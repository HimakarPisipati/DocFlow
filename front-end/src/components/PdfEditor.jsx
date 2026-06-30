import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Set worker to enable pdf.js to run in a web worker
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Helper to convert hex to pdf-lib rgb color object
const hexToRgb = (hex) => {
  if (!hex || hex === 'transparent') return rgb(0, 0, 0);
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
};

// Word wrap helper for PDF text annotations
const wrapText = (text, maxWidth, fontSize, font) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

export default function PdfEditor({ file, onSave, onCancel }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageOrder, setPageOrder] = useState([]); // Array of original page indices
  const [rotations, setRotations] = useState({}); // Map of page ID (e.g. 'page-1') to rotation degrees (multiples of 90)
  const [pageSizes, setPageSizes] = useState({}); // Original page sizes in PDF points
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Annotation states
  const [activeTool, setActiveTool] = useState('select'); // select, text, highlight, rect, circle, draw, arrow, note
  const [annotations, setAnnotations] = useState({}); // Map of page ID -> array of annotations
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Style properties states
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [strokeColor, setStrokeColor] = useState('#4f46e5');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1.0);
  
  // Text styling toggles
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  
  // Dragging and resizing states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ pdfX: 0, pdfY: 0, width: 0, height: 0, x: 0, y: 0 });
  
  // Active drawing states (freehand and shapes)
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [tempDrawingPoints, setTempDrawingPoints] = useState([]);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [startPdfCoords, setStartPdfCoords] = useState({ x: 0, y: 0 });
  const [tempShape, setTempShape] = useState(null);
  
  // Signature Modal states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [sigPoints, setSigPoints] = useState([]);
  const [sigTab, setSigTab] = useState('draw'); // draw, upload
  const [uploadedSigUrl, setUploadedSigUrl] = useState(null);
  const [uploadedSigDims, setUploadedSigDims] = useState({ width: 1, height: 1 });
  
  const canvasRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const currentViewportRef = useRef(null);
  const imageInputRef = useRef(null);
  const editorContainerRef = useRef(null);

  const storageKey = `docflow_annots_${file.name}_${file.size}`;

  // Sync annotations to sessionStorage for auto-saving
  useEffect(() => {
    if (Object.keys(annotations).length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(annotations));
    }
  }, [annotations, storageKey]);

  // Load annotations from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        setAnnotations(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved annotations:", e);
      }
    }
  }, [storageKey]);

  // Load the PDF using pdfjs
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function(e) {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const loadedPdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            setPdfDoc(loadedPdf);
            setNumPages(loadedPdf.numPages);
            
            const initialOrder = Array.from({length: loadedPdf.numPages}, (_, i) => i + 1);
            setPageOrder(initialOrder);
   
            const sizes = {};
            const thumbPromises = initialOrder.map(async (pageNum) => {
              const page = await loadedPdf.getPage(pageNum);
              const baseViewport = page.getViewport({ scale: 1.0 });
              sizes[pageNum] = { width: baseViewport.width, height: baseViewport.height };
              
              const viewport = page.getViewport({ scale: 0.4 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              return { id: `page-${pageNum}`, pageNum: pageNum, url: canvas.toDataURL() };
            });
            const generatedThumbnails = await Promise.all(thumbPromises);
            setPageSizes(sizes);
            setThumbnails(generatedThumbnails);
          } catch (err) {
            console.error("Error parsing PDF inside onload:", err);
          }
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error loading PDF FileReader:", error);
      }
    };
    loadPdf();
  }, [file]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || pageOrder.length === 0) return;
      
      const originalPageNum = pageOrder[currentPage - 1];
      if (!originalPageNum) return;

      const page = await pdfDoc.getPage(originalPageNum);
      const currentThumb = thumbnails[currentPage - 1];
      const rotationAngle = currentThumb ? (rotations[currentThumb.id] || 0) : 0;
      
      const viewport = page.getViewport({ 
        scale: zoom * 1.5,
        rotation: (page.rotate + rotationAngle) % 360
      }); 
      
      currentViewportRef.current = viewport;
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    };
    renderPage();
  }, [pdfDoc, currentPage, zoom, pageOrder, rotations, thumbnails]);

  // Synchronize style panel states with selected text annotation
  useEffect(() => {
    if (selectedAnnotationId) {
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      const pageAnnots = annotations[pageId] || [];
      const selected = pageAnnots.find(a => a.id === selectedAnnotationId);
      if (selected && selected.type === 'text') {
        setFontSize(selected.fontSize || 16);
        setTextColor(selected.textColor || '#000000');
        setFontFamily(selected.fontFamily || 'Arial');
        setIsBold(!!selected.bold);
        setIsItalic(!!selected.italic);
        setIsUnderline(!!selected.underline);
        setIsStrike(!!selected.strike);
      }
    }
  }, [selectedAnnotationId, currentPage, pageOrder, annotations]);

  // Handle escape key or exit full screen changes from browser UI
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle keyboard deletions of annotations
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedAnnotationId && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
          return;
        }
        e.preventDefault();
        deleteSelectedAnnotation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, pageOrder, currentPage]);

  const deleteSelectedAnnotation = () => {
    if (!selectedAnnotationId) return;
    const pageId = `page-${pageOrder[currentPage - 1]}`;
    setAnnotations(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter(a => a.id !== selectedAnnotationId)
    }));
    setSelectedAnnotationId(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const newPageOrder = Array.from(pageOrder);
    const [reorderedItem] = newPageOrder.splice(result.source.index, 1);
    newPageOrder.splice(result.destination.index, 0, reorderedItem);
    
    const newThumbnails = Array.from(thumbnails);
    const [reorderedThumb] = newThumbnails.splice(result.source.index, 1);
    newThumbnails.splice(result.destination.index, 0, reorderedThumb);

    setPageOrder(newPageOrder);
    setThumbnails(newThumbnails);
    
    if (currentPage === result.source.index + 1) {
      setCurrentPage(result.destination.index + 1);
    }
  };

  const handleDeletePage = (indexToDelete) => {
    if (pageOrder.length <= 1) {
      alert("Cannot delete the last page.");
      return;
    }
    
    const newPageOrder = pageOrder.filter((_, idx) => idx !== indexToDelete);
    const newThumbnails = thumbnails.filter((_, idx) => idx !== indexToDelete);
    
    setPageOrder(newPageOrder);
    setThumbnails(newThumbnails);
    setNumPages(newPageOrder.length);
    
    if (currentPage > newPageOrder.length) {
      setCurrentPage(newPageOrder.length);
    }
  };

  const handleRotatePage = async (indexToRotate) => {
    if (indexToRotate < 0 || indexToRotate >= pageOrder.length) return;
    
    const newThumbnails = [...thumbnails];
    const thumb = newThumbnails[indexToRotate];
    const originalPageNum = pageOrder[indexToRotate];
    const pageId = thumb.id;
    
    const currentRotation = rotations[pageId] || 0;
    const nextRotation = (currentRotation + 90) % 360;
    
    setRotations(prev => ({
      ...prev,
      [pageId]: nextRotation
    }));
    
    try {
      const page = await pdfDoc.getPage(originalPageNum);
      const viewport = page.getViewport({ 
        scale: 0.4, 
        rotation: (page.rotate + nextRotation) % 360 
      });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      thumb.url = canvas.toDataURL();
      setThumbnails(newThumbnails);
    } catch (error) {
      console.error("Error rotating page thumbnail:", error);
    }
  };

  // Convert PDF coordinates to viewport coordinates for rendering overlays
  const getViewportRect = (pdfX, pdfY, pdfW, pdfH) => {
    if (!currentViewportRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    
    const p1 = currentViewportRef.current.convertToViewportPoint(pdfX, pdfY);
    const p2 = currentViewportRef.current.convertToViewportPoint(pdfX + pdfW, pdfY + pdfH);
    
    const left = Math.min(p1[0], p2[0]);
    const top = Math.min(p1[1], p2[1]);
    const width = Math.abs(p1[0] - p2[0]);
    const height = Math.abs(p1[1] - p2[1]);
    
    return { left, top, width, height };
  };

  // Convert viewport coordinate point to pdf points
  const getViewportCoords = (pdfX, pdfY) => {
    if (!currentViewportRef.current) return [0, 0];
    return currentViewportRef.current.convertToViewportPoint(pdfX, pdfY);
  };

  const toggleStyle = (styleKey) => {
    if (selectedAnnotationId) {
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      setAnnotations(prev => ({
        ...prev,
        [pageId]: (prev[pageId] || []).map(a => {
          if (a.id === selectedAnnotationId && a.type === 'text') {
            return { ...a, [styleKey]: !a[styleKey] };
          }
          return a;
        })
      }));
    } else {
      if (styleKey === 'bold') setIsBold(b => !b);
      if (styleKey === 'italic') setIsItalic(i => !i);
      if (styleKey === 'underline') setIsUnderline(u => !u);
      if (styleKey === 'strike') setIsStrike(s => !s);
    }
  };

  // Pointer event handlers for annotations
  const handleMouseDown = (e) => {
    if (!canvasRef.current || !currentViewportRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [pdfX, pdfY] = currentViewportRef.current.convertToPdfPoint(mouseX, mouseY);
    
    if (activeTool === 'text') {
      const newAnnot = {
        id: `annot-${Date.now()}`,
        type: 'text',
        x: pdfX,
        y: pdfY - 15,
        width: 180,
        height: 35,
        text: 'Type text here',
        fontSize: fontSize,
        textColor: textColor,
        fontFamily: fontFamily,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike
      };
      
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      setAnnotations(prev => ({
        ...prev,
        [pageId]: [...(prev[pageId] || []), newAnnot]
      }));
      setSelectedAnnotationId(newAnnot.id);
      setIsEditingText(true);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'note') {
      const newAnnot = {
        id: `annot-${Date.now()}`,
        type: 'note',
        x: pdfX,
        y: pdfY - 14,
        width: 28,
        height: 28,
        text: 'Add your comment here'
      };
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      setAnnotations(prev => ({
        ...prev,
        [pageId]: [...(prev[pageId] || []), newAnnot]
      }));
      setSelectedAnnotationId(newAnnot.id);
      setActiveTool('select');
      return;
    }
    
    if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'highlight' || activeTool === 'arrow') {
      setIsDrawingShape(true);
      setStartPdfCoords({ x: pdfX, y: pdfY });
      setTempShape({
        type: activeTool,
        x: pdfX,
        y: pdfY,
        width: 0,
        height: 0,
        color: activeTool === 'highlight' ? '#ffff00' : (activeTool === 'arrow' ? strokeColor : fillColor),
        strokeColor: activeTool === 'highlight' ? 'transparent' : strokeColor,
        strokeWidth: activeTool === 'highlight' ? 0 : strokeWidth,
        opacity: activeTool === 'highlight' ? 0.35 : opacity
      });
      return;
    }
    
    if (activeTool === 'draw') {
      setIsDrawingFreehand(true);
      setTempDrawingPoints([{ x: pdfX, y: pdfY }]);
      return;
    }
    
    setSelectedAnnotationId(null);
    setIsEditingText(false);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !currentViewportRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [pdfX, pdfY] = currentViewportRef.current.convertToPdfPoint(mouseX, mouseY);
    
    if (isDragging && selectedAnnotationId) {
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      setAnnotations(prev => ({
        ...prev,
        [pageId]: (prev[pageId] || []).map(a => {
          if (a.id === selectedAnnotationId) {
            return {
              ...a,
              x: pdfX - dragOffset.x,
              y: pdfY - dragOffset.y
            };
          }
          return a;
        })
      }));
      return;
    }
    
    if (isResizing && selectedAnnotationId) {
      const dx = pdfX - resizeStart.pdfX;
      const dy = pdfY - resizeStart.pdfY;
      
      const pageId = `page-${pageOrder[currentPage - 1]}`;
      setAnnotations(prev => ({
        ...prev,
        [pageId]: (prev[pageId] || []).map(a => {
          if (a.id === selectedAnnotationId) {
            const newWidth = Math.max(10, resizeStart.width + dx);
            const newHeight = Math.max(10, resizeStart.height - dy);
            return {
              ...a,
              width: newWidth,
              height: newHeight,
              y: resizeStart.y + dy
            };
          }
          return a;
        })
      }));
      return;
    }
    
    if (isDrawingShape && tempShape) {
      if (tempShape.type === 'arrow') {
        const width = pdfX - startPdfCoords.x;
        const height = pdfY - startPdfCoords.y;
        setTempShape(prev => ({ ...prev, width, height }));
      } else {
        const x = Math.min(startPdfCoords.x, pdfX);
        const y = Math.min(startPdfCoords.y, pdfY);
        const width = Math.abs(pdfX - startPdfCoords.x);
        const height = Math.abs(pdfY - startPdfCoords.y);
        setTempShape(prev => ({
          ...prev,
          x,
          y,
          width,
          height
        }));
      }
      return;
    }
    
    if (isDrawingFreehand) {
      setTempDrawingPoints(prev => [...prev, { x: pdfX, y: pdfY }]);
      return;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    
    const pageId = `page-${pageOrder[currentPage - 1]}`;
    
    if (isDrawingShape && tempShape) {
      if (Math.abs(tempShape.width) > 3 || Math.abs(tempShape.height) > 3) {
        const newAnnot = {
          ...tempShape,
          id: `annot-${Date.now()}`
        };
        setAnnotations(prev => ({
          ...prev,
          [pageId]: [...(prev[pageId] || []), newAnnot]
        }));
      }
      setIsDrawingShape(false);
      setTempShape(null);
      setActiveTool('select');
      return;
    }
    
    if (isDrawingFreehand && tempDrawingPoints.length > 1) {
      const xs = tempDrawingPoints.map(p => p.x);
      const ys = tempDrawingPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const w = maxX - minX || 1;
      const h = maxY - minY || 1;
      
      const lines = [[
        ...tempDrawingPoints.map(p => ({
          rx: (p.x - minX) / w,
          ry: (p.y - minY) / h
        }))
      ]];
      
      const newAnnot = {
        id: `annot-${Date.now()}`,
        type: 'drawing',
        x: minX,
        y: minY,
        width: w,
        height: h,
        lines: lines,
        color: strokeColor,
        strokeWidth: strokeWidth
      };
      
      setAnnotations(prev => ({
        ...prev,
        [pageId]: [...(prev[pageId] || []), newAnnot]
      }));
      setIsDrawingFreehand(false);
      setTempDrawingPoints([]);
      setActiveTool('select');
      return;
    }
    
    setIsDrawingFreehand(false);
    setTempDrawingPoints([]);
  };

  const handleAnnotMouseDown = (e, annot) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedAnnotationId(annot.id);
    setIsDragging(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [pdfX, pdfY] = currentViewportRef.current.convertToPdfPoint(mouseX, mouseY);
    
    setDragOffset({
      x: pdfX - annot.x,
      y: pdfY - annot.y
    });
  };

  const handleResizeMouseDown = (e, annot) => {
    e.stopPropagation();
    setSelectedAnnotationId(annot.id);
    setIsResizing(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [pdfX, pdfY] = currentViewportRef.current.convertToPdfPoint(mouseX, mouseY);
    
    setResizeStart({
      pdfX,
      pdfY,
      width: annot.width,
      height: annot.height,
      x: annot.x,
      y: annot.y
    });
  };

  // Signature Pad Handlers
  const handleSigMouseDown = (e) => {
    setIsDrawingSig(true);
    const canvas = sigCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#000000';
    
    setSigPoints([{ x, y, isStart: true }]);
  };

  const handleSigMouseMove = (e) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const context = canvas.getContext('2d');
    context.lineTo(x, y);
    context.stroke();
    
    setSigPoints(prev => [...prev, { x, y, isStart: false }]);
  };

  const handleSigMouseUp = () => {
    setIsDrawingSig(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSigPoints([]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      const img = new Image();
      img.onload = () => {
        setUploadedSigUrl(dataUrl);
        setUploadedSigDims({ width: img.width, height: img.height });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const insertSignature = () => {
    if (sigPoints.length === 0) return;
    
    const xs = sigPoints.map(p => p.x);
    const ys = sigPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    
    const originalPageNum = pageOrder[currentPage - 1];
    const pageSize = pageSizes[originalPageNum] || { width: 612, height: 792 };
    
    const w_target = 150;
    const h_target = w_target * (h / w);
    
    const x_target = (pageSize.width - w_target) / 2;
    const y_target = (pageSize.height - h_target) / 2;
    
    const mappedLines = [];
    let currentLine = [];
    
    sigPoints.forEach(p => {
      const rx = (p.x - minX) / w;
      const ry = 1 - (p.y - minY) / h; // Invert Y relative to bounding box base
      
      if (p.isStart && currentLine.length > 0) {
        mappedLines.push(currentLine);
        currentLine = [];
      }
      currentLine.push({ rx, ry });
    });
    if (currentLine.length > 0) {
      mappedLines.push(currentLine);
    }
    
    const newAnnot = {
      id: `annot-${Date.now()}`,
      type: 'signature',
      x: x_target,
      y: y_target,
      width: w_target,
      height: h_target,
      lines: mappedLines,
      color: '#000000',
      strokeWidth: 3
    };
    
    const pageId = `page-${originalPageNum}`;
    setAnnotations(prev => ({
      ...prev,
      [pageId]: [...(prev[pageId] || []), newAnnot]
    }));
    
    setShowSignatureModal(false);
    setSigPoints([]);
    setActiveTool('select');
  };

  const insertUploadedSignature = () => {
    if (!uploadedSigUrl) return;
    
    const originalPageNum = pageOrder[currentPage - 1];
    const pageSize = pageSizes[originalPageNum] || { width: 612, height: 792 };
    
    const aspect = uploadedSigDims.width / uploadedSigDims.height || 1.0;
    const w_target = 150;
    const h_target = w_target / aspect;
    
    const x_target = (pageSize.width - w_target) / 2;
    const y_target = (pageSize.height - h_target) / 2;
    
    const newAnnot = {
      id: `annot-${Date.now()}`,
      type: 'image',
      x: x_target,
      y: y_target,
      width: w_target,
      height: h_target,
      imageUrl: uploadedSigUrl
    };
    
    const pageId = `page-${originalPageNum}`;
    setAnnotations(prev => ({
      ...prev,
      [pageId]: [...(prev[pageId] || []), newAnnot]
    }));
    
    setShowSignatureModal(false);
    setUploadedSigUrl(null);
    setActiveTool('select');
  };

  // General Image Embed Toolbar Actions
  const triggerImageUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleGeneralImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height || 1.0;
        const w_target = 180;
        const h_target = w_target / aspect;
        
        const originalPageNum = pageOrder[currentPage - 1];
        const pageSize = pageSizes[originalPageNum] || { width: 612, height: 792 };
        
        const x_target = (pageSize.width - w_target) / 2;
        const y_target = (pageSize.height - h_target) / 2;
        
        const newAnnot = {
          id: `annot-${Date.now()}`,
          type: 'image',
          x: x_target,
          y: y_target,
          width: w_target,
          height: h_target,
          imageUrl: dataUrl
        };
        
        const pageId = `page-${originalPageNum}`;
        setAnnotations(prev => ({
          ...prev,
          [pageId]: [...(prev[pageId] || []), newAnnot]
        }));
        setSelectedAnnotationId(newAnnot.id);
        setActiveTool('select');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSave = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      // Embed standard Helvetica, Times, and Courier fonts
      const fontsMap = {
        helvetica: {
          regular: await newPdf.embedFont(StandardFonts.Helvetica),
          bold: await newPdf.embedFont(StandardFonts.HelveticaBold),
          italic: await newPdf.embedFont(StandardFonts.HelveticaOblique),
          boldItalic: await newPdf.embedFont(StandardFonts.HelveticaBoldOblique),
        },
        times: {
          regular: await newPdf.embedFont(StandardFonts.TimesRoman),
          bold: await newPdf.embedFont(StandardFonts.TimesRomanBold),
          italic: await newPdf.embedFont(StandardFonts.TimesRomanItalic),
          boldItalic: await newPdf.embedFont(StandardFonts.TimesRomanBoldItalic),
        },
        courier: {
          regular: await newPdf.embedFont(StandardFonts.Courier),
          bold: await newPdf.embedFont(StandardFonts.CourierBold),
          italic: await newPdf.embedFont(StandardFonts.CourierOblique),
          boldItalic: await newPdf.embedFont(StandardFonts.CourierBoldOblique),
        }
      };

      const fontRegular = fontsMap.helvetica.regular;

      const getFontCategory = (family) => {
        const f = (family || 'Arial').toLowerCase();
        if (f.includes('times') || f.includes('georgia') || f.includes('garamond') || f.includes('cambria')) {
          return 'times';
        }
        if (f.includes('courier') || f.includes('consolas')) {
          return 'courier';
        }
        return 'helvetica';
      };
      
      const indicesToCopy = pageOrder.map(num => num - 1);
      const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
      
      for (let idx = 0; idx < copiedPages.length; idx++) {
        const page = copiedPages[idx];
        const originalPageNum = pageOrder[idx];
        const pageId = `page-${originalPageNum}`;
        
        // 1. Apply Rotation
        const rotationAngle = rotations[pageId] || 0;
        if (rotationAngle !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + rotationAngle) % 360));
        }
        
        // 2. Draw Annotations
        const pageAnnots = annotations[pageId] || [];
        for (const annotation of pageAnnots) {
          if (annotation.type === 'text') {
            const category = getFontCategory(annotation.fontFamily);
            const fontSet = fontsMap[category] || fontsMap.helvetica;
            const font = annotation.bold && annotation.italic ? fontSet.boldItalic 
                       : annotation.bold ? fontSet.bold 
                       : annotation.italic ? fontSet.italic 
                       : fontSet.regular;
                       
            const lines = annotation.text.split('\n');
            const wrappedLines = [];
            lines.forEach(rawLine => {
              const wrapped = wrapText(rawLine, annotation.width, annotation.fontSize, font);
              wrappedLines.push(...wrapped);
            });
            
            wrappedLines.forEach((line, lineIdx) => {
              const lineY = (annotation.y + annotation.height) - (lineIdx * annotation.fontSize * 1.2) - annotation.fontSize;
              
              // Draw Text
              page.drawText(line, {
                x: annotation.x,
                y: lineY,
                size: annotation.fontSize,
                font: font,
                color: hexToRgb(annotation.textColor || '#000000'),
              });
              
              // Draw Underline / Strike-through
              const lineWidth = font.widthOfTextAtSize(line, annotation.fontSize);
              if (annotation.underline) {
                page.drawLine({
                  start: { x: annotation.x, y: lineY - 2 },
                  end: { x: annotation.x + lineWidth, y: lineY - 2 },
                  thickness: 1,
                  color: hexToRgb(annotation.textColor || '#000000'),
                });
              }
              if (annotation.strike) {
                page.drawLine({
                  start: { x: annotation.x, y: lineY + (annotation.fontSize / 3) },
                  end: { x: annotation.x + lineWidth, y: lineY + (annotation.fontSize / 3) },
                  thickness: 1,
                  color: hexToRgb(annotation.textColor || '#000000'),
                });
              }
            });
          }
          else if (annotation.type === 'rect' || annotation.type === 'highlight') {
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
              color: annotation.color !== 'transparent' ? hexToRgb(annotation.color) : undefined,
              borderColor: annotation.strokeColor && annotation.strokeColor !== 'transparent' ? hexToRgb(annotation.strokeColor) : undefined,
              borderWidth: annotation.strokeWidth || 0,
              opacity: annotation.opacity || 1.0,
            });
          }
          else if (annotation.type === 'circle') {
            page.drawEllipse({
              x: annotation.x + annotation.width / 2,
              y: annotation.y + annotation.height / 2,
              xScale: annotation.width / 2,
              yScale: annotation.height / 2,
              color: annotation.color !== 'transparent' ? hexToRgb(annotation.color) : undefined,
              borderColor: annotation.strokeColor && annotation.strokeColor !== 'transparent' ? hexToRgb(annotation.strokeColor) : undefined,
              borderWidth: annotation.strokeWidth || 0,
              opacity: annotation.opacity || 1.0,
            });
          }
          else if (annotation.type === 'arrow') {
            const x1 = annotation.x;
            const y1 = annotation.y;
            const x2 = annotation.x + annotation.width;
            const y2 = annotation.y + annotation.height;
            
            page.drawLine({
              start: { x: x1, y: y1 },
              end: { x: x2, y: y2 },
              color: hexToRgb(annotation.color || '#000000'),
              thickness: annotation.strokeWidth || 3,
            });
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const angle = Math.atan2(dy, dx);
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6;
            
            const x3 = x2 - arrowLength * Math.cos(angle - arrowAngle);
            const y3 = y2 - arrowLength * Math.sin(angle - arrowAngle);
            const x4 = x2 - arrowLength * Math.cos(angle + arrowAngle);
            const y4 = y2 - arrowLength * Math.sin(angle + arrowAngle);
            
            page.drawLine({
              start: { x: x2, y: y2 },
              end: { x: x3, y: y3 },
              color: hexToRgb(annotation.color || '#000000'),
              thickness: annotation.strokeWidth || 3,
            });
            page.drawLine({
              start: { x: x2, y: y2 },
              end: { x: x4, y: y4 },
              color: hexToRgb(annotation.color || '#000000'),
              thickness: annotation.strokeWidth || 3,
            });
          }
          else if (annotation.type === 'note') {
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y,
              width: 32,
              height: 32,
              color: rgb(0.98, 0.9, 0.44),
              borderColor: rgb(0.85, 0.72, 0.1),
              borderWidth: 1,
            });
            
            page.drawText("NOTE", {
              x: annotation.x + 3,
              y: annotation.y + 12,
              size: 8,
              font: fontRegular,
              color: rgb(0.3, 0.3, 0.3),
            });
            
            const commentText = annotation.text || '';
            const lines = wrapText(commentText, 150, 8, fontRegular);
            lines.forEach((line, lineIdx) => {
              page.drawText(line, {
                x: annotation.x + 38,
                y: (annotation.y + 24) - (lineIdx * 10),
                size: 8,
                font: fontRegular,
                color: rgb(0.1, 0.1, 0.1),
              });
            });
          }
          else if (annotation.type === 'drawing' || annotation.type === 'signature') {
            annotation.lines.forEach(line => {
              for (let i = 0; i < line.length - 1; i++) {
                const p1 = line[i];
                const p2 = line[i+1];
                
                const x1 = annotation.x + p1.rx * annotation.width;
                const y1 = annotation.y + p1.ry * annotation.height;
                const x2 = annotation.x + p2.rx * annotation.width;
                const y2 = annotation.y + p2.ry * annotation.height;
                
                page.drawLine({
                  start: { x: x1, y: y1 },
                  end: { x: x2, y: y2 },
                  color: hexToRgb(annotation.color || '#000000'),
                  thickness: annotation.strokeWidth || 3,
                });
              }
            });
          }
          else if (annotation.type === 'image') {
            try {
              const base64Data = annotation.imageUrl.split(',')[1];
              const binaryStr = atob(base64Data);
              const len = binaryStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              
              const isPng = annotation.imageUrl.startsWith('data:image/png');
              const embeddedImage = isPng 
                ? await newPdf.embedPng(bytes) 
                : await newPdf.embedJpg(bytes);
                
              page.drawImage(embeddedImage, {
                x: annotation.x,
                y: annotation.y,
                width: annotation.width,
                height: annotation.height,
              });
            } catch (err) {
              console.error("Error embedding signature image in PDF:", err);
            }
          }
        }
        
        newPdf.addPage(page);
      }
      
      // Clear sessionStorage on successful export
      sessionStorage.removeItem(storageKey);
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      onSave(blob);
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save the PDF document.");
    }
  };

  const pageId = pageOrder.length > 0 ? `page-${pageOrder[currentPage - 1]}` : '';
  const pageAnnots = annotations[pageId] || [];

  return (
    <div 
      ref={editorContainerRef} 
      className={`flex flex-col bg-surface dark:bg-slate-900 overflow-hidden text-on-surface dark:text-gray-100 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'h-[85vh] rounded-xl shadow-2xl border border-outline-variant/30'}`}
    >
      {/* Hidden File Input for general images */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleGeneralImageUpload}
        className="hidden"
      />

      {/* Main Toolbar */}
      <div className="flex items-center justify-between p-4 bg-surface-container-low dark:bg-slate-800 border-b border-outline-variant/30">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-full transition-colors text-on-surface dark:text-gray-300">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-headline-sm font-bold text-on-surface dark:text-gray-100">Interactive Editor</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-high dark:bg-slate-800 rounded-lg p-1 border border-outline-variant/20">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 hover:bg-surface dark:hover:bg-slate-700 rounded text-on-surface-variant dark:text-gray-300">
              <span className="material-symbols-outlined text-[20px]">zoom_out</span>
            </button>
            <span className="text-label-sm font-medium w-12 text-center text-on-surface dark:text-gray-200">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:bg-surface dark:hover:bg-slate-700 rounded text-on-surface-variant dark:text-gray-300">
              <span className="material-symbols-outlined text-[20px]">zoom_in</span>
            </button>
          </div>

          <button 
            onClick={() => handleRotatePage(currentPage - 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high dark:bg-slate-800 hover:bg-surface-container-highest dark:hover:bg-slate-700 rounded-lg text-on-surface-variant dark:text-gray-200 border border-outline-variant/30 dark:border-slate-650 transition-colors text-sm font-medium"
            title="Rotate Page 90° Clockwise"
          >
            <span className="material-symbols-outlined text-[18px]">rotate_right</span>
            Rotate Page
          </button>

          <button 
            onClick={toggleFullscreen}
            className="flex items-center justify-center p-2 bg-surface-container-high dark:bg-slate-800 hover:bg-surface-container-highest dark:hover:bg-slate-700 rounded-lg text-on-surface-variant dark:text-gray-200 border border-outline-variant/30 dark:border-slate-650 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            <span className="material-symbols-outlined text-[20px]">{isFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:brightness-110 shadow-sm transition-all font-label-md">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Changes
          </button>
        </div>
      </div>

      {/* Annotations Sub-Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 bg-surface-container-lowest dark:bg-slate-900 border-b border-outline-variant/20 dark:border-slate-800 gap-4 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <button 
            onClick={() => { setActiveTool('select'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'select' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Select & Move Annotation"
          >
            <span className="material-symbols-outlined text-[20px]">near_me</span>
            Select
          </button>
          
          <button 
            onClick={() => { setActiveTool('text'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'text' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Add Text Block"
          >
            <span className="material-symbols-outlined text-[20px]">title</span>
            Text
          </button>

          <button 
            onClick={() => { setActiveTool('highlight'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'highlight' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Highlight Text Area"
          >
            <span className="material-symbols-outlined text-[20px]">ink_highlighter</span>
            Highlight
          </button>

          <button 
            onClick={() => { setActiveTool('rect'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'rect' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Draw Rectangle"
          >
            <span className="material-symbols-outlined text-[20px]">rectangle</span>
            Rectangle
          </button>

          <button 
            onClick={() => { setActiveTool('circle'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'circle' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Draw Circle"
          >
            <span className="material-symbols-outlined text-[20px]">circle</span>
            Circle
          </button>

          <button 
            onClick={() => { setActiveTool('arrow'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'arrow' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Draw Line with Arrow"
          >
            <span className="material-symbols-outlined text-[20px]">trending_flat</span>
            Arrow
          </button>

          <button 
            onClick={() => { setActiveTool('note'); setSelectedAnnotationId(null); }} 
            className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium ${activeTool === 'note' ? 'bg-primary/15 text-primary dark:bg-primary/30 border border-primary/20' : 'hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300'}`}
            title="Add Sticky Note / Comment"
          >
            <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
            Note
          </button>

          <button 
            onClick={triggerImageUpload} 
            className="p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300"
            title="Upload General Image"
          >
            <span className="material-symbols-outlined text-[20px]">image</span>
            Image
          </button>

          <button 
            onClick={() => { setShowSignatureModal(true); setSigTab('draw'); setSelectedAnnotationId(null); }} 
            className="p-2 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-gray-300"
            title="Insert Digital Signature"
          >
            <span className="material-symbols-outlined text-[20px]">draw</span>
            Signature
          </button>
        </div>

        {/* Styling controls (Contextual) */}
        <div className="flex items-center gap-4 text-sm text-on-surface-variant dark:text-gray-300">
          {(activeTool === 'text' || (selectedAnnotationId && pageAnnots.find(a => a.id === selectedAnnotationId)?.type === 'text')) && (
            <div className="flex items-center gap-3 flex-wrap bg-surface-container-high dark:bg-slate-800 px-3 py-1 rounded-lg border border-outline-variant/20 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <span>Font:</span>
                <select 
                  value={fontFamily} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFontFamily(val);
                    if (selectedAnnotationId) {
                      setAnnotations(prev => ({
                        ...prev,
                        [pageId]: prev[pageId].map(a => a.id === selectedAnnotationId ? { ...a, fontFamily: val } : a)
                      }));
                    }
                  }}
                  className="px-2 py-1 bg-surface-container dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded text-on-surface dark:text-gray-200 mr-2"
                >
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Cambria">Cambria</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                  <option value="Consolas">Consolas</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Garamond">Garamond</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Impact">Impact</option>
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Size:</span>
                <select 
                  value={fontSize} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFontSize(val);
                    if (selectedAnnotationId) {
                      setAnnotations(prev => ({
                        ...prev,
                        [pageId]: prev[pageId].map(a => a.id === selectedAnnotationId ? { ...a, fontSize: val } : a)
                      }));
                    }
                  }}
                  className="px-2 py-1 bg-surface-container dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded text-on-surface dark:text-gray-200"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="24">24px</option>
                  <option value="32">32px</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Color:</span>
                <input 
                  type="color" 
                  value={textColor} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextColor(val);
                    if (selectedAnnotationId) {
                      setAnnotations(prev => ({
                        ...prev,
                        [pageId]: prev[pageId].map(a => a.id === selectedAnnotationId ? { ...a, textColor: val } : a)
                      }));
                    }
                  }} 
                  className="w-6 h-6 border-0 p-0 cursor-pointer bg-transparent"
                />
              </div>
              
              {/* Text styling toggles */}
              <div className="flex items-center border-l border-outline-variant/30 pl-2 gap-1">
                <button
                  onClick={() => toggleStyle('bold')}
                  className={`px-2 py-0.5 rounded font-bold text-xs ${isBold ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-highest'}`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => toggleStyle('italic')}
                  className={`px-2 py-0.5 rounded italic text-xs ${isItalic ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-highest'}`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => toggleStyle('underline')}
                  className={`px-2 py-0.5 rounded underline text-xs ${isUnderline ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-highest'}`}
                  title="Underline"
                >
                  U
                </button>
                <button
                  onClick={() => toggleStyle('strike')}
                  className={`px-2 py-0.5 rounded line-through text-xs ${isStrike ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-highest'}`}
                  title="Strike-through"
                >
                  S
                </button>
              </div>
            </div>
          )}

          {(activeTool === 'rect' || activeTool === 'circle' || activeTool === 'draw' || activeTool === 'arrow') && (
            <div className="flex items-center gap-3 flex-wrap bg-surface-container-high dark:bg-slate-800 px-3 py-1 rounded-lg border border-outline-variant/20 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <span>Stroke:</span>
                <input 
                  type="color" 
                  value={strokeColor} 
                  onChange={(e) => setStrokeColor(e.target.value)} 
                  className="w-6 h-6 border-0 p-0 cursor-pointer bg-transparent"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Thickness:</span>
                <select 
                  value={strokeWidth} 
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="px-2 py-1 bg-surface-container dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded text-on-surface dark:text-gray-200"
                >
                  <option value="1">1px</option>
                  <option value="2">2px</option>
                  <option value="3">3px</option>
                  <option value="5">5px</option>
                  <option value="8">8px</option>
                </select>
              </div>
              {(activeTool === 'rect' || activeTool === 'circle') && (
                <div className="flex items-center gap-1.5">
                  <span>Fill:</span>
                  <select 
                    value={fillColor} 
                    onChange={(e) => setFillColor(e.target.value)}
                    className="px-2 py-1 bg-surface-container dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded text-on-surface dark:text-gray-200"
                  >
                    <option value="transparent">Transparent</option>
                    <option value="#ffffff">White</option>
                    <option value="#ff0000">Red</option>
                    <option value="#00ff00">Green</option>
                    <option value="#0000ff">Blue</option>
                    <option value="#ffff00">Yellow</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails Sidebar */}
        <div className="w-64 bg-surface-container-lowest dark:bg-slate-900 border-r border-outline-variant/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-outline-variant/30 bg-surface-container-low dark:bg-slate-800">
            <h3 className="font-label-md text-on-surface-variant dark:text-gray-400">Pages ({numPages})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="thumbnails">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {thumbnails.map((thumb, index) => (
                      <Draggable key={thumb.id} draggableId={thumb.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative group cursor-grab active:cursor-grabbing rounded-lg p-2 border-2 transition-colors
                              ${currentPage === index + 1 ? 'border-primary bg-primary/5' : 'border-transparent hover:border-outline-variant dark:hover:border-slate-600'}`}
                            onClick={() => { setCurrentPage(index + 1); setSelectedAnnotationId(null); }}
                          >
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRotatePage(index); }}
                                className="p-1 bg-primary text-white rounded shadow-md hover:brightness-110"
                                title="Rotate Page 90° Clockwise"
                              >
                                <span className="material-symbols-outlined text-[16px]">rotate_right</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeletePage(index); }}
                                className="p-1 bg-error text-white rounded shadow-md hover:bg-red-600"
                                title="Delete Page"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-2 text-xs font-bold bg-white/80 dark:bg-slate-800/80 dark:text-gray-100 px-1.5 rounded">{index + 1}</span>
                            <img src={thumb.url} alt={`Page ${index + 1}`} className="w-full h-auto border border-outline-variant/50 shadow-sm rounded" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-surface-container dark:bg-slate-850 overflow-auto flex items-start justify-center p-8 custom-scrollbar relative">
          {pdfDoc ? (
            <div className="relative shadow-lg border border-outline-variant/30 bg-white dark:border-slate-700 select-none">
              <canvas ref={canvasRef} className="max-w-full h-auto block" />
              
              {/* Interactive Annotations Overlay Layer */}
              <div 
                className="absolute inset-0 z-20 pointer-events-auto"
                style={{
                  width: canvasRef.current ? canvasRef.current.style.width : '0px',
                  height: canvasRef.current ? canvasRef.current.style.height : '0px',
                  cursor: activeTool === 'select' ? 'default' : 'crosshair'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* SVG Render Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {pageAnnots.map(annot => {
                    const coords = getViewportRect(annot.x, annot.y, annot.width, annot.height);
                    
                    if (annot.type === 'rect') {
                      return (
                        <rect
                          key={annot.id}
                          x={coords.left}
                          y={coords.top}
                          width={coords.width}
                          height={coords.height}
                          fill={annot.color}
                          stroke={annot.strokeColor}
                          strokeWidth={annot.strokeWidth * zoom * 1.5}
                          opacity={annot.opacity}
                        />
                      );
                    }
                    if (annot.type === 'highlight') {
                      return (
                        <rect
                          key={annot.id}
                          x={coords.left}
                          y={coords.top}
                          width={coords.width}
                          height={coords.height}
                          fill={annot.color}
                          opacity={annot.opacity}
                        />
                      );
                    }
                    if (annot.type === 'circle') {
                      return (
                        <ellipse
                          key={annot.id}
                          cx={coords.left + coords.width / 2}
                          cy={coords.top + coords.height / 2}
                          rx={coords.width / 2}
                          ry={coords.height / 2}
                          fill={annot.color}
                          stroke={annot.strokeColor}
                          strokeWidth={annot.strokeWidth * zoom * 1.5}
                          opacity={annot.opacity}
                        />
                      );
                    }
                    if (annot.type === 'arrow') {
                      const p1 = getViewportCoords(annot.x, annot.y);
                      const p2 = getViewportCoords(annot.x + annot.width, annot.y + annot.height);
                      return (
                        <g key={annot.id}>
                          <defs>
                            <marker
                              id={`arrowhead-${annot.id}`}
                              markerWidth="8"
                              markerHeight="8"
                              refX="7"
                              refY="4"
                              orient="auto"
                            >
                              <polygon points="0 0, 8 4, 0 8" fill={annot.color} />
                            </marker>
                          </defs>
                          <line
                            x1={p1[0]}
                            y1={p1[1]}
                            x2={p2[0]}
                            y2={p2[1]}
                            stroke={annot.color}
                            strokeWidth={annot.strokeWidth * zoom * 1.5}
                            markerEnd={`url(#arrowhead-${annot.id})`}
                          />
                        </g>
                      );
                    }
                    if (annot.type === 'drawing' || annot.type === 'signature') {
                      return annot.lines.map((line, lineIdx) => {
                        const pathData = line.map((p, idx) => {
                          const rx_svg = p.rx * coords.width;
                          const ry_svg = (1 - p.ry) * coords.height;
                          return `${idx === 0 ? 'M' : 'L'} ${coords.left + rx_svg} ${coords.top + ry_svg}`;
                        }).join(' ');
                        
                        return (
                          <path
                            key={`${annot.id}-${lineIdx}`}
                            d={pathData}
                            stroke={annot.color}
                            strokeWidth={annot.strokeWidth * zoom * 1.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      });
                    }
                    return null;
                  })}
                  
                  {/* Drawing Freehand feedback path */}
                  {isDrawingFreehand && tempDrawingPoints.length > 0 && (
                    <path
                      d={tempDrawingPoints.map((p, idx) => {
                        const [vx, vy] = currentViewportRef.current.convertToViewportPoint(p.x, p.y);
                        return `${idx === 0 ? 'M' : 'L'} ${vx} ${vy}`;
                      }).join(' ')}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth * zoom * 1.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  
                  {/* Drawing Shape feedback bounds */}
                  {isDrawingShape && tempShape && (
                    <>
                      {tempShape.type === 'rect' && (
                        <rect
                          x={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).left}
                          y={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).top}
                          width={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).width}
                          height={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).height}
                          fill={tempShape.color}
                          stroke={tempShape.strokeColor}
                          strokeWidth={tempShape.strokeWidth * zoom * 1.5}
                          opacity={tempShape.opacity}
                        />
                      )}
                      {tempShape.type === 'highlight' && (
                        <rect
                          x={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).left}
                          y={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).top}
                          width={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).width}
                          height={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).height}
                          fill={tempShape.color}
                          opacity={tempShape.opacity}
                        />
                      )}
                      {tempShape.type === 'circle' && (
                        <ellipse
                          cx={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).left + getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).width / 2}
                          cy={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).top + getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).height / 2}
                          rx={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).width / 2}
                          ry={getViewportRect(tempShape.x, tempShape.y, tempShape.width, tempShape.height).height / 2}
                          fill={tempShape.color}
                          stroke={tempShape.strokeColor}
                          strokeWidth={tempShape.strokeWidth * zoom * 1.5}
                          opacity={tempShape.opacity}
                        />
                      )}
                      {tempShape.type === 'arrow' && (
                        <line
                          x1={currentViewportRef.current.convertToViewportPoint(tempShape.x, tempShape.y)[0]}
                          y1={currentViewportRef.current.convertToViewportPoint(tempShape.x, tempShape.y)[1]}
                          x2={currentViewportRef.current.convertToViewportPoint(tempShape.x + tempShape.width, tempShape.y + tempShape.height)[0]}
                          y2={currentViewportRef.current.convertToViewportPoint(tempShape.x + tempShape.width, tempShape.y + tempShape.height)[1]}
                          stroke={tempShape.color}
                          strokeWidth={tempShape.strokeWidth * zoom * 1.5}
                        />
                      )}
                    </>
                  )}
                </svg>
                
                {/* HTML Text & Image Overlay Layer */}
                {pageAnnots.map(annot => {
                  const coords = getViewportRect(annot.x, annot.y, annot.width, annot.height);
                  const isSelected = selectedAnnotationId === annot.id;
                  
                  return (
                    <div
                      key={annot.id}
                      className={`absolute ${isSelected ? 'ring-2 ring-primary ring-offset-1 z-35 bg-primary/5' : ''}`}
                      style={{
                        left: `${coords.left}px`,
                        top: `${coords.top}px`,
                        width: `${coords.width}px`,
                        height: `${coords.height}px`,
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleAnnotMouseDown(e, annot)}
                    >
                      {annot.type === 'text' && (
                        <>
                          {isEditingText && isSelected ? (
                            <textarea
                              value={annot.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAnnotations(prev => ({
                                  ...prev,
                                  [pageId]: prev[pageId].map(a => a.id === annot.id ? { ...a, text: val } : a)
                                }));
                              }}
                              onBlur={() => setIsEditingText(false)}
                              autoFocus
                              className="w-full h-full bg-white border border-primary outline-none resize-none p-1 font-sans text-black"
                              style={{
                                fontFamily: annot.fontFamily || 'Arial',
                                fontSize: `${annot.fontSize * zoom * 1.5}px`,
                                color: annot.textColor,
                                lineHeight: 1.2,
                                fontWeight: annot.bold ? 'bold' : 'normal',
                                fontStyle: annot.italic ? 'italic' : 'normal',
                                textDecoration: `${annot.underline ? 'underline' : ''} ${annot.strike ? 'line-through' : ''}`.trim() || 'none'
                              }}
                            />
                          ) : (
                            <div
                              onDoubleClick={() => setIsEditingText(true)}
                              className="w-full h-full p-1 overflow-hidden font-sans break-words whitespace-pre-wrap leading-tight select-none cursor-text text-black"
                              style={{
                                fontFamily: annot.fontFamily || 'Arial',
                                fontSize: `${annot.fontSize * zoom * 1.5}px`,
                                color: annot.textColor,
                                fontWeight: annot.bold ? 'bold' : 'normal',
                                fontStyle: annot.italic ? 'italic' : 'normal',
                                textDecoration: `${annot.underline ? 'underline' : ''} ${annot.strike ? 'line-through' : ''}`.trim() || 'none'
                              }}
                            >
                              {annot.text || "Double click to type"}
                            </div>
                          )}
                        </>
                      )}

                      {annot.type === 'image' && (
                        <img
                          src={annot.imageUrl}
                          alt="Annotation Element"
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                      )}

                      {annot.type === 'note' && (
                        <div className="relative group cursor-pointer w-full h-full">
                          <div className="w-full h-full bg-amber-400 dark:bg-amber-500 rounded-lg shadow-md border border-amber-600 flex items-center justify-center text-amber-900 font-bold select-none">
                            <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
                          </div>
                          {/* Floating edit balloon */}
                          {isSelected && (
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white dark:bg-slate-800 border border-outline-variant/30 rounded-lg p-2 shadow-xl z-50 w-52 text-xs font-sans text-on-surface"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <textarea
                                value={annot.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAnnotations(prev => ({
                                    ...prev,
                                    [pageId]: prev[pageId].map(a => a.id === annot.id ? { ...a, text: val } : a)
                                  }));
                                }}
                                placeholder="Add a comment note..."
                                className="w-full h-20 resize-none p-1.5 border border-outline-variant/30 rounded bg-surface-container-highest dark:bg-slate-900 dark:text-gray-200 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Selection controls */}
                      {isSelected && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSelectedAnnotation();
                            }}
                            className="absolute -top-8 right-0 p-1 bg-error text-white rounded shadow-md hover:bg-red-600 flex items-center justify-center z-40"
                            title="Delete (Backspace)"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                          
                          {annot.type !== 'drawing' && annot.type !== 'signature' && annot.type !== 'arrow' && (
                            <div
                              className="absolute bottom-0 right-0 w-3 h-3 bg-primary border border-white cursor-se-resize z-40 shadow-sm"
                              onMouseDown={(e) => handleResizeMouseDown(e, annot)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant dark:text-gray-400 gap-4">
              <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
              <p>Loading document...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="h-12 bg-surface-container-low dark:bg-slate-800 border-t border-outline-variant/30 flex items-center justify-center gap-6">
        <button 
          onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); setSelectedAnnotationId(null); }}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-surface disabled:opacity-50 text-on-surface-variant dark:text-gray-300"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="font-label-md text-on-surface dark:text-gray-200">Page {currentPage} of {numPages}</span>
        <button 
          onClick={() => { setCurrentPage(p => Math.min(numPages, p + 1)); setSelectedAnnotationId(null); }}
          disabled={currentPage === numPages}
          className="p-1 rounded hover:bg-surface disabled:opacity-50 text-on-surface-variant dark:text-gray-300"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-surface dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full border border-outline-variant/30 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-lg font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">draw</span>
                Signature Options
              </h3>
              <button onClick={() => setShowSignatureModal(false)} className="p-1 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-full text-on-surface-variant dark:text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-outline-variant/20 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSigTab('draw')}
                className={`flex-1 pb-2 text-sm font-medium border-b-2 text-center transition-all ${sigTab === 'draw' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface dark:text-gray-400'}`}
              >
                Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setSigTab('upload')}
                className={`flex-1 pb-2 text-sm font-medium border-b-2 text-center transition-all ${sigTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface dark:text-gray-400'}`}
              >
                Upload Image
              </button>
            </div>
            
            {sigTab === 'upload' ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant dark:border-slate-650 rounded-lg p-6 bg-white dark:bg-slate-900/50 min-h-[220px] text-center gap-3">
                {uploadedSigUrl ? (
                  <div className="relative max-h-[160px] max-w-full flex items-center justify-center p-2 border border-outline-variant/30 rounded-lg bg-white dark:bg-slate-800">
                    <img src={uploadedSigUrl} alt="Uploaded signature" className="max-h-[140px] max-w-full object-contain" />
                    <button
                      onClick={() => setUploadedSigUrl(null)}
                      className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full shadow-md hover:bg-red-600 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-outline-variant">cloud_upload</span>
                    <div>
                      <label className="cursor-pointer px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors">
                        Choose Image
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-gray-400">Supports transparent PNG, JPEG</p>
                  </>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-outline-variant dark:border-slate-650 rounded-lg overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={sigCanvasRef}
                  width={460}
                  height={220}
                  className="cursor-crosshair w-full h-[220px]"
                  onMouseDown={handleSigMouseDown}
                  onMouseMove={handleSigMouseMove}
                  onMouseUp={handleSigMouseUp}
                />
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2">
              {sigTab === 'draw' ? (
                <button 
                  onClick={clearSigCanvas} 
                  className="px-4 py-2 hover:bg-surface-container-high dark:hover:bg-slate-700 text-sm text-error font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">clear_all</span>
                  Clear Pad
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSignatureModal(false)} 
                  className="px-4 py-2 border border-outline-variant dark:border-slate-600 hover:bg-surface-container-high dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-on-surface-variant dark:text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={sigTab === 'draw' ? insertSignature : insertUploadedSignature} 
                  disabled={sigTab === 'draw' ? sigPoints.length === 0 : !uploadedSigUrl}
                  className="px-6 py-2 bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium shadow transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Insert Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

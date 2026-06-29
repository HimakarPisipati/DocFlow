import React, { useState, useRef } from 'react';

export default function UploadZone({ 
  activeTool, 
  selectedFiles, 
  setSelectedFiles, 
  password, 
  setPassword, 
  splitType,
  setSplitType,
  pageRange,
  setPageRange,
  watermark,
  setWatermark,
  onProcess, 
  isProcessing,
  progress,
  estimatedTime
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getToolDetails = () => {
    switch (activeTool) {
      case 'merge':
        return {
          title: 'Merge PDFs',
          description: 'Select two or more PDF files to combine into a single document.',
          accept: '.pdf',
          multiple: true
        };
      case 'split':
        return {
          title: 'Split PDF',
          description: 'Select a PDF file to split into separate files or extract specific pages.',
          accept: '.pdf',
          multiple: false
        };
      case 'protect':
        return {
          title: 'Protect PDF',
          description: 'Select a PDF file and set a password to encrypt it.',
          accept: '.pdf',
          multiple: false
        };
      case 'pdf2img':
        return {
          title: 'PDF to Image',
          description: 'Select a PDF file to extract all its pages as high-quality PNGs.',
          accept: '.pdf',
          multiple: false
        };
      case 'pdf2docx':
        return {
          title: 'PDF to Word',
          description: 'Select a PDF file to convert it to an editable DOCX document.',
          accept: '.pdf',
          multiple: false
        };
      case 'pdf2pptx':
        return {
          title: 'PDF to PowerPoint',
          description: 'Select a PDF file to convert it to an editable PPTX slide deck.',
          accept: '.pdf',
          multiple: false
        };
      case 'pdf2xlsx':
        return {
          title: 'PDF to Excel',
          description: 'Select a PDF file to extract table data into an Excel spreadsheet.',
          accept: '.pdf',
          multiple: false
        };
      case 'img2pdf':
        return {
          title: 'Image to PDF',
          description: 'Select one or more PNG, JPG, or JPEG images to combine into a single PDF.',
          accept: '.png,.jpg,.jpeg',
          multiple: true
        };
      case 'office2pdf':
        return {
          title: 'Office to PDF',
          description: 'Select a Word (.docx), PowerPoint (.pptx), or Excel (.xlsx) file to convert to PDF.',
          accept: '.docx,.pptx,.xlsx',
          multiple: false
        };
      case 'compress':
        return {
          title: 'Compress PDF',
          description: 'Select a PDF file to reduce its size.',
          accept: '.pdf',
          multiple: false
        };
      case 'edit':
        return {
          title: 'Edit PDF',
          description: 'Select a PDF to add a custom watermark text to its pages.',
          accept: '.pdf',
          multiple: false
        };
      default:
        return {
          title: 'DocFlow Secure Vault',
          description: 'Select a tool below to begin processing your documents.',
          accept: '.pdf',
          multiple: false
        };
    }
  };

  const tool = getToolDetails();

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    preventDefaults(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    preventDefaults(e);
    setIsDragging(false);
  };

  const filterFiles = (fileList) => {
    const allowedExtensions = tool.accept.split(',').map(ext => ext.trim().toLowerCase());
    return Array.from(fileList).filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return allowedExtensions.includes(ext);
    });
  };

  const processIncomingFiles = (incoming) => {
    if (!activeTool) return;
    const validFiles = filterFiles(incoming);
    
    if (validFiles.length === 0) {
      alert(`Invalid file format. This tool only accepts ${tool.accept} files.`);
      return;
    }

    if (tool.multiple) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleDrop = (e) => {
    preventDefaults(e);
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      processIncomingFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerFileBrowser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const canProcess = () => {
    if (!selectedFiles || selectedFiles.length === 0) return false;
    if (activeTool === 'merge' && selectedFiles.length < 2) return false;
    if (activeTool === 'protect' && (!password || typeof password !== 'string' || !password.trim())) return false;
    if (activeTool === 'split' && splitType === 'extract_range' && (!pageRange || typeof pageRange !== 'string' || !pageRange.trim())) return false;
    if (activeTool === 'edit' && (!watermark || typeof watermark !== 'string' || !watermark.trim())) return false;
    return true;
  };

  return (
    <section className="w-full space-y-6">
      {/* Hidden File Input */}
      <input 
        key={activeTool}
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple={tool.multiple}
        accept={tool.accept}
        className="hidden"
      />

      <div 
        onClick={activeTool ? triggerFileBrowser : undefined}
        onDragEnter={handleDragEnter}
        onDragOver={preventDefaults}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`upload-zone w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 gap-6 group transition-all duration-300
          ${!activeTool ? 'border-outline-variant bg-surface-container-low opacity-60 cursor-not-allowed dark:bg-slate-800 dark:border-slate-600' : 'cursor-pointer'}
          ${isDragging ? 'bg-primary/5 border-primary scale-[0.99] dark:bg-primary/20' : 'border-outline-variant bg-surface-container-low dark:bg-slate-800/50 dark:border-slate-600'}`}
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300
          ${activeTool ? 'bg-primary/10 text-primary group-hover:scale-110' : 'bg-outline/15 text-outline'}`}>
          <span className="material-symbols-outlined text-[40px]">
            {activeTool ? 'cloud_upload' : 'disabled_by_default'}
          </span>
        </div>
        
        <div className="text-center space-y-2 max-w-lg">
          <h1 className="font-headline-md text-headline-md text-on-surface dark:text-gray-100">
            {tool.title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400">
            {tool.description}
          </p>
        </div>

        {activeTool && selectedFiles.length === 0 && (
          <div className="flex flex-col items-center gap-2">
            <button className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md hover:brightness-110 transition-all shadow-md active:scale-95">
              Choose Files
            </button>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">or drag files here</span>
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="glass-card rounded-xl p-6 space-y-4 max-w-3xl mx-auto border border-outline-variant/30 animate-fade-in">
          <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-slate-700 pb-3">
            <h3 className="font-headline-md text-[18px] text-on-surface dark:text-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">folder_open</span>
              Selected Documents ({selectedFiles.length})
            </h3>
            <button 
              onClick={() => setSelectedFiles([])} 
              className="text-error font-label-sm hover:underline flex items-center gap-1"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low dark:bg-slate-800 border border-outline-variant/20 dark:border-slate-600 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="material-symbols-outlined text-primary dark:text-primary">description</span>
                  <span className="font-body-md text-on-surface dark:text-gray-200 truncate max-w-md">{file.name}</span>
                  <span className="font-body-md text-on-surface-variant dark:text-gray-400 text-[14px] flex-shrink-0">({formatBytes(file.size)})</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
          </div>

          {/* Password Input for PDF Protect Tool */}
          {activeTool === 'protect' && (
            <div className="pt-4 border-t border-outline-variant/20 dark:border-slate-700 space-y-2">
              <label className="block font-label-md text-on-surface dark:text-gray-200 text-left">
                Vault Security Password
              </label>
              <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password to restrict access"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high dark:bg-slate-800 border border-outline-variant dark:border-slate-600 rounded-lg text-on-surface dark:text-gray-100 placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Watermark Input for PDF Edit Tool */}
          {activeTool === 'edit' && (
            <div className="pt-4 border-t border-outline-variant/20 dark:border-slate-700 space-y-2">
              <label className="block font-label-md text-on-surface dark:text-gray-200 text-left">
                Watermark Text
              </label>
              <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">edit</span>
                <input 
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder="Enter text to watermark the PDF"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high dark:bg-slate-800 border border-outline-variant dark:border-slate-600 rounded-lg text-on-surface dark:text-gray-100 placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Split Options for PDF Split Tool */}
          {activeTool === 'split' && (
            <div className="pt-4 border-t border-outline-variant/20 dark:border-slate-700 space-y-4 text-left">
              <label className="block font-label-md text-on-surface dark:text-gray-200">Split Mode</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 font-body-md text-on-surface dark:text-gray-300 cursor-pointer">
                  <input 
                    type="radio" 
                    name="splitType" 
                    value="split_all" 
                    checked={splitType === 'split_all'} 
                    onChange={() => setSplitType('split_all')}
                    className="accent-primary"
                  />
                  Split all pages separately (.zip)
                </label>
                <label className="flex items-center gap-2 font-body-md text-on-surface dark:text-gray-300 cursor-pointer">
                  <input 
                    type="radio" 
                    name="splitType" 
                    value="extract_range" 
                    checked={splitType === 'extract_range'} 
                    onChange={() => setSplitType('extract_range')}
                    className="accent-primary"
                  />
                  Extract specific page range (.pdf)
                </label>
              </div>

              {splitType === 'extract_range' && (
                <div className="space-y-2 mt-2 max-w-md">
                  <label className="block font-label-sm text-on-surface-variant dark:text-gray-400">Page Range (e.g. 1-3, 5)</label>
                  <input 
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="1-3, 5"
                    className="w-full px-3 py-2 bg-surface-container-high dark:bg-slate-800 border border-outline-variant dark:border-slate-600 rounded-lg text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions Bar & Progress */}
          <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20 dark:border-slate-700">
            {isProcessing ? (
              <div className="w-full space-y-2 animate-fade-in">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-label-md text-primary dark:text-primary-fixed font-medium">Processing Document...</span>
                  <span className="font-label-sm text-on-surface-variant dark:text-gray-400">{estimatedTime}</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs font-label-sm text-outline dark:text-gray-500">
                  {Math.round(progress)}% Complete
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={onProcess}
                  disabled={!canProcess()}
                  className={`px-8 py-3 rounded-lg font-label-md shadow-md text-white transition-all flex items-center gap-2 active:scale-95
                    ${canProcess() 
                      ? 'bg-primary hover:brightness-110 cursor-pointer dark:bg-primary' 
                      : 'bg-outline-variant cursor-not-allowed dark:bg-slate-600'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">build</span>
                  {activeTool === 'merge' ? 'Merge Documents' : 
                   activeTool === 'protect' ? 'Protect Document' :
                   activeTool === 'pdf2img' ? 'Convert to Images' : 
                   activeTool === 'img2pdf' ? 'Convert to PDF' : 
                   activeTool === 'office2pdf' ? 'Convert to PDF' : 
                   activeTool === 'pdf2docx' ? 'Convert to Word' : 
                   activeTool === 'pdf2pptx' ? 'Convert to PPTX' : 
                   activeTool === 'pdf2xlsx' ? 'Convert to Excel' : 
                   activeTool === 'split' ? 'Split PDF' : 
                   activeTool === 'compress' ? 'Compress PDF' : 
                   activeTool === 'edit' ? 'Watermark PDF' : 'Process'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

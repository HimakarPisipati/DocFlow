import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ToolsGrid from './components/ToolsGrid';
import Settings from './components/Settings';
import Security from './components/Security';
import Documents from './components/Documents';
import StatusBanner from './components/StatusBanner';
import PdfEditor from './components/PdfEditor';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import PrivacyPolicy from './components/PrivacyPolicy';

const API_BASE = 'https://docflow-backend-oovp.onrender.com';

export default function App() {
  const [activeTool, setActiveTool] = useState('merge');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [splitType, setSplitType] = useState('split_all');
  const [pageRange, setPageRange] = useState('');
  const [watermark, setWatermark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [status, setStatus] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [downloadBehavior, setDownloadBehavior] = useState(() => localStorage.getItem('downloadBehavior') || 'ask');
  const [autoClear, setAutoClear] = useState(() => {
    const saved = localStorage.getItem('autoClear');
    return saved !== null ? saved === 'true' : true;
  });
  const [apiServer, setApiServer] = useState(() => localStorage.getItem('apiServer') || API_BASE);

  const [currentView, setCurrentView] = useState('dashboard');
  const [processedDocuments, setProcessedDocuments] = useState([]);
  const uploadZoneRef = useRef(null);

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('downloadBehavior', downloadBehavior);
  }, [downloadBehavior]);

  useEffect(() => {
    localStorage.setItem('autoClear', autoClear);
  }, [autoClear]);

  useEffect(() => {
    localStorage.setItem('apiServer', apiServer);
  }, [apiServer]);

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    if (uploadZoneRef.current) {
      setTimeout(() => {
        const yOffset = -100;
        const element = uploadZoneRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 50);
    }
  };

  // Clear states when active tool changes
  useEffect(() => {
    setSelectedFiles([]);
    setPassword('');
    setSplitType('split_all');
    setPageRange('');
    setWatermark('');
    setStatus(null);
  }, [activeTool]);

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setStatus(null);

    const formData = new FormData();
    let endpoint = '';
    let downloadFilename = 'processed_file';

    const originalName = selectedFiles[0].name;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));

    try {
      if (activeTool === 'merge') {
        if (selectedFiles.length < 2) {
          throw new Error('Please select at least two PDF files to merge.');
        }
        endpoint = `${apiServer}/api/merge`;
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        downloadFilename = `${baseName}_merged.pdf`;
      }
      else if (activeTool === 'split') {
        endpoint = `${apiServer}/api/split`;
        formData.append('file', selectedFiles[0]);
        formData.append('split_type', splitType);
        formData.append('page_range', pageRange);
        if (splitType === 'extract_range') {
          downloadFilename = `${baseName}_split.pdf`;
        } else {
          downloadFilename = `${baseName}_split.zip`;
        }
      }
      else if (activeTool === 'protect') {
        if (!password.trim()) {
          throw new Error('Please enter a security password to encrypt the PDF.');
        }
        endpoint = `${apiServer}/api/security/protect`;
        formData.append('file', selectedFiles[0]);
        formData.append('password', password);
        downloadFilename = `${baseName}.pdf`;
      }
      else if (activeTool === 'pdf2img') {
        endpoint = `${apiServer}/api/convert/pdf-to-image`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}.zip`;
      }
      else if (activeTool === 'pdf2docx') {
        endpoint = `${apiServer}/api/convert/pdf-to-docx`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}.docx`;
      }
      else if (activeTool === 'pdf2pptx') {
        endpoint = `${apiServer}/api/convert/pdf-to-pptx`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}.pptx`;
      }
      else if (activeTool === 'pdf2xlsx') {
        endpoint = `${apiServer}/api/convert/pdf-to-xlsx`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}.xlsx`;
      }
      else if (activeTool === 'img2pdf') {
        endpoint = `${apiServer}/api/convert/image-to-pdf`;
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        downloadFilename = `${baseName}.pdf`;
      }
      else if (activeTool === 'office2pdf') {
        endpoint = `${apiServer}/api/convert/office-to-pdf`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}.pdf`;
      }
      else if (activeTool === 'compress') {
        endpoint = `${apiServer}/api/compress`;
        formData.append('file', selectedFiles[0]);
        downloadFilename = `${baseName}_compressed.pdf`;
      }
      else if (activeTool === 'edit') {
        endpoint = `${apiServer}/api/edit`;
        formData.append('file', selectedFiles[0]);
        if (watermark) formData.append('watermark', watermark);
        downloadFilename = `${baseName}_edited.pdf`;
      }
      else {
        throw new Error('Selected tool is not supported yet.');
      }

      // Start Progress Simulation
      let currentProgress = 0;
      setProgress(0);

      // Heuristic for estimated time (1MB ~ 2s, min 3s)
      const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      const estimatedSeconds = Math.max(3, Math.ceil(totalSize / 500000));
      setEstimatedTime(`${estimatedSeconds}s`);

      const progressInterval = setInterval(() => {
        currentProgress += (100 / estimatedSeconds) / 4; // Update 4 times a second
        if (currentProgress > 95) currentProgress = 95; // Cap at 95% until complete
        setProgress(currentProgress);

        const remaining = Math.max(1, Math.ceil(estimatedSeconds - (currentProgress / 100 * estimatedSeconds)));
        setEstimatedTime(`~${remaining}s remaining`);
      }, 250);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setEstimatedTime('Complete!');

      if (!response.ok) {
        let errMsg = 'File processing failed';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          // If response is not JSON
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      if (downloadBehavior === 'downloads') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: downloadFilename,
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (err) {
            console.log('User cancelled save prompt');
          }
        } else {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      }
      // Notice: Do NOT revoke object URL yet, so it can be re-downloaded from Documents tab.

      const toolNames = {
        merge: 'PDF to PDF (Merge)',
        split: 'PDF to ZIP/PDF (Split)',
        protect: 'PDF to PDF (Secure)',
        pdf2img: 'PDF to Image',
        pdf2docx: 'PDF to Word',
        pdf2pptx: 'PDF to PPTX',
        pdf2xlsx: 'PDF to Excel',
        img2pdf: 'Image to PDF',
        office2pdf: 'Office to PDF',
        compress: 'Compress PDF',
        edit: 'Edit PDF'
      };

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setProcessedDocuments(prev => [
        {
          filename: downloadFilename,
          size: blob.size,
          toolId: activeTool,
          conversion: toolNames[activeTool] || 'Unknown',
          timestamp: timestamp,
          downloadUrl: downloadUrl
        },
        ...prev
      ]);

      setStatus({
        type: 'success',
        message: 'Your file has been successfully processed!'
      });
      if (autoClear) {
        setSelectedFiles([]);
        setPassword('');
        setPageRange('');
        setWatermark('');
      }
    } catch (err) {
      setProgress(0);
      setEstimatedTime('');
      console.error(err);
      
      let errorMessage = err.message || 'An unexpected error occurred during processing.';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'The file is too large to process. Please try a smaller file.';
      }
      
      setStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditorSave = async (blob) => {
    try {
      setIsProcessing(true);
      setStatus(null);

      const downloadFilename = `${selectedFiles[0].name.replace(/\.pdf$/i, '')}_edited.pdf`;
      const downloadUrl = window.URL.createObjectURL(blob);

      if (downloadBehavior === 'downloads') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: downloadFilename,
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (err) {
            console.log('User cancelled save prompt');
          }
        } else {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setProcessedDocuments(prev => [
        {
          filename: downloadFilename,
          size: blob.size,
          toolId: 'edit',
          conversion: 'Edit PDF',
          timestamp: timestamp,
          downloadUrl: downloadUrl
        },
        ...prev
      ]);

      setStatus({
        type: 'success',
        message: 'Your PDF has been successfully edited and saved!'
      });

      if (autoClear) {
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred during saving.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setTheme(isDarkMode ? 'light' : 'dark')}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <main className="pt-24 pb-16 px-margin-desktop max-w-[1400px] mx-auto min-h-screen flex flex-col gap-12">
        {currentView === 'dashboard' && (
          <>
            {/* Status Notification */}
            {status && (
              <div className={`p-4 rounded-lg flex items-center justify-between gap-4 max-w-3xl w-full mx-auto border transition-all duration-300 animate-fade-in
            ${status.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {status.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <p className="font-body-md text-[15px]">{status.message}</p>
                </div>
                <button onClick={() => setStatus(null)} className="hover:opacity-70 p-1 flex items-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <div ref={uploadZoneRef} className="scroll-mt-24">
              {activeTool === 'edit' && selectedFiles.length > 0 ? (
                <PdfEditor
                  file={selectedFiles[0]}
                  onSave={handleEditorSave}
                  onCancel={() => setSelectedFiles([])}
                />
              ) : (
                <UploadZone
                  activeTool={activeTool}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  password={password}
                  setPassword={setPassword}
                  splitType={splitType}
                  setSplitType={setSplitType}
                  pageRange={pageRange}
                  setPageRange={setPageRange}
                  watermark={watermark}
                  setWatermark={setWatermark}
                  onProcess={handleProcess}
                  isProcessing={isProcessing}
                  progress={progress}
                  estimatedTime={estimatedTime}
                />
              )}
            </div>

            <ToolsGrid
              activeTool={activeTool}
              setActiveTool={handleToolSelect}
              onViewAll={() => setCurrentView('tools')}
            />

          </>
        )}

        {currentView === 'documents' && (
          <Documents processedDocuments={processedDocuments} />
        )}

        {currentView === 'tools' && (
          <div className="pt-8">
            <ToolsGrid
              activeTool={activeTool}
              setActiveTool={(id) => {
                handleToolSelect(id);
                setCurrentView('dashboard');
              }}
              showHeader={false}
            />
          </div>
        )}

        {currentView === 'settings' && (
          <Settings
            theme={theme} setTheme={setTheme}
            downloadBehavior={downloadBehavior} setDownloadBehavior={setDownloadBehavior}
            autoClear={autoClear} setAutoClear={setAutoClear}
            apiServer={apiServer} setApiServer={setApiServer}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'security' && (
          <Security />
        )}

        {currentView === 'about' && (
          <AboutUs setCurrentView={setCurrentView} />
        )}

        {currentView === 'contact' && (
          <ContactUs setCurrentView={setCurrentView} />
        )}

        {currentView === 'privacy' && (
          <PrivacyPolicy setCurrentView={setCurrentView} />
        )}
      </main>
    </>
  );
}

import React from 'react';

export default function Documents({ processedDocuments }) {
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.downloadUrl;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Session Documents</h2>
        <p className="font-body-md text-on-surface-variant dark:text-gray-400 mt-2">
          Files processed during this session are temporarily available here.
        </p>
      </div>

      <div className="glass-card rounded-xl border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        {processedDocuments && processedDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low dark:bg-slate-900 border-b border-outline-variant/30 dark:border-slate-700">
                  <th className="px-6 py-4 font-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider text-xs">File Name</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider text-xs">Conversion</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider text-xs">Size</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider text-xs">Time</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 dark:divide-slate-700">
                {processedDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                        <span className="font-body-md text-on-surface dark:text-gray-200 font-medium max-w-[200px] truncate" title={doc.filename}>{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                        {doc.conversion}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant dark:text-gray-400 text-sm">
                      {formatBytes(doc.size)}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant dark:text-gray-400 text-sm">
                      {doc.timestamp}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-container-high dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-outline dark:text-gray-400">
              <span className="material-symbols-outlined text-[32px]">folder_off</span>
            </div>
            <h3 className="font-headline-md text-[18px] text-on-surface dark:text-gray-200 mb-1">No Documents Yet</h3>
            <p className="font-body-md text-on-surface-variant dark:text-gray-400 max-w-sm">
              Documents you process during this session will appear here for easy access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

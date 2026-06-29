import React from 'react';

export default function Security() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[40px]">security</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Secure Cloud Processing</h2>
        <p className="font-body-lg text-on-surface-variant dark:text-gray-400">
          DocFlow is built with a privacy-first architecture. Your documents are processed on secure cloud servers and instantly deleted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-xl border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 text-primary rounded-lg flex items-center justify-center mb-6">
            <span className="material-symbols-outlined">cloud_off</span>
          </div>
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 mb-2">Strictly Temporary Storage</h3>
          <p className="font-body-md text-on-surface-variant dark:text-gray-400">
            When your files are uploaded to our secure remote servers for conversion or merging, they are processed and instantly deleted. We never store them.
          </p>
        </div>

        <div className="glass-card p-8 rounded-xl border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 text-primary rounded-lg flex items-center justify-center mb-6">
            <span className="material-symbols-outlined">delete_forever</span>
          </div>
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 mb-2">Zero Data Retention</h3>
          <p className="font-body-md text-on-surface-variant dark:text-gray-400">
            Processed files are temporarily held in our server's memory just long enough to be sent back to you, then they are immediately and permanently destroyed.
          </p>
        </div>

        <div className="glass-card p-8 rounded-xl border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 text-primary rounded-lg flex items-center justify-center mb-6">
            <span className="material-symbols-outlined">vpn_key</span>
          </div>
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 mb-2">Military-Grade Encryption</h3>
          <p className="font-body-md text-on-surface-variant dark:text-gray-400">
            When you use the Protect PDF tool, we apply AES 256-bit encryption to secure your documents from unauthorized access.
          </p>
        </div>

        <div className="glass-card p-8 rounded-xl border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 text-primary rounded-lg flex items-center justify-center mb-6">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 mb-2">Open Source Core</h3>
          <p className="font-body-md text-on-surface-variant dark:text-gray-400">
            Powered by trusted, widely-audited open-source libraries like PyPDF2, PyMuPDF, and React. No hidden tracking telemetry.
          </p>
        </div>
      </div>
    </div>
  );
}

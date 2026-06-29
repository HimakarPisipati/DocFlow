import React from 'react';

export default function StatusBanner() {
  return (
    <section className="glass-card mt-auto p-gutter rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-primary/10 overflow-hidden relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary rounded-full blur-3xl"></div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        <div className="p-3 bg-primary text-on-primary rounded-full">
          <span className="material-symbols-outlined">offline_pin</span>
        </div>
        <div>
          <h4 className="font-headline-md text-[18px] text-on-surface dark:text-gray-100">Offline-Only Workspace</h4>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400">All processing happens in your browser's memory. No data is sent to our servers.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 relative">
        <div className="text-right">
          <span className="font-label-sm text-label-sm text-outline dark:text-gray-500 uppercase block">Vault Version</span>
          <span className="font-body-md text-body-md font-bold text-on-surface dark:text-gray-100">v4.2.1-stable</span>
        </div>
        <div className="w-px h-10 bg-outline-variant dark:bg-slate-700"></div>
        <button className="px-6 py-2 border border-primary text-primary dark:border-primary-fixed dark:text-primary-fixed rounded-lg font-label-md hover:bg-primary/5 transition-colors">
          Check for Updates
        </button>
      </div>
    </section>
  );
}

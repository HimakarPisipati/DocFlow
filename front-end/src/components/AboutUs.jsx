import React from 'react';

export default function AboutUs({ setCurrentView }) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in pt-8">
      <div>
        <button
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary dark:text-gray-400 dark:hover:text-primary-400 transition-colors mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-label-md">Back to Settings</span>
        </button>
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">About Us</h2>
        <p className="font-body-md text-on-surface-variant dark:text-gray-400 mt-2">Learn more about DocFlow.</p>
      </div>

      <div className="glass-card rounded-xl p-8 space-y-6 border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-on-surface-variant dark:text-gray-300 leading-relaxed font-body-md">
          DocFlow is an advanced document processing platform built to simplify the way you handle PDFs.
          Whether you're merging, splitting, compressing, or editing files, we aim to provide powerful tools right in your browser.
        </p>
        <p className="text-on-surface-variant dark:text-gray-300 leading-relaxed font-body-md">
          Our mission is to ensure seamless document management without compromising security or privacy.
          By utilizing strictly temporary cloud processing, we ensure your files remain yours and are never permanently stored.
        </p>
      </div>
      <div className="glass-card rounded-xl p-8 space-y-6 border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800 mt-6">
        <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 border-b border-outline-variant/20 dark:border-slate-700 pb-2">Founder & Developer</h3>
        <p className="text-on-surface-variant dark:text-gray-300 font-body-md">
          DocFlow was created and developed by <strong>Himakar Pisipati</strong>.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a href="mailto:campusspend@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high dark:bg-slate-700 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary transition-colors font-label-md border border-outline-variant/20 dark:border-slate-600">
          <span className="material-symbols-outlined text-[18px]">mail</span>
          Email
        </a>
        <a href="https://github.com/himakarpisipati" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high dark:bg-slate-700 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary transition-colors font-label-md border border-outline-variant/20 dark:border-slate-600">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          GitHub
        </a>
        <a href="https://linkedin.com/in/himakarpisipati" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high dark:bg-slate-700 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary transition-colors font-label-md border border-outline-variant/20 dark:border-slate-600">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
          LinkedIn
        </a>
      </div>
    </div>
    </div >
  );
}

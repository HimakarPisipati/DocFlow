import React from 'react';

export default function ContactUs({ setCurrentView }) {
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
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Contact Us</h2>
        <p className="font-body-md text-on-surface-variant dark:text-gray-400 mt-2">Get in touch with the DocFlow team.</p>
      </div>

      <div className="glass-card rounded-xl p-8 space-y-6 border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-on-surface-variant dark:text-gray-300 font-body-md">
          Have questions or need support? We'd love to hear from you.
        </p>

        <div className="space-y-4 font-body-md bg-surface-container-high dark:bg-slate-700 p-6 rounded-lg border border-outline-variant/20 dark:border-slate-600">
          <div className="flex items-center gap-3 text-on-surface dark:text-gray-200">
            <span className="material-symbols-outlined text-primary">mail</span>
            <span><strong>Email:</strong> campusspend@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 text-on-surface dark:text-gray-200">
            <span className="material-symbols-outlined text-primary">phone</span>
            <span><strong>Phone:</strong> +91 8074982449</span>
          </div>

        </div>
      </div>
    </div>
  );
}

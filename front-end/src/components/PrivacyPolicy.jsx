import React from 'react';

export default function PrivacyPolicy({ setCurrentView }) {
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
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Privacy Policy</h2>
        <p className="font-body-md text-on-surface-variant dark:text-gray-400 mt-2">How we handle your data and privacy.</p>
      </div>

      <div className="glass-card rounded-xl p-8 space-y-6 border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-on-surface-variant dark:text-gray-300 space-y-4 font-body-md">
          <section>
            <h3 className="font-bold text-on-surface dark:text-gray-100 mb-2">1. Data Collection</h3>
            <p>Your documents are processed on our secure cloud servers. To ensure your privacy, files are stored strictly temporarily during processing and are <strong>instantly and permanently deleted</strong> the moment the conversion finishes. We never permanently store, read, or distribute your documents.</p>
          </section>
          
          <section>
            <h3 className="font-bold text-on-surface dark:text-gray-100 mb-2">2. Usage Data</h3>
            <p>We may collect anonymous usage data to improve our services and user experience, but this is never linked to your personal identity or document contents.</p>
          </section>
          
          <section>
            <h3 className="font-bold text-on-surface dark:text-gray-100 mb-2">3. Security</h3>
            <p>We implement industry-standard security measures to protect any preference data saved in your browser.</p>
          </section>
          
          <section>
            <h3 className="font-bold text-on-surface dark:text-gray-100 mb-2">4. Third Parties</h3>
            <p>We do not sell, trade, or otherwise transfer your personal information to outside parties.</p>
          </section>
          
          <p className="mt-6 pt-4 border-t border-outline-variant/20 dark:border-slate-700">
            By using DocFlow, you consent to our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

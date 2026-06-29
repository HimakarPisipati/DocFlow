import React from 'react';

export default function Settings({
  theme, setTheme,
  downloadBehavior, setDownloadBehavior,
  autoClear, setAutoClear,
  apiServer, setApiServer,
  setCurrentView
}) {
  const [showNotification, setShowNotification] = React.useState(false);

  const handleSave = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Settings</h2>
        <p className="font-body-md text-on-surface-variant dark:text-gray-400 mt-2">Manage your DocFlow preferences and default behaviors.</p>
      </div>

      {showNotification && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
          <p className="font-body-md text-[15px]">Settings have been successfully saved and applied!</p>
        </div>
      )}

      <div className="glass-card rounded-xl p-8 space-y-8 border border-outline-variant/30 dark:border-slate-700 dark:bg-slate-800">
        
        {/* Appearance Section */}
        <section className="space-y-4">
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 border-b border-outline-variant/20 dark:border-slate-700 pb-2">Appearance</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-md text-on-surface dark:text-gray-200">Theme Preference</p>
              <p className="font-label-sm text-on-surface-variant dark:text-gray-400">Choose between light and dark mode</p>
            </div>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-4 py-2 bg-surface-container-high dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded-lg text-on-surface dark:text-gray-200 focus:outline-none focus:border-primary">

              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </section>

        {/* File Processing Section */}
        <section className="space-y-4">
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 border-b border-outline-variant/20 dark:border-slate-700 pb-2">File Processing</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-md text-on-surface dark:text-gray-200">Default Download Behavior</p>
              <p className="font-label-sm text-on-surface-variant dark:text-gray-400">Where should files be saved after processing?</p>
            </div>
            <select 
              value={downloadBehavior}
              onChange={(e) => setDownloadBehavior(e.target.value)}
              className="px-4 py-2 bg-surface-container-high dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded-lg text-on-surface dark:text-gray-200 focus:outline-none focus:border-primary">
              <option value="ask">Always ask me</option>
              <option value="downloads">Save to Downloads</option>
            </select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="font-label-md text-on-surface dark:text-gray-200">Auto-clear Workspace</p>
              <p className="font-label-sm text-on-surface-variant dark:text-gray-400">Remove files from dashboard after processing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoClear}
                onChange={(e) => setAutoClear(e.target.checked)}
              />
              <div className="w-11 h-6 bg-outline-variant dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>



        {/* Information Section */}
        <section className="space-y-4">
          <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 border-b border-outline-variant/20 dark:border-slate-700 pb-2">About & Legal</h3>
          
          <div className="flex flex-col items-start space-y-3">
            <button 
              onClick={() => setCurrentView('about')}
              className="font-label-md text-primary hover:underline dark:text-primary-400 focus:outline-none">
              About Us
            </button>
            <button 
              onClick={() => setCurrentView('contact')}
              className="font-label-md text-primary hover:underline dark:text-primary-400 focus:outline-none">
              Contact Us
            </button>
            <button 
              onClick={() => setCurrentView('privacy')}
              className="font-label-md text-primary hover:underline dark:text-primary-400 focus:outline-none">
              Privacy Policy
            </button>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-label-md shadow-md hover:brightness-110 transition-all active:scale-95">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

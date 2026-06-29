import React from 'react';

export default function Header({ isDarkMode, toggleDarkMode, currentView, setCurrentView }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex items-center gap-8">
        <span 
          className="font-headline-md text-headline-md font-bold text-primary cursor-pointer"
          onClick={() => setCurrentView('dashboard')}
        >
          DocFlow
        </span>
        <nav className="hidden md:flex gap-6 items-center h-full pt-1">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`font-label-md text-label-md font-bold h-full flex items-center px-2 transition-all duration-200 ${currentView === 'dashboard' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high dark:text-gray-300 dark:hover:bg-slate-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('documents')}
            className={`font-label-md text-label-md font-bold h-full flex items-center px-2 transition-all duration-200 ${currentView === 'documents' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high dark:text-gray-300 dark:hover:bg-slate-800'}`}
          >
            Documents
          </button>
          <button 
            onClick={() => setCurrentView('tools')}
            className={`font-label-md text-label-md font-bold h-full flex items-center px-2 transition-all duration-200 ${currentView === 'tools' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high dark:text-gray-300 dark:hover:bg-slate-800'}`}
          >
            Tools
          </button>
        </nav>
      </div>



      <div className="flex items-center gap-4">
        <button 
          onClick={() => setCurrentView('security')}
          className={`p-2 rounded-full transition-all ${currentView === 'security' ? 'bg-primary/10 text-primary dark:bg-primary/30' : 'hover:bg-surface-container-high dark:hover:bg-slate-800'}`}
        >
          <span className={`material-symbols-outlined ${currentView === 'security' ? 'text-primary' : 'text-on-surface-variant dark:text-gray-300'}`}>shield</span>
        </button>
        <button 
          onClick={() => setCurrentView('settings')}
          className={`p-2 rounded-full transition-all ${currentView === 'settings' ? 'bg-primary/10 text-primary dark:bg-primary/30' : 'hover:bg-surface-container-high dark:hover:bg-slate-800'}`}
        >
          <span className={`material-symbols-outlined ${currentView === 'settings' ? 'text-primary' : 'text-on-surface-variant dark:text-gray-300'}`}>settings</span>
        </button>
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-slate-800 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface-variant dark:text-gray-300">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </header>
  );
}

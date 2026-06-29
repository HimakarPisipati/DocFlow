import React from 'react';

export default function ToolCard({ icon, title, description, active, supported, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-gutter rounded-xl hover:translate-y-[-4px] transition-all relative group
        ${supported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
        ${active ? 'border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/20 dark:border-primary/50' : 'border-outline-variant/30 hover:border-primary/30 dark:border-slate-700 dark:hover:border-primary/50'}`}
    >
      {!supported && (
        <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-outline/10 text-on-surface-variant dark:bg-slate-700 dark:text-gray-300">
          Coming Soon
        </span>
      )}
      
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-colors
        ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white dark:bg-primary/20'}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      
      <h3 className="font-headline-md text-[20px] text-on-surface dark:text-gray-100 mb-2">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mb-6">{description}</p>
      
      {supported && (
        <div className={`flex items-center text-primary font-label-md gap-2 transition-opacity duration-200
          ${active ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100'}`}>
          {active ? 'Active Tool' : 'Select Tool'} <span className="material-symbols-outlined text-[16px]">{active ? 'check_circle' : 'arrow_forward'}</span>
        </div>
      )}
    </div>
  );
}

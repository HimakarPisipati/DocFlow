import React from 'react';
import ToolCard from './ToolCard';

const tools = [
  { id: 'merge', icon: 'call_merge', title: 'Merge PDFs', description: 'Combine multiple PDFs into one cohesive document.', supported: true },
  { id: 'split', icon: 'call_split', title: 'Split PDF', description: 'Extract specific pages or split your PDF into separate individual files.', supported: true },
  { id: 'office2pdf', icon: 'transform', title: 'Office to PDF', description: 'Convert Word (.docx), PowerPoint (.pptx), or Excel (.xlsx) files to PDF.', supported: true },
  { id: 'pdf2docx', icon: 'description', title: 'PDF to Word', description: 'Convert your PDF files to editable DOCX documents.', supported: true },
  { id: 'pdf2pptx', icon: 'slideshow', title: 'PDF to PowerPoint', description: 'Convert your PDF presentation to editable PPTX slides.', supported: true },
  { id: 'pdf2xlsx', icon: 'table_chart', title: 'PDF to Excel', description: 'Extract tables and text from your PDF into an Excel spreadsheet.', supported: true },
  { id: 'img2pdf', icon: 'picture_as_pdf', title: 'Image to PDF', description: 'Convert and combine PNG, JPG, or JPEG images into a single PDF document.', supported: true },
  { id: 'protect', icon: 'lock', title: 'Protect PDF', description: 'Add industrial-grade passwords and AES encryption to secure your PDF files.', supported: true },
  { id: 'pdf2img', icon: 'image', title: 'PDF to Image', description: 'Export PDF pages as high-quality PNG images inside a zip archive.', supported: true },
  { id: 'ocr', icon: 'document_scanner', title: 'OCR Scanner', description: 'Make scanned PDFs searchable and editable using advanced text recognition.', supported: false },
  { id: 'compress', icon: 'compress', title: 'Compress PDF', description: 'Reduce file size significantly without losing perceptible document or image quality.', supported: true },
  { id: 'edit', icon: 'edit', title: 'Edit PDF', description: 'Add custom watermarks and text to your PDF documents.', supported: true }
];

export default function ToolsGrid({ activeTool, setActiveTool, onViewAll, showHeader = true }) {
  // Filter and order tools for the Popular Tools section
  let displayTools = tools;
  if (showHeader) {
    const popularIds = ['office2pdf', 'edit', 'split', 'merge', 'protect'];
    displayTools = popularIds.map(id => tools.find(t => t.id === id)).filter(Boolean);
  }

  return (
    <section className="space-y-8 animate-fade-in">
      {showHeader && (
        <div className="flex items-end justify-between border-b border-outline-variant/30 dark:border-slate-700 pb-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-gray-100">Popular Tools</h2>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400">Essential PDF management and security utilities.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTools.map((tool) => (
          <ToolCard 
            key={tool.id}
            icon={tool.icon}
            title={tool.title}
            description={tool.description}
            active={activeTool === tool.id}
            supported={tool.supported}
            onClick={() => tool.supported && setActiveTool(tool.id)}
          />
        ))}
        {showHeader && onViewAll && (
          <ToolCard 
            key="view-all"
            icon="grid_view"
            title="View All Tools"
            description="Explore our full collection of PDF conversion, editing, compression, and security tools."
            active={false}
            supported={true}
            onClick={onViewAll}
          />
        )}
      </div>
    </section>
  );
}

/**
 * DiagramViewer Component
 * Unified viewer for displaying a single diagram with controls
 */

import { MermaidDiagram } from './MermaidDiagram';
import { DiagramControls } from './DiagramControls';

interface DiagramViewerProps {
  id: string;
  title: string;
  description?: string;
  content: string;
  className?: string;
}

export function DiagramViewer({
  id,
  title,
  description,
  content,
  className = '',
}: DiagramViewerProps) {
  const handleExportSuccess = (format: string) => {
    console.log(`Successfully exported as ${format}`);
  };

  return (
    <div className={`diagram-viewer ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {description && (
          <p className="text-gray-400 text-sm">{description}</p>
        )}
      </div>

      <MermaidDiagram
        id={id}
        content={content}
        className="mb-4"
      />

      <DiagramControls
        diagramId={id}
        diagramTitle={title}
        mermaidSource={content}
        onExportSuccess={handleExportSuccess}
      />
    </div>
  );
}

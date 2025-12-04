/**
 * MermaidDiagram Component
 * Renders Mermaid diagrams with dynamic content
 */

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  id: string;
  content: string;
  title?: string;
  className?: string;
}

export function MermaidDiagram({
  id,
  content,
  title,
  className = '',
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: true,
          theme: 'dark',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          er: {
            useMaxWidth: true,
          },
          sequence: {
            useMaxWidth: true,
            mirrorActors: true,
          },
        });

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create diagram element
        const diagramDiv = document.createElement('div');
        diagramDiv.className = 'mermaid';
        diagramDiv.textContent = content;
        diagramDiv.id = id;

        containerRef.current.appendChild(diagramDiv);

        // Render diagram
        await mermaid.contentLoaded();
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<p class="text-red-500">Error rendering diagram</p>';
        }
      }
    };

    renderDiagram();
  }, [content, id]);

  return (
    <div className={`mermaid-container ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>}
      <div
        ref={containerRef}
        className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-auto"
        id={`diagram-${id}`}
      />
    </div>
  );
}

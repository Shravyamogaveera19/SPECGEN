/**
 * DiagramControls Component
 * Export, copy, and view options for diagrams
 */

import { Download, Copy, Eye } from 'lucide-react';
import { useState } from 'react';
import { exportAsSVG, exportAsPNG, exportAsMermaid, copyToClipboard } from '../../utils/diagramExport';

interface DiagramControlsProps {
  diagramId: string;
  diagramTitle: string;
  mermaidSource: string;
  onExportSuccess?: (format: string) => void;
}

export function DiagramControls({
  diagramId,
  diagramTitle,
  mermaidSource,
  onExportSuccess,
}: DiagramControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleExportSVG = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById(`diagram-${diagramId}`);
      if (element) {
        await exportAsSVG(element, diagramTitle);
        onExportSuccess?.('SVG');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById(`diagram-${diagramId}`);
      if (element) {
        await exportAsPNG(element, diagramTitle);
        onExportSuccess?.('PNG');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMermaid = () => {
    try {
      exportAsMermaid(mermaidSource, diagramTitle);
      onExportSuccess?.('Mermaid');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCopySource = async () => {
    const success = await copyToClipboard(mermaidSource);
    if (success) {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
      <button
        onClick={handleExportSVG}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        title="Download as SVG"
      >
        <Download size={16} />
        SVG
      </button>

      <button
        onClick={handleExportPNG}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        title="Download as PNG"
      >
        <Download size={16} />
        PNG
      </button>

      <button
        onClick={handleExportMermaid}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        title="Download Mermaid source"
      >
        <Download size={16} />
        Mermaid
      </button>

      <button
        onClick={handleCopySource}
        className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
        title="Copy source to clipboard"
      >
        <Copy size={16} />
        {copyStatus || 'Copy'}
      </button>

      <a
        href="https://mermaid.live"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium transition-colors"
        title="Edit in Mermaid Live Editor"
      >
        <Eye size={16} />
        Live
      </a>
    </div>
  );
}

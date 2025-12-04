/**
 * Diagram Export Utility
 * Handles export of diagrams to various formats (SVG, PNG, Mermaid source)
 */

export interface ExportOptions {
  format: 'svg' | 'png' | 'mmd' | 'pdf';
  scale?: number;
  filename?: string;
}

/**
 * Export diagram as SVG
 * Uses Mermaid's built-in SVG rendering
 */
export const exportAsSVG = async (
  diagramElement: HTMLElement,
  filename: string = 'diagram'
): Promise<void> => {
  try {
    const svg = diagramElement.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG found in diagram element');
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    downloadFile(blob, `${filename}.svg`);
  } catch (error) {
    console.error('Error exporting SVG:', error);
    throw error;
  }
};

/**
 * Export diagram as PNG
 * Converts SVG to PNG using canvas
 */
export const exportAsPNG = async (
  diagramElement: HTMLElement,
  filename: string = 'diagram',
  scale: number = 2
): Promise<void> => {
  try {
    const svg = diagramElement.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG found in diagram element');
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(blob, `${filename}.png`);
        }
      }, 'image/png');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw error;
  }
};

/**
 * Export diagram source as Mermaid markdown
 */
export const exportAsMermaid = (
  mermaidSource: string,
  filename: string = 'diagram'
): void => {
  try {
    const blob = new Blob([mermaidSource], { type: 'text/plain' });
    downloadFile(blob, `${filename}.mmd`);
  } catch (error) {
    console.error('Error exporting Mermaid source:', error);
    throw error;
  }
};

/**
 * Helper function to download file
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy diagram source to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Generate downloadable diagram package (all formats)
 */
export const exportAllFormats = async (
  diagramElement: HTMLElement,
  mermaidSource: string,
  baseName: string = 'diagram'
): Promise<void> => {
  try {
    // Export SVG
    await exportAsSVG(diagramElement, baseName);

    // Export PNG
    await exportAsPNG(diagramElement, baseName);

    // Export Mermaid source
    exportAsMermaid(mermaidSource, baseName);
  } catch (error) {
    console.error('Error exporting all formats:', error);
    throw error;
  }
};

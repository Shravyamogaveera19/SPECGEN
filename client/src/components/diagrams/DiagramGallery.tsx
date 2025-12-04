/**
 * DiagramGallery Component
 * Tabbed view showing all diagrams by category
 */

import { useState } from 'react';
import { DiagramViewer } from './DiagramViewer';
import { MERMAID_DIAGRAMS } from '../../utils/mermaidDiagrams';
import { DIAGRAM_DEFINITIONS, DIAGRAM_CATEGORIES } from '../../utils/diagramDefinitions';

export function DiagramGallery() {
  const [activeCategory, setActiveCategory] = useState('Architecture');

  const filteredDiagrams = Object.values(DIAGRAM_DEFINITIONS).filter(
    (diagram) => diagram.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto pb-4">
        {DIAGRAM_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Diagrams Grid */}
      <div className="space-y-8">
        {filteredDiagrams.map((diagram) => (
          <div key={diagram.id} className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
            <DiagramViewer
              id={diagram.id}
              title={diagram.title}
              description={diagram.description}
              content={MERMAID_DIAGRAMS[diagram.id as keyof typeof MERMAID_DIAGRAMS]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

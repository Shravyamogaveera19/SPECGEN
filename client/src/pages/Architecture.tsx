/**
 * Architecture Page
 * Displays system architecture, design, and database diagrams
 */

import { DiagramGallery } from '../components/diagrams';
import { ArrowRight } from 'lucide-react';

export function Architecture() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-700 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-3">
              <ArrowRight size={16} />
              System Design & Architecture
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Architecture Overview
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Complete reverse-engineered system design showing high-level architecture,
              detailed component interactions, database schemas, and request flows.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-700">
            <div className="space-y-1">
              <div className="text-gray-400 text-sm">Diagrams</div>
              <div className="text-3xl font-bold text-blue-400">4</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 text-sm">Categories</div>
              <div className="text-3xl font-bold text-green-400">4</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 text-sm">Services</div>
              <div className="text-3xl font-bold text-purple-400">3</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 text-sm">Export Formats</div>
              <div className="text-3xl font-bold text-orange-400">3+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagrams Section */}
      <div className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-700/30 rounded-lg p-6">
              <div className="text-blue-400 font-semibold mb-2">High-Level Design</div>
              <p className="text-gray-300 text-sm">
                System-wide architecture showing all major components, their interactions,
                and integration points with external services.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-700/30 rounded-lg p-6">
              <div className="text-green-400 font-semibold mb-2">Low-Level Design</div>
              <p className="text-gray-300 text-sm">
                Detailed internal structure showing component logic, data flows, validation
                pipelines, and API interactions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/30 rounded-lg p-6">
              <div className="text-purple-400 font-semibold mb-2">Database Schema</div>
              <p className="text-gray-300 text-sm">
                MongoDB collections, entity relationships, data types, and cardinality
                showing how data is stored and interconnected.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/20 to-orange-900/5 border border-orange-700/30 rounded-lg p-6">
              <div className="text-orange-400 font-semibold mb-2">Sequence Diagram</div>
              <p className="text-gray-300 text-sm">
                Step-by-step request flow showing interactions between user, frontend,
                backend, external APIs, and services.
              </p>
            </div>
          </div>

          {/* Diagram Gallery */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-gray-700">
              Diagrams
            </h2>
            <DiagramGallery />
          </div>

          {/* Usage Guide */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8 mt-12">
            <h3 className="text-xl font-bold mb-4">How to Use</h3>
            <div className="space-y-4 text-gray-300 text-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">View Diagrams</div>
                  <p>Switch between Architecture, Design, Database, and Flow categories</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">Export Formats</div>
                  <p>Download diagrams as SVG (vector), PNG (raster), or Mermaid source</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">Copy Source</div>
                  <p>Copy Mermaid source code for use in documentation or reports</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  4
                </div>
                <div>
                  <div className="font-semibold text-white">Live Editor</div>
                  <p>Edit diagrams in Mermaid Live Editor and integrate back</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

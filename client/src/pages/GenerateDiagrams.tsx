/**
 * GenerateDiagrams Page
 * Dynamically generates architecture diagrams for a validated GitHub repository
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Layers, Database, GitBranch, FileCode, AlertCircle, Download, Copy, Check } from 'lucide-react';
import { MermaidDiagram } from '../components/diagrams/MermaidDiagram';
import { exportAsSVG, exportAsPNG, copyToClipboard } from '../utils/diagramExport';

interface DiagramType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

export function GenerateDiagrams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const repoData = location.state as {
    owner?: string;
    repo?: string;
    branch?: string;
    url?: string;
    codeMetrics?: any;
  };

  // Redirect if no repo data
  useEffect(() => {
    if (!repoData?.owner || !repoData?.repo) {
      navigate('/repo-validator');
    }
  }, [repoData, navigate]);

  const diagramTypes: DiagramType[] = [
    {
      id: 'hld',
      title: 'High-Level Design (HLD)',
      description: 'System architecture overview showing major components, layers, and integrations',
      icon: <Layers className="w-6 h-6" />,
      color: 'from-blue-600 to-blue-400',
      available: true,
    },
    {
      id: 'lld',
      title: 'Low-Level Design (LLD)',
      description: 'Detailed component interactions, request flows, and internal logic',
      icon: <FileCode className="w-6 h-6" />,
      color: 'from-purple-600 to-purple-400',
      available: true,
    },
    {
      id: 'database',
      title: 'Database Schema',
      description: 'Entity relationships, collections/tables, and data model structure',
      icon: <Database className="w-6 h-6" />,
      color: 'from-green-600 to-green-400',
      available: true,
    },
    {
      id: 'sequence',
      title: 'Sequence Diagram',
      description: 'Step-by-step interaction flows between components and services',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'from-orange-600 to-orange-400',
      available: true,
    },
  ];

  const handleGenerateDiagram = async (diagramId: string) => {
    setSelectedDiagram(diagramId);
    setLoading(true);
    setError(null);
    setGeneratedDiagram(null);

    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          branch: repoData.branch,
          diagramType: diagramId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate diagram');
      }

      const data = await response.json();
      setGeneratedDiagram(data.diagram);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagram');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySource = async () => {
    if (!generatedDiagram) return;
    const success = await copyToClipboard(generatedDiagram);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportSVG = async () => {
    const element = document.getElementById('generated-diagram');
    if (element && selectedDiagram) {
      await exportAsSVG(element, `${repoData.repo}-${selectedDiagram}`);
    }
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('generated-diagram');
    if (element && selectedDiagram) {
      await exportAsPNG(element, `${repoData.repo}-${selectedDiagram}`);
    }
  };

  if (!repoData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/repo-validator"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Validator
          </Link>

          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Generate Architecture Diagrams
            </h1>
            <p className="text-gray-400 mb-4">
              Automatically analyze and visualize the architecture of{' '}
              <span className="text-purple-400 font-semibold">
                {repoData.owner}/{repoData.repo}
              </span>
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <GitBranch className="w-4 h-4" />
              <span>Branch: {repoData.branch}</span>
            </div>
          </div>
        </div>

        {/* Diagram Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {diagramTypes.map((diagram) => (
            <button
              key={diagram.id}
              onClick={() => handleGenerateDiagram(diagram.id)}
              disabled={!diagram.available || loading}
              className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                selectedDiagram === diagram.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-900/30 to-blue-900/30 scale-105'
                  : 'border-white/10 bg-gradient-to-br from-gray-900 to-black hover:border-purple-500/50 hover:scale-102'
              } ${!diagram.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${diagram.color} opacity-0 group-hover:opacity-10 transition-opacity`}
              />

              {/* Content */}
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${diagram.color} shadow-lg`}
                  >
                    {diagram.icon}
                  </div>
                  {selectedDiagram === diagram.id && loading && (
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">{diagram.title}</h3>
                <p className="text-gray-400 text-sm">{diagram.description}</p>

                {!diagram.available && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Coming soon</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analyzing Repository...</h3>
            <p className="text-gray-400">
              Fetching code, detecting patterns, and generating your diagram
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">
                  Generation Failed
                </h3>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Diagram Display */}
        {generatedDiagram && !loading && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">
              Diagram Generated Successfully!
            </h2>
            
            {/* Mermaid Diagram Renderer */}
            <div id="generated-diagram" className="bg-black/50 border border-white/10 rounded-xl p-6 mb-4">
              <MermaidDiagram
                id={`generated-${selectedDiagram}`}
                content={generatedDiagram}
              />
            </div>

            {/* Export Controls */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleExportSVG}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </button>
              <button 
                onClick={handleExportPNG}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button 
                onClick={handleCopySource}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Source
                  </>
                )}
              </button>
            </div>

            {/* Generate Another */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-3">
                Want to generate another diagram type?
              </p>
              <button
                onClick={() => {
                  setGeneratedDiagram(null);
                  setSelectedDiagram(null);
                  setError(null);
                }}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                ← Back to diagram selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

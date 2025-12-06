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
  const [codeDetails, setCodeDetails] = useState<any>(null);
  const [selectedDetail, setSelectedDetail] = useState<string>('endpoints');

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
    setCodeDetails(null);

    try {
      console.log('Generating diagram for:', { owner: repoData.owner, repo: repoData.repo, branch: repoData.branch, diagramType: diagramId });
      
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          branch: repoData.branch || 'main',
          diagramType: diagramId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ reason: 'Unknown error' }));
        throw new Error(errorData.reason || `Failed to generate diagram (${response.status})`);
      }

      const data = await response.json();
      console.log('Diagram generated successfully:', data);
      
      if (!data.diagram) {
        throw new Error('No diagram in response');
      }
      
      setGeneratedDiagram(data.diagram);
      setCodeDetails(data.codeDetails || null);
      setSelectedDetail('endpoints');
    } catch (err) {
      console.error('Error generating diagram:', err);
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

            {/* Dynamic Code Details Panel */}
            {codeDetails && (
              <div className="mt-8 pt-8 border-t border-purple-500/30">
                <h3 className="text-xl font-bold mb-6 text-purple-400">
                  📊 Actual Code Details from Repository
                </h3>

                {/* Tab Selection */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedDetail('endpoints')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedDetail === 'endpoints'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    API Endpoints ({codeDetails.endpoints?.length || 0})
                  </button>
                  <button
                    onClick={() => setSelectedDetail('components')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedDetail === 'components'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Components ({codeDetails.components?.length || 0})
                  </button>
                  <button
                    onClick={() => setSelectedDetail('services')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedDetail === 'services'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Services ({codeDetails.services?.length || 0})
                  </button>
                  <button
                    onClick={() => setSelectedDetail('models')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedDetail === 'models'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Models ({codeDetails.models?.length || 0})
                  </button>
                </div>

                {/* Endpoints List */}
                {selectedDetail === 'endpoints' && codeDetails.endpoints && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {codeDetails.endpoints.map((endpoint: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded text-sm font-bold text-white ${
                            endpoint.method === 'GET'
                              ? 'bg-blue-600'
                              : endpoint.method === 'POST'
                              ? 'bg-green-600'
                              : endpoint.method === 'PUT'
                              ? 'bg-yellow-600'
                              : endpoint.method === 'DELETE'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-green-400 font-mono text-sm flex-1">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-gray-400 text-xs">📄 {endpoint.file}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Components List */}
                {selectedDetail === 'components' && codeDetails.components && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {codeDetails.components.map((component: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-blue-400">{component.name}</h4>
                            <p className="text-gray-400 text-sm">
                              {component.type === 'Page' ? '📄 Page' : '🧩 Component'} • {component.lineCount} lines
                            </p>
                          </div>
                        </div>
                        {component.functions && component.functions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-xs mb-1">Functions:</p>
                            <div className="flex flex-wrap gap-2">
                              {component.functions.map((fn: string, i: number) => (
                                <span key={i} className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs font-mono">
                                  {fn}()
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Services List */}
                {selectedDetail === 'services' && codeDetails.services && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {codeDetails.services.map((service: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-orange-400">{service.name}</h4>
                          <span className="text-gray-400 text-xs">{service.lineCount} lines</span>
                        </div>
                        {service.methods && service.methods.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-xs mb-1">Methods:</p>
                            <div className="flex flex-wrap gap-2">
                              {service.methods.map((method: string, i: number) => (
                                <span key={i} className="bg-orange-900/40 text-orange-300 px-2 py-1 rounded text-xs font-mono">
                                  {method}()
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Models List */}
                {selectedDetail === 'models' && codeDetails.models && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {codeDetails.models.map((model: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-pink-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-pink-400">{model.name}</h4>
                          <span className="text-gray-400 text-xs">{model.lineCount} lines</span>
                        </div>
                        {model.fields && model.fields.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-xs mb-1">Fields:</p>
                            <div className="flex flex-wrap gap-2">
                              {model.fields.map((field: string, i: number) => (
                                <span key={i} className="bg-pink-900/40 text-pink-300 px-2 py-1 rounded text-xs font-mono">
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Github, GitBranch, Shield } from 'lucide-react'

type ValidationResult = {
  ok: boolean
  exists?: boolean
  accessible?: boolean
  hasCode?: boolean
  owner?: string
  repo?: string
  branch?: string
  defaultBranch?: string
  branches?: string[]
  reason?: string
}

export function RepoValidator() {
  const [url, setUrl] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  async function validateRepo() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/validate-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, branch: selectedBranch || undefined }),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ ok: false, reason: `Server error: ${res.status}` }))
        setResult(data)
        return
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Validation error:', err)
      setResult({ 
        ok: false, 
        reason: 'Cannot connect to server. Make sure the backend is running on port 3000.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url && !loading) {
      validateRepo()
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 md:py-16 min-h-screen flex items-center">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-purple-300 mb-4 sm:mb-6">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Repository Validation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
            Validate GitHub Repository
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-4">
            Verify repository accessibility and code presence before generating SDLC documentation
          </p>
        </div>

        {/* Input Card */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-2xl blur-xl"></div>
          <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Github className="w-6 h-6 text-purple-400" />
              <label className="text-sm font-medium text-gray-300">Repository URL</label>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://github.com/owner/repository"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-black/60 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  onClick={validateRepo}
                  disabled={!url || loading}
                  className="rounded-lg px-6 sm:px-8 py-3 font-semibold bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Validate
                    </>
                  )}
                </button>
              </div>
              
              {/* Branch Selector - shown after successful validation */}
              {result && result.branches && result.branches.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 animate-slide-up">
                  <GitBranch className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm text-gray-400 mb-2">Select Branch (Optional)</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">{result.defaultBranch} (default)</option>
                      {result.branches
                        .filter(b => b !== result.defaultBranch)
                        .map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                    </select>
                  </div>
                  <button
                    onClick={validateRepo}
                    disabled={loading}
                    className="rounded-lg px-4 py-2 font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all text-sm whitespace-nowrap"
                  >
                    Re-validate
                  </button>
                </div>
              )}
            </div>

            {/* Status Message */}
            {result && !loading && (
              <div className={`mt-4 flex items-center gap-2 text-sm animate-slide-up ${
                result.ok ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.ok ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {result.ok ? '✓ Validation passed successfully!' : result.reason || 'Validation failed'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State - Full Page Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-green-500 animate-spin-slow"></div>
                <Github className="absolute inset-0 m-auto w-10 h-10 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                Analyzing Repository
              </h3>
              <p className="text-gray-400 text-sm animate-pulse">Please wait while we validate your repository...</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && !loading && (
          <div className="space-y-6 animate-slide-up">
            {/* Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black to-green-900/10 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Github className="w-5 h-5 text-green-400" />
                <h3 className="text-base sm:text-lg font-semibold">Repository Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="font-mono text-sm text-white truncate">{result.owner || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Repository</p>
                    <p className="font-mono text-sm text-white truncate">{result.repo || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-mono text-sm text-white truncate">{result.branch || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Checks */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/20 via-black to-purple-900/10 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-semibold">Validation Checks</h3>
              </div>
              <div className="space-y-3">
                {/* Exists Check */}
                <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                  result.exists 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  {result.exists ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">Repository Exists</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.exists ? 'Repository found on GitHub' : 'Repository not found'}
                    </p>
                  </div>
                </div>

                {/* Accessible Check */}
                <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                  result.accessible 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  {result.accessible ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">Publicly Accessible</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.accessible ? 'Repository is publicly accessible' : 'Access denied or rate limited'}
                    </p>
                  </div>
                </div>

                {/* Has Code Check */}
                <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all ${
                  result.hasCode 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  {result.hasCode ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">Contains Code</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.hasCode ? 'Code files detected in repository' : 'No code files found (docs only)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            {result.ok && (
              <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-900/20 to-black p-4 sm:p-6 backdrop-blur-sm animate-slide-up">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-green-400">Ready for Analysis!</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      This repository has passed all validation checks and is ready for SDLC documentation generation.
                    </p>
                    <button className="w-full sm:w-auto rounded-lg px-6 py-2.5 font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all transform hover:scale-105 shadow-lg shadow-green-500/25 text-sm">
                      Generate Documentation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-green-500/20 mb-4">
              <Github className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Enter a GitHub repository URL above to begin validation</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </section>
  )
}

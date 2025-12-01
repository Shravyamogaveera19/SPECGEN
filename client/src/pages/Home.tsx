import { Link } from 'react-router-dom'
import { CheckCircle, Code, FileText, Zap, GitBranch, Database } from 'lucide-react'

export function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-8">
              <Zap className="w-4 h-4" />
              <span>Automated SDLC Documentation Generator</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              SpecGen
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Reverse-engineer any GitHub repository to automatically generate comprehensive SDLC documentation. From requirements to architecture, test plans to deployment guides—all powered by advanced ML analysis.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/repo-validator"
                className="w-full sm:w-auto rounded-lg px-8 py-4 font-semibold text-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 transition-all"
              >
                Validate Repository
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto rounded-lg px-8 py-4 font-semibold text-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Reverse Engineering</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              SpecGen analyzes your codebase and automatically generates professional documentation for every phase of the SDLC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-black p-8 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Repository Validation</h3>
              <p className="text-gray-400 leading-relaxed">
                Verify GitHub repositories exist, are accessible, and contain analyzable code before processing.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/20 to-black p-8 hover:border-green-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Tech Stack Analysis</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically detect languages, frameworks, databases, and libraries used in your project.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-black p-8 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">SDLC Documentation</h3>
              <p className="text-gray-400 leading-relaxed">
                Generate requirements, design docs, architecture diagrams, test plans, and deployment guides.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/20 to-black p-8 hover:border-green-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">ML Embeddings</h3>
              <p className="text-gray-400 leading-relaxed">
                Semantic code analysis using sentence transformers to understand context and relationships.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-black p-8 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">API-First Design</h3>
              <p className="text-gray-400 leading-relaxed">
                RESTful API architecture with Express backend and FastAPI ML microservice for scalability.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/20 to-black p-8 hover:border-green-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Processing</h3>
              <p className="text-gray-400 leading-relaxed">
                Fast validation and analysis with streaming updates and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-black">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Four simple steps to generate comprehensive documentation for any repository.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Validate Repository</h3>
              <p className="text-gray-400 text-sm">
                Enter a GitHub URL and verify the repo is accessible and contains code.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Clone & Analyze</h3>
              <p className="text-gray-400 text-sm">
                Our system clones the repo and analyzes the codebase structure and dependencies.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">ML Processing</h3>
              <p className="text-gray-400 text-sm">
                Machine learning models generate embeddings and understand code semantics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Generate Docs</h3>
              <p className="text-gray-400 text-sm">
                Complete SDLC documentation is generated and ready for download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-purple-900/30 via-black to-green-900/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Document Your Project?
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
            Start by validating your GitHub repository. Our platform will handle the rest, generating professional documentation in minutes.
          </p>
          <Link
            to="/repo-validator"
            className="inline-block rounded-lg px-10 py-5 font-semibold text-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 shadow-xl shadow-purple-500/30 transition-all"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  )
}

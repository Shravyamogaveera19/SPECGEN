import { CheckCircle, Code, FileText, Zap, GitBranch, Database } from 'lucide-react';

const features = [
  {
    icon: <GitBranch className="w-6 h-6" />, title: 'Repository Validation',
    desc: 'Verify GitHub repositories exist, are accessible, and contain analyzable code before processing.',
    color: 'from-purple-500 to-purple-700',
    border: 'hover:border-purple-500/50',
    bg: 'from-purple-900/20 to-black',
  },
  {
    icon: <Code className="w-6 h-6" />, title: 'Tech Stack Analysis',
    desc: 'Automatically detect languages, frameworks, databases, and libraries used in your project.',
    color: 'from-green-500 to-green-700',
    border: 'hover:border-green-500/50',
    bg: 'from-green-900/20 to-black',
  },
  {
    icon: <FileText className="w-6 h-6" />, title: 'SDLC Documentation',
    desc: 'Generate requirements, design docs, architecture diagrams, test plans, and deployment guides.',
    color: 'from-purple-500 to-purple-700',
    border: 'hover:border-purple-500/50',
    bg: 'from-purple-900/20 to-black',
  },
  {
    icon: <Database className="w-6 h-6" />, title: 'ML Embeddings',
    desc: 'Semantic code analysis using sentence transformers to understand context and relationships.',
    color: 'from-green-500 to-green-700',
    border: 'hover:border-green-500/50',
    bg: 'from-green-900/20 to-black',
  },
  {
    icon: <CheckCircle className="w-6 h-6" />, title: 'API-First Design',
    desc: 'RESTful API architecture with Express backend and FastAPI ML microservice for scalability.',
    color: 'from-purple-500 to-purple-700',
    border: 'hover:border-purple-500/50',
    bg: 'from-purple-900/20 to-black',
  },
  {
    icon: <Zap className="w-6 h-6" />, title: 'Real-Time Analysis',
    desc: 'Instant validation and comprehensive analysis with live progress tracking and detailed insights.',
    color: 'from-green-500 to-green-700',
    border: 'hover:border-green-500/50',
    bg: 'from-green-900/20 to-black',
  },
];

export function FeaturesSlider() {
  return (
    <section id="features" className="py-16 md:py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Powerful Repository Intelligence
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            SpecGen analyzes your codebase to generate professional documentation for every phase of the software development lifecycle.
          </p>
        </div>

        {/* Desktop Grid - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={i} 
              className={`group relative rounded-xl border border-white/10 bg-gradient-to-br ${f.bg} p-6 ${f.border} transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10`}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scrollable */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4">
          <div className="flex gap-4 px-4 pb-2" style={{ width: 'max-content' }}>
            {features.map((f, i) => (
              <div key={i} className="w-[300px] flex-shrink-0">
                <div className={`relative rounded-xl border border-white/10 bg-gradient-to-br ${f.bg} p-5 shadow-lg`}>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-md`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

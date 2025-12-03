import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-8">
            <Zap className="w-4 h-4" />
            <span>Revolutionary SDLC Documentation Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            SpecGen
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform any GitHub repository into comprehensive SDLC documentation instantly. From requirements analysis to deployment guides—powered by intelligent code understanding and ML-driven insights.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/repo-validator"
              className="w-full sm:w-auto rounded-lg px-8 py-4 font-semibold text-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105"
            >
              Start Validation
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
  );
}

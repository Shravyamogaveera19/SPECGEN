import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-green-500" />
            <Link to="/" className="text-xl font-bold hover:text-white transition-colors">
              SpecGen
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link className="text-gray-300 hover:text-white transition-colors" to="/">
              Home
            </Link>
            <Link className="text-gray-300 hover:text-white transition-colors" to="/repo-validator">
              Repo Validator
            </Link>
            <a className="text-gray-300 hover:text-white transition-colors" href="#features">
              Features
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-80 bg-black border-l border-purple-500/20 shadow-2xl shadow-purple-500/10 animate-slideInRight overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-green-500 shadow-lg shadow-purple-500/50" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                  SpecGen
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-purple-500/10 rounded-lg transition-all duration-200 hover:scale-110"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="px-6 py-8 flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent transition-all duration-200 border border-transparent hover:border-purple-500/30"
              >
                <div className="w-1 h-8 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                <span className="text-lg font-medium">Home</span>
              </Link>
              <Link
                to="/repo-validator"
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-transparent transition-all duration-200 border border-transparent hover:border-green-500/30"
              >
                <div className="w-1 h-8 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                <span className="text-lg font-medium">Repo Validator</span>
              </Link>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-transparent transition-all duration-200 border border-transparent hover:border-blue-500/30"
              >
                <div className="w-1 h-8 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                <span className="text-lg font-medium">Features</span>
              </a>
            </nav>

            {/* Decorative Element */}
            <div className="px-6 py-4">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-purple-500/20 bg-gradient-to-t from-purple-900/10 to-transparent">
              <p className="text-xs text-gray-500 text-center font-medium">
                © 2025 SpecGen. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

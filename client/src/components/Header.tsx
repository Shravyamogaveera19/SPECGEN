import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-sm">
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
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-sm">
          <nav className="px-6 py-4 flex flex-col gap-4">
            <Link 
              className="text-gray-300 hover:text-white transition-colors py-2" 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              className="text-gray-300 hover:text-white transition-colors py-2" 
              to="/repo-validator" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Repo Validator
            </Link>
            <a 
              className="text-gray-300 hover:text-white transition-colors py-2" 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}

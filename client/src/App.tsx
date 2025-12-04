import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { ValidateRepo } from './pages/ValidateRepo'
import { Architecture } from './pages/Architecture'
import { GenerateDiagrams } from './pages/GenerateDiagrams'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/repo-validator" element={<ValidateRepo />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/generate-diagrams" element={<GenerateDiagrams />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App

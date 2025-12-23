# SpecGen Client

React + TypeScript frontend for SpecGen - visualize GitHub repository architecture, generate diagrams, and view AI-generated documentation.

## Features

- 🔍 **Repository Validation** - Validate GitHub repos and view detailed code metrics
- 📊 **Interactive Diagrams** - View and interact with Mermaid architecture diagrams
- 💾 **Export Capabilities** - Export diagrams as PNG, PDF, or SVG
- 📝 **Documentation Viewer** - Browse generated SDLC documentation
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🚀 **Fast Performance** - Powered by Vite with HMR

## Technology Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 6
- **Diagrams:** Mermaid.js
- **Export:** html2canvas, jsPDF
- **Icons:** lucide-react

## Setup

### Prerequisites

- Node.js 18+
- Backend server running on port 3000

### Installation

```bash
cd client
npm install
```

### Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**API Proxy:** The Vite dev server automatically proxies `/api/*` requests to `http://localhost:3000` (backend server).

## Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
client/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component with routing
│   ├── index.css                # Global styles
│   ├── pages/
│   │   ├── Home.tsx             # Landing page
│   │   ├── ValidateRepo.tsx     # Repository validation page
│   │   ├── GenerateDiagrams.tsx # Diagram generation page
│   │   ├── Documentation.tsx    # Documentation viewer
│   │   └── Architecture.tsx     # Architecture overview
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Navigation header
│   │   │   └── Footer.tsx       # Page footer
│   │   ├── forms/
│   │   │   └── RepoValidator.tsx # Repo validation form
│   │   ├── diagrams/
│   │   │   ├── DiagramViewer.tsx    # Mermaid diagram renderer
│   │   │   ├── DiagramControls.tsx  # Zoom/pan controls
│   │   │   ├── DiagramGallery.tsx   # Diagram type selector
│   │   │   └── MermaidDiagram.tsx   # Core Mermaid wrapper
│   │   ├── common/
│   │   │   ├── HomeHero.tsx     # Hero section
│   │   │   ├── HowItWorks.tsx   # Feature explanation
│   │   │   ├── FeaturesSlider.tsx # Feature carousel
│   │   │   └── HomeCTA.tsx      # Call-to-action
│   │   └── index.ts             # Component exports
│   ├── utils/
│   │   ├── diagramDefinitions.ts # Diagram type definitions
│   │   ├── diagramExport.ts      # Export utilities (PNG/PDF/SVG)
│   │   └── mermaidDiagrams.ts    # Mermaid helpers
│   ├── services/                 # API service layer
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   └── styles/                   # Additional styles
├── public/                       # Static assets
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
└── package.json
```

## Pages

### Home (`/`)

- Landing page with hero section
- Features overview
- How it works explanation
- Call-to-action to get started

### Validate Repository (`/validate`)

- Input GitHub repository URL
- Validate repository accessibility
- View detailed code metrics:
  - File count
  - Programming languages
  - Detected frameworks
  - Project type
  - Quality score
  - Tests, CI/CD, Docker detection

### Generate Diagrams (`/diagrams`)

- Input validated repository URL
- Generate 4 diagram types:
  - **HLD** - High-Level Design
  - **LLD** - Low-Level Design
  - **Database** - ER Schema
  - **Sequence** - Request/Response Flow
- Interactive diagram viewer with:
  - Zoom in/out
  - Pan/drag
  - Reset view
  - Export as PNG, PDF, SVG

### Documentation (`/docs`)

- View AI-generated documentation:
  - Requirements Specification
  - System Design
  - Test Plan
  - Deployment Guide
- Markdown rendering
- Copy to clipboard
- Download as text

### Architecture (`/architecture`)

- System architecture overview
- Technology stack details
- Component relationships

## Key Components

### DiagramViewer

Interactive Mermaid diagram renderer with zoom and pan controls.

**Features:**
- Renders Mermaid syntax
- Zoom: 50% - 200%
- Pan/drag support
- Reset view button
- Export to PNG, PDF, SVG

**Props:**
```typescript
interface DiagramViewerProps {
  diagram: string;      // Mermaid syntax
  type: DiagramType;    // hld, lld, database, sequence
}
```

### RepoValidator

Form component for validating GitHub repositories.

**Features:**
- URL validation
- Optional branch selection
- Loading states
- Error handling
- Results display with metrics

### DiagramGallery

Diagram type selector with visual previews.

**Diagram Types:**
1. High-Level Design (HLD)
2. Low-Level Design (LLD)
3. Database Schema
4. Sequence Diagram

## Utilities

### Diagram Export (`utils/diagramExport.ts`)

Export diagrams in multiple formats:

```typescript
// Export as PNG
exportDiagramAsPNG(element: HTMLElement, filename: string)

// Export as PDF
exportDiagramAsPDF(element: HTMLElement, filename: string)

// Export as SVG
exportDiagramAsSVG(element: HTMLElement, filename: string)
```

**Implementation:**
- Uses `html2canvas` for PNG rendering
- Uses `jsPDF` for PDF generation
- Direct SVG extraction from Mermaid diagrams

## Styling

### Tailwind CSS 4

Utility-first CSS framework with custom configuration.

**Theme:**
- Dark color palette
- Custom animations
- Responsive breakpoints
- Custom components

### Global Styles (`index.css`)

- CSS resets
- Custom scrollbar styles
- Animation keyframes
- Typography scales

## API Integration

All API calls are proxied through Vite dev server:

```typescript
// Example API calls
fetch('/api/validate-repo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, branch })
})

fetch('/api/generate-diagram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, branch, diagramType })
})

fetch('/api/generate-docs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, branch })
})
```

## Configuration

### Vite Config (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### TypeScript Config

- `tsconfig.json` - Base configuration
- `tsconfig.app.json` - App-specific settings
- `tsconfig.node.json` - Node/Vite config

**Strict mode enabled** for better type safety.

## Dependencies

**Core:**
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing
- `tailwindcss` - Utility-first CSS
- `mermaid` - Diagram rendering

**Export:**
- `html2canvas` - HTML to canvas conversion
- `jspdf` - PDF generation

**UI:**
- `lucide-react` - Icon library

**Development:**
- `vite` - Build tool
- `typescript` - Type checking
- `eslint` - Code linting
- `prettier` - Code formatting

## Build Output

```bash
npm run build
```

**Output directory:** `client/dist/`

**Assets:**
- Minified JavaScript bundles
- Optimized CSS
- Source maps (for debugging)
- Static assets (images, fonts)

**Deployment:**
The `dist/` folder can be served by any static file server (Nginx, Apache, Netlify, Vercel, etc.).

## Development Features

- **Hot Module Replacement (HMR)** - Instant updates without page reload
- **TypeScript** - Full type safety
- **ESLint** - Code quality checks
- **Fast Refresh** - Preserve component state during updates

## Performance

- **Code Splitting** - Automatic route-based splitting
- **Lazy Loading** - Components loaded on demand
- **Tree Shaking** - Unused code eliminated
- **Asset Optimization** - Images and fonts optimized

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Troubleshooting

**API calls failing:**
- Ensure backend server is running on port 3000
- Check browser console for CORS errors
- Verify proxy configuration in `vite.config.ts`

**Diagrams not rendering:**
- Check Mermaid syntax in browser console
- Ensure diagram string is valid Mermaid format
- Try refreshing the page

**Build errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npx tsc --noEmit`

## License

MIT
```

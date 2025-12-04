export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 bg-black">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple Four-Step Process</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Generate comprehensive documentation for any repository in minutes with our streamlined workflow.
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
  );
}

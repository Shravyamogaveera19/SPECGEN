import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface RepoAnalysis {
  structure: { [key: string]: string[] };
  languages: { [key: string]: number };
  dependencies: string[];
  frameworks: string[];
  databases: string[];
  hasTests: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  readme?: string;
  packageFiles: string[];
}

interface DocumentationData {
  requirements: string;
  design: string;
  testPlan: string;
  deployment: string;
  analysis?: RepoAnalysis;
  repoName?: string;
  repoUrl?: string;
}

export function Documentation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentationData | null>(null);
  const [activeTab, setActiveTab] = useState<"detected" | "requirements">(
    "detected"
  );

  useEffect(() => {
    if (location.state?.docs) {
      setDocs(location.state.docs);
    } else {
      navigate("/repo-validator");
    }
  }, [location.state, navigate]);

  const downloadAsPDF = async () => {
    if (!docs) return;

    const element = document.getElementById("pdf-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      pdf.save("project-documentation.pdf");
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!docs) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/repo-validator")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Validator
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-2">
                Project Documentation
              </h1>
              <p className="text-gray-400">
                Repository Overview & Functional Requirements
              </p>
            </div>
            <button
              onClick={downloadAsPDF}
              className="flex items-center gap-2 rounded-lg px-6 py-3 font-medium bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 border-b border-white/10">
            {[
              { id: "detected" as const, label: "🔍 Detected Items" },
              {
                id: "requirements" as const,
                label: "📝 Functional Requirements",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-green-600 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div id="pdf-content" className="space-y-6">
          {activeTab === "detected" && docs?.analysis && (
            <div className="space-y-6">
              {/* Languages */}
              {Object.keys(docs.analysis.languages).length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/20 via-black to-blue-900/10 p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                    Languages Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(docs.analysis.languages)
                      .sort((a, b) => b[1] - a[1])
                      .map(([lang, count]) => (
                        <span
                          key={lang}
                          className="px-3 py-1 bg-blue-600/30 border border-blue-400/50 rounded-full text-sm text-blue-200"
                        >
                          {lang} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Frameworks */}
              {docs.analysis.frameworks.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black to-purple-900/10 p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                    Frameworks & Libraries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docs.analysis.frameworks.map((framework) => (
                      <span
                        key={framework}
                        className="px-3 py-1 bg-purple-600/30 border border-purple-400/50 rounded-full text-sm text-purple-200"
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Databases */}
              {docs.analysis.databases.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/20 via-black to-green-900/10 p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    Databases
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docs.analysis.databases.map((db) => (
                      <span
                        key={db}
                        className="px-3 py-1 bg-green-600/30 border border-green-400/50 rounded-full text-sm text-green-200"
                      >
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/20 via-black to-amber-900/10 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-amber-400" />
                  Project Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    {docs.analysis.hasTests ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span
                      className={
                        docs.analysis.hasTests
                          ? "text-green-300"
                          : "text-gray-400"
                      }
                    >
                      Tests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {docs.analysis.hasCI ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span
                      className={
                        docs.analysis.hasCI ? "text-green-300" : "text-gray-400"
                      }
                    >
                      CI/CD
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {docs.analysis.hasDocker ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span
                      className={
                        docs.analysis.hasDocker
                          ? "text-green-300"
                          : "text-gray-400"
                      }
                    >
                      Docker
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Dependencies */}
              {docs.analysis.dependencies.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-pink-900/20 via-black to-pink-900/10 p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-pink-400" />
                    Top Dependencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docs.analysis.dependencies.slice(0, 15).map((dep) => (
                      <span
                        key={dep}
                        className="px-2 py-1 bg-pink-600/20 border border-pink-400/30 rounded text-xs text-pink-200"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/10 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-600/30 rounded-lg">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">
                      Software Requirements Specification
                    </h2>
                    <p className="text-gray-400 mt-1">
                      SRS Document - Functional Requirements
                    </p>
                  </div>
                </div>
              </div>

              {/* SRS Content with Enhanced Styling */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm">
                <div className="prose prose-invert max-w-none">
                  {/* Parse and render SRS content with better formatting */}
                  <div className="space-y-6">
                    <div className="srs-content text-gray-200 leading-relaxed">
                      {docs.requirements.split("\n").map((line, idx) => {
                        // Headers
                        if (line.match(/^##\s+\d+\./)) {
                          return (
                            <h2
                              key={idx}
                              className="text-2xl font-bold mt-8 mb-4 text-blue-300"
                            >
                              {line.replace(/^##\s+/, "")}
                            </h2>
                          );
                        }
                        if (line.match(/^###\s+\d+\.\d+/)) {
                          return (
                            <h3
                              key={idx}
                              className="text-xl font-bold mt-6 mb-3 text-purple-300"
                            >
                              {line.replace(/^###\s+/, "")}
                            </h3>
                          );
                        }
                        if (line.match(/^\*\*Requirement ID:\*\*/)) {
                          return (
                            <div
                              key={idx}
                              className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 my-3"
                            >
                              <p className="text-purple-300 font-semibold">
                                {line
                                  .replace(/^\*\*/, "")
                                  .replace(/\*\*/, ": ")}
                              </p>
                            </div>
                          );
                        }
                        if (line.match(/^\*\*Description:\*\*/)) {
                          return (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-blue-500 my-2"
                            >
                              <p className="text-blue-300 font-semibold">
                                Description
                              </p>
                              <p className="text-gray-300 mt-1">
                                {line
                                  .replace(/^\*\*Description:\*\*/, "")
                                  .trim()}
                              </p>
                            </div>
                          );
                        }
                        if (line.match(/^\*\*Input:\*\*/)) {
                          return (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-green-500 my-2"
                            >
                              <p className="text-green-300 font-semibold">
                                Input
                              </p>
                              <p className="text-gray-300 mt-1">
                                {line.replace(/^\*\*Input:\*\*/, "").trim()}
                              </p>
                            </div>
                          );
                        }
                        if (line.match(/^\*\*Processing:\*\*/)) {
                          return (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-amber-500 my-2"
                            >
                              <p className="text-amber-300 font-semibold">
                                Processing
                              </p>
                              <p className="text-gray-300 mt-1">
                                {line
                                  .replace(/^\*\*Processing:\*\*/, "")
                                  .trim()}
                              </p>
                            </div>
                          );
                        }
                        if (line.match(/^\*\*Output:\*\*/)) {
                          return (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-cyan-500 my-2"
                            >
                              <p className="text-cyan-300 font-semibold">
                                Output
                              </p>
                              <p className="text-gray-300 mt-1">
                                {line.replace(/^\*\*Output:\*\*/, "").trim()}
                              </p>
                            </div>
                          );
                        }
                        if (line.match(/^\*\*Priority:\*\*/)) {
                          const priority =
                            line.match(/High|Medium|Low/)?.[0] || "Medium";
                          const priorityColor =
                            priority === "High"
                              ? "text-red-400 bg-red-900/30"
                              : priority === "Medium"
                                ? "text-yellow-400 bg-yellow-900/30"
                                : "text-green-400 bg-green-900/30";
                          return (
                            <div
                              key={idx}
                              className={`inline-block px-3 py-1 rounded ${priorityColor} font-semibold mt-2`}
                            >
                              Priority: {priority}
                            </div>
                          );
                        }
                        if (line.match(/^-\s+/)) {
                          return (
                            <li key={idx} className="ml-6 my-1 text-gray-300">
                              {line.replace(/^-\s+/, "")}
                            </li>
                          );
                        }
                        if (line.match(/^\*\*/)) {
                          return (
                            <p
                              key={idx}
                              className="font-bold text-gray-200 my-2"
                            >
                              {line.replace(/\*\*/g, "")}
                            </p>
                          );
                        }
                        if (line.trim()) {
                          return (
                            <p key={idx} className="text-gray-300 my-2">
                              {line}
                            </p>
                          );
                        }
                        return <br key={idx} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm py-6 border-t border-white/10">
          <p>Generated by SpecGen - SDLC Documentation Platform</p>
          <p className="mt-2">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

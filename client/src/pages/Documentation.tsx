import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DocumentationData {
  requirements: string;
  design: string;
  testPlan: string;
  deployment: string;
}

export function Documentation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentationData | null>(null);
  const [activeTab, setActiveTab] = useState<"explanation" | "requirements">(
    "explanation"
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
              { id: "explanation" as const, label: "📋 Explanation" },
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
          {activeTab === "explanation" && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black to-green-900/10 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-400" />
                Repository Explanation
              </h2>
              <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono leading-relaxed overflow-x-auto">
                  {docs.design}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/10 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-400" />
                Functional Requirements
              </h2>
              <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono leading-relaxed overflow-x-auto">
                  {docs.requirements}
                </pre>
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

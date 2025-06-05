// src/App.tsx
import { useState } from 'react';
import { Download, FileText, Upload, Eye, AlertCircle } from 'lucide-react';
import { PDFGenerator } from './utils/pdfGenerator';
import './App.css';

function App() {
  const [htmlContent, setHtmlContent] = useState(PDFGenerator.getSampleTemplate());
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load sample.pdf from localhost
  const loadLocalFile = async () => {
    try {
      setError('');
      const content = await PDFGenerator.loadLocalFile('http://localhost:5173/sample.pdf');
      setLocalContent(content);
      setSuccess('Local file loaded successfully!');

      // Update HTML content with loaded data
      const updatedHtml = htmlContent.replace(
        '{{LOCAL_CONTENT}}',
        `Loaded from localhost/sample.pdf:\n${content}`
      );
      setHtmlContent(updatedHtml);
    } catch (err) {
      setError(`Failed to load local file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLocalContent('');
    }
  };

  // Generate PDF from current HTML content
  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      setError('');

      const result = await PDFGenerator.generateFromHTML(htmlContent, {
        filename: 'dynamic.pdf',
        orientation: 'landscape'
      });

      setPdfUrl(result.url);
      setSuccess('PDF generated and downloaded as dynamic.pdf!');
    } catch (err) {
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate PDF with local content integration
  const generateWithLocalContent = async () => {
    try {
      setIsGenerating(true);
      setError('');

      const template = PDFGenerator.getSampleTemplate();
      const result = await PDFGenerator.generateWithLocalContent(
        template,
        'http://localhost:5173/sample.pdf',
        {
          filename: 'dynamic.pdf',
          orientation: 'landscape'
        }
      );

      setPdfUrl(result.url);
      setSuccess('PDF with local content generated and downloaded!');
    } catch (err) {
      setError(`Failed to generate PDF with local content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dynamic PDF Generator
          </h1>
          <p className="text-gray-600">
            Generate dynamic.pdf from HTML content with localhost integration
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="text-green-500 mr-2" size={20} />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTML Content Editor */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">HTML Content</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadLocalFile}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Upload size={16} />
                  Load Local File
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download size={16} />
                  )}
                  Generate PDF
                </button>
              </div>
            </div>

            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your HTML content here..."
            />

            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={generateWithLocalContent}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FileText size={16} />
                    <Upload size={16} />
                  </>
                )}
                Generate with Local Content
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye size={16} />
                A4 Landscape (297×210mm)
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <div
                className="w-full bg-white overflow-hidden transform scale-50 origin-top-left"
                style={{
                  width: '200%',
                  height: '200%',
                  aspectRatio: '297/210'
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  className="w-full h-full"
                  style={{ width: '1123px', height: '794px' }}
                />
              </div>
            </div>

            {/* Local Content Display */}
            {localContent && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Local Content Loaded:</h3>
                <div className="text-sm text-blue-700 max-h-32 overflow-y-auto bg-white p-2 rounded border">
                  <pre className="whitespace-pre-wrap">{localContent}</pre>
                </div>
              </div>
            )}

            {pdfUrl && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">PDF Generated Successfully!</p>
                    <p className="text-sm text-green-700">dynamic.pdf has been created and downloaded</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={pdfUrl}
                      download="dynamic.pdf"
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <Download size={14} />
                      Download Again
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions & Setup Guide */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Setup Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-800">1. Install Dependencies:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                  npm install jspdf html2canvas<br/>
                  npm install -D @types/jspdf tailwindcss
                </code>
              </div>

              <div>
                <p className="font-medium text-gray-800">2. Place sample.pdf in public folder:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                  public/sample.pdf
                </code>
              </div>

              <div>
                <p className="font-medium text-gray-800">3. Start development server:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                  npm run dev
                </code>
              </div>

              <div>
                <p className="font-medium text-gray-800">4. Access localhost:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                  http://localhost:5173/sample.pdf
                </code>
              </div>
            </div>
          </div>

          {/* Features & Usage */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Usage</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800">Dynamic HTML to PDF</p>
                  <p>Edit HTML content in real-time and generate PDFs instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800">Localhost Integration</p>
                  <p>Load content from local files and embed in PDFs</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800">A4 Landscape Format</p>
                  <p>Optimized for presentation-style content</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800">Live Preview</p>
                  <p>See exactly how your PDF will look before generating</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800">High Quality Output</p>
                  <p>Vector-based graphics with crisp text rendering</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">HTML to Canvas</h4>
              <p className="text-gray-600">Uses html2canvas to convert DOM elements to high-resolution canvas</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Canvas to PDF</h4>
              <p className="text-gray-600">jsPDF converts canvas to PDF with proper A4 dimensions</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">File Integration</h4>
              <p className="text-gray-600">Fetch API loads local content for dynamic embedding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
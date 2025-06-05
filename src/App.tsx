// src/App.tsx
import { useState, useRef } from 'react';
import { Download, FileText, Link, Eye, AlertCircle, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import './App.css';

// PDF Generator utility for JSX components
const generatePDFFromJSX = async (component: React.ReactElement, filename: string = 'dynamic.pdf') => {
  try {
    // Import libraries dynamically
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    // Create temporary container
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1123px;
      height: 794px;
      background: white;
      overflow: hidden;
    `;
    document.body.appendChild(tempDiv);

    // Render React component to temp div
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(tempDiv);

    return new Promise((resolve, reject) => {
      root.render(component);

      // Wait for rendering then convert to PDF
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(tempDiv, {
            width: 1123,
            height: 794,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const pdf = new jsPDF('landscape', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

          // Save and create blob URL
          pdf.save(filename);
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);

          // Cleanup
          document.body.removeChild(tempDiv);
          root.unmount();

          resolve({ blob, url });
        } catch (error) {
          document.body.removeChild(tempDiv);
          root.unmount();
          reject(error);
        }
      }, 1000);
    });
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

interface PDFSnippet {
  id: string;
  name: string;
  url: string;
  description: string;
  isActive: boolean;
}

interface TemplateData {
  title: string;
  subtitle: string;
  mainContent: string;
  snippetData: any[];
}

function App() {
  const [pdfSnippets, setPdfSnippets] = useState<PDFSnippet[]>([
    {
      id: '1',
      name: 'Sales Presentation',
      url: 'https://drive.google.com/file/d/YOUR_GOOGLE_DRIVE_FILE_ID/view',
      description: 'Q4 Sales deck with latest metrics',
      isActive: true
    },
    {
      id: '2',
      name: 'Financial Report',
      url: 'https://example.com/financial-report.pdf',
      description: 'Monthly financial overview',
      isActive: false
    }
  ]);

  const [templateData, setTemplateData] = useState<TemplateData>({
    title: 'Dynamic PDF Report',
    subtitle: 'Generated with Live Data Integration',
    mainContent: 'This PDF contains dynamic content from multiple sources including external PDFs and real-time data.',
    snippetData: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [newSnippetUrl, setNewSnippetUrl] = useState('');
  const [newSnippetName, setNewSnippetName] = useState('');

  // Load data from external PDF URL
  const loadPDFData = async (snippet: PDFSnippet) => {
    try {
      setError('');

      // Convert Google Drive view URL to direct download URL
      let processedUrl = snippet.url;
      if (snippet.url.includes('drive.google.com')) {
        const fileId = snippet.url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (fileId) {
          processedUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      const response = await fetch(processedUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      // For PDFs, we'll extract metadata
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      const snippetInfo = {
        name: snippet.name,
        url: snippet.url,
        size: contentLength ? `${Math.round(parseInt(contentLength) / 1024)}KB` : 'Unknown',
        type: contentType || 'application/pdf',
        loadedAt: new Date().toLocaleString()
      };

      setTemplateData(prev => ({
        ...prev,
        snippetData: [...prev.snippetData.filter(s => s.name !== snippet.name), snippetInfo]
      }));

      setSuccess(`Successfully loaded data from ${snippet.name}`);
    } catch (err) {
      setError(`Failed to load ${snippet.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Add new PDF snippet
  const addPDFSnippet = () => {
    if (!newSnippetUrl || !newSnippetName) return;

    const newSnippet: PDFSnippet = {
      id: Date.now().toString(),
      name: newSnippetName,
      url: newSnippetUrl,
      description: 'Custom PDF source',
      isActive: true
    };

    setPdfSnippets(prev => [...prev, newSnippet]);
    setNewSnippetUrl('');
    setNewSnippetName('');
    setSuccess(`Added new PDF snippet: ${newSnippetName}`);
  };

  // Remove PDF snippet
  const removePDFSnippet = (id: string) => {
    setPdfSnippets(prev => prev.filter(s => s.id !== id));
    setSuccess('PDF snippet removed');
  };

  // Toggle snippet active state
  const toggleSnippet = (id: string) => {
    setPdfSnippets(prev =>
      prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
  };

  // Dynamic JSX Template Component
  const DynamicPDFTemplate = () => (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '42px',
          marginBottom: '15px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          {templateData.title}
        </h1>
        <p style={{ fontSize: '20px', opacity: 0.9 }}>
          {templateData.subtitle}
        </p>
        <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '10px' }}>
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        flex: 1
      }}>
        {/* Content Section */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '25px',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Content Overview</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '20px' }}>
            {templateData.mainContent}
          </p>

          <div style={{ fontSize: '14px' }}>
            <p><strong>Active Snippets:</strong> {pdfSnippets.filter(s => s.isActive).length}</p>
            <p><strong>Total Sources:</strong> {pdfSnippets.length}</p>
            <p><strong>Data Sources:</strong> {templateData.snippetData.length}</p>
          </div>
        </div>

        {/* PDF Snippets Data */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '25px',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>PDF Data Sources</h2>

          {templateData.snippetData.length > 0 ? (
            <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
              {templateData.snippetData.map((data, index) => (
                <div key={index} style={{
                  marginBottom: '15px',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px'
                }}>
                  <strong>{data.name}</strong><br/>
                  <span style={{ opacity: 0.8 }}>Size: {data.size}</span><br/>
                  <span style={{ opacity: 0.8 }}>Loaded: {data.loadedAt}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '16px', opacity: 0.8, fontStyle: 'italic' }}>
              No PDF data loaded yet. Click "Load Data" on any snippet to populate this section.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          Dynamic PDF Generator - Cloud PDF Management System
        </p>
      </div>
    </div>
  );

  // Generate PDF from JSX template
  const generateDynamicPDF = async () => {
    try {
      setIsGenerating(true);
      setError('');

      const result = await generatePDFFromJSX(<DynamicPDFTemplate />, 'dynamic.pdf');
      setPdfUrl(result.url);
      setSuccess('Dynamic PDF generated successfully! Check your downloads.');
    } catch (err) {
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            Dynamic PDF Snippet Generator
          </h1>
          <p className="text-gray-600">
            Create dynamic PDFs with content from external sources like Google Drive
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
          {/* PDF Snippets Manager */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">PDF Snippets</h2>
              <button
                onClick={generateDynamicPDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download size={16} />
                )}
                Generate dynamic.pdf
              </button>
            </div>

            {/* Add New Snippet */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add PDF Source</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="PDF Name (e.g., Sales Deck)"
                  value={newSnippetName}
                  onChange={(e) => setNewSnippetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="url"
                  placeholder="PDF URL (Google Drive, Dropbox, etc.)"
                  value={newSnippetUrl}
                  onChange={(e) => setNewSnippetUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={addPDFSnippet}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={14} />
                  Add PDF Snippet
                </button>
              </div>
            </div>

            {/* Snippets List */}
            <div className="space-y-3">
              {pdfSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`p-4 border rounded-lg ${snippet.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={snippet.isActive}
                          onChange={() => toggleSnippet(snippet.id)}
                          className="rounded"
                        />
                        <h3 className="font-medium text-gray-900">{snippet.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{snippet.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Link size={12} />
                        <span className="truncate max-w-xs">{snippet.url}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => loadPDFData(snippet)}
                        disabled={!snippet.isActive}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 disabled:opacity-50"
                      >
                        Load Data
                      </button>
                      <button
                        onClick={() => window.open(snippet.url, '_blank')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => removePDFSnippet(snippet.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Editor & Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Template Editor</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye size={16} />
                JSX Template
              </div>
            </div>

            {/* Template Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={templateData.title}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={templateData.subtitle}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Content</label>
                <textarea
                  value={templateData.mainContent}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, mainContent: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <div
                className="w-full bg-white overflow-hidden transform scale-40 origin-top-left"
                style={{
                  width: '250%',
                  height: '250%',
                  aspectRatio: '297/210'
                }}
              >
                <DynamicPDFTemplate />
              </div>
            </div>

            {/* Generated PDF Info */}
            {pdfUrl && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">PDF Generated!</p>
                    <p className="text-sm text-green-700">dynamic.pdf with live snippet data</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={pdfUrl}
                      download="dynamic.pdf"
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use PDF Snippets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🔗 Google Drive Integration</h4>
              <div className="space-y-1 text-gray-600">
                <p>1. Share your PDF publicly in Google Drive</p>
                <p>2. Copy the share link (https://drive.google.com/file/d/...)</p>
                <p>3. Add it as a new PDF snippet</p>
                <p>4. Click "Load Data" to fetch metadata</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">📄 Dynamic PDF Generation</h4>
              <div className="space-y-1 text-gray-600">
                <p>1. Configure your template content</p>
                <p>2. Load data from active PDF snippets</p>
                <p>3. Click "Generate dynamic.pdf"</p>
                <p>4. PDF downloads with live data integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
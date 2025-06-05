import React, { useState } from 'react';
import { Download, FileText, AlertCircle, Plus, Trash2, Eye } from 'lucide-react';

// PDF Generator utility with proper page-by-page generation
const generatePDFFromPages = async (pages: string[], filename: string = 'dynamic.pdf') => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let isFirstPage = true;

    for (const pageHTML of pages) {
      // Create temporary container for each page
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        background: white;
        overflow: hidden;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
      `;

      tempDiv.innerHTML = pageHTML;
      document.body.appendChild(tempDiv);

      try {
        // Convert to canvas with high resolution
        const canvas = await html2canvas(tempDiv, {
          width: 794, // A4 width at 96 DPI
          height: 1123, // A4 height at 96 DPI
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Add new page if not first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      } finally {
        // Clean up
        document.body.removeChild(tempDiv);
      }
    }

    // Save PDF and create blob URL
    pdf.save(filename);
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    return { blob, url };
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
  data?: any;
}

interface TemplateData {
  title: string;
  subtitle: string;
  mainContent: string;
  snippetData: any[];
}

const DynamicPDFGenerator: React.FC = () => {
  const [pdfSnippets, setPdfSnippets] = useState<PDFSnippet[]>([
    {
      id: '1',
      name: 'Manual JSON Input',
      url: 'manual-input',
      description: 'Paste JSON data directly',
      isActive: true
    },
    {
      id: '2',
      name: 'Sample Posts Data',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      description: 'Sample JSON API endpoint',
      isActive: false
    },
    {
      id: '3',
      name: 'Sample User Data',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      description: 'Sample user information API',
      isActive: false
    },
    {
      id: '4',
      name: 'Google Drive (Your File)',
      url: 'https://drive.google.com/file/d/1PljJLvqJ6MIVjvAXdiY11oIMwuYYLLwe/view?usp=sharing',
      description: 'Note: Requires manual copy-paste due to CORS',
      isActive: false
    }
  ]);

  const [templateData, setTemplateData] = useState<TemplateData>({
    title: 'Dynamic PDF Report',
    subtitle: 'Generated with Live Data Integration',
    mainContent: 'This PDF contains dynamic content from multiple sources and demonstrates page-by-page generation.',
    snippetData: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [manualJsonInput, setManualJsonInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const [newSnippetUrl, setNewSnippetUrl] = useState('');
  const [newSnippetName, setNewSnippetName] = useState('');

  // Handle manual JSON input
  const handleManualJsonInput = () => {
    try {
      if (!manualJsonInput.trim()) {
        setError('Please enter some JSON data');
        return;
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(manualJsonInput);
      } catch {
        // If not valid JSON, treat as text and create a structured object
        data = {
          content: manualJsonInput,
          type: 'TEXT',
          length: manualJsonInput.length,
          lines: manualJsonInput.split('\n').length
        };
      }

      // Find the manual input snippet and update it
      setPdfSnippets(prev =>
        prev.map(s => s.url === 'manual-input' ? { ...s, data, isActive: true } : s)
      );

      // Add to template data
      const snippetInfo = {
        name: 'Manual JSON Input',
        url: 'manual-input',
        data: data,
        dataType: typeof data === 'object' && !Array.isArray(data) && data.type !== 'TEXT' ? 'JSON' : 'TEXT',
        loadedAt: new Date().toLocaleString()
      };

      setTemplateData(prev => ({
        ...prev,
        snippetData: [...prev.snippetData.filter(s => s.name !== 'Manual JSON Input'), snippetInfo]
      }));

      setSuccess('Manual data loaded successfully!');
      setShowManualInput(false);
      setManualJsonInput('');
    } catch (err) {
      setError(`Failed to process manual input: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Load data from external URL
  const loadSnippetData = async (snippet: PDFSnippet) => {
    // Handle manual input differently
    if (snippet.url === 'manual-input') {
      setShowManualInput(true);
      return;
    }

    // Handle Google Drive files with instructions
    if (snippet.url.includes('drive.google.com')) {
      setError('Google Drive files cannot be accessed directly due to CORS restrictions. Please:\n1. Open your Google Drive file\n2. Copy the content\n3. Use "Manual JSON Input" to paste the data');
      return;
    }

    try {
      setError('');
      setSuccess('Loading data...');

      const response = await fetch(snippet.url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json,text/plain,*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        // If not JSON, treat as text
        const textData = await response.text();
        data = {
          content: textData.substring(0, 1000),
          type: 'TEXT',
          length: textData.length,
          preview: textData.substring(0, 200) + (textData.length > 200 ? '...' : '')
        };
      }

      // Update snippet with loaded data
      setPdfSnippets(prev =>
        prev.map(s => s.id === snippet.id ? { ...s, data } : s)
      );

      // Add to template data
      const snippetInfo = {
        name: snippet.name,
        url: snippet.url,
        data: data,
        dataType: typeof data === 'object' && !Array.isArray(data) && data.type !== 'TEXT' ? 'JSON' : (data.type || 'JSON'),
        loadedAt: new Date().toLocaleString()
      };

      setTemplateData(prev => ({
        ...prev,
        snippetData: [...prev.snippetData.filter(s => s.name !== snippet.name), snippetInfo]
      }));

      setSuccess(`Successfully loaded data from ${snippet.name}`);
    } catch (err) {
      setError(`Failed to load ${snippet.name}: ${err instanceof Error ? err.message : 'Unknown error'}\n\nFor Google Drive files, please use manual input instead.`);
    }
  };

  // Add new snippet
  const addSnippet = () => {
    if (!newSnippetUrl || !newSnippetName) return;

    const newSnippet: PDFSnippet = {
      id: Date.now().toString(),
      name: newSnippetName,
      url: newSnippetUrl,
      description: 'Custom data source',
      isActive: true
    };

    setPdfSnippets(prev => [...prev, newSnippet]);
    setNewSnippetUrl('');
    setNewSnippetName('');
    setSuccess(`Added new snippet: ${newSnippetName}`);
  };

  // Remove snippet
  const removeSnippet = (id: string) => {
    setPdfSnippets(prev => prev.filter(s => s.id !== id));
    setSuccess('Snippet removed');
  };

  // Toggle snippet
  const toggleSnippet = (id: string) => {
    setPdfSnippets(prev =>
      prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
  };

  // Generate HTML for cover page
  const generateCoverPage = (): string => {
    return `
      <div style="
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 40px;
        box-sizing: border-box;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      ">
        <h1 style="
          font-size: 48px;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        ">
          ${templateData.title}
        </h1>
        <h2 style="
          font-size: 24px;
          margin-bottom: 40px;
          opacity: 0.9;
        ">
          ${templateData.subtitle}
        </h2>
        <p style="
          font-size: 18px;
          margin-bottom: 60px;
          max-width: 600px;
          line-height: 1.6;
        ">
          ${templateData.mainContent}
        </p>
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        ">
          <p style="font-size: 16px; margin-bottom: 10px;">
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </p>
          <p style="font-size: 16px; margin-bottom: 10px;">
            <strong>Active Sources:</strong> ${pdfSnippets.filter(s => s.isActive).length}
          </p>
          <p style="font-size: 16px;">
            <strong>Data Loaded:</strong> ${templateData.snippetData.length}
          </p>
        </div>
      </div>
    `;
  };

  // Generate HTML for data page
  const generateDataPage = (): string => {
    return `
      <div style="
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 40px;
        box-sizing: border-box;
        background: white;
        color: #333;
        font-family: Arial, sans-serif;
      ">
        <h1 style="
          font-size: 36px;
          margin-bottom: 30px;
          color: #667eea;
          border-bottom: 3px solid #667eea;
          padding-bottom: 15px;
        ">
          Data Sources Overview
        </h1>

        ${templateData.snippetData.length > 0 ? templateData.snippetData.map(data => `
          <div style="
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background: #f9f9f9;
          ">
            <h2 style="
              font-size: 24px;
              margin-bottom: 15px;
              color: #764ba2;
            ">
              ${data.name}
            </h2>
            <p style="
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            ">
              Source: ${data.url}<br>
              Loaded: ${data.loadedAt}
            </p>
            <div style="
              background: white;
              padding: 15px;
              border-radius: 5px;
              font-size: 12px;
              font-family: monospace;
              overflow: hidden;
              white-space: pre-wrap;
              max-height: 200px;
              overflow-y: auto;
            ">
              ${JSON.stringify(data.data, null, 2).substring(0, 500)}${JSON.stringify(data.data, null, 2).length > 500 ? '...' : ''}
            </div>
          </div>
        `).join('') : `
          <div style="
            text-align: center;
            padding: 60px 20px;
            color: #999;
          ">
            <p style="font-size: 18px; margin-bottom: 20px;">No data sources loaded yet</p>
            <p style="font-size: 14px;">Click "Load Data" on any active snippet to populate this page</p>
          </div>
        `}
      </div>
    `;
  };

  // Generate HTML for summary page
  const generateSummaryPage = (): string => {
    const activeSnippets = pdfSnippets.filter(s => s.isActive);

    return `
      <div style="
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 40px;
        box-sizing: border-box;
        background: linear-gradient(45deg, #f0f2f5 0%, #e8ecf0 100%);
        color: #333;
        font-family: Arial, sans-serif;
      ">
        <h1 style="
          font-size: 36px;
          margin-bottom: 30px;
          color: #667eea;
          text-align: center;
        ">
          Summary Report
        </h1>

        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          height: calc(100% - 120px);
        ">
          <div style="
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            <h2 style="
              font-size: 24px;
              margin-bottom: 20px;
              color: #764ba2;
            ">
              Configuration Summary
            </h2>
            <div style="font-size: 16px; line-height: 1.8;">
              <p><strong>Total Snippets:</strong> ${pdfSnippets.length}</p>
              <p><strong>Active Snippets:</strong> ${activeSnippets.length}</p>
              <p><strong>Data Sources Loaded:</strong> ${templateData.snippetData.length}</p>
              <p><strong>Generation Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Generation Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div style="
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            <h2 style="
              font-size: 24px;
              margin-bottom: 20px;
              color: #764ba2;
            ">
              Active Sources
            </h2>
            <div style="font-size: 14px;">
              ${activeSnippets.map(snippet => `
                <div style="
                  margin-bottom: 15px;
                  padding: 10px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid ${snippet.data ? '#28a745' : '#ffc107'};
                ">
                  <strong>${snippet.name}</strong><br>
                  <span style="color: #666;">${snippet.description}</span><br>
                  <span style="color: #888; font-size: 12px;">
                    Status: ${snippet.data ? 'Data Loaded' : 'Not Loaded'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        ">
          Generated by Dynamic PDF Generator - Cloud PDF Management System
        </div>
      </div>
    `;
  };

  // Generate the complete PDF
  const generateDynamicPDF = async () => {
    try {
      setIsGenerating(true);
      setError('');

      // Create all pages
      const pages = [
        generateCoverPage(),
        generateDataPage(),
        generateSummaryPage()
      ];

      // Generate PDF from pages
      const result = await generatePDFFromPages(pages, 'dynamic-report.pdf');
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
            Dynamic PDF Generator
          </h1>
          <p className="text-gray-600">
            Create multi-page PDFs with dynamic content from external data sources
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
          {/* Data Sources Manager */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Data Sources</h2>
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
                Generate PDF
              </button>
            </div>

            {/* Manual JSON Input Modal */}
            {showManualInput && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Manual Data Input</h3>
                    <button
                      onClick={() => setShowManualInput(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-800">
                      <strong>For Google Drive files:</strong><br/>
                      1. Open your Google Drive file<br/>
                      2. Copy all content (Ctrl+A, Ctrl+C)<br/>
                      3. Paste it below<br/>
                      4. Click "Load Data"
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste your JSON data or text content:
                    </label>
                    <textarea
                      value={manualJsonInput}
                      onChange={(e) => setManualJsonInput(e.target.value)}
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder='Paste your data here. Examples:
{"name": "John", "age": 30}
or plain text content from your Google Drive file'
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowManualInput(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualJsonInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Load Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Source */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Data Source</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Source Name"
                  value={newSnippetName}
                  onChange={(e) => setNewSnippetName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="url"
                  placeholder="API URL or Data Source"
                  value={newSnippetUrl}
                  onChange={(e) => setNewSnippetUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={addSnippet}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={14} />
                  Add Source
                </button>
              </div>
            </div>

            {/* Sources List */}
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
                        {snippet.data && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Loaded
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{snippet.description}</p>
                      <p className="text-xs text-gray-500 truncate">{snippet.url}</p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => loadSnippetData(snippet)}
                        disabled={!snippet.isActive}
                        className={`px-3 py-1 rounded text-sm disabled:opacity-50 ${
                          snippet.url === 'manual-input'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : snippet.url.includes('drive.google.com')
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {snippet.url === 'manual-input'
                          ? 'Enter Data'
                          : snippet.url.includes('drive.google.com')
                          ? 'Manual Input'
                          : 'Load Data'
                        }
                      </button>
                      {snippet.url.includes('drive.google.com') && (
                        <button
                          onClick={() => window.open(snippet.url, '_blank')}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Open
                        </button>
                      )}
                      <button
                        onClick={() => removeSnippet(snippet.id)}
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

          {/* Template Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Template Configuration</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye size={16} />
                Multi-Page Layout
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={templateData.mainContent}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, mainContent: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Page Preview Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">PDF Structure</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span>Page 1: Cover Page</span>
                  <span className="text-blue-600">Title + Overview</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span>Page 2: Data Sources</span>
                  <span className="text-purple-600">
                    {templateData.snippetData.length} sources loaded
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>Page 3: Summary</span>
                  <span className="text-green-600">Statistics + Status</span>
                </div>
              </div>
            </div>

            {/* Generated PDF Info */}
            {pdfUrl && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">PDF Generated!</p>
                    <p className="text-sm text-green-700">3-page dynamic report with live data</p>
                  </div>
                  <a
                    href={pdfUrl}
                    download="dynamic-report.pdf"
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Download size={14} />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use with Google Drive Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🔗 Google Drive Workaround</h4>
              <div className="text-gray-600 space-y-1">
                <p>Due to CORS restrictions, use these steps:</p>
                <p>1. Open your Google Drive file</p>
                <p>2. Select all content (Ctrl+A)</p>
                <p>3. Copy content (Ctrl+C)</p>
                <p>4. Use "Manual JSON Input" option</p>
                <p>5. Paste and click "Load Data"</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📊 JSON APIs</h4>
              <p className="text-gray-600">
                For direct API access, use public JSON endpoints that support CORS.
                Examples: JSONPlaceholder, your own APIs with CORS enabled.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📄 PDF Output</h4>
              <p className="text-gray-600">
                The system generates a 3-page PDF with cover page, data overview,
                and summary. All loaded data appears formatted in the PDF.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ CORS Limitation Notice</h4>
            <p className="text-yellow-700 text-sm">
              Web browsers block direct access to Google Drive files for security reasons.
              The "Manual JSON Input" option is the most reliable way to include your Google Drive content.
              For production use, consider using Google Drive API with proper authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPDFGenerator;
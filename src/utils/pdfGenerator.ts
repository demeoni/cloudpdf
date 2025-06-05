// src/utils/pdfGenerator.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFGeneratorOptions {
  filename?: string;
  format?: 'a4';
  orientation?: 'landscape' | 'portrait';
  quality?: number;
  scale?: number;
}

export class PDFGenerator {
  private static defaultOptions: PDFGeneratorOptions = {
    filename: 'dynamic.pdf',
    format: 'a4',
    orientation: 'landscape',
    quality: 1.0,
    scale: 2
  };

  /**
   * Generate PDF from HTML content
   */
  static async generateFromHTML(
    htmlContent: string,
    options: Partial<PDFGeneratorOptions> = {}
  ): Promise<{ blob: Blob; url: string }> {
    const opts = { ...this.defaultOptions, ...options };

    // Create temporary container for HTML content
    const container = this.createTempContainer(htmlContent, opts.orientation!);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        width: opts.orientation === 'landscape' ? 1123 : 794,
        height: opts.orientation === 'landscape' ? 794 : 1123,
        scale: opts.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.format
      });

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png', opts.quality);
      const pdfWidth = opts.orientation === 'landscape' ? 297 : 210;
      const pdfHeight = opts.orientation === 'landscape' ? 210 : 297;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Generate blob and URL
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);

      // Download the PDF
      pdf.save(opts.filename!);

      return { blob, url };
    } finally {
      // Clean up temporary container
      document.body.removeChild(container);
    }
  }

  /**
   * Load content from localhost
   */
  static async loadLocalFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
      }

      // Check if it's a PDF file
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/pdf')) {
        // For PDF files, we'll just return metadata since we can't directly read PDF content
        return `PDF file loaded from ${url} (${response.headers.get('content-length')} bytes)`;
      }

      // For text files, return content
      return await response.text();
    } catch (error) {
      console.error('Error loading local file:', error);
      throw new Error(`Could not load file from ${url}`);
    }
  }

  /**
   * Create temporary container for HTML content
   */
  private static createTempContainer(htmlContent: string, orientation: 'landscape' | 'portrait'): HTMLElement {
    const container = document.createElement('div');

    // Set container dimensions to match A4 paper at 96 DPI
    const width = orientation === 'landscape' ? 1123 : 794;
    const height = orientation === 'landscape' ? 794 : 1123;

    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: white;
      font-family: Arial, sans-serif;
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    return container;
  }

  /**
   * Generate PDF with content from localhost
   */
  static async generateWithLocalContent(
    htmlTemplate: string,
    localUrl: string,
    options: Partial<PDFGeneratorOptions> = {}
  ): Promise<{ blob: Blob; url: string }> {
    try {
      // Load local content
      const localContent = await this.loadLocalFile(localUrl);

      // Inject local content into HTML template
      const processedHTML = htmlTemplate.replace(
        '{{LOCAL_CONTENT}}',
        this.escapeHtml(localContent)
      );

      // Generate PDF
      return await this.generateFromHTML(processedHTML, options);
    } catch (error) {
      console.error('Error generating PDF with local content:', error);
      throw error;
    }
  }

  /**
   * Escape HTML content
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create a sample HTML template with placeholder for local content
   */
  static getSampleTemplate(): string {
    return `
      <div style="width: 100%; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; box-sizing: border-box; font-family: 'Arial', sans-serif; color: white;">
        <div style="text-align: center; margin-bottom: 60px;">
          <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Dynamic PDF Report</h1>
          <p style="font-size: 24px; opacity: 0.9;">Generated ${new Date().toLocaleString()}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; height: 60%;">
          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px);">
            <h2 style="font-size: 28px; margin-bottom: 20px;">Local Content</h2>
            <div style="font-size: 16px; line-height: 1.6; max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px;">
              <pre style="white-space: pre-wrap; margin: 0;">{{LOCAL_CONTENT}}</pre>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px);">
            <h2 style="font-size: 28px; margin-bottom: 20px;">System Info</h2>
            <div style="font-size: 16px; line-height: 1.8;">
              <p><strong>Format:</strong> A4 Landscape</p>
              <p><strong>Resolution:</strong> High Quality</p>
              <p><strong>Source:</strong> Dynamic HTML + Local File</p>
              <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
        </div>

        <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center;">
          <p style="font-size: 14px; opacity: 0.7;">Cloud PDF Management System - Dynamic Content Integration</p>
        </div>
      </div>
    `;
  }
}
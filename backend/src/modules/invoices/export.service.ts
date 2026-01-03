/**
 * Invoice Export Service
 * Handles exporting invoices to CSV, Excel, and PDF formats
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Invoice } from './invoice.repository';
import { InvoiceLine } from './invoice-line.repository';

export interface ExportInvoiceData {
  invoice: Invoice;
  lines: InvoiceLine[];
  supplierName?: string;
}

export class ExportService {
  /**
   * Generate CSV content from invoice data
   */
  static generateCSV(invoices: ExportInvoiceData[]): string {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Supplier',
      'Total Amount',
      'Currency',
      'Status',
      'Confidence Score',
      'Line Number',
      'Description',
      'Quantity',
      'Unit Price',
      'Line Total',
    ];

    const rows: string[][] = [];

    for (const { invoice, lines, supplierName } of invoices) {
      if (lines.length === 0) {
        // Invoice with no lines
        rows.push([
          invoice.invoice_number || '',
          invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
          supplierName || '',
          invoice.total_amount?.toString() || '',
          invoice.currency || 'USD',
          invoice.status,
          invoice.confidence_score?.toString() || '',
          '', '', '', '', '',
        ]);
      } else {
        // One row per line item
        for (const line of lines) {
          rows.push([
            invoice.invoice_number || '',
            invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
            supplierName || '',
            invoice.total_amount?.toString() || '',
            invoice.currency || 'USD',
            invoice.status,
            invoice.confidence_score?.toString() || '',
            line.line_number.toString(),
            line.normalized_description || line.raw_description,
            line.quantity?.toString() || '',
            line.unit_price?.toString() || '',
            line.line_total?.toString() || '',
          ]);
        }
      }
    }

    // Escape CSV values
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate Excel workbook from invoice data
   */
  static async generateExcel(invoices: ExportInvoiceData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Invoice OCR Platform';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Invoice Summary');
    summarySheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Line Items', key: 'lineCount', width: 12 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const { invoice, lines, supplierName } of invoices) {
      summarySheet.addRow({
        invoiceNumber: invoice.invoice_number || 'N/A',
        invoiceDate: invoice.invoice_date ? new Date(invoice.invoice_date) : null,
        supplier: supplierName || 'Unknown',
        totalAmount: invoice.total_amount,
        currency: invoice.currency || 'USD',
        status: invoice.status,
        confidence: invoice.confidence_score ? `${(invoice.confidence_score * 100).toFixed(1)}%` : 'N/A',
        lineCount: lines.length,
      });
    }

    // Line items sheet
    const linesSheet = workbook.addWorksheet('Line Items');
    linesSheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Line #', key: 'lineNumber', width: 8 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit Price', key: 'unitPrice', width: 12 },
      { header: 'Line Total', key: 'lineTotal', width: 12 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Needs Review', key: 'needsReview', width: 12 },
    ];

    linesSheet.getRow(1).font = { bold: true };
    linesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const { invoice, lines } of invoices) {
      for (const line of lines) {
        linesSheet.addRow({
          invoiceNumber: invoice.invoice_number || 'N/A',
          lineNumber: line.line_number || 0,
          description: line.normalized_description || line.raw_description || '',
          quantity: line.quantity != null ? Number(line.quantity) : null,
          unitPrice: line.unit_price != null ? Number(line.unit_price) : null,
          lineTotal: line.line_total != null ? Number(line.line_total) : null,
          confidence: line.confidence_score != null ? `${(Number(line.confidence_score) * 100).toFixed(0)}%` : 'N/A',
          needsReview: line.needs_review ? 'Yes' : 'No',
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate PDF document from invoice data
   */
  static generatePDF(invoices: ExportInvoiceData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Invoice Export Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      for (let i = 0; i < invoices.length; i++) {
        const { invoice, lines, supplierName } = invoices[i];

        if (i > 0) {
          doc.addPage();
        }

        // Invoice header
        doc.fontSize(14).font('Helvetica-Bold').text(`Invoice: ${invoice.invoice_number || 'N/A'}`);
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        doc.text(`Date: ${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}`);
        doc.text(`Supplier: ${supplierName || 'Unknown'}`);
        doc.text(`Total: ${invoice.currency || 'USD'} ${invoice.total_amount || 0}`);
        doc.text(`Status: ${invoice.status}`);
        doc.text(`Confidence: ${invoice.confidence_score ? `${(invoice.confidence_score * 100).toFixed(1)}%` : 'N/A'}`);
        doc.moveDown();

        // Line items table
        if (lines.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Line Items:');
          doc.moveDown(0.5);

          // Table header
          const tableTop = doc.y;
          const col1 = 50;  // #
          const col2 = 80;  // Description
          const col3 = 320; // Qty
          const col4 = 380; // Price
          const col5 = 450; // Total

          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('#', col1, tableTop);
          doc.text('Description', col2, tableTop);
          doc.text('Qty', col3, tableTop);
          doc.text('Price', col4, tableTop);
          doc.text('Total', col5, tableTop);

          doc.moveTo(col1, tableTop + 12).lineTo(550, tableTop + 12).stroke();

          let yPos = tableTop + 18;
          doc.font('Helvetica').fontSize(8);

          for (const line of lines) {
            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }

            const desc = (line.normalized_description || line.raw_description || '').substring(0, 40);
            doc.text(String(line.line_number || ''), col1, yPos);
            doc.text(desc, col2, yPos);
            doc.text(line.quantity != null ? String(line.quantity) : '-', col3, yPos);
            doc.text(line.unit_price != null ? `$${Number(line.unit_price).toFixed(2)}` : '-', col4, yPos);
            doc.text(line.line_total != null ? `$${Number(line.line_total).toFixed(2)}` : '-', col5, yPos);
            yPos += 15;
          }
        } else {
          doc.fontSize(10).font('Helvetica-Oblique').text('No line items found.');
        }
      }

      doc.end();
    });
  }

  /**
   * Generate export based on format
   */
  static async generate(
    format: 'csv' | 'excel' | 'pdf',
    invoices: ExportInvoiceData[]
  ): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        return {
          data: this.generateCSV(invoices),
          contentType: 'text/csv',
          filename: `invoices-export-${timestamp}.csv`,
        };
      case 'excel':
        return {
          data: await this.generateExcel(invoices),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `invoices-export-${timestamp}.xlsx`,
        };
      case 'pdf':
        return {
          data: await this.generatePDF(invoices),
          contentType: 'application/pdf',
          filename: `invoices-export-${timestamp}.pdf`,
        };
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

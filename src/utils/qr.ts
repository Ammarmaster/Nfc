import QRCode from 'qrcode';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { Stand, PrintLayoutOptions } from '../types';

export interface QRRenderOptions {
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  logoDataUrl?: string;
  size?: number;
}

/**
 * Generates a clean PNG Data URL for a given public URL.
 * Supports center logo overlay with safety margins.
 */
export async function generateQRDataUrl(
  url: string,
  options: QRRenderOptions = {}
): Promise<string> {
  const {
    fgColor = '#0F172A',
    bgColor = '#FFFFFF',
    errorCorrectionLevel = 'H', // High error correction recommended when embedding logo
    logoDataUrl,
    size = 400,
  } = options;

  // 1. Generate base QR code on an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    errorCorrectionLevel: logoDataUrl ? 'H' : errorCorrectionLevel,
  });

  // 2. If a center logo is provided, draw it safely with a padded background circle/rect
  if (logoDataUrl) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const logoSize = size * 0.22; // 22% size ensures QR readability with 'H' error correction
          const center = size / 2;
          const x = center - logoSize / 2;
          const y = center - logoSize / 2;

          // Draw protective background badge
          ctx.save();
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 8);
          ctx.fill();
          ctx.strokeStyle = fgColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw logo
          ctx.drawImage(img, x, y, logoSize, logoSize);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve(); // Graceful fallback if image load fails
        img.src = logoDataUrl;
      });
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generates pure SVG string for infinite scaling and print precision.
 */
export async function generateQRSVG(
  url: string,
  options: QRRenderOptions = {}
): Promise<string> {
  const {
    fgColor = '#0F172A',
    bgColor = '#FFFFFF',
    errorCorrectionLevel = 'M',
  } = options;

  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    errorCorrectionLevel,
  });
}

/**
 * Downloads a text or blob file in the browser.
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports all selected stands as a ZIP archive containing individual PNG and SVG files.
 */
export async function exportStandsZip(
  stands: Stand[],
  domain: string,
  options: QRRenderOptions = {},
  onProgress?: (percent: number, currentSlug: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const pngFolder = zip.folder('png');
  const svgFolder = zip.folder('svg');

  const total = stands.length;
  for (let i = 0; i < total; i++) {
    const stand = stands[i];
    const publicUrl = `https://${domain}/r/${stand.slug}`;
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100), stand.slug);
    }

    // Generate PNG
    const dataUrl = await generateQRDataUrl(publicUrl, options);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    pngFolder?.file(`stand_${stand.slug}.png`, base64Data, { base64: true });

    // Generate SVG
    const svgStr = await generateQRSVG(publicUrl, options);
    svgFolder?.file(`stand_${stand.slug}.svg`, svgStr);
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Exports stands metadata to CSV.
 */
export function exportStandsCSV(stands: Stand[], domain: string): Blob {
  const headers = [
    'Stand ID',
    'Slug',
    'Stand Number',
    'Label',
    'Public URL',
    'NFC URL',
    'Assigned Business',
    'Destination Type',
    'Destination Override',
    'Status',
    'NFC Status',
    'NFC Chip UID',
    'Total Visits',
    'Created Date'
  ];

  const rows = stands.map(s => [
    `"${s.id}"`,
    `"${s.slug}"`,
    s.standNumber,
    `"${(s.customLabel || '').replace(/"/g, '""')}"`,
    `"https://${domain}/r/${s.slug}"`,
    `"https://${domain}/r/${s.slug}?nfc=1"`,
    `"${(s.businessName || 'Unassigned').replace(/"/g, '""')}"`,
    `"${s.destinationType}"`,
    `"${(s.destinationUrlOverride || '').replace(/"/g, '""')}"`,
    `"${s.isActive ? 'Active' : 'Inactive'}"`,
    `"${s.nfcProgrammedStatus}"`,
    `"${s.nfcTagUid || 'Not Paired'}"`,
    s.visitCount || 0,
    `"${s.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generates enterprise print-ready multi-page PDF sheets containing QR stand cutouts.
 */
export async function generatePrintPDF(
  stands: Stand[],
  domain: string,
  layout: PrintLayoutOptions,
  qrOptions: QRRenderOptions = {},
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: layout.paperSize === 'A4' ? 'a4' : 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const cols = layout.columns;
  const rows = layout.rows;
  const perPage = cols * rows;
  const margin = layout.marginMm;

  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const cellWidth = printableWidth / cols;
  const cellHeight = printableHeight / rows;

  const total = stands.length;

  for (let i = 0; i < total; i++) {
    if (i > 0 && i % perPage === 0) {
      doc.addPage();
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }

    const pageIndex = i % perPage;
    const col = pageIndex % cols;
    const row = Math.floor(pageIndex / cols);

    const x = margin + col * cellWidth;
    const y = margin + row * cellHeight;

    const stand = stands[i];
    const publicUrl = `https://${domain}/r/${stand.slug}`;

    // 1. Draw subtle cutting guideline boundary
    if (layout.showCutLines) {
      doc.setDrawColor(210, 215, 225);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(x, y, cellWidth, cellHeight);
      doc.setLineDashPattern([], 0); // Reset
    }

    // 2. Generate QR Data URL
    const qrDataUrl = await generateQRDataUrl(publicUrl, {
      ...qrOptions,
      size: 500, // High-res for print
    });

    // Calculate layout inside cell
    const qrDim = Math.min(cellWidth * 0.55, cellHeight * 0.55, 45);
    const qrX = x + (cellWidth - qrDim) / 2;
    const qrY = y + 10;

    // Place QR code image
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrDim, qrDim);

    // Business Name Header
    let currentY = y + 6;
    if (layout.showBusinessName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const name = stand.businessName || 'SMART STAND';
      doc.text(name.substring(0, 26), x + cellWidth / 2, currentY, { align: 'center' });
    }

    // Stand ID & Instruction labels below QR
    currentY = qrY + qrDim + 5;
    if (layout.showInstruction) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105); // Brand emerald
      doc.text(layout.instructionText.toUpperCase(), x + cellWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;
    }

    if (layout.showStandId) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const label = stand.customLabel ? `${stand.customLabel} (${stand.slug})` : `Stand #${stand.slug}`;
      doc.text(label, x + cellWidth / 2, currentY, { align: 'center' });
      currentY += 3.5;

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(publicUrl, x + cellWidth / 2, currentY, { align: 'center' });
    }
  }

  return doc.output('blob');
}

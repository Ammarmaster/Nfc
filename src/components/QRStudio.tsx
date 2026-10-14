import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sliders, 
  Eye, 
  RefreshCw, 
  Image as ImageIcon,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { Stand, Business, BulkGenerateOptions, DestinationType } from '../types';
import { api } from '../services/api';
import { 
  generateQRDataUrl, 
  generateQRSVG, 
  exportStandsZip, 
  exportStandsCSV, 
  downloadFile 
} from '../utils/qr';

interface QRStudioProps {
  stands: Stand[];
  businesses: Business[];
  onRefreshStands: () => void;
  onEditStand: (stand: Stand) => void;
  onOpenPrintModal: (standsToPrint: Stand[]) => void;
  domain: string;
}

const COLOR_PRESETS = [
  { name: 'Dark Slate', fg: '#0F172A', bg: '#FFFFFF' },
  { name: 'Emerald Forest', fg: '#065F46', bg: '#FFFFFF' },
  { name: 'Royal Indigo', fg: '#312E81', bg: '#FFFFFF' },
  { name: 'Amber Gold', fg: '#78350F', bg: '#FFFFFF' },
  { name: 'Ruby Wine', fg: '#881337', bg: '#FFFFFF' },
];

export const QRStudio: React.FC<QRStudioProps> = ({
  stands,
  businesses,
  onRefreshStands,
  onEditStand,
  onOpenPrintModal,
  domain,
}) => {
  // Generation Form State
  const [quantity, setQuantity] = useState<number>(50);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [padDigits, setPadDigits] = useState<number>(2); // 0 = unpadded (1..50), 2 = 01..50
  const [destinationType, setDestinationType] = useState<DestinationType>('REVIEW');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [customLabelTemplate, setCustomLabelTemplate] = useState<string>('Table {n}');

  // QR Design Styling State
  const [qrFgColor, setQrFgColor] = useState<string>('#0F172A');
  const [qrBgColor, setQrBgColor] = useState<string>('#FFFFFF');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

  // Operation Feedback & Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{ count: number; skipped: string[] } | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Cached QR image data URLs for real-time preview grid
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  // Calculate ending number based on start and quantity
  const calculatedEndNumber = startNumber + quantity - 1;

  // Filter stands to show in studio preview (most recently created 50 stands)
  const previewStands = [...stands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 48);

  // Load preview QR images when stands or style options change
  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      const cache: Record<string, string> = {};
      for (const stand of previewStands.slice(0, 16)) {
        const publicUrl = `https://${domain}/r/${stand.slug}`;
        try {
          const img = await generateQRDataUrl(publicUrl, {
            fgColor: qrFgColor,
            bgColor: qrBgColor,
            errorCorrectionLevel: logoDataUrl ? 'H' : errorCorrectionLevel,
            logoDataUrl,
            size: 240,
          });
          cache[stand.id] = img;
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) {
        setPreviewImages(cache);
      }
    }
    loadPreviews();
    return () => { isMounted = false; };
  }, [previewStands.length, qrFgColor, qrBgColor, errorCorrectionLevel, logoDataUrl, domain]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoDataUrl(reader.result as string);
        setErrorCorrectionLevel('H'); // Automatically set High error correction
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const options: BulkGenerateOptions = {
        quantity,
        startNumber,
        endNumber: calculatedEndNumber,
        prefix: prefix.trim(),
        suffix: suffix.trim(),
        padDigits,
        destinationType,
        businessId: selectedBusinessId || undefined,
        customLabelTemplate: customLabelTemplate.trim() || 'Stand #{n}',
        qrFgColor,
        qrBgColor,
        errorCorrectionLevel,
        logoDataUrl,
      };

      const result = await api.bulkCreateStands(options);
      setGenerationResult({
        count: result.created.length,
        skipped: result.skipped,
      });

      onRefreshStands();
      // Auto-update start number for next batch to avoid duplicate sequences
      setStartNumber(calculatedEndNumber + 1);
    } catch (err: any) {
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSinglePNG = async (stand: Stand) => {
    const publicUrl = `https://${domain}/r/${stand.slug}`;
    const dataUrl = await generateQRDataUrl(publicUrl, {
      fgColor: qrFgColor,
      bgColor: qrBgColor,
      errorCorrectionLevel: logoDataUrl ? 'H' : errorCorrectionLevel,
      logoDataUrl,
      size: 800,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `stand_${stand.slug}.png`;
    a.click();
  };

  const handleDownloadSingleSVG = async (stand: Stand) => {
    const publicUrl = `https://${domain}/r/${stand.slug}`;
    const svgStr = await generateQRSVG(publicUrl, {
      fgColor: qrFgColor,
      bgColor: qrBgColor,
      errorCorrectionLevel: logoDataUrl ? 'H' : errorCorrectionLevel,
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, `stand_${stand.slug}.svg`);
  };

  const handleCopyUrl = async (slug: string) => {
    const publicUrl = `https://${domain}/r/${slug}`;
    await navigator.clipboard.writeText(publicUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleExportAllZip = async () => {
    if (stands.length === 0) return;
    setIsExportingZip(true);
    setExportProgress(0);

    try {
      const blob = await exportStandsZip(
        stands,
        domain,
        {
          fgColor: qrFgColor,
          bgColor: qrBgColor,
          errorCorrectionLevel: logoDataUrl ? 'H' : errorCorrectionLevel,
          logoDataUrl,
        },
        (pct) => setExportProgress(pct)
      );

      downloadFile(blob, `tapreview_qr_stands_${stands.length}_batch.zip`);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportCSV = () => {
    if (stands.length === 0) return;
    const blob = exportStandsCSV(stands, domain);
    downloadFile(blob, `tapreview_stands_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Top Section: Title & Bulk Export Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              QR Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Generate high-resolution, print-ready bulk QR codes encoded with permanent public redirect URLs. Customize colors, add logos, and export for production.
          </p>
        </div>

        {/* Global Bulk Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors"
            title="Download CSV inventory of all stands"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportAllZip}
            disabled={isExportingZip || stands.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors disabled:opacity-50"
            title="Download ZIP containing PNG and SVG files"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>{isExportingZip ? `Packaging ZIP (${exportProgress}%)...` : 'Export All (ZIP)'}</span>
          </button>

          <button
            onClick={() => onOpenPrintModal(stands)}
            disabled={stands.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow transition-all"
            title="Generate print-ready multi-page A4 sheets"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheets (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Controls & Design Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generation Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Bulk Stand Allocation Parameters</span>
            </h2>

            {/* Quick Quantity Presets */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Batch Quantity
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {[1, 10, 50, 100, 500, 1000].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      quantity === qty
                        ? 'bg-emerald-600 text-white shadow-glow'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Custom quantity:</span>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Numbering Sequence: Starting & Ending */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Starting Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ending Number (Calculated)
                </label>
                <div className="px-3.5 py-2.5 bg-slate-950/30 border border-slate-800/80 rounded-xl text-sm font-semibold text-slate-400">
                  {calculatedEndNumber}
                </div>
              </div>
            </div>

            {/* Prefix, Suffix & Number Padding */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Prefix (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TBL-"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Padding Format
                </label>
                <select
                  value={padDigits}
                  onChange={(e) => setPadDigits(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={2}>Zero-padded 2 digits (01..50)</option>
                  <option value={3}>Zero-padded 3 digits (001..500)</option>
                  <option value={0}>Unpadded (1..50)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Suffix (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. -AC"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Destination Category & Optional Assigned Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Destination Mode
                </label>
                <select
                  value={destinationType}
                  onChange={(e) => setDestinationType(e.target.value as DestinationType)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="REVIEW">Google Reviews Landing Page</option>
                  <option value="MENU_HOSTED">Hosted Digital Menu</option>
                  <option value="MENU_EXTERNAL">External Digital Menu URL</option>
                  <option value="CUSTOM_URL">Custom Redirect URL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assign to Business (Optional)
                </label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Keep Unassigned (Stock Inventory)</option>
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.name} ({biz.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stand Label Template */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Stand Physical Label Template
              </label>
              <input
                type="text"
                value={customLabelTemplate}
                onChange={(e) => setCustomLabelTemplate(e.target.value)}
                placeholder="e.g. Table {n} or Stand #{n}"
                className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {'{n}'} will be automatically replaced with each stand's sequence number.
              </p>
            </div>

            {/* URL Sequence Live Simulation Banner */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Permanent URL Sequence Preview:
              </div>
              <div className="font-mono text-xs text-emerald-400 font-bold truncate">
                https://{domain}/r/{prefix}{padDigits > 0 ? '1'.padStart(padDigits, '0') : '1'}{suffix} ... https://{domain}/r/{prefix}{padDigits > 0 ? calculatedEndNumber.toString().padStart(padDigits, '0') : calculatedEndNumber}{suffix}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Stable URL Guarantee: These URLs will remain permanent even if restaurants change menus or Google review addresses later.
              </p>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleGenerateBatch}
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating {quantity} Database Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>GENERATE {quantity} SMART STANDS</span>
                </>
              )}
            </button>

            {/* Generation Result Banner */}
            {generationResult && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Successfully Generated {generationResult.count} Stands!</span>
                </div>
                {generationResult.skipped.length > 0 && (
                  <p className="mt-1 text-slate-400">
                    Skipped {generationResult.skipped.length} existing slugs to prevent collisions ({generationResult.skipped.slice(0, 5).join(', ')}...).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QR Design Customizer & Live Sample Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>QR Design & Branding Customizer</span>
            </h2>

            {/* Single Live Dynamic QR Card */}
            <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-center mb-6 shadow-inner">
              <div className="w-44 h-44 mx-auto bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center relative overflow-hidden">
                {previewStands[0] && previewImages[previewStands[0].id] ? (
                  <img
                    src={previewImages[previewStands[0].id]}
                    alt="Sample QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-slate-900" />
                )}
              </div>

              <div className="mt-4">
                <span className="text-xs font-mono font-bold text-white">
                  Sample: https://{domain}/r/{prefix}{padDigits > 0 ? '1'.padStart(padDigits, '0') : '1'}{suffix}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Error Correction: Level {errorCorrectionLevel} (Recommended with logos)
                </p>
              </div>
            </div>

            {/* Color Swatches Presets */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Brand Palette Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setQrFgColor(p.fg);
                      setQrBgColor(p.bg);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      qrFgColor === p.fg
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.fg }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Foreground & Background Color Pickers */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={qrFgColor}
                    onChange={(e) => setQrFgColor(e.target.value)}
                    className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={qrFgColor}
                    onChange={(e) => setQrFgColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Logo Center Overlay Upload */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Embed Center Logo (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>{logoDataUrl ? 'Change Logo Image' : 'Upload PNG / SVG Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoDataUrl(undefined)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-rose-400"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Warning regarding scan reliability with custom logos */}
              {logoDataUrl && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Scan Reliability Note:</strong> Custom logos overlay the QR center. Level 'H' error correction (30% redundancy) has been locked in to ensure reliable scanning across camera sensors.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-time Generated QR Stand Preview Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Real-Time QR Stand Preview Grid</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing active stands. Download individual high-res PNG/SVG or copy permanent URLs directly.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 self-start sm:self-auto">
            {previewStands.length} Stands Displayed
          </span>
        </div>

        {previewStands.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No stands generated yet. Use the parameters above to create your first batch!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewStands.map((stand) => {
              const publicUrl = `https://${domain}/r/${stand.slug}`;
              const qrImg = previewImages[stand.id];
              const isCopied = copiedSlug === stand.slug;

              return (
                <div
                  key={stand.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
                >
                  <div>
                    {/* Stand Header Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        Stand #{stand.slug}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        stand.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {stand.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="w-36 h-36 mx-auto bg-white rounded-xl p-2 shadow-md flex items-center justify-center mb-3">
                      {qrImg ? (
                        <img src={qrImg} alt={`QR ${stand.slug}`} className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-24 h-24 text-slate-800" />
                      )}
                    </div>

                    {/* Stand Information */}
                    <div className="text-center mb-3">
                      <p className="text-xs font-bold text-white truncate">
                        {stand.customLabel || `Stand #${stand.slug}`}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {stand.businessName || 'Unassigned Stock'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                        {stand.destinationType.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-1">
                        {publicUrl}
                      </p>
                    </div>
                  </div>

                  {/* Stand Action Toolbar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleCopyUrl(stand.slug)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                      title="Copy Public URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDownloadSinglePNG(stand)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                      title="Download High-Res PNG"
                    >
                      PNG
                    </button>

                    <button
                      onClick={() => handleDownloadSingleSVG(stand)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                      title="Download Vector SVG"
                    >
                      SVG
                    </button>

                    <button
                      onClick={() => onEditStand(stand)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Edit Stand Destination & Business"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

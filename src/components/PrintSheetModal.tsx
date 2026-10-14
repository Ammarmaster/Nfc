import React, { useState } from 'react';
import type { Stand, PrintLayoutOptions } from '../types';
import { generatePrintPDF, downloadFile } from '../utils/qr';
import { Printer, Download, X } from 'lucide-react';

interface PrintSheetModalProps {
  stands: Stand[];
  onClose: () => void;
  domain: string;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  stands,
  onClose,
  domain,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [columns, setColumns] = useState<number>(3);
  const [rows, setRows] = useState<number>(4);
  const [marginMm, setMarginMm] = useState<number>(10);
  const [showStandId, setShowStandId] = useState<boolean>(true);
  const [showInstruction, setShowInstruction] = useState<boolean>(true);
  const [showBusinessName, setShowBusinessName] = useState<boolean>(true);
  const [instructionText, setInstructionText] = useState<string>('TAP OR SCAN FOR REVIEWS');
  const [showCutLines, setShowCutLines] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const totalPerPage = columns * rows;
  const totalPages = Math.ceil(stands.length / totalPerPage) || 1;

  const handleExportPDF = async () => {
    setIsGenerating(true);
    setProgress(0);

    const layout: PrintLayoutOptions = {
      paperSize,
      columns,
      rows,
      marginMm,
      showStandId,
      showInstruction,
      showBusinessName,
      instructionText,
      showCutLines,
    };

    try {
      const pdfBlob = await generatePrintPDF(
        stands,
        domain,
        layout,
        { size: 500 },
        (pct) => setProgress(pct)
      );

      downloadFile(pdfBlob, `tapreview_print_sheets_${stands.length}_stands.pdf`);
    } catch (err: any) {
      alert(`Print export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Print-Ready Sheet Generator</h2>
              <p className="text-xs text-slate-400">Multi-page PDF layout with cut guidelines and stand labels.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-300 flex items-center justify-between">
            <span>Selected Stands: <strong>{stands.length}</strong></span>
            <span>Grid: <strong>{columns} x {rows} ({totalPerPage}/sheet)</strong></span>
            <span>Estimated Pages: <strong>{totalPages} page(s)</strong></span>
          </div>

          {/* Paper Size & Grid Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="A4">A4 (Standard 210 x 297 mm)</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Grid Columns</label>
              <select
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Grid Rows</label>
              <select
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={2}>2 Rows</option>
                <option value={3}>3 Rows</option>
                <option value={4}>4 Rows</option>
                <option value={5}>5 Rows</option>
              </select>
            </div>
          </div>

          {/* Instruction Label */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Instruction Text</label>
            <input
              type="text"
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showCutLines}
                onChange={(e) => setShowCutLines(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Dashed Cutting Lines</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showStandId}
                onChange={(e) => setShowStandId(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Include Stand ID & URL</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showBusinessName}
                onChange={(e) => setShowBusinessName(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Include Restaurant / Business Header</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showInstruction}
                onChange={(e) => setShowInstruction(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Include Instruction Text</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGenerating || stands.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-glow flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? `Building PDF (${progress}%)...` : 'Download Print PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

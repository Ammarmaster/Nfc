import React, { useState } from 'react';
import type { Stand, PrintLayoutOptions } from '../types';
import { generatePrintPDF, downloadFile } from '../utils/qr';
import { Printer, Download, X } from 'lucide-react';
import { sounds } from '../utils/audio';

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
    sounds.playTap();
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

      sounds.playScanSuccess();
      downloadFile(pdfBlob, `tapreview_print_sheets_${stands.length}_stands.pdf`);
    } catch (err: any) {
      alert(`Print export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-xl w-full p-6 shadow-2xl my-0 sm:my-8 transition-all">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEAE1]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">Print-Ready Sheet Generator</h2>
              <p className="text-xs text-stone-500">Multi-page PDF layout with cut guidelines and stand labels.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="p-3 bg-white rounded-2xl border border-[#E8E2D5] text-stone-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <span>Stands: <strong className="text-stone-900 font-bold">{stands.length}</strong></span>
            <span>Grid: <strong className="text-stone-900 font-bold">{columns} x {rows} ({totalPerPage}/sheet)</strong></span>
            <span>Pages: <strong className="text-stone-900 font-bold">{totalPages}</strong></span>
          </div>

          {/* Paper Size & Grid Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
              >
                <option value="A4">A4 (Standard 210 x 297 mm)</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Grid Columns</label>
              <select
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Grid Rows</label>
              <select
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
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
            <label className="block text-stone-700 font-bold mb-1">Instruction Text</label>
            <input
              type="text"
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EFEAE1]">
            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showCutLines}
                onChange={(e) => setShowCutLines(e.target.checked)}
                className="w-4 h-4 accent-[#C59B27] rounded"
              />
              <span>Dashed Cutting Lines</span>
            </label>

            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showStandId}
                onChange={(e) => setShowStandId(e.target.checked)}
                className="w-4 h-4 accent-[#C59B27] rounded"
              />
              <span>Include Stand ID & URL</span>
            </label>

            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showBusinessName}
                onChange={(e) => setShowBusinessName(e.target.checked)}
                className="w-4 h-4 accent-[#C59B27] rounded"
              />
              <span>Include Business Header</span>
            </label>

            <label className="flex items-center gap-2 text-stone-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showInstruction}
                onChange={(e) => setShowInstruction(e.target.checked)}
                className="w-4 h-4 accent-[#C59B27] rounded"
              />
              <span>Include Instruction Text</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#EFEAE1] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 font-semibold hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGenerating || stands.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold shadow-md hover:brightness-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
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

import React from 'react';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { sounds } from '../utils/audio';

interface StatusPageProps {
  code: 'inactive' | 'unassigned' | 'not_found';
  slug?: string;
  onNavigateHome?: () => void;
}

export const StatusPage: React.FC<StatusPageProps> = ({ code, slug, onNavigateHome }) => {
  const titles = {
    inactive: 'Stand Temporarily Unavailable',
    unassigned: 'Stand Not Yet Configured',
    not_found: 'Stand Not Found',
  };

  const descriptions = {
    inactive: 'This physical NFC + QR smart stand has been temporarily deactivated by the business administrator. Please reach out to staff for assistance.',
    unassigned: 'This stand record exists but has not yet been linked to an active business or menu destination in the TapReview dashboard.',
    not_found: `The permanent stand identifier "${slug || ''}" could not be found or has been retired.`,
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full milky-card rounded-3xl p-8 text-center shadow-xl border border-[#E8E2D5] bg-white">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B3801A]">
          {code === 'inactive' ? <ShieldAlert className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>

        <span className="inline-block px-3 py-1 bg-[#FAF8F5] text-stone-700 text-xs font-bold rounded-full uppercase tracking-wider mb-3 border border-[#E8E2D5]">
          Stand #{slug || 'Unknown'}
        </span>

        <h1 className="text-2xl font-black text-stone-900 mb-3 tracking-tight">
          {titles[code]}
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          {descriptions[code]}
        </p>

        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5] text-xs text-stone-500 mb-6 text-left">
          <p className="font-bold text-stone-800 mb-1">Permanent URL Stability Notice</p>
          This physical stand URL will remain identical once re-activated or assigned. The printed QR code and programmed NFC tag never need replacement.
        </div>

        {onNavigateHome && (
          <button
            onClick={() => {
              sounds.playTap();
              onNavigateHome();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 text-sm font-extrabold shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          {code === 'inactive' ? <ShieldAlert className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>

        <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
          Stand #{slug || 'Unknown'}
        </span>

        <h1 className="text-2xl font-bold text-white mb-3">
          {titles[code]}
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {descriptions[code]}
        </p>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-500 mb-6 text-left">
          <p className="font-semibold text-slate-400 mb-1">Permanent URL Stability Notice</p>
          This physical stand URL will remain identical once re-activated or assigned. The printed QR code and programmed NFC tag do not need replacement.
        </div>

        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

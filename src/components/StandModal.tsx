import React, { useState } from 'react';
import type { Stand, Business, DestinationType, NFCStatus } from '../types';
import { api } from '../services/api';
import { Radio, X, Check, Link2, Unlink } from 'lucide-react';
import { sounds } from '../utils/audio';

interface StandModalProps {
  stand: Stand;
  businesses: Business[];
  onClose: () => void;
  onSaved: () => void;
  domain: string;
}

export const StandModal: React.FC<StandModalProps> = ({
  stand,
  businesses,
  onClose,
  onSaved,
  domain,
}) => {
  const [customLabel, setCustomLabel] = useState(stand.customLabel || '');
  const [businessId, setBusinessId] = useState(stand.businessId || '');
  const [destinationType, setDestinationType] = useState<DestinationType>(stand.destinationType);
  const [destinationUrlOverride, setDestinationUrlOverride] = useState(stand.destinationUrlOverride || '');
  const [nfcTagUid, setNfcTagUid] = useState(stand.nfcTagUid || '');
  const [nfcStatus, setNfcStatus] = useState<NFCStatus>(stand.nfcProgrammedStatus);
  const [isActive, setIsActive] = useState(stand.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    sounds.playTap();

    const business = businesses.find(b => b.id === businessId);

    const updatedStand: Stand = {
      ...stand,
      customLabel: customLabel.trim() || undefined,
      businessId: businessId || null,
      businessName: business?.name,
      destinationType,
      destinationUrlOverride: destinationUrlOverride.trim() || undefined,
      nfcTagUid: nfcTagUid.trim() || undefined,
      nfcProgrammedStatus: nfcStatus,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    await api.saveStand(updatedStand);
    setIsSaving(false);
    onSaved();
    onClose();
  };

  const handleUnlinkNow = () => {
    sounds.playTap();
    setBusinessId('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl my-0 sm:my-8 transition-all">
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#EFEAE1]">
          <div>
            <span className="text-[10px] font-extrabold text-[#B3801A] uppercase tracking-wider block">
              Smart Stand Configuration
            </span>
            <h2 className="text-lg font-bold text-stone-900">
              Edit Stand #{stand.slug}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-white text-stone-700 border border-[#E8E2D5] shadow-sm">
              /r/{stand.slug}
            </span>
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Label & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Custom Label</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Table 04 (Indoor)"
                className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-stone-700 font-bold">Assigned Business</label>
                {businessId && (
                  <button
                    type="button"
                    onClick={handleUnlinkNow}
                    className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-medium focus:outline-none focus:border-[#C59B27]"
              >
                <option value="">None (Unassigned Stock)</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Type */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Stand Destination Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'MULTI_LINK', label: 'Multi-Link Hub (Review + Menu + IG)' },
                { id: 'REVIEW', label: 'Google Review Safe Page' },
                { id: 'MENU_HOSTED', label: 'Hosted Digital Menu' },
                { id: 'MENU_EXTERNAL', label: 'External Menu URL' },
                { id: 'CUSTOM_URL', label: 'Custom Redirect URL' },
              ].map((dest) => (
                <button
                  type="button"
                  key={dest.id}
                  onClick={() => {
                    sounds.playTap();
                    setDestinationType(dest.id as DestinationType);
                  }}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                    destinationType === dest.id
                      ? 'bg-amber-100 border-[#C59B27] text-amber-950 shadow-sm'
                      : 'bg-white border-[#E8E2D5] text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{dest.label}</span>
                    {destinationType === dest.id && (
                      <Check className="w-3.5 h-3.5 text-[#B3801A]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Destination URL Override (Optional) */}
          {(destinationType === 'CUSTOM_URL' || destinationType === 'MENU_EXTERNAL') && (
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Destination URL Override
              </label>
              <input
                type="url"
                value={destinationUrlOverride}
                onChange={(e) => setDestinationUrlOverride(e.target.value)}
                placeholder="https://example.com/menu"
                className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
              />
            </div>
          )}

          {/* Hardware & NFC Settings */}
          <div className="pt-2 border-t border-[#EFEAE1] space-y-3">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Physical NFC Tag Pairing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">NFC Chip UID</label>
                <input
                  type="text"
                  value={nfcTagUid}
                  onChange={(e) => setNfcTagUid(e.target.value)}
                  placeholder="04:9A:2F:5B:78:1C:80"
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl font-mono text-stone-800 text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">NFC Status</label>
                <select
                  value={nfcStatus}
                  onChange={(e) => setNfcStatus(e.target.value as NFCStatus)}
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-800 text-xs focus:outline-none focus:border-[#C59B27]"
                >
                  <option value="PENDING">Pending Pairing</option>
                  <option value="PROGRAMMED">Programmed</option>
                  <option value="VERIFIED">Tested & Verified</option>
                  <option value="FAILED">Defective / Error</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Toggle Switch */}
          <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E8E2D5]">
            <div>
              <span className="font-bold text-stone-900 block">Stand Active Status</span>
              <span className="text-[11px] text-stone-500">
                Disabled stands show a polite temporary unavailable screen
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setIsActive(!isActive);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                isActive ? 'bg-[#10B981]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EFEAE1]">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 font-semibold hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

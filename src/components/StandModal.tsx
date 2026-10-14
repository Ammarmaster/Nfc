import React, { useState } from 'react';
import type { Stand, Business, DestinationType, NFCStatus } from '../types';
import { api } from '../services/api';
import { Radio } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Smart Stand Configuration
            </span>
            <h2 className="text-lg font-bold text-white">
              Edit Stand #{stand.slug}
            </h2>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
            https://{domain}/r/{stand.slug}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Label & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Custom Label</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Table 04 (Indoor)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Business</label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
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
            <label className="block text-slate-300 font-semibold mb-1">Destination Mode</label>
            <select
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value as DestinationType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="REVIEW">Google Reviews Landing Page</option>
              <option value="MENU_HOSTED">Hosted Digital Menu (Indian Restaurant Menu)</option>
              <option value="MENU_EXTERNAL">External Digital Menu Link</option>
              <option value="CUSTOM_URL">Custom Redirect URL</option>
            </select>
          </div>

          {/* Destination URL Override */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Stand-Specific Destination URL Override (Optional)
            </label>
            <input
              type="url"
              value={destinationUrlOverride}
              onChange={(e) => setDestinationUrlOverride(e.target.value)}
              placeholder="Leave blank to use assigned business's default link"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Precedence: Stand override &gt; Assigned business default URL &gt; Unassigned status notice.
            </p>
          </div>

          {/* NFC Hardware Information */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span>NFC Hardware Pairing</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">NFC Chip UID</label>
                <input
                  type="text"
                  value={nfcTagUid}
                  onChange={(e) => setNfcTagUid(e.target.value)}
                  placeholder="e.g. 04:8F:A1:3B:5D:20:80"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Programming Status</label>
                <select
                  value={nfcStatus}
                  onChange={(e) => setNfcStatus(e.target.value as NFCStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PENDING">Pending (Not written)</option>
                  <option value="PROGRAMMED">Programmed</option>
                  <option value="VERIFIED">Verified & Tested</option>
                  <option value="FAILED">Tag Defective</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-300 block">Stand Activation</span>
              <span className="text-[11px] text-slate-500">
                Disabled stands show a polite "temporarily unavailable" notice when scanned.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs ${
                isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isActive ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-glow"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

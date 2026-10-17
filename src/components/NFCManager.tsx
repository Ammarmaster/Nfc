import React, { useState } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  Smartphone, 
  ShieldAlert, 
  Copy, 
  Check, 
  Search,
  Cpu,
  Layers
} from 'lucide-react';
import type { Stand, NFCStatus } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface NFCManagerProps {
  stands: Stand[];
  onRefreshStands: () => void;
  domain: string;
}

export const NFCManager: React.FC<NFCManagerProps> = ({ stands, onRefreshStands, domain }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Web NFC State (Chrome for Android Web NFC API)
  const [isWebNfcSupported, setIsWebNfcSupported] = useState<boolean>(false);
  const [nfcWritingStandId, setNfcWritingStandId] = useState<string | null>(null);
  const [nfcFeedback, setNfcFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if ('NDEFReader' in window) {
      setIsWebNfcSupported(true);
    }
  }, []);

  const handleCopyNfcUrl = async (slug: string) => {
    sounds.playTap();
    const nfcUrl = `https://${domain}/r/${slug}?nfc=1`;
    await navigator.clipboard.writeText(nfcUrl);
    setCopiedUrl(slug);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleUpdateStatus = async (stand: Stand, newStatus: NFCStatus) => {
    sounds.playTap();
    await api.saveStand({
      ...stand,
      nfcProgrammedStatus: newStatus,
      nfcTestedAt: newStatus === 'VERIFIED' ? new Date().toISOString() : stand.nfcTestedAt,
    });
    onRefreshStands();
  };

  const handleWebNfcWrite = async (stand: Stand) => {
    sounds.playTap();
    if (!('NDEFReader' in window)) {
      alert('Web NFC is only supported in Chromium browsers on Android with NFC enabled.');
      return;
    }

    try {
      setNfcWritingStandId(stand.id);
      setNfcFeedback('Bring your physical NFC tag close to the back of this phone...');

      const ndef = new (window as any).NDEFReader();
      const nfcUrl = `https://${domain}/r/${stand.slug}?nfc=1`;

      await ndef.write({
        records: [{ recordType: 'url', data: nfcUrl }],
      });

      sounds.playScanSuccess();
      setNfcFeedback(`Success! Programmed NFC Stand #${stand.slug}`);
      await api.saveStand({
        ...stand,
        nfcProgrammedStatus: 'PROGRAMMED',
        nfcTestedAt: new Date().toISOString(),
      });
      onRefreshStands();
    } catch (err: any) {
      setNfcFeedback(`NFC Write Error: ${err.message || 'Operation cancelled'}`);
    } finally {
      setTimeout(() => {
        setNfcWritingStandId(null);
        setNfcFeedback(null);
      }, 4000);
    }
  };

  const filteredStands = stands.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.slug.toLowerCase().includes(q) || 
           s.customLabel?.toLowerCase().includes(q) || 
           s.businessName?.toLowerCase().includes(q) ||
           s.nfcTagUid?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="milky-glass border border-[#E8E2D5] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
            <Radio className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            NFC Chip Programming & Verification
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
          Physical NFC tags require encoding with their permanent public redirect URL. Destination updates are handled dynamically in the cloud — physical chips never need re-writing.
        </p>
      </div>

      {/* Hardware Architecture & 3-Step Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#B3801A] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-stone-900">1. Permanent Chip URL Principle</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            The NFC chip and printed QR code store the <strong>exact same permanent URL</strong> (e.g. <code className="text-[#B3801A] font-bold">/r/01</code>). When destinations change, update in dashboard.
          </p>
        </div>

        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-stone-900">2. Tag Lock Safety</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Never permanently password-protect or lock NTAG chips during production until you have physically tested that both the QR and NFC chip open the redirect.
          </p>
        </div>

        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-stone-900">3. Recommended Writer App</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Use the free <strong>NFC Tools</strong> app (iOS/Android). Select <em>Write &rarr; Add Record &rarr; Custom URL</em>, paste the permanent URL, and touch the physical stand chip.
          </p>
        </div>
      </div>

      {/* Web NFC Banner if available */}
      {isWebNfcSupported && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Web NFC API Active! You can encode tags directly from this browser on your Android device.</span>
          </div>
          {nfcFeedback && <span className="font-mono text-stone-900 font-bold animate-pulse">{nfcFeedback}</span>}
        </div>
      )}

      {/* Stands Verification Checklist Table */}
      <div className="milky-glass rounded-3xl p-6 border border-[#E8E2D5] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B3801A]" />
              <span>Stand Provisioning & NFC Verification Checklist</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Verify each manufactured stand before dispatching to client locations.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stand or UID..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C59B27]"
            />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {filteredStands.map((stand) => {
            const isCopied = copiedUrl === stand.slug;
            const nfcUrl = `https://${domain}/r/${stand.slug}?nfc=1`;

            return (
              <div key={stand.id} className="milky-card p-4 rounded-2xl border border-[#E8E2D5] bg-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-stone-900 text-amber-300">
                    /r/{stand.slug}
                  </span>
                  <span className="text-xs font-bold text-stone-800">
                    {stand.businessName || 'Unassigned (Stock)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between text-xs font-mono text-stone-600">
                  <span className="truncate max-w-[200px]">{nfcUrl}</span>
                  <button
                    onClick={() => handleCopyNfcUrl(stand.slug)}
                    className="p-1 rounded bg-white text-stone-700 shadow-sm border border-[#DCD4C5]"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <select
                    value={stand.nfcProgrammedStatus}
                    onChange={(e) => handleUpdateStatus(stand, e.target.value as NFCStatus)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[#DCD4C5] bg-white text-stone-800"
                  >
                    <option value="PENDING">Pending (Unwritten)</option>
                    <option value="PROGRAMMED">Programmed</option>
                    <option value="VERIFIED">Verified & Tested</option>
                    <option value="FAILED">Tag Defective</option>
                  </select>

                  {isWebNfcSupported ? (
                    <button
                      onClick={() => handleWebNfcWrite(stand)}
                      disabled={nfcWritingStandId === stand.id}
                      className="px-3 py-1.5 rounded-xl bg-[#C59B27] text-white font-bold text-xs shadow-sm"
                    >
                      {nfcWritingStandId === stand.id ? 'Tap Tag...' : 'Write NFC'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopyNfcUrl(stand.slug)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD4C5] text-stone-700 text-xs font-bold"
                    >
                      {isCopied ? 'Copied!' : 'Copy URL'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E8E2D5] bg-white shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-stone-500 border-b border-[#E8E2D5]">
              <tr>
                <th className="p-3.5">Stand ID</th>
                <th className="p-3.5">Assigned Client</th>
                <th className="p-3.5">NFC Permanent URL</th>
                <th className="p-3.5">Chip Status</th>
                <th className="p-3.5">Verified At</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE1]">
              {filteredStands.map((stand) => {
                const isCopied = copiedUrl === stand.slug;
                const nfcUrl = `https://${domain}/r/${stand.slug}?nfc=1`;

                return (
                  <tr key={stand.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    {/* Stand Slug */}
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-stone-900">
                        /r/{stand.slug}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {stand.customLabel || `Stand #${stand.slug}`}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="p-3.5 font-bold text-stone-800">
                      {stand.businessName || 'Unassigned (Stock)'}
                    </td>

                    {/* NFC URL */}
                    <td className="p-3.5 font-mono text-[11px] text-stone-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{nfcUrl}</span>
                        <button
                          onClick={() => handleCopyNfcUrl(stand.slug)}
                          className="p-1 rounded bg-[#FAF8F5] hover:bg-stone-200 text-stone-600 border border-[#DCD4C5]"
                          title="Copy NFC URL"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Chip Status */}
                    <td className="p-3.5">
                      <select
                        value={stand.nfcProgrammedStatus}
                        onChange={(e) => handleUpdateStatus(stand, e.target.value as NFCStatus)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none ${
                          stand.nfcProgrammedStatus === 'VERIFIED'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : stand.nfcProgrammedStatus === 'PROGRAMMED'
                            ? 'bg-teal-100 border-teal-300 text-teal-900'
                            : stand.nfcProgrammedStatus === 'FAILED'
                            ? 'bg-rose-100 border-rose-300 text-rose-900'
                            : 'bg-white border-[#DCD4C5] text-stone-700'
                        }`}
                      >
                        <option value="PENDING">Pending (Unwritten)</option>
                        <option value="PROGRAMMED">Programmed</option>
                        <option value="VERIFIED">Verified & Tested</option>
                        <option value="FAILED">Tag Defective</option>
                      </select>
                    </td>

                    {/* Tested Timestamp */}
                    <td className="p-3.5 text-stone-500 text-[11px]">
                      {stand.nfcTestedAt 
                        ? new Date(stand.nfcTestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Not yet verified'}
                    </td>

                    {/* Direct Web NFC Write Action */}
                    <td className="p-3.5 text-right">
                      {isWebNfcSupported ? (
                        <button
                          onClick={() => handleWebNfcWrite(stand)}
                          disabled={nfcWritingStandId === stand.id}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-bold text-xs shadow-sm hover:brightness-105"
                        >
                          {nfcWritingStandId === stand.id ? 'Tap Tag Now...' : 'Write via Web NFC'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCopyNfcUrl(stand.slug)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#DCD4C5] hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-sm"
                        >
                          {isCopied ? 'URL Copied!' : 'Copy to NFC Tools'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

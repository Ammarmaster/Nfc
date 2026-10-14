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
    // We append ?nfc=1 so serverless analytics can optionally record physical tap attribution
    const nfcUrl = `https://${domain}/r/${slug}?nfc=1`;
    await navigator.clipboard.writeText(nfcUrl);
    setCopiedUrl(slug);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleUpdateStatus = async (stand: Stand, newStatus: NFCStatus) => {
    await api.saveStand({
      ...stand,
      nfcProgrammedStatus: newStatus,
      nfcTestedAt: newStatus === 'VERIFIED' ? new Date().toISOString() : stand.nfcTestedAt,
    });
    onRefreshStands();
  };

  const handleWebNfcWrite = async (stand: Stand) => {
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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Radio className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            NFC Chip Programming & Quality Verification
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Physical NFC tags require encoding with their permanent public redirect URL. Because NFC chips cannot be updated over-the-air, destination changes are managed centrally by the serverless redirect system.
        </p>
      </div>

      {/* Hardware Architecture & 6-Step Workflow Guidance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1.5">1. Permanent Chip URL Principle</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The NFC chip and printed QR code store the <strong>exact same permanent URL</strong> (e.g., <code className="text-emerald-400">/r/01</code>). When restaurants update their Google link or menu, you change it in the dashboard — never re-write the physical tag.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1.5">2. Tag Lock Safety Warning</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Never permanently password-protect or lock NTAG chips during production until you have physically verified that both the QR and NFC chip open the verified redirect successfully.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1.5">3. Recommended Writer App</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Use the free <strong>NFC Tools</strong> app (iOS / Android). Select <em>Write &rarr; Add Record &rarr; Custom URL / URI</em>, paste the permanent URL, and touch the physical stand chip.
          </p>
        </div>
      </div>

      {/* Web NFC Banner if available */}
      {isWebNfcSupported && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Web NFC API Active! You can write tags directly from this browser on your Android device.</span>
          </div>
          {nfcFeedback && <span className="font-mono text-white animate-pulse">{nfcFeedback}</span>}
        </div>
      )}

      {/* Stands Verification Checklist Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Stand Provisioning & NFC Verification Checklist</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify each manufactured stand before dispatching to client restaurants.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stand or UID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Stand ID</th>
                <th className="p-3.5">Assigned Client</th>
                <th className="p-3.5">NFC Permanent URL</th>
                <th className="p-3.5">Chip Status</th>
                <th className="p-3.5">Verified At</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {filteredStands.map((stand) => {
                const isCopied = copiedUrl === stand.slug;
                const nfcUrl = `https://${domain}/r/${stand.slug}?nfc=1`;

                return (
                  <tr key={stand.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Stand Slug */}
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-white">
                        /r/{stand.slug}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {stand.customLabel || `Stand #${stand.slug}`}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="p-3.5 font-semibold text-slate-200">
                      {stand.businessName || 'Unassigned (Stock)'}
                    </td>

                    {/* NFC URL */}
                    <td className="p-3.5 font-mono text-[11px] text-teal-400">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{nfcUrl}</span>
                        <button
                          onClick={() => handleCopyNfcUrl(stand.slug)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Copy NFC URL"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : stand.nfcProgrammedStatus === 'PROGRAMMED'
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                            : stand.nfcProgrammedStatus === 'FAILED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <option value="PENDING">Pending (Unwritten)</option>
                        <option value="PROGRAMMED">Programmed</option>
                        <option value="VERIFIED">Verified & Tested</option>
                        <option value="FAILED">Tag Defective</option>
                      </select>
                    </td>

                    {/* Tested Timestamp */}
                    <td className="p-3.5 text-slate-400 text-[11px]">
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
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                        >
                          {nfcWritingStandId === stand.id ? 'Tap Tag Now...' : 'Write via Web NFC'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCopyNfcUrl(stand.slug)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
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

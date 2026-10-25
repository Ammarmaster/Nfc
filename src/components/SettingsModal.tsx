import React, { useState } from 'react';
import type { AIConfig } from '../types';
import { api } from '../services/api';
import { Settings, Sparkles, Key, Globe, RefreshCcw, X, Check, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getAppDomain } from '../utils/domain';
import { authService } from '../services/auth';

interface SettingsModalProps {
  config: AIConfig;
  onClose: () => void;
  onSaved: (newConfig: AIConfig) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onClose,
  onSaved,
  onResetData,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'template'>(config.provider);
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [model, setModel] = useState<string>(config.model || 'gemini-1.5-flash');
  const [defaultTone, setDefaultTone] = useState<'warm' | 'enthusiastic' | 'professional' | 'brief'>(config.defaultTone);
  const [maxDrafts, setMaxDrafts] = useState<number>(config.maxDrafts || 3);
  const [enableNoKeyFallback, setEnableNoKeyFallback] = useState<boolean>(config.enableNoKeyFallback ?? true);
  const [customDomain, setCustomDomain] = useState<string>(config.customDomain || getAppDomain());
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [passwordUpdatedMsg, setPasswordUpdatedMsg] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    
    if (newAdminPassword.trim()) {
      authService.setCustomPassword(newAdminPassword.trim());
      setNewAdminPassword('');
      setPasswordUpdatedMsg(true);
    }

    const newConfig: AIConfig = {
      provider,
      apiKey: apiKey.trim(),
      model,
      defaultTone,
      maxDrafts,
      enableNoKeyFallback,
      customDomain: customDomain.trim() || getAppDomain(),
    };

    await api.saveSettings(newConfig);
    onSaved(newConfig);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 1000);
  };

  const handleReset = async () => {
    sounds.playTap();
    const confirm = window.confirm('Reset all demo stands, businesses, and analytics back to initial demo seeds?');
    if (!confirm) return;
    await api.resetAllData();
    onResetData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-xl w-full p-6 shadow-2xl my-0 sm:my-8 transition-all">
        {/* Mobile Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEAE1]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">System & AI Settings</h2>
              <p className="text-xs text-stone-500">Cloud AI provider and permanent production domain configuration.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Domain Configuration */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D5] shadow-sm">
            <h3 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#B3801A]" />
              <span>Permanent Public Domain</span>
            </h3>
            <label className="block text-stone-600 mb-1 font-medium">Domain Name</label>
            <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl px-3 py-2">
              <span className="text-stone-400">https://</span>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder={getAppDomain() || 'yourdomain.com'}
                className="w-full bg-transparent text-stone-900 font-mono text-xs focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
              All generated QR codes and NFC chips encode URLs under this domain (e.g. <code>https://{customDomain || getAppDomain()}/r/01</code>).
              <span className="block mt-0.5 text-stone-400">Can also be configured via <code>VITE_APP_DOMAIN</code> in <code>.env</code>.</span>
            </p>
          </div>

          {/* Admin Security & Master Key Section */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D5] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Authentication & Permissions</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {authService.isConfiguredViaEnv() ? '.env Active' : 'Protected'}
              </span>
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-medium">Update Admin Password</label>
              <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl px-3 py-2">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Enter new password to update..."
                  className="w-full bg-transparent text-stone-900 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
                Prevents unauthorized users from accessing the dashboard. Can also be set in <code>.env</code> via <code>VITE_ADMIN_PASSWORD=your_password</code>.
              </p>
            </div>

            {passwordUpdatedMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin password updated successfully!</span>
              </div>
            )}
          </div>

          {/* AI Provider Section */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E2D5] space-y-3 shadow-sm">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B3801A]" />
              <span>Review Assistant AI Engine</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'template', label: 'Deterministic Engine (Free, Instant)' },
                { id: 'gemini', label: 'Google Gemini 1.5' },
                { id: 'openai', label: 'OpenAI GPT-4o' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    sounds.playTap();
                    setProvider(p.id as any);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    provider === p.id
                      ? 'bg-amber-100 border-[#C59B27] text-amber-950 font-bold shadow-sm'
                      : 'bg-[#FAF8F5] border-[#E8E2D5] text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {provider !== 'template' && (
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  {provider.toUpperCase()} API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-700 font-medium">Automatic Fallback Engine</span>
              <input
                type="checkbox"
                checked={enableNoKeyFallback}
                onChange={(e) => setEnableNoKeyFallback(e.target.checked)}
                className="w-4 h-4 accent-[#C59B27] rounded"
              />
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-stone-500 hover:text-rose-600 flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold shadow-md hover:brightness-105 active:scale-95 flex items-center gap-1.5"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

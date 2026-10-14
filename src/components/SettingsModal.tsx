import React, { useState } from 'react';
import type { AIConfig } from '../types';
import { api } from '../services/api';
import { Settings, Sparkles, Key, Globe, RefreshCcw, X, Check } from 'lucide-react';

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
  const [customDomain, setCustomDomain] = useState<string>(config.customDomain || 'tapreview.in');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: AIConfig = {
      provider,
      apiKey: apiKey.trim(),
      model,
      defaultTone,
      maxDrafts,
      enableNoKeyFallback,
      customDomain: customDomain.trim() || 'tapreview.in',
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
    const confirm = window.confirm('Reset all demo stands, businesses, and analytics back to initial demo seeds?');
    if (!confirm) return;
    await api.resetAllData();
    onResetData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">System & AI Settings</h2>
              <p className="text-xs text-slate-400">Serverless AI provider and production domain configuration.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Domain Configuration */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Production Domain Configuration</span>
            </h3>
            <label className="block text-slate-400 mb-1">Permanent Public Domain</label>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-slate-500">https://</span>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="tapreview.in or yourdomain.in"
                className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              All generated QR codes and NFC chips will encode URLs under this domain (e.g. <code>https://{customDomain}/r/01</code>).
            </p>
          </div>

          {/* AI Provider Section */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>AI Review Draft Engine</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="template">Deterministic Templates (Zero-Cost / Free)</option>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Low Cost)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>
            </div>

            {provider !== 'template' && (
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>API Key (Serverless Secret / Local Preview)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AI API Key..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-slate-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={enableNoKeyFallback}
                onChange={(e) => setEnableNoKeyFallback(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Automatic Template Fallback when no API Key is available</span>
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Demo Data</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-glow flex items-center gap-1.5"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

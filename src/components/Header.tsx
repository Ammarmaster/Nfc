import React from 'react';
import { 
  QrCode, 
  Layers, 
  Store, 
  UtensilsCrossed, 
  Radio, 
  BarChart3, 
  Settings
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics';
  setActiveTab: (tab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics') => void;
  onOpenSettings: () => void;
  totalStands: number;
  totalVisits: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  totalStands,
  totalVisits,
}) => {
  const tabs = [
    { id: 'stands' as const, label: 'Stand Inventory', icon: Layers },
    { id: 'studio' as const, label: 'QR Studio', icon: QrCode, highlight: true },
    { id: 'businesses' as const, label: 'Businesses', icon: Store },
    { id: 'menus' as const, label: 'Digital Menus', icon: UtensilsCrossed },
    { id: 'nfc' as const, label: 'NFC Provisioning', icon: Radio },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center p-2 shadow-glow">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-white tracking-tight">
                  TapReview
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  SaaS Edge
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                NFC + QR Smart Stand Management System
              </p>
            </div>
          </div>

          {/* Quick Metrics & Settings */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800/90 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400">Total Stands:</span>
                <span className="font-bold text-white">{totalStands}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Total Visits:</span>
                <span className="font-bold text-emerald-400">{totalVisits.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="System & AI Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { 
  QrCode, 
  Layers, 
  Store, 
  UtensilsCrossed, 
  Radio, 
  BarChart3, 
  Settings,
  Sparkles,
  Camera,
  Star
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  activeTab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics';
  setActiveTab: (tab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics') => void;
  onOpenSettings: () => void;
  onOpenScanner: () => void;
  totalStands: number;
  totalVisits: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenScanner,
  totalStands,
  totalVisits,
}) => {
  const tabs = [
    { id: 'stands' as const, label: 'Stand Inventory', icon: Layers },
    { id: 'studio' as const, label: 'QR Studio', icon: QrCode, badge: 'PRO' },
    { id: 'businesses' as const, label: 'Clients & Places', icon: Store },
    { id: 'menus' as const, label: 'Digital Menus', icon: UtensilsCrossed },
    { id: 'nfc' as const, label: 'NFC Hardware', icon: Radio },
    { id: 'analytics' as const, label: 'Live Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-2xl border-b border-[#E8E2D5] shadow-[0_4px_25px_rgba(70,55,40,0.05)]">
      {/* Top subtle champagne gold shimmer accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-[#10B981]/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#E8C872] to-[#B3801A] p-[1.5px] shadow-[0_4px_15px_rgba(197,155,39,0.3)]">
              <div className="w-full h-full bg-[#FAF8F5] rounded-[14px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-[#B3801A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black font-display tracking-tight text-stone-900 flex items-center gap-1">
                  Tap<span className="gold-text-gradient font-black">Review</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100/80 border border-amber-300 text-[#B3801A] text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Cloud NFC</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block font-medium">
                Smart Stand NFC + Dynamic QR Link Architecture
              </p>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* PROMINENT SCAN QR BUTTON (Desktop & Mobile) */}
            <button
              onClick={() => {
                sounds.playTap();
                onOpenScanner();
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27] text-stone-950 font-extrabold text-xs shadow-[0_4px_18px_rgba(197,155,39,0.3)] hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300"
              title="Open QR Scanner to Link or Unlink Stand"
            >
              <Camera className="w-4 h-4 text-stone-950" />
              <span className="hidden xs:inline">Scan QR</span>
              <span className="xs:hidden">Scan</span>
            </button>

            {/* Quick Stats (Desktop) */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white border border-[#E8E2D5] text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                <span className="text-stone-500 font-medium">Stands:</span>
                <span className="font-bold text-stone-900 font-mono">{totalStands}</span>
              </div>
              <div className="w-px h-3.5 bg-stone-300" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#B3801A]" />
                <span className="text-stone-500 font-medium">Visits:</span>
                <span className="font-bold font-mono gold-text-gradient">{totalVisits.toLocaleString()}</span>
              </div>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => {
                sounds.playTap();
                onOpenSettings();
              }}
              className="p-2.5 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-[#E8E2D5] transition-all hover:border-[#D4AF37] shadow-sm"
              title="System & AI Cloud Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-[#EFEAE1]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playTap();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-stone-900 border border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.18)]'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-white/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#B3801A]' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#B3801A] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

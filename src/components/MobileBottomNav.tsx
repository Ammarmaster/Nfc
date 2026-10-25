import React from 'react';
import { 
  Layers, 
  QrCode, 
  Camera, 
  Store, 
  MoreHorizontal,
  UtensilsCrossed,
  Radio,
  BarChart3,
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics';
  setActiveTab: (tab: 'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics') => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenSettings,
  onLogout,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  return (
    <>
      {/* "More" Drawer for Menus, NFC, Analytics on Mobile */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col justify-end animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] rounded-t-[2rem] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE1]">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Additional Modules
              </span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-stone-200/60 text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('menus');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  activeTab === 'menus'
                    ? 'bg-white border-[#C59B27] shadow-sm text-stone-900 font-bold'
                    : 'bg-white/70 border-[#E8E2D5] text-stone-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#B3801A] flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900">Digital Menus</strong>
                  <span className="text-[10px] text-stone-500">Items & Categories</span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('nfc');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  activeTab === 'nfc'
                    ? 'bg-white border-[#C59B27] shadow-sm text-stone-900 font-bold'
                    : 'bg-white/70 border-[#E8E2D5] text-stone-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900">NFC Hardware</strong>
                  <span className="text-[10px] text-stone-500">Program Tags</span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('analytics');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white border-[#C59B27] shadow-sm text-stone-900 font-bold'
                    : 'bg-white/70 border-[#E8E2D5] text-stone-700'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900">Live Analytics</strong>
                  <span className="text-[10px] text-stone-500">Real-time Scans</span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenSettings();
                  setIsMoreMenuOpen(false);
                }}
                className="p-4 rounded-2xl border border-[#E8E2D5] bg-white/70 text-left flex items-center gap-3 transition-all text-stone-700 hover:bg-white"
              >
                <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900">Settings</strong>
                  <span className="text-[10px] text-stone-500">Domain & AI Cloud</span>
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    sounds.playTap();
                    setIsMoreMenuOpen(false);
                    onLogout();
                  }}
                  className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 text-left flex items-center gap-3 transition-all text-rose-700 hover:bg-rose-100 col-span-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-rose-950 font-bold">Lock Admin Portal</strong>
                    <span className="text-[10px] text-rose-600">Sign out and protect dashboard</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Milky Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-2xl border-t border-[#E8E2D5] shadow-[0_-4px_25px_rgba(70,55,40,0.08)] px-3 pb-safe pt-2">
        <div className="flex items-center justify-around h-14 max-w-md mx-auto relative">
          
          {/* Tab 1: Stands */}
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('stands');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'stands' ? 'text-[#B3801A] font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Stands</span>
          </button>

          {/* Tab 2: QR Studio */}
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('studio');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'studio' ? 'text-[#B3801A] font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Studio</span>
          </button>

          {/* CENTER FLOATING ACTION: SCAN QR CODE */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={() => {
                sounds.playTap();
                onOpenScanner();
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#E8C872] to-[#B3801A] p-[2.5px] shadow-[0_8px_20px_rgba(197,155,39,0.38)] active:scale-95 transition-transform"
              title="Scan QR to Link or Manage"
            >
              <div className="w-full h-full rounded-full bg-[#1C1917] flex flex-col items-center justify-center text-amber-300">
                <Camera className="w-6 h-6 animate-pulse" />
                <span className="text-[8px] font-black tracking-widest uppercase">Scan</span>
              </div>
            </button>
          </div>

          {/* Tab 4: Clients */}
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('businesses');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'businesses' ? 'text-[#B3801A] font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Clients</span>
          </button>

          {/* Tab 5: More */}
          <button
            onClick={() => {
              sounds.playTap();
              setIsMoreMenuOpen(prev => !prev);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              ['menus', 'nfc', 'analytics'].includes(activeTab) || isMoreMenuOpen
                ? 'text-[#B3801A] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">More</span>
          </button>

        </div>
      </nav>
    </>
  );
};

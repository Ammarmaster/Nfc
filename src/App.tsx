import React, { useState, useEffect } from 'react';
import type { Stand, Business, AIConfig } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StandManager } from './components/StandManager';
import { QRStudio } from './components/QRStudio';
import { BusinessManager } from './components/BusinessManager';
import { MenuManager } from './components/MenuManager';
import { NFCManager } from './components/NFCManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ReviewLandingPage } from './components/ReviewLandingPage';
import { PublicMenuPage } from './components/PublicMenuPage';
import { StatusPage } from './components/StatusPage';
import { StandModal } from './components/StandModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { SettingsModal } from './components/SettingsModal';
import { QRScannerModal } from './components/QRScannerModal';
import { StandSetupPage } from './components/StandSetupPage';
import { CustomerHubPage } from './components/CustomerHubPage';
import { ReviewSliderPage } from './components/ReviewSliderPage';

export function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'stands' | 'studio' | 'businesses' | 'menus' | 'nfc' | 'analytics'>('stands');
  
  // Data State
  const [stands, setStands] = useState<Stand[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [settings, setSettings] = useState<AIConfig>({
    provider: 'template',
    apiKey: '',
    model: 'gemini-1.5-flash',
    defaultTone: 'warm',
    maxDrafts: 3,
    enableNoKeyFallback: true,
    customDomain: 'tapreview.in',
  });
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);

  // Modals
  const [editingStand, setEditingStand] = useState<Stand | null>(null);
  const [standsToPrint, setStandsToPrint] = useState<Stand[] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Customer Simulation Route State
  const [customerRoute, setCustomerRoute] = useState<{
    slug: string;
    isNfc?: boolean;
    stand?: Stand;
    business?: Business;
    statusCode?: 'inactive' | 'unassigned' | 'not_found';
    isSetup?: boolean;
    view?: 'hub' | 'review_slider' | 'menu';
  } | null>(null);

  // Load Initial Data
  const reloadData = async () => {
    const [standsData, bizData, settingsData, eventsData] = await Promise.all([
      api.getStands(),
      api.getBusinesses(),
      api.getSettings(),
      api.getAnalytics(),
    ]);
    setStands(standsData);
    setBusinesses(bizData);
    setSettings(settingsData);
    setAnalyticsEvents(eventsData);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Listen to Hash changes or check URL for direct public routes e.g. /r/:slug or /#/setup
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      // Handle Quick Setup route /#/setup?slug=...
      if (hash.startsWith('#/setup')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const slug = urlParams.get('slug') || '01';
        const stand = await api.getStandBySlug(slug);
        let biz: Business | undefined;
        if (stand?.businessId) {
          biz = await api.getBusinessById(stand.businessId);
        }
        setCustomerRoute({
          slug,
          stand,
          business: biz,
          isSetup: true,
        });
        return;
      }

      let targetSlug: string | null = null;
      let isNfc = false;

      if (hash.startsWith('#/r/')) {
        const parts = hash.replace('#/r/', '').split('?');
        targetSlug = decodeURIComponent(parts[0]);
        if (parts[1]?.includes('nfc=1')) isNfc = true;
      } else if (pathname.startsWith('/r/')) {
        const parts = pathname.replace('/r/', '').split('?');
        targetSlug = decodeURIComponent(parts[0]);
        if (window.location.search.includes('nfc=1')) isNfc = true;
      }

      if (targetSlug) {
        const stand = await api.getStandBySlug(targetSlug);
        
        // 1. If stand does not exist yet, allow on-site activation immediately!
        if (!stand) {
          setCustomerRoute({
            slug: targetSlug,
            isNfc,
            isSetup: true,
          });
          return;
        }

        // 2. If stand is deactivated
        if (!stand.isActive) {
          setCustomerRoute({ slug: targetSlug, statusCode: 'inactive', stand });
          return;
        }

        let biz: Business | undefined;
        if (stand.businessId) {
          biz = await api.getBusinessById(stand.businessId);
        }

        // 3. Check if this stand has any destination links configured
        const hasLinks = Boolean(
          stand.destinationUrlOverride ||
          biz?.googleReviewUrl ||
          biz?.digitalMenuUrl ||
          biz?.instagramUrl ||
          biz?.whatsappUrl ||
          stand.destinationType === 'MENU_HOSTED'
        );

        // If not assigned any links, open setup page!
        if (!stand.businessId || !hasLinks) {
          setCustomerRoute({
            slug: targetSlug,
            isNfc,
            stand,
            business: biz,
            isSetup: true,
          });
          return;
        }

        // Record privacy-conscious scan analytics
        await api.logScanEvent({
          standId: stand.id,
          slug: stand.slug,
          businessId: stand.businessId,
          businessName: biz?.name,
          destinationType: stand.destinationType,
          destinationUrl: stand.destinationUrlOverride || biz?.googleReviewUrl || biz?.digitalMenuUrl || 'LANDING_PAGE',
          source: isNfc ? 'NFC' : 'QR',
          deviceCategory: 'DESKTOP',
        });

        // Determine view:
        let view: 'hub' | 'review_slider' | 'menu' = 'hub';
        if (stand.destinationType === 'MENU_HOSTED') {
          view = 'menu';
        }

        setCustomerRoute({
          slug: targetSlug,
          isNfc,
          stand,
          business: biz,
          view,
        });
      } else if (hash.startsWith('#/status')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const code = (urlParams.get('code') || 'unassigned') as any;
        const slug = urlParams.get('slug') || '';
        
        if (code === 'unassigned') {
          const stand = await api.getStandBySlug(slug);
          let biz: Business | undefined;
          if (stand?.businessId) {
            biz = await api.getBusinessById(stand.businessId);
          }
          setCustomerRoute({
            slug,
            stand,
            business: biz,
            isSetup: true,
          });
        } else {
          setCustomerRoute({ slug, statusCode: code });
        }
      } else {
        setCustomerRoute(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Customer View Simulator Handler
  const openCustomerView = (stand: Stand) => {
    window.location.hash = `#/r/${encodeURIComponent(stand.slug)}`;
  };

  const openCustomerMenu = (businessId: string) => {
    const stand = stands.find(s => s.businessId === businessId && s.destinationType === 'MENU_HOSTED') || stands[0];
    if (stand) {
      window.location.hash = `#/r/${encodeURIComponent(stand.slug)}`;
    }
  };

  const handleReturnHome = () => {
    window.location.hash = '';
    setCustomerRoute(null);
    reloadData();
  };

  // If customer route is active, render customer experience
  if (customerRoute) {
    if (customerRoute.isSetup) {
      return (
        <StandSetupPage
          slug={customerRoute.slug}
          stand={customerRoute.stand}
          existingBusiness={customerRoute.business}
          businesses={businesses}
          onSaved={async (savedStand) => {
            await reloadData();
            window.location.hash = `#/r/${encodeURIComponent(savedStand.slug)}`;
          }}
          onCancel={handleReturnHome}
        />
      );
    }

    if (customerRoute.statusCode) {
      return (
        <StatusPage
          code={customerRoute.statusCode}
          slug={customerRoute.slug}
          onNavigateHome={handleReturnHome}
        />
      );
    }

    if (customerRoute.stand) {
      if (customerRoute.view === 'menu' || customerRoute.stand.destinationType === 'MENU_HOSTED') {
        return (
          <PublicMenuPage
            stand={customerRoute.stand}
            business={customerRoute.business}
            isNfc={customerRoute.isNfc}
            onNavigateHome={handleReturnHome}
          />
        );
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
          {/* Subtle top back bar for preview testing */}
          <div className="bg-[#FAF8F5]/95 border-b border-[#E8E2D5] px-4 py-2.5 text-xs flex items-center justify-between text-stone-700 backdrop-blur-md shadow-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Previewing Customer Flow: <strong className="text-stone-900 font-mono font-bold">Stand #{customerRoute.stand.slug}</strong> <span className="text-[#B3801A] font-semibold">({customerRoute.business?.name || 'Unassigned'})</span>
              </span>
            </span>
            <button
              onClick={handleReturnHome}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCD4C5] text-stone-800 hover:text-stone-900 font-bold transition-all shadow-sm active:scale-95"
            >
              Exit Preview & Return to Dashboard
            </button>
          </div>

          {customerRoute.view === 'review_slider' ? (
            <ReviewSliderPage
              stand={customerRoute.stand}
              business={customerRoute.business}
              isNfc={customerRoute.isNfc}
              onBack={() => setCustomerRoute(prev => prev ? { ...prev, view: 'hub' } : null)}
            />
          ) : (
            <CustomerHubPage
              stand={customerRoute.stand}
              business={customerRoute.business}
              isNfc={customerRoute.isNfc}
              onSelectGoogleReview={() => setCustomerRoute(prev => prev ? { ...prev, view: 'review_slider' } : null)}
              onEditLinks={() => setCustomerRoute(prev => prev ? { ...prev, isSetup: true } : null)}
              onNavigateHome={handleReturnHome}
            />
          )}
        </div>
      );
    }
  }

  // Calculate total metrics for Header
  const totalVisits = stands.reduce((sum, s) => sum + (s.visitCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-[#E8C872] selection:text-stone-950">
      {/* SaaS Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        totalStands={stands.length}
        totalVisits={totalVisits}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'stands' && (
          <StandManager
            stands={stands}
            businesses={businesses}
            onRefreshStands={reloadData}
            onEditStand={(stand) => setEditingStand(stand)}
            onOpenPrintModal={(stands) => setStandsToPrint(stands)}
            onOpenCustomerView={openCustomerView}
            domain={settings.customDomain}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'studio' && (
          <QRStudio
            stands={stands}
            businesses={businesses}
            onRefreshStands={reloadData}
            onEditStand={(stand) => setEditingStand(stand)}
            onOpenPrintModal={(stands) => setStandsToPrint(stands)}
            domain={settings.customDomain}
          />
        )}

        {activeTab === 'businesses' && (
          <BusinessManager
            businesses={businesses}
            stands={stands}
            onRefreshBusinesses={reloadData}
            onRefreshStands={reloadData}
            onSelectBusinessStands={() => setActiveTab('stands')}
            onPreviewCustomerReview={(b) => {
              const stand = stands.find(s => s.businessId === b.id) || stands[0];
              if (stand) openCustomerView(stand);
            }}
          />
        )}

        {activeTab === 'menus' && (
          <MenuManager
            businesses={businesses}
            onOpenCustomerMenu={openCustomerMenu}
          />
        )}

        {activeTab === 'nfc' && (
          <NFCManager
            stands={stands}
            onRefreshStands={reloadData}
            domain={settings.customDomain}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            events={analyticsEvents}
            stands={stands}
            businesses={businesses}
          />
        )}
      </main>

      {/* Stand Edit Modal */}
      {editingStand && (
        <StandModal
          stand={editingStand}
          businesses={businesses}
          onClose={() => setEditingStand(null)}
          onSaved={reloadData}
          domain={settings.customDomain}
        />
      )}

      {/* QR Scanner & Instant Link/Unlink Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        stands={stands}
        businesses={businesses}
        onRefreshStands={reloadData}
        domain={settings.customDomain}
        onOpenCustomerView={openCustomerView}
        onEditStand={(stand) => setEditingStand(stand)}
      />

      {/* Print PDF Sheets Modal */}
      {standsToPrint && (
        <PrintSheetModal
          stands={standsToPrint}
          onClose={() => setStandsToPrint(null)}
          domain={settings.customDomain}
        />
      )}

      {/* System Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          config={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={(newCfg) => setSettings(newCfg)}
          onResetData={reloadData}
        />
      )}

      {/* Mobile Floating Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Production SaaS Footer */}
      <footer className="border-t border-[#E8E2D5] bg-[#FAF8F5]/90 backdrop-blur-xl py-6 text-center text-xs text-stone-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900">Tap<span className="gold-text-gradient">Review</span></span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600">Enterprise NFC + Dynamic QR Cloud</span>
            <span className="text-stone-300">•</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">Cloud D1 Active</span>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-2">
            <span>Permanent URL Architecture</span>
            <span>•</span>
            <span className="text-[#B3801A] font-medium">Google Review Safe</span>
            <span>•</span>
            <span>Sub-50ms Global Routing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

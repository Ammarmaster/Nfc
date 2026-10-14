import React, { useState, useEffect } from 'react';
import type { Stand, Business, AIConfig } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
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

  // Customer Simulation Route State
  const [customerRoute, setCustomerRoute] = useState<{
    slug: string;
    isNfc?: boolean;
    stand?: Stand;
    business?: Business;
    statusCode?: 'inactive' | 'unassigned' | 'not_found';
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

  // Listen to Hash changes or check URL for direct public routes e.g. /r/:slug
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

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
        if (!stand) {
          setCustomerRoute({ slug: targetSlug, statusCode: 'not_found' });
          return;
        }

        if (!stand.isActive) {
          setCustomerRoute({ slug: targetSlug, statusCode: 'inactive', stand });
          return;
        }

        let biz: Business | undefined;
        if (stand.businessId) {
          biz = await api.getBusinessById(stand.businessId);
        }

        // Record analytics
        await api.logScanEvent({
          standId: stand.id,
          slug: stand.slug,
          businessId: stand.businessId,
          businessName: biz?.name,
          destinationType: stand.destinationType,
          destinationUrl: stand.destinationUrlOverride || biz?.googleReviewUrl || 'LANDING_PAGE',
          source: isNfc ? 'NFC' : 'QR',
          deviceCategory: 'DESKTOP',
        });

        setCustomerRoute({
          slug: targetSlug,
          isNfc,
          stand,
          business: biz,
        });
      } else if (hash.startsWith('#/status')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const code = (urlParams.get('code') || 'unassigned') as any;
        const slug = urlParams.get('slug') || '';
        setCustomerRoute({ slug, statusCode: code });
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
      if (customerRoute.stand.destinationType === 'MENU_HOSTED') {
        return (
          <PublicMenuPage
            stand={customerRoute.stand}
            business={customerRoute.business}
            isNfc={customerRoute.isNfc}
            onNavigateHome={handleReturnHome}
          />
        );
      }

      // Default review landing
      return (
        <div>
          {/* Subtle top back bar for preview testing */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex items-center justify-between text-slate-400">
            <span>
              Previewing Customer Experience: <strong>Stand #{customerRoute.stand.slug}</strong> ({customerRoute.business?.name || 'Unassigned'})
            </span>
            <button
              onClick={handleReturnHome}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold"
            >
              Exit Preview & Return to Dashboard
            </button>
          </div>
          <ReviewLandingPage
            stand={customerRoute.stand}
            business={customerRoute.business}
            isNfc={customerRoute.isNfc}
          />
        </div>
      );
    }
  }

  // Calculate total metrics for Header
  const totalVisits = stands.reduce((sum, s) => sum + (s.visitCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* SaaS Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalStands={stands.length}
        totalVisits={totalVisits}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stands' && (
          <StandManager
            stands={stands}
            businesses={businesses}
            onRefreshStands={reloadData}
            onEditStand={(stand) => setEditingStand(stand)}
            onOpenPrintModal={(stands) => setStandsToPrint(stands)}
            onOpenCustomerView={openCustomerView}
            domain={settings.customDomain}
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

      {/* Production SaaS Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">TapReview SaaS</span>
            <span>•</span>
            <span>Cloudflare Edge &amp; D1 Database Native</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Stable Permanent URLs • Google Review Compliance • Grounded Review Drafting
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

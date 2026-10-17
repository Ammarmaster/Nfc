import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Smartphone, 
  QrCode, 
  Radio, 
  ShieldCheck, 
  Layers, 
  Store 
} from 'lucide-react';
import type { AnalyticsEvent, Stand, Business } from '../types';

interface AnalyticsDashboardProps {
  events: AnalyticsEvent[];
  stands: Stand[];
  businesses: Business[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  events,
  stands,
  businesses,
}) => {
  // Aggregate Metrics Computation
  const stats = useMemo(() => {
    const total = events.length;
    const nfcCount = events.filter(e => e.source === 'NFC').length;
    const qrCount = events.filter(e => e.source === 'QR').length;
    const androidCount = events.filter(e => e.deviceCategory === 'MOBILE_ANDROID').length;
    const iosCount = events.filter(e => e.deviceCategory === 'MOBILE_IOS').length;
    const desktopCount = events.filter(e => e.deviceCategory === 'DESKTOP' || e.deviceCategory === 'OTHER').length;
    const reviewViews = events.filter(e => e.destinationType === 'REVIEW').length;
    const menuViews = events.filter(e => e.destinationType === 'MENU_HOSTED' || e.destinationType === 'MENU_EXTERNAL').length;

    // Top stands by visits
    const standCounts: Record<string, number> = {};
    events.forEach(e => {
      standCounts[e.slug] = (standCounts[e.slug] || 0) + 1;
    });

    const topStands = Object.entries(standCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => {
        const stand = stands.find(s => s.slug === slug);
        return {
          slug,
          count,
          label: stand?.customLabel || (stand?.businessName ? `(${stand.businessName})` : undefined),
        };
      });

    // Top businesses by visits
    const bizCounts: Record<string, number> = {};
    events.forEach(e => {
      if (e.businessName) {
        bizCounts[e.businessName] = (bizCounts[e.businessName] || 0) + 1;
      }
    });

    const topBusinesses = Object.entries(bizCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Generate 14-day timeline
    const timelineDays = 14;
    const timeline: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = timelineDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = events.filter(e => e.createdAt && e.createdAt.startsWith(dateStr)).length;
      timeline.push({
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        count,
      });
    }

    const maxDayCount = Math.max(1, ...timeline.map(t => t.count));

    return {
      total,
      nfcCount,
      qrCount,
      androidCount,
      iosCount,
      desktopCount,
      reviewViews,
      menuViews,
      topStands,
      topBusinesses,
      timeline,
      maxDayCount,
    };
  }, [events, stands, businesses]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="milky-glass border border-[#E8E2D5] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Live Scan Performance & Analytics
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
          Aggregated scan performance across physical NFC smart stands and dynamic QR codes. Designed in compliance with international privacy standards without recording personally identifiable information.
        </p>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Total Interactions</span>
          <span className="text-3xl font-black text-stone-900 mt-1 block font-mono">{stats.total.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active across all stands</span>
          </span>
        </div>

        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">NFC Physical Taps</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-teal-700 font-mono">{stats.nfcCount.toLocaleString()}</span>
            <span className="text-xs text-stone-500 font-bold">
              ({stats.total > 0 ? Math.round((stats.nfcCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-stone-500 flex items-center gap-1 pt-1">
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span>Via ?nfc=1 query parameter</span>
          </span>
        </div>

        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">QR Code Scans</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#B3801A] font-mono">{stats.qrCount.toLocaleString()}</span>
            <span className="text-xs text-stone-500 font-bold">
              ({stats.total > 0 ? Math.round((stats.qrCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-stone-500 flex items-center gap-1 pt-1">
            <QrCode className="w-3.5 h-3.5 text-[#B3801A]" />
            <span>Standard camera QR scans</span>
          </span>
        </div>

        <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Review Engagement</span>
          <span className="text-3xl font-black text-amber-700 font-mono mt-1 block">{stats.reviewViews.toLocaleString()}</span>
          <span className="text-[11px] text-stone-500 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Customer review landings</span>
          </span>
        </div>
      </div>

      {/* 14-Day Timeline Bar Chart */}
      <div className="milky-glass rounded-3xl p-6 border border-[#E8E2D5] shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-0.5">14-Day Customer Scan Volume</h2>
        <p className="text-xs text-stone-500 mb-6">Daily redirect requests across all physical NFC + QR stands.</p>

        {events.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center border-b border-[#E8E2D5] text-stone-500 text-xs">
            <BarChart3 className="w-8 h-8 text-stone-300 mb-2" />
            <span className="font-bold text-stone-700">No Scan Events Recorded Yet</span>
            <span className="text-[11px] text-stone-500 mt-1">Interactions from physical QR codes and NFC taps will plot daily volume here in real time.</span>
          </div>
        ) : (
          <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4 border-b border-[#E8E2D5] pb-2">
            {stats.timeline.map((item) => {
              const heightPercent = Math.max(10, Math.round((item.count / stats.maxDayCount) * 100));
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-[#B3801A] to-[#E8C872] rounded-t-lg group-hover:brightness-110 transition-all shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown Grid: Devices, Top Stands, Top Businesses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Categories */}
        <div className="milky-card rounded-3xl p-6 border border-[#E8E2D5] bg-white shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Customer Device Category</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-stone-600">Android Phones</span>
                <span className="text-stone-900 font-bold">{stats.androidCount}</span>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.androidCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-stone-600">Apple iOS (iPhones)</span>
                <span className="text-stone-900 font-bold">{stats.iosCount}</span>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.iosCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-stone-600">Desktop / Other</span>
                <span className="text-stone-900 font-bold">{stats.desktopCount}</span>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-stone-400 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.desktopCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Stands */}
        <div className="milky-card rounded-3xl p-6 border border-[#E8E2D5] bg-white shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B3801A]" />
            <span>Top Performing Stands</span>
          </h2>
          <div className="space-y-3">
            {stats.topStands.length === 0 ? (
              <span className="text-xs text-stone-400">No visits recorded yet</span>
            ) : (
              stats.topStands.map((stand, i) => (
                <div key={stand.slug} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] text-stone-600 flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-mono font-bold text-stone-900">/r/{stand.slug}</span>
                    {stand.label && <span className="text-stone-500 text-[11px] truncate max-w-[100px]">{stand.label}</span>}
                  </div>
                  <span className="font-extrabold text-emerald-700 font-mono">{stand.count.toLocaleString()} visits</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Clients */}
        <div className="milky-card rounded-3xl p-6 border border-[#E8E2D5] bg-white shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Top Performing Businesses</span>
          </h2>
          <div className="space-y-3">
            {stats.topBusinesses.length === 0 ? (
              <span className="text-xs text-stone-400">No visits recorded yet</span>
            ) : (
              stats.topBusinesses.map((biz, i) => (
                <div key={biz.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] text-stone-600 flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate max-w-[140px]">{biz.name}</span>
                  </div>
                  <span className="font-extrabold text-[#B3801A] font-mono">{biz.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

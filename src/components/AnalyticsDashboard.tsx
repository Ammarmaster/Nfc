import React, { useMemo } from 'react';
import { 
  BarChart3, 
  QrCode, 
  Radio, 
  Smartphone, 
  TrendingUp, 
  Layers, 
  Store, 
  ShieldCheck 
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
  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = events.length;
    const nfcCount = events.filter(e => e.source === 'NFC').length;
    const qrCount = events.filter(e => e.source === 'QR').length;

    const androidCount = events.filter(e => e.deviceCategory === 'MOBILE_ANDROID').length;
    const iosCount = events.filter(e => e.deviceCategory === 'MOBILE_IOS').length;
    const desktopCount = events.filter(e => e.deviceCategory === 'DESKTOP').length;

    const reviewViews = events.filter(e => e.destinationType === 'REVIEW').length;
    const menuViews = events.filter(e => e.destinationType === 'MENU_HOSTED' || e.destinationType === 'MENU_EXTERNAL').length;

    // Top Stands
    const standCounts: Record<string, { slug: string; label?: string; count: number }> = {};
    for (const stand of stands) {
      standCounts[stand.id] = { slug: stand.slug, label: stand.customLabel, count: stand.visitCount || 0 };
    }
    const topStands = Object.values(standCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Top Businesses
    const bizCounts: Record<string, { name: string; count: number }> = {};
    for (const e of events) {
      if (e.businessName) {
        bizCounts[e.businessName] = bizCounts[e.businessName] || { name: e.businessName, count: 0 };
        bizCounts[e.businessName].count++;
      }
    }
    const topBusinesses = Object.values(bizCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // 14-day timeline breakdown
    const daysMap: Record<string, { date: string; count: number }> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(5, 10); // MM-DD
      daysMap[key] = { date: key, count: 0 };
    }
    for (const e of events) {
      const key = e.createdAt.slice(5, 10);
      if (daysMap[key]) {
        daysMap[key].count++;
      }
    }
    const timeline = Object.values(daysMap);
    const maxDayCount = Math.max(...timeline.map(t => t.count), 1);

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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Privacy-First SaaS Scan Analytics
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Aggregated scan performance across physical NFC smart stands and QR codes. Designed in compliance with Indian and international privacy standards without recording personally identifiable information.
        </p>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Interactions</span>
          <span className="text-3xl font-extrabold text-white mt-1 block">{stats.total.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active across all stands</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">NFC Physical Taps</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-teal-400">{stats.nfcCount.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({stats.total > 0 ? Math.round((stats.nfcCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>Via ?nfc=1 query attribution</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">QR Code Scans</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400">{stats.qrCount.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({stats.total > 0 ? Math.round((stats.qrCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standard camera QR scans</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Review Engagement</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{stats.reviewViews.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Customer review landings</span>
          </span>
        </div>
      </div>

      {/* 14-Day Timeline Bar Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <h2 className="text-base font-bold text-white mb-1">14-Day Customer Scan Volume</h2>
        <p className="text-xs text-slate-400 mb-6">Daily redirect requests across all physical NFC + QR stands.</p>

        <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4 border-b border-slate-800 pb-2">
          {stats.timeline.map((item) => {
            const heightPercent = Math.max(10, Math.round((item.count / stats.maxDayCount) * 100));
            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all shadow-glow"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grid: Devices, Top Stands, Top Businesses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Categories */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Customer Device Category</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Android Phones</span>
                <span className="font-bold text-white">{stats.androidCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.androidCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Apple iOS (iPhones)</span>
                <span className="font-bold text-white">{stats.iosCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.iosCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Desktop / Other</span>
                <span className="font-bold text-white">{stats.desktopCount}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-slate-600 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.desktopCount / stats.total) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Stands */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Top Performing Stands</span>
          </h2>
          <div className="space-y-3">
            {stats.topStands.map((stand, i) => (
              <div key={stand.slug} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-mono font-bold text-white">/r/{stand.slug}</span>
                  {stand.label && <span className="text-slate-500 text-[11px] truncate max-w-[100px]">{stand.label}</span>}
                </div>
                <span className="font-extrabold text-emerald-400">{stand.count.toLocaleString()} visits</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Clients */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Top Performing Businesses</span>
          </h2>
          <div className="space-y-3">
            {stats.topBusinesses.map((biz, i) => (
              <div key={biz.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-200 truncate max-w-[140px]">{biz.name}</span>
                </div>
                <span className="font-extrabold text-teal-400">{biz.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

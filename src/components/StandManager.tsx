import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Download, 
  Edit, 
  Trash2, 
  Radio, 
  Eye, 
  ArrowUpDown, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Camera,
  Unlink,
  Link2,
  Power
} from 'lucide-react';
import type { Stand, Business, DestinationType } from '../types';
import { api } from '../services/api';
import { generateQRDataUrl } from '../utils/qr';
import { sounds } from '../utils/audio';

interface StandManagerProps {
  stands: Stand[];
  businesses: Business[];
  onRefreshStands: () => void;
  onEditStand: (stand: Stand) => void;
  onOpenPrintModal: (standsToPrint: Stand[]) => void;
  onOpenCustomerView: (stand: Stand) => void;
  domain: string;
  onOpenScanner?: () => void;
}

export const StandManager: React.FC<StandManagerProps> = ({
  stands,
  businesses,
  onRefreshStands,
  onEditStand,
  onOpenPrintModal,
  onOpenCustomerView,
  domain,
  onOpenScanner,
}) => {
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'assigned' | 'unassigned'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | DestinationType>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<'slug' | 'visitCount' | 'createdAt'>('slug');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Bulk Action State
  const [bulkActionTargetBiz, setBulkActionTargetBiz] = useState<string>('');
  const [bulkActionTargetType, setBulkActionTargetType] = useState<DestinationType>('REVIEW');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Compute Metrics Summary
  const metrics = useMemo(() => {
    const total = stands.length;
    const active = stands.filter(s => s.isActive).length;
    const inactive = stands.filter(s => !s.isActive).length;
    const assigned = stands.filter(s => !!s.businessId).length;
    const unassigned = stands.filter(s => !s.businessId).length;
    const reviews = stands.filter(s => s.destinationType === 'REVIEW').length;
    const menus = stands.filter(s => s.destinationType === 'MENU_HOSTED' || s.destinationType === 'MENU_EXTERNAL').length;
    const totalVisits = stands.reduce((sum, s) => sum + (s.visitCount || 0), 0);

    return { total, active, inactive, assigned, unassigned, reviews, menus, totalVisits };
  }, [stands]);

  // Filtered and Sorted Stands
  const filteredStands = useMemo(() => {
    return stands.filter((s) => {
      // Status filter
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      if (statusFilter === 'assigned' && !s.businessId) return false;
      if (statusFilter === 'unassigned' && !!s.businessId) return false;

      // Type filter
      if (typeFilter !== 'all' && s.destinationType !== typeFilter) return false;

      // Business filter
      if (businessFilter !== 'all' && s.businessId !== businessFilter) return false;

      // Search query filter (matches slug, label, business name, NFC UID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSlug = s.slug.toLowerCase().includes(q);
        const matchLabel = s.customLabel?.toLowerCase().includes(q);
        const matchBiz = s.businessName?.toLowerCase().includes(q);
        const matchNfc = s.nfcTagUid?.toLowerCase().includes(q);
        if (!matchSlug && !matchLabel && !matchBiz && !matchNfc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'slug') {
        const numA = parseInt(a.slug) || a.standNumber || 0;
        const numB = parseInt(b.slug) || b.standNumber || 0;
        return sortAsc ? numA - numB : numB - numA;
      }
      if (sortField === 'visitCount') {
        return sortAsc ? (a.visitCount - b.visitCount) : (b.visitCount - a.visitCount);
      }
      if (sortField === 'createdAt') {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortAsc ? tA - tB : tB - tA;
      }
      return 0;
    });
  }, [stands, statusFilter, typeFilter, businessFilter, searchQuery, sortField, sortAsc]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredStands.length / pageSize) || 1;
  const paginatedStands = filteredStands.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection Handlers
  const toggleSelectAll = () => {
    sounds.playTap();
    if (selectedIds.length === paginatedStands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStands.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    sounds.playTap();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 1-Click Quick Unlink Stand
  const handleQuickUnlink = async (stand: Stand) => {
    sounds.playTap();
    if (!window.confirm(`Unlink Stand #${stand.slug} from "${stand.businessName}"? It will return to available inventory.`)) return;
    
    await api.saveStand({
      ...stand,
      businessId: null,
      businessName: undefined,
      updatedAt: new Date().toISOString(),
    });
    onRefreshStands();
  };

  // 1-Click Quick Toggle Active
  const handleQuickToggleActive = async (stand: Stand) => {
    sounds.playTap();
    await api.saveStand({
      ...stand,
      isActive: !stand.isActive,
      updatedAt: new Date().toISOString(),
    });
    onRefreshStands();
  };

  // Bulk Operations
  const handleBulkActivate = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    setIsApplyingBulk(true);
    await api.bulkUpdateStands(selectedIds, { isActive: activate });
    setSelectedIds([]);
    setIsApplyingBulk(false);
    onRefreshStands();
  };

  const handleBulkAssignBusiness = async () => {
    if (selectedIds.length === 0 || !bulkActionTargetBiz) return;
    setIsApplyingBulk(true);
    const targetBiz = businesses.find(b => b.id === bulkActionTargetBiz);
    await api.bulkUpdateStands(selectedIds, {
      businessId: bulkActionTargetBiz,
      businessName: targetBiz?.name,
    });
    setSelectedIds([]);
    setBulkActionTargetBiz('');
    setIsApplyingBulk(false);
    onRefreshStands();
  };

  const handleBulkChangeType = async () => {
    if (selectedIds.length === 0) return;
    setIsApplyingBulk(true);
    await api.bulkUpdateStands(selectedIds, { destinationType: bulkActionTargetType });
    setSelectedIds([]);
    setIsApplyingBulk(false);
    onRefreshStands();
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(`Archive ${selectedIds.length} stands? This safely hides them from the active inventory.`);
    if (!confirm) return;

    setIsApplyingBulk(true);
    for (const id of selectedIds) {
      await api.archiveStand(id);
    }
    setSelectedIds([]);
    setIsApplyingBulk(false);
    onRefreshStands();
  };

  const handleCopyUrl = async (slug: string) => {
    sounds.playTap();
    const url = `https://${domain}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDownloadSingleQR = async (stand: Stand) => {
    sounds.playTap();
    const url = `https://${domain}/r/${stand.slug}`;
    const dataUrl = await generateQRDataUrl(url, { size: 600 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `stand_${stand.slug}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row (Milky Silk Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Stands', value: metrics.total, color: 'text-stone-900', bg: 'bg-white' },
          { label: 'Active', value: metrics.active, color: 'text-emerald-700', bg: 'bg-emerald-50/50' },
          { label: 'Inactive', value: metrics.inactive, color: 'text-rose-700', bg: 'bg-rose-50/50' },
          { label: 'Assigned', value: metrics.assigned, color: 'text-teal-700', bg: 'bg-teal-50/50' },
          { label: 'Unassigned', value: metrics.unassigned, color: 'text-[#B3801A]', bg: 'bg-amber-50/60' },
          { label: 'Review Stands', value: metrics.reviews, color: 'text-indigo-700', bg: 'bg-indigo-50/50' },
          { label: 'Menu Stands', value: metrics.menus, color: 'text-purple-700', bg: 'bg-purple-50/50' },
          { label: 'Total Visits', value: metrics.totalVisits.toLocaleString(), color: 'text-stone-900', bg: 'bg-amber-100/40' },
        ].map((m) => (
          <div key={m.label} className={`milky-card p-3.5 rounded-2xl border border-[#E8E2D5] ${m.bg}`}>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {m.label}
            </span>
            <span className={`text-xl font-extrabold ${m.color} mt-1 block`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter, Search & Scanner Action Bar */}
      <div className="milky-glass rounded-3xl p-5 border border-[#E8E2D5] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Stand ID, Label, Business or NFC UID..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 transition-all"
            />
          </div>

          {/* Quick Filter Selectors & Scan Shortcut */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scan QR Quick Trigger */}
            {onOpenScanner && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenScanner();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Stand QR</span>
              </button>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#C59B27]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Disabled</option>
              <option value="assigned">Assigned Only</option>
              <option value="unassigned">Unassigned (Stock)</option>
            </select>

            {/* Destination Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#C59B27]"
            >
              <option value="all">All Destination Types</option>
              <option value="REVIEW">Google Reviews</option>
              <option value="MENU_HOSTED">Hosted Digital Menu</option>
              <option value="MENU_EXTERNAL">External Menu URL</option>
              <option value="CUSTOM_URL">Custom URL</option>
            </select>

            {/* Business Filter */}
            <select
              value={businessFilter}
              onChange={(e) => {
                setBusinessFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#C59B27]"
            >
              <option value="all">All Businesses</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <span>{selectedIds.length} stands selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Assign Business */}
              <select
                value={bulkActionTargetBiz}
                onChange={(e) => setBulkActionTargetBiz(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-800 text-xs focus:outline-none"
              >
                <option value="">Assign to business...</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {bulkActionTargetBiz && (
                <button
                  onClick={handleBulkAssignBusiness}
                  disabled={isApplyingBulk}
                  className="px-3 py-1.5 rounded-lg bg-[#C59B27] text-white font-bold hover:brightness-105"
                >
                  Apply Assignment
                </button>
              )}

              {/* Bulk Change Destination */}
              <select
                value={bulkActionTargetType}
                onChange={(e) => setBulkActionTargetType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-800 text-xs focus:outline-none"
              >
                <option value="REVIEW">Set to Reviews</option>
                <option value="MENU_HOSTED">Set to Hosted Menu</option>
                <option value="MENU_EXTERNAL">Set to External Menu</option>
                <option value="CUSTOM_URL">Set to Custom URL</option>
              </select>
              <button
                onClick={handleBulkChangeType}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-800 font-semibold hover:bg-stone-300"
              >
                Change Type
              </button>

              {/* Activate / Deactivate */}
              <button
                onClick={() => handleBulkActivate(true)}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 border border-emerald-300"
              >
                Activate
              </button>

              <button
                onClick={() => handleBulkActivate(false)}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-semibold hover:bg-rose-200 border border-rose-300"
              >
                Deactivate
              </button>

              {/* Print Selected */}
              <button
                onClick={() => onOpenPrintModal(stands.filter(s => selectedIds.includes(s.id)))}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Selected</span>
              </button>

              {/* Bulk Archive */}
              <button
                onClick={handleBulkArchive}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5"
                title="Archive selected stands"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            RESPONSIVE VIEW 1: MOBILE TOUCH CARDS (< md)
            Optimized for phones: easy thumb reach, clear link/unlink
           ======================================================== */}
        <div className="block md:hidden space-y-3">
          {paginatedStands.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border border-[#E8E2D5]">
              <p className="text-sm font-bold text-stone-800 mb-1">No Stands Found</p>
              <p className="text-xs text-stone-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            paginatedStands.map((stand) => {
              const isSelected = selectedIds.includes(stand.id);
              const isCopied = copiedSlug === stand.slug;

              return (
                <div
                  key={stand.id}
                  className={`milky-card p-4 rounded-3xl border transition-all space-y-3 ${
                    isSelected ? 'border-[#C59B27] bg-amber-50/30' : 'border-[#E8E2D5] bg-white'
                  }`}
                >
                  {/* Top Row: Slug, Label, Active Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSelectRow(stand.id)} className="p-1 text-stone-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#B3801A]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-amber-300 font-mono font-bold text-xs shadow-sm">
                        /r/{stand.slug}
                      </span>

                      {stand.customLabel && (
                        <span className="text-xs font-bold text-stone-800 truncate max-w-[120px]">
                          {stand.customLabel}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleQuickToggleActive(stand)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                        stand.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-100 text-stone-600 border border-stone-300'
                      }`}
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{stand.isActive ? 'Active' : 'Paused'}</span>
                    </button>
                  </div>

                  {/* Middle Row: Assigned Business & Destination Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-[#F0EBE1]">
                    <div>
                      {stand.businessId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-400 text-[11px]">Linked:</span>
                          <strong className="text-stone-900 font-bold px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200">
                            {stand.businessName || 'Assigned'}
                          </strong>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                          Unassigned Stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
                        {stand.destinationType.replace('_', ' ')}
                      </span>
                      <span className="text-stone-400 text-[11px]">
                        Scans: <strong className="text-emerald-700 font-mono">{stand.visitCount || 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Quick Mobile Touch Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F0EBE1]">
                    <div className="flex items-center gap-1.5">
                      {/* Link / Unlink 1-click action */}
                      {stand.businessId ? (
                        <button
                          onClick={() => handleQuickUnlink(stand)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center gap-1 shadow-sm active:scale-95"
                          title="Unlink Stand"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Unlink</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onEditStand(stand)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-200 flex items-center gap-1 shadow-sm active:scale-95"
                          title="Link to Business"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Link Place</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenCustomerView(stand)}
                        className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD4C5] text-stone-700 hover:text-stone-900 active:scale-95"
                        title="Preview Customer Flow"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCopyUrl(stand.slug)}
                        className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD4C5] text-stone-700 hover:text-stone-900 active:scale-95"
                        title="Copy URL"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadSingleQR(stand)}
                        className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD4C5] text-stone-700 hover:text-stone-900 active:scale-95"
                        title="Download Stand QR"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditStand(stand)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================
            RESPONSIVE VIEW 2: DESKTOP MILKY TABLE (>= md)
           ======================================================== */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E8E2D5] bg-white shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-stone-500 border-b border-[#E8E2D5]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5 text-stone-400 hover:text-stone-800">
                    {selectedIds.length === paginatedStands.length && paginatedStands.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#B3801A]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => { setSortField('slug'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1.5">
                    <span>Stand Slug</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="p-3.5">Assigned Business</th>
                <th className="p-3.5">Destination Mode</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 cursor-pointer" onClick={() => { setSortField('visitCount'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1.5">
                    <span>Visits</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="p-3.5">NFC Hardware</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE1]">
              {paginatedStands.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500">
                    {stands.length === 0 ? (
                      <div>
                        <p className="text-sm font-bold text-stone-800 mb-1">No Smart Stands in Inventory Yet</p>
                        <p className="text-xs text-stone-500">Go to the QR Studio tab or scan your first physical stand code.</p>
                      </div>
                    ) : (
                      <span>No stands match your filters. Try clearing search or status filters.</span>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStands.map((stand) => {
                  const isSelected = selectedIds.includes(stand.id);
                  const isCopied = copiedSlug === stand.slug;

                  return (
                    <tr
                      key={stand.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelectRow(stand.id)} className="p-0.5 text-stone-400 hover:text-stone-800">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#B3801A]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Stand Slug & Permanent URL */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-stone-900 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-stone-900 text-amber-300 text-xs shadow-sm">
                            /r/{stand.slug}
                          </span>
                        </div>
                        {stand.customLabel && (
                          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
                            {stand.customLabel}
                          </div>
                        )}
                      </td>

                      {/* Assigned Business & Link / Unlink 1-click */}
                      <td className="p-3.5">
                        {stand.businessId ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">
                              {stand.businessName || 'Assigned Business'}
                            </span>
                            <button
                              onClick={() => handleQuickUnlink(stand)}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Unlink Stand from this Business"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#B3801A] text-[10px] font-bold uppercase">
                              Unassigned Stock
                            </span>
                            <button
                              onClick={() => onEditStand(stand)}
                              className="text-xs text-[#B3801A] hover:underline font-bold"
                              title="Link to Business"
                            >
                              + Link
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Destination Type & Override notice */}
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          stand.destinationType === 'REVIEW'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : stand.destinationType === 'MENU_HOSTED'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {stand.destinationType.replace('_', ' ')}
                        </span>
                        {stand.destinationUrlOverride && (
                          <div className="text-[10px] text-stone-400 truncate max-w-[140px] mt-0.5" title={stand.destinationUrlOverride}>
                            Override active
                          </div>
                        )}
                      </td>

                      {/* Status Active / Inactive */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleQuickToggleActive(stand)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            stand.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-stone-100 text-stone-600 border border-stone-300'
                          }`}
                          title="Click to toggle active status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stand.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'}`} />
                          <span>{stand.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Visit Count */}
                      <td className="p-3.5 font-bold font-mono text-stone-800">
                        {stand.visitCount.toLocaleString()}
                      </td>

                      {/* NFC Status */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Radio className={`w-3 h-3 ${
                            stand.nfcProgrammedStatus === 'VERIFIED'
                              ? 'text-emerald-600'
                              : stand.nfcProgrammedStatus === 'PROGRAMMED'
                              ? 'text-teal-600'
                              : 'text-stone-400'
                          }`} />
                          <span className="text-[11px] text-stone-600 capitalize font-medium">
                            {stand.nfcProgrammedStatus.toLowerCase()}
                          </span>
                        </div>
                        {stand.nfcTagUid && (
                          <div className="font-mono text-[9px] text-stone-400">
                            {stand.nfcTagUid}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Redirect / Customer View */}
                          <button
                            onClick={() => onOpenCustomerView(stand)}
                            className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-stone-200/60 text-stone-600 hover:text-stone-900 border border-[#DCD4C5]"
                            title="Test Landing Page & Redirect"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy URL */}
                          <button
                            onClick={() => handleCopyUrl(stand.slug)}
                            className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-stone-200/60 text-stone-600 hover:text-stone-900 border border-[#DCD4C5]"
                            title="Copy Permanent URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Download QR */}
                          <button
                            onClick={() => handleDownloadSingleQR(stand)}
                            className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-stone-200/60 text-stone-600 hover:text-stone-900 border border-[#DCD4C5]"
                            title="Download Stand QR Code"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Destination / Stand */}
                          <button
                            onClick={() => onEditStand(stand)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                            title="Edit Configuration"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 pt-2">
          <span>
            Showing {filteredStands.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredStands.length)} of {filteredStands.length} stands
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sounds.playTap();
                setCurrentPage(p => Math.max(1, p - 1));
              }}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl bg-white border border-[#DCD4C5] disabled:opacity-40 hover:text-stone-900 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-stone-900 bg-white border border-[#DCD4C5] rounded-xl shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                sounds.playTap();
                setCurrentPage(p => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl bg-white border border-[#DCD4C5] disabled:opacity-40 hover:text-stone-900 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

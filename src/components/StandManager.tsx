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
  ChevronRight
} from 'lucide-react';
import type { Stand, Business, DestinationType } from '../types';
import { api } from '../services/api';
import { generateQRDataUrl } from '../utils/qr';

interface StandManagerProps {
  stands: Stand[];
  businesses: Business[];
  onRefreshStands: () => void;
  onEditStand: (stand: Stand) => void;
  onOpenPrintModal: (standsToPrint: Stand[]) => void;
  onOpenCustomerView: (stand: Stand) => void;
  domain: string;
}

export const StandManager: React.FC<StandManagerProps> = ({
  stands,
  businesses,
  onRefreshStands,
  onEditStand,
  onOpenPrintModal,
  onOpenCustomerView,
  domain,
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

  // Bulk Action Drawer / Modal State
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
    if (selectedIds.length === paginatedStands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStands.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
    const confirm = window.confirm(`Are you sure you want to archive ${selectedIds.length} stands? This safely hides them from the active inventory.`);
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
    const url = `https://${domain}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDownloadSingleQR = async (stand: Stand) => {
    const url = `https://${domain}/r/${stand.slug}`;
    const dataUrl = await generateQRDataUrl(url, { size: 600 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `stand_${stand.slug}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Stands', value: metrics.total, color: 'text-white' },
          { label: 'Active', value: metrics.active, color: 'text-emerald-400' },
          { label: 'Inactive', value: metrics.inactive, color: 'text-rose-400' },
          { label: 'Assigned', value: metrics.assigned, color: 'text-teal-400' },
          { label: 'Unassigned', value: metrics.unassigned, color: 'text-amber-400' },
          { label: 'Review Stands', value: metrics.reviews, color: 'text-indigo-400' },
          { label: 'Menu Stands', value: metrics.menus, color: 'text-purple-400' },
          { label: 'Total Visits', value: metrics.totalVisits.toLocaleString(), color: 'text-emerald-400' },
        ].map((m) => (
          <div key={m.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {m.label}
            </span>
            <span className={`text-xl font-extrabold ${m.color} mt-1 block`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Stand ID, Label, Business or NFC UID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
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
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
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
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Businesses</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls Bar (visible when items selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <span>{selectedIds.length} stands selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Assign Business */}
              <select
                value={bulkActionTargetBiz}
                onChange={(e) => setBulkActionTargetBiz(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-lg text-slate-200 text-xs focus:outline-none"
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                >
                  Apply Assignment
                </button>
              )}

              {/* Bulk Change Destination */}
              <select
                value={bulkActionTargetType}
                onChange={(e) => setBulkActionTargetType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-lg text-slate-200 text-xs focus:outline-none"
              >
                <option value="REVIEW">Set to Reviews</option>
                <option value="MENU_HOSTED">Set to Hosted Menu</option>
                <option value="MENU_EXTERNAL">Set to External Menu</option>
                <option value="CUSTOM_URL">Set to Custom URL</option>
              </select>
              <button
                onClick={handleBulkChangeType}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700"
              >
                Change Type
              </button>

              {/* Activate / Deactivate */}
              <button
                onClick={() => handleBulkActivate(true)}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 border border-emerald-500/30"
              >
                Activate
              </button>

              <button
                onClick={() => handleBulkActivate(false)}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 font-semibold hover:bg-rose-500/30 border border-rose-500/30"
              >
                Deactivate
              </button>

              {/* Print Selected */}
              <button
                onClick={() => onOpenPrintModal(stands.filter(s => selectedIds.includes(s.id)))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Selected</span>
              </button>

              {/* Bulk Archive */}
              <button
                onClick={handleBulkArchive}
                disabled={isApplyingBulk}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-rose-400 font-semibold hover:bg-slate-700 flex items-center gap-1.5"
                title="Archive selected stands"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            </div>
          </div>
        )}

        {/* Stands Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-white">
                    {selectedIds.length === paginatedStands.length && paginatedStands.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => { setSortField('slug'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1.5">
                    <span>Stand Slug</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Assigned Business</th>
                <th className="p-3.5">Destination Mode</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 cursor-pointer" onClick={() => { setSortField('visitCount'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1.5">
                    <span>Visits</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">NFC Tag Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {paginatedStands.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    No stands match your filters. Try clearing search or status filters.
                  </td>
                </tr>
              ) : (
                paginatedStands.map((stand) => {
                  const isSelected = selectedIds.includes(stand.id);
                  const isCopied = copiedSlug === stand.slug;

                  return (
                    <tr
                      key={stand.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isSelected ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelectRow(stand.id)} className="p-0.5 text-slate-400 hover:text-white">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Stand Slug & Permanent URL */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                            /r/{stand.slug}
                          </span>
                        </div>
                        {stand.customLabel && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stand.customLabel}
                          </div>
                        )}
                      </td>

                      {/* Assigned Business */}
                      <td className="p-3.5">
                        {stand.businessId ? (
                          <div>
                            <span className="font-semibold text-slate-200">
                              {stand.businessName || 'Assigned Business'}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 text-[10px] font-semibold uppercase">
                            Unassigned Stock
                          </span>
                        )}
                      </td>

                      {/* Destination Type & Override notice */}
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          stand.destinationType === 'REVIEW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : stand.destinationType === 'MENU_HOSTED'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {stand.destinationType.replace('_', ' ')}
                        </span>
                        {stand.destinationUrlOverride && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5" title={stand.destinationUrlOverride}>
                            Override active
                          </div>
                        )}
                      </td>

                      {/* Status Active / Inactive */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          stand.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stand.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{stand.isActive ? 'Active' : 'Disabled'}</span>
                        </span>
                      </td>

                      {/* Visit Count */}
                      <td className="p-3.5 font-semibold text-slate-200">
                        {stand.visitCount.toLocaleString()}
                      </td>

                      {/* NFC Status */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Radio className={`w-3 h-3 ${
                            stand.nfcProgrammedStatus === 'VERIFIED'
                              ? 'text-emerald-400'
                              : stand.nfcProgrammedStatus === 'PROGRAMMED'
                              ? 'text-teal-400'
                              : 'text-slate-500'
                          }`} />
                          <span className="text-[11px] text-slate-400 capitalize">
                            {stand.nfcProgrammedStatus.toLowerCase()}
                          </span>
                        </div>
                        {stand.nfcTagUid && (
                          <div className="font-mono text-[9px] text-slate-500">
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
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Test Landing Page & Redirect"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy URL */}
                          <button
                            onClick={() => handleCopyUrl(stand.slug)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Copy Permanent URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Download QR */}
                          <button
                            onClick={() => handleDownloadSingleQR(stand)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Download Stand QR Code"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Destination / Stand */}
                          <button
                            onClick={() => onEditStand(stand)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
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
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Showing {filteredStands.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredStands.length)} of {filteredStands.length} stands
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

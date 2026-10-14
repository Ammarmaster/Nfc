import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  Edit3, 
  ExternalLink, 
  Trash2, 
  Layers, 
  UtensilsCrossed, 
  Phone, 
  MapPin, 
  Eye, 
  Search,
  Building2,
  Coffee,
  Sparkles,
  Scissors,
  ShoppingBag
} from 'lucide-react';
import type { Business, Stand, BusinessCategory } from '../types';
import { api } from '../services/api';

interface BusinessManagerProps {
  businesses: Business[];
  stands: Stand[];
  onRefreshBusinesses: () => void;
  onRefreshStands: () => void;
  onSelectBusinessStands: (businessId: string) => void;
  onPreviewCustomerReview: (business: Business) => void;
}

const CATEGORY_ICONS: Record<BusinessCategory, React.ElementType> = {
  Restaurant: UtensilsCrossed,
  Cafe: Coffee,
  Hotel: Building2,
  Bakery: Sparkles,
  Salon: Scissors,
  Retail: ShoppingBag,
  Other: Store,
};

export const BusinessManager: React.FC<BusinessManagerProps> = ({
  businesses,
  stands,
  onRefreshBusinesses,
  onRefreshStands,
  onSelectBusinessStands,
  onPreviewCustomerReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Restaurant');
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#059669');
  const [address, setAddress] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [digitalMenuUrl, setDigitalMenuUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingBusiness(null);
    setName('');
    setCategory('Restaurant');
    setOwnerName('');
    setContactPhone('');
    setContactEmail('');
    setLogoUrl('');
    setBrandColor('#059669');
    setAddress('');
    setGoogleReviewUrl('');
    setDigitalMenuUrl('');
    setWebsiteUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Business) => {
    setEditingBusiness(b);
    setName(b.name);
    setCategory(b.category);
    setOwnerName(b.ownerName || '');
    setContactPhone(b.contactPhone || '');
    setContactEmail(b.contactEmail || '');
    setLogoUrl(b.logoUrl || '');
    setBrandColor(b.brandColor || '#059669');
    setAddress(b.address || '');
    setGoogleReviewUrl(b.googleReviewUrl || '');
    setDigitalMenuUrl(b.digitalMenuUrl || '');
    setWebsiteUrl(b.websiteUrl || '');
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Business = {
      id: editingBusiness ? editingBusiness.id : `biz_${Date.now()}`,
      name: name.trim(),
      category,
      ownerName: ownerName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      brandColor,
      address: address.trim() || undefined,
      googleReviewUrl: googleReviewUrl.trim() || undefined,
      digitalMenuUrl: digitalMenuUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      isActive,
      createdAt: editingBusiness ? editingBusiness.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await api.saveBusiness(payload);
    setIsModalOpen(false);
    onRefreshBusinesses();
    onRefreshStands(); // Cascades name and review URLs to stands
  };

  const handleDelete = async (b: Business) => {
    const confirm = window.confirm(`Are you sure you want to delete ${b.name}? Associated stands will safely revert to Unassigned Stock.`);
    if (!confirm) return;

    await api.deleteBusiness(b.id);
    onRefreshBusinesses();
    onRefreshStands();
  };

  const filteredBusinesses = businesses.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || 
           b.category.toLowerCase().includes(q) || 
           b.ownerName?.toLowerCase().includes(q) ||
           b.address?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Business Directory & Destinations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage Indian client businesses. Updating a restaurant's Google Review URL or Menu URL automatically cascades to all its assigned smart review stands.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Business</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by restaurant name, owner, city..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((b) => {
          const CategoryIcon = CATEGORY_ICONS[b.category] || Store;
          const assignedStands = stands.filter(s => s.businessId === b.id);

          return (
            <div
              key={b.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: b.brandColor || '#059669' }}
              />

              <div>
                {/* Header with Logo & Badges */}
                <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                  <div className="flex items-center gap-3">
                    {b.logoUrl ? (
                      <img 
                        src={b.logoUrl} 
                        alt={b.name} 
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-sm shrink-0" 
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                        style={{ backgroundColor: b.brandColor || '#059669' }}
                      >
                        {b.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">
                        {b.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <CategoryIcon className="w-3 h-3 text-slate-400" />
                        <span>{b.category}</span>
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Address & Contacts */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  {b.address && (
                    <div className="flex items-start gap-1.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </div>
                  )}
                  {b.ownerName && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Contact:</span>
                      <span className="text-slate-300 font-medium">{b.ownerName}</span>
                    </div>
                  )}
                  {b.contactPhone && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{b.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Stands Pill */}
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-medium">Assigned Stands:</span>
                  </div>
                  <button
                    onClick={() => onSelectBusinessStands(b.id)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>{assignedStands.length} Stands</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Effective URLs Summary */}
                <div className="space-y-1.5 text-[11px] mb-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Google Review URL:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[150px]">
                      {b.googleReviewUrl ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Digital Menu URL:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[150px]">
                      {b.digitalMenuUrl ? 'Configured' : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onPreviewCustomerReview(b)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Preview Customer Review Experience"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview Page</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Business Details & URLs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(b)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                    title="Delete Business"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingBusiness ? 'Edit Business Configuration' : 'Register New Business'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Spice Route Biryani"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Salon">Salon</option>
                    <option value="Retail">Retail Store</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner / Manager Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone (Private)</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98201 12345"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Cyber Hub, DLF Phase 2, Gurugram"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* URLs Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Google Review URL (Critical)
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    All review stands assigned to this business will automatically open this link.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">External Digital Menu URL (Optional)</label>
                  <input
                    type="url"
                    value={digitalMenuUrl}
                    onChange={(e) => setDigitalMenuUrl(e.target.value)}
                    placeholder="https://restaurant.com/menu or PDF link"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Branding Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Logo URL (Square image)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand Accent Color</label>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full bg-transparent font-mono text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Active Account Status</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-glow"
                >
                  {editingBusiness ? 'Save Changes' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

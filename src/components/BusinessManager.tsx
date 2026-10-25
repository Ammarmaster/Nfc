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
  ShoppingBag,
  X
} from 'lucide-react';
import type { Business, Stand, BusinessCategory } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

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
  const [brandColor, setBrandColor] = useState('#B3801A');
  const [address, setAddress] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [digitalMenuUrl, setDigitalMenuUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    sounds.playTap();
    setEditingBusiness(null);
    setName('');
    setCategory('Restaurant');
    setOwnerName('');
    setContactPhone('');
    setContactEmail('');
    setLogoUrl('');
    setBrandColor('#B3801A');
    setAddress('');
    setGoogleReviewUrl('');
    setDigitalMenuUrl('');
    setWebsiteUrl('');
    setInstagramUrl('');
    setWhatsappUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Business) => {
    sounds.playTap();
    setEditingBusiness(b);
    setName(b.name);
    setCategory(b.category);
    setOwnerName(b.ownerName || '');
    setContactPhone(b.contactPhone || '');
    setContactEmail(b.contactEmail || '');
    setLogoUrl(b.logoUrl || '');
    setBrandColor(b.brandColor || '#B3801A');
    setAddress(b.address || '');
    setGoogleReviewUrl(b.googleReviewUrl || '');
    setDigitalMenuUrl(b.digitalMenuUrl || '');
    setWebsiteUrl(b.websiteUrl || '');
    setInstagramUrl(b.instagramUrl || '');
    setWhatsappUrl(b.whatsappUrl || '');
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sounds.playTap();

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
      instagramUrl: instagramUrl.trim() || undefined,
      whatsappUrl: whatsappUrl.trim() || undefined,
      isActive,
      createdAt: editingBusiness ? editingBusiness.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await api.saveBusiness(payload);
    setIsModalOpen(false);
    onRefreshBusinesses();
    onRefreshStands();
  };

  const handleDelete = async (b: Business) => {
    sounds.playTap();
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
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 milky-glass border border-[#E8E2D5] rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Client Businesses & Places
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            Configure restaurant profiles. Updating a client's Google Review URL or Menu URL automatically cascades to all its assigned physical stands.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Business</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by restaurant name, owner, city..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 transition-all shadow-sm"
        />
      </div>

      {/* Businesses Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="milky-card p-12 text-center rounded-3xl border border-[#E8E2D5] bg-white shadow-sm">
          <Store className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900 mb-1">No Businesses Registered Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
            Register your first client restaurant, cafe, hotel, or retail store to link smart NFC + QR review stands.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 text-xs font-extrabold shadow-md hover:brightness-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Business</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((b) => {
            const CategoryIcon = CATEGORY_ICONS[b.category] || Store;
            const assignedStands = stands.filter(s => s.businessId === b.id);

            return (
              <div
                key={b.id}
                className="milky-card rounded-3xl p-6 border border-[#E8E2D5] bg-white flex flex-col justify-between hover:border-[#D4AF37] transition-all shadow-sm group relative overflow-hidden"
              >
                {/* Top Accent Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: b.brandColor || '#B3801A' }}
                />

                <div>
                  {/* Header with Logo & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                    <div className="flex items-center gap-3">
                      {b.logoUrl ? (
                        <img 
                          src={b.logoUrl} 
                          alt={b.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-[#E8E2D5] shadow-sm shrink-0" 
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0"
                          style={{ backgroundColor: b.brandColor || '#B3801A' }}
                        >
                          {b.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold text-stone-900 leading-tight">
                          {b.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <CategoryIcon className="w-3 h-3 text-[#B3801A]" />
                          <span>{b.category}</span>
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Address & Contacts */}
                  <div className="space-y-1.5 text-xs text-stone-500 mb-4">
                    {b.address && (
                      <div className="flex items-start gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </div>
                    )}
                    {b.ownerName && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">Contact:</span>
                        <span className="text-stone-800 font-semibold">{b.ownerName}</span>
                      </div>
                    )}
                    {b.contactPhone && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{b.contactPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Stands Pill */}
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5] mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#B3801A]" />
                      <span className="text-xs font-semibold text-stone-700">Linked Stands:</span>
                    </div>
                    <button
                      onClick={() => onSelectBusinessStands(b.id)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#DCD4C5] text-xs font-bold text-stone-900 hover:border-[#B3801A] transition-colors shadow-sm"
                    >
                      {assignedStands.length} Stands
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-[#EFEAE1] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Preview Customer Flow */}
                    <button
                      onClick={() => onPreviewCustomerReview(b)}
                      className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-[#DCD4C5] transition-colors"
                      title="Test Customer Landing"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Open Google Review directly */}
                    {b.googleReviewUrl && (
                      <a
                        href={b.googleReviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-[#DCD4C5] transition-colors"
                        title="Open Direct Google Review URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 border border-[#DCD4C5] transition-colors"
                      title="Edit Business"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(b)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      title="Delete Business"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Business Modal (Milky Drawer) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl my-0 sm:my-8 transition-all">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEAE1]">
              <h2 className="text-lg font-bold text-stone-900">
                {editingBusiness ? `Edit ${editingBusiness.name}` : 'Register New Business'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Spice Route Biryani"
                    className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                    className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-medium focus:outline-none focus:border-[#C59B27]"
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
                  <label className="block text-stone-700 font-bold mb-1">Owner / Manager Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98201 12345"
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Cyber Hub, DLF Phase 2, Gurugram"
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {/* URLs Section */}
              <div className="space-y-3 pt-2 border-t border-[#EFEAE1]">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Google Review URL (Critical)
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-mono text-[11px] focus:outline-none focus:border-[#C59B27]"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    All review stands assigned to this business will automatically open this link.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">External Digital Menu URL (Optional)</label>
                  <input
                    type="url"
                    value={digitalMenuUrl}
                    onChange={(e) => setDigitalMenuUrl(e.target.value)}
                    placeholder="https://restaurant.com/menu or PDF link"
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-mono text-[11px] focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Instagram Link or @Handle</label>
                    <input
                      type="text"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/... or @handle"
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-mono text-[11px] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">WhatsApp Contact (Optional)</label>
                    <input
                      type="text"
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                      placeholder="+91 98201 12345 or https://wa.me/..."
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-mono text-[11px] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
              </div>

              {/* Branding Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EFEAE1]">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Logo URL (Square image)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Brand Accent Color</label>
                  <div className="flex items-center gap-2 p-1 bg-white border border-[#DCD4C5] rounded-xl">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-none cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full bg-transparent font-mono text-stone-900 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-700 font-bold">Active Account Status</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#EFEAE1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 font-semibold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold shadow-md hover:brightness-105 active:scale-95"
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

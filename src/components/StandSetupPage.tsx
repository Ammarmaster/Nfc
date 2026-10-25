import React, { useState } from 'react';
import { 
  Sparkles, 
  Store, 
  Star, 
  UtensilsCrossed, 
  Globe, 
  MessageSquare, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Radio, 
  Layers,
  Info
} from 'lucide-react';
import { InstagramIcon } from './icons';
import type { Stand, Business, BusinessCategory } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface StandSetupPageProps {
  slug: string;
  stand?: Stand | null;
  existingBusiness?: Business | null;
  businesses?: Business[];
  onSaved: (stand: Stand, business: Business) => void;
  onCancel?: () => void;
}

export const StandSetupPage: React.FC<StandSetupPageProps> = ({
  slug,
  stand,
  existingBusiness,
  businesses = [],
  onSaved,
  onCancel,
}) => {
  // If an existing business was passed or selected
  const [selectedExistingBizId, setSelectedExistingBizId] = useState<string>(existingBusiness?.id || '');
  
  // Form fields
  const [name, setName] = useState(existingBusiness?.name || (stand?.customLabel ? stand.customLabel : ''));
  const [category, setCategory] = useState<BusinessCategory>(existingBusiness?.category || 'Restaurant');
  const [customLabel, setCustomLabel] = useState(stand?.customLabel || `Stand #${slug}`);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(existingBusiness?.googleReviewUrl || '');
  const [digitalMenuUrl, setDigitalMenuUrl] = useState(existingBusiness?.digitalMenuUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(existingBusiness?.instagramUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(existingBusiness?.websiteUrl || '');
  const [whatsappUrl, setWhatsappUrl] = useState(existingBusiness?.whatsappUrl || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When selecting an existing business from dropdown
  const handleSelectExistingBusiness = (bizId: string) => {
    sounds.playTap();
    setSelectedExistingBizId(bizId);
    if (!bizId) return;

    const found = businesses.find(b => b.id === bizId);
    if (found) {
      setName(found.name);
      setCategory(found.category);
      setGoogleReviewUrl(found.googleReviewUrl || '');
      setDigitalMenuUrl(found.digitalMenuUrl || '');
      setInstagramUrl(found.instagramUrl || '');
      setWebsiteUrl(found.websiteUrl || '');
      setWhatsappUrl(found.whatsappUrl || '');
    }
  };

  const cleanInstagramInput = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const handle = trimmed.replace(/^@/, '');
    return `https://instagram.com/${handle}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a business or restaurant name.');
      return;
    }

    if (!googleReviewUrl.trim() && !digitalMenuUrl.trim() && !instagramUrl.trim()) {
      setErrorMsg('Please provide at least one link (Google Review, Menu, or Instagram).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    sounds.playTap();

    try {
      const now = new Date().toISOString();
      const bizId = selectedExistingBizId || existingBusiness?.id || `biz_${Date.now()}`;
      
      const formattedInstagram = cleanInstagramInput(instagramUrl);

      // 1. Save / Update Business
      const businessPayload: Business = {
        id: bizId,
        name: name.trim(),
        category,
        googleReviewUrl: googleReviewUrl.trim() || undefined,
        digitalMenuUrl: digitalMenuUrl.trim() || undefined,
        instagramUrl: formattedInstagram || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        whatsappUrl: whatsappUrl.trim() || undefined,
        isActive: true,
        createdAt: existingBusiness?.createdAt || now,
        updatedAt: now,
      };

      const savedBiz = await api.saveBusiness(businessPayload);

      // 2. Save / Update Stand
      const parsedNum = parseInt(slug.replace(/\D/g, '')) || 1;
      const standId = stand?.id || `std_${Date.now()}_${slug}`;

      const standPayload: Stand = {
        id: standId,
        slug,
        standNumber: stand?.standNumber || parsedNum,
        customLabel: customLabel.trim() || `Stand ${slug}`,
        businessId: savedBiz.id,
        businessName: savedBiz.name,
        destinationType: 'MULTI_LINK',
        isActive: true,
        isArchived: false,
        nfcProgrammedStatus: stand?.nfcProgrammedStatus || 'PENDING',
        visitCount: stand?.visitCount || 0,
        createdAt: stand?.createdAt || now,
        updatedAt: now,
      };

      const savedStand = await api.saveStand(standPayload);

      sounds.playScanSuccess();
      onSaved(savedStand, savedBiz);
    } catch (err: any) {
      console.error('Error saving stand setup:', err);
      setErrorMsg(err.message || 'Failed to save configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-start p-4 sm:p-6 pb-24">
      {/* Top Banner Indicator */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D5] shadow-sm">
          <QrCode className="w-3.5 h-3.5 text-[#B3801A]" />
          <span className="font-semibold text-stone-700">Physical Stand Setup</span>
        </div>
        <span className="font-mono text-stone-900 font-bold bg-white px-3 py-1 rounded-full border border-[#E8E2D5] shadow-sm">
          Stand #{slug}
        </span>
      </div>

      <div className="w-full max-w-xl bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Top Gold Ambient Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27]" />

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B3801A] shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B3801A]" />
            <span>Smart Stand Configuration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Configure Your Smart Stand
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-md mx-auto">
            This QR code & NFC stand is currently unassigned. Add your Google Review, Menu, and Instagram links below. When anyone scans this QR in the future, your custom link portal will open instantly!
          </p>
        </div>

        {/* Existing Business Selector (If available) */}
        {businesses.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5]">
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#B3801A]" />
                <span>Link to an Existing Business Profile</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">Optional</span>
            </label>
            <select
              value={selectedExistingBizId}
              onChange={(e) => handleSelectExistingBusiness(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-[#C59B27]"
            >
              <option value="">-- Create or Type New Business Below --</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Restaurant / Business Name *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Bistro & Cafe"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#C59B27] transition-all"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Bakery">Bakery</option>
                <option value="Hotel">Hotel</option>
                <option value="Salon">Salon</option>
                <option value="Retail">Retail Store</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Stand Label */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Table / Stand Label
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Table 01, Main Counter, Bar 2"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-all"
            />
          </div>

          {/* SECTION: DESTINATION LINKS */}
          <div className="pt-2 border-t border-[#EFEAE1] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#B3801A]" />
                <span>Destination Links</span>
              </span>
              <span className="text-[11px] text-[#B3801A] font-semibold">
                Will appear on Customer Scan Hub
              </span>
            </div>

            {/* Link 1: Google Review Link */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>1. Google Review URL</span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                  AI Generator Enabled
                </span>
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=... or https://g.page/r/..."
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-all"
              />
              <p className="text-[11px] text-stone-500">
                When clicked by customers, our AI will generate 3-4 glowing review drafts that they can slide through and copy in 1 tap directly into Google!
              </p>
            </div>

            {/* Link 2: Digital Menu Link */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <span>2. Digital Menu Link</span>
              </label>
              <input
                type="url"
                value={digitalMenuUrl}
                onChange={(e) => setDigitalMenuUrl(e.target.value)}
                placeholder="https://yourrestaurant.com/menu or PDF menu link or Swiggy/Zomato menu"
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-all"
              />
            </div>

            {/* Link 3: Instagram Link */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <InstagramIcon className="w-4 h-4 text-pink-600" />
                <span>3. Instagram Profile / Handle</span>
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="e.g. @yourrestaurant or https://instagram.com/yourrestaurant"
                className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-all"
              />
            </div>

            {/* Link 4 & 5: Website & WhatsApp (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-stone-700 mb-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Website URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-stone-700 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Contact (Optional)</span>
                </label>
                <input
                  type="text"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="+91 ... or https://wa.me/..."
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>
          </div>

          {/* Permanent URL Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-stone-600 text-xs">
            <span className="font-bold text-stone-900 block mb-0.5">Permanent URL Guarantee</span>
            Physical QR Code URL <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-stone-800">/r/{slug}</code> remains permanent. You can modify these destination links anytime without reprinting!
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border border-[#DCD4C5] text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors"
              >
                Back to Dashboard
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27] text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving Configuration...' : 'Save & Activate Stand'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

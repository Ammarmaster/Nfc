import React from 'react';
import { 
  Star, 
  UtensilsCrossed, 
  Globe, 
  MessageSquare, 
  Sparkles, 
  ExternalLink, 
  Radio, 
  ShieldCheck, 
  Settings2, 
  ArrowRight,
  Share2
} from 'lucide-react';
import { InstagramIcon } from './icons';
import type { Stand, Business } from '../types';
import { sounds } from '../utils/audio';

interface CustomerHubPageProps {
  stand: Stand;
  business?: Business;
  isNfc?: boolean;
  onSelectGoogleReview: () => void;
  onNavigateHome?: () => void;
  onEditLinks?: () => void;
}

export const CustomerHubPage: React.FC<CustomerHubPageProps> = ({
  stand,
  business,
  isNfc,
  onSelectGoogleReview,
  onNavigateHome,
  onEditLinks,
}) => {
  const businessName = business?.name || stand.businessName || 'Hospitality Partner';
  const category = business?.category || 'Restaurant';

  const handleOpenLink = (url: string) => {
    sounds.playTap();
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenReview = () => {
    sounds.playTap();
    onSelectGoogleReview();
  };

  const handleShare = async () => {
    sounds.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Check out ${businessName} on TapReview!`,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-start p-4 sm:p-6 pb-24">
      {/* Top Banner Indicator */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D5] shadow-sm">
          <Radio className={`w-3.5 h-3.5 ${isNfc ? 'text-emerald-600 animate-pulse' : 'text-[#B3801A]'}`} />
          <span className="font-semibold text-stone-700">
            {isNfc ? 'Connected via NFC Tap' : 'Connected via QR Scan'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full bg-white border border-[#E8E2D5] text-stone-600 hover:text-stone-900 shadow-sm"
            title="Share this page"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-stone-700 font-bold bg-white px-2.5 py-0.5 rounded-full border border-[#E8E2D5] shadow-sm">
            Stand #{stand.slug}
          </span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Top Gold Ambient Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27]" />

        {/* Business Branding Header */}
        <div className="text-center mb-6 pt-2">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={businessName} 
              className="w-20 h-20 rounded-2xl mx-auto object-cover border border-[#E8E2D5] shadow-md mb-3"
            />
          ) : (
            <div 
              className="w-20 h-20 rounded-2xl mx-auto bg-gradient-to-tr from-[#D4AF37] to-[#C59B27] flex items-center justify-center text-stone-950 text-3xl font-black shadow-md mb-3"
            >
              {businessName.charAt(0)}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Smart Stand</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {businessName}
          </h1>

          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto line-clamp-1">
            {business?.address || `${category} • Welcome! Please choose an option below.`}
          </p>
        </div>

        {/* ACTION LINKS LIST */}
        <div className="space-y-3.5">
          {/* 1. Google Review Assistant Card (Featured Hero Card) */}
          <button
            type="button"
            onClick={handleOpenReview}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-[#D4AF37] hover:border-[#B3801A] shadow-md hover:shadow-lg transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C59B27] flex items-center justify-center text-stone-950 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <Star className="w-6 h-6 fill-stone-950 text-stone-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-black text-stone-900 text-sm sm:text-base">
                      Leave a Google Review
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-[#B3801A] font-bold text-[10px] uppercase tracking-wider">
                      AI Assist
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-1">
                    Slide to choose from 4 reviews & copy in 1-tap!
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] font-bold text-[#B3801A] ml-1">
                      Official Review Portal
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[#B3801A] shrink-0 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>

          {/* 2. Digital Menu Card */}
          {business?.digitalMenuUrl && (
            <button
              type="button"
              onClick={() => handleOpenLink(business.digitalMenuUrl!)}
              className="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] hover:bg-stone-50 border border-[#E8E2D5] hover:border-[#C59B27] shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    View Digital Menu
                  </h3>
                  <p className="text-xs text-stone-500">
                    Browse food, beverages & chef specials
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
            </button>
          )}

          {/* 3. Instagram Card */}
          {business?.instagramUrl && (
            <button
              type="button"
              onClick={() => handleOpenLink(business.instagramUrl!)}
              className="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] hover:bg-stone-50 border border-[#E8E2D5] hover:border-[#C59B27] shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0 group-hover:scale-105 transition-transform">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Follow on Instagram
                  </h3>
                  <p className="text-xs text-stone-500">
                    Tag us in your stories & photos
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
            </button>
          )}

          {/* 4. Official Website Card */}
          {business?.websiteUrl && (
            <button
              type="button"
              onClick={() => handleOpenLink(business.websiteUrl!)}
              className="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] hover:bg-stone-50 border border-[#E8E2D5] hover:border-[#C59B27] shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Visit Official Website
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reservations, story & info
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
            </button>
          )}

          {/* 5. WhatsApp Contact Card */}
          {business?.whatsappUrl && (
            <button
              type="button"
              onClick={() => {
                let wa = business.whatsappUrl!;
                if (!wa.startsWith('http://') && !wa.startsWith('https://')) {
                  const cleaned = wa.replace(/\D/g, '');
                  wa = `https://wa.me/${cleaned}`;
                }
                handleOpenLink(wa);
              }}
              className="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] hover:bg-stone-50 border border-[#E8E2D5] hover:border-[#C59B27] shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Chat on WhatsApp
                  </h3>
                  <p className="text-xs text-stone-500">
                    Quick inquiries & direct contact
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
            </button>
          )}
        </div>

        {/* Manage Links CTA (For Owners / Staff) */}
        {onEditLinks && (
          <div className="mt-6 pt-5 border-t border-[#EFEAE1] text-center">
            <button
              type="button"
              onClick={onEditLinks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD4C5] text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all shadow-sm"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#B3801A]" />
              <span>Manager Settings: Edit Stand Links</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 text-center text-[11px] text-stone-400">
          Powered by <strong className="text-stone-700 font-extrabold">TapReview</strong> Smart Stand
        </div>
      </div>
    </div>
  );
};

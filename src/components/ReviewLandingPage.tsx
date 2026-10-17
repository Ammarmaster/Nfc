import React, { useState } from 'react';
import { 
  Star, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Utensils, 
  HeartHandshake, 
  Clock, 
  Sparkle, 
  Award, 
  Edit3, 
  Radio
} from 'lucide-react';
import type { Stand, Business } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface ReviewLandingPageProps {
  stand: Stand;
  business?: Business;
  isNfc?: boolean;
}

const EXPERIENCE_TAGS = [
  { id: 'Delicious Food', label: 'Delicious Food', icon: Utensils },
  { id: 'Courteous Staff', label: 'Courteous Staff', icon: HeartHandshake },
  { id: 'Quick Service', label: 'Quick Service', icon: Clock },
  { id: 'Wonderful Ambience', label: 'Wonderful Ambience', icon: Sparkle },
  { id: 'Clean & Hygienic', label: 'Clean & Hygienic', icon: ShieldCheck },
  { id: 'Great Value', label: 'Great Value', icon: Award },
];

export const ReviewLandingPage: React.FC<ReviewLandingPageProps> = ({ stand, business, isNfc }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(['Delicious Food', 'Courteous Staff']);
  const [customerNotes, setCustomerNotes] = useState('');
  const [tone, setTone] = useState<'warm' | 'enthusiastic' | 'professional' | 'brief'>('warm');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftSource, setDraftSource] = useState<'ai' | 'template' | null>(null);
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const businessName = business?.name || 'Hospitality Partner';
  const targetGoogleUrl = stand.destinationUrlOverride || business?.googleReviewUrl || 'https://search.google.com';

  const toggleTag = (tag: string) => {
    sounds.playTap();
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateDrafts = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateReviewDrafts({
        businessName,
        category: business?.category || 'Restaurant',
        experienceTags: selectedTags,
        customerNotes: customerNotes.trim(),
        tone,
      });

      setDrafts(res.drafts);
      setDraftSource(res.source);
      setSelectedDraftIndex(0);
      setCustomText(res.drafts[0] || '');
      setIsEditingDraft(false);
    } catch (err) {
      console.error('Failed to generate review drafts:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    handleGenerateDrafts();
  }, []);

  const handleCopyReview = async (textToCopy: string) => {
    sounds.playScanSuccess();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenGoogle = () => {
    sounds.playTap();
    const textToCopy = isEditingDraft ? customText : (drafts[selectedDraftIndex] || customText);
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    window.open(targetGoogleUrl, '_blank', 'noopener,noreferrer');
  };

  const currentActiveText = isEditingDraft ? customText : (drafts[selectedDraftIndex] || customText);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-start p-4 sm:p-6 pb-20">
      {/* Top Banner & Stand Chip Indicator */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D5] shadow-sm">
          <Radio className={`w-3.5 h-3.5 ${isNfc ? 'text-emerald-600 animate-pulse' : 'text-[#B3801A]'}`} />
          <span className="font-semibold text-stone-700">{isNfc ? 'Connected via NFC Tap' : 'Connected via QR Code'}</span>
        </div>
        <span className="font-mono text-stone-500 font-bold bg-white px-2.5 py-0.5 rounded-full border border-[#E8E2D5]">
          Stand #{stand.slug}
        </span>
      </div>

      <div className="w-full max-w-lg milky-card rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8E2D5] bg-white relative">
        {/* Business Branding Header */}
        <div className="text-center mb-6">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={businessName} 
              className="w-20 h-20 rounded-2xl mx-auto object-cover border border-[#E8E2D5] shadow-md mb-3"
            />
          ) : (
            <div 
              className="w-20 h-20 rounded-2xl mx-auto bg-gradient-to-tr from-[#D4AF37] to-[#C59B27] flex items-center justify-center text-stone-950 text-2xl font-black shadow-md mb-3"
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

          {business?.address && (
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto line-clamp-1">
              {business.address}
            </p>
          )}

          {/* Star rating illustration */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-bold text-[#B3801A] ml-1.5">Official Google Reviews</span>
          </div>
        </div>

        {/* STEP 1: Authentic Experience Highlights */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
            Step 1: What did you enjoy about your visit?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE_TAGS.map((tag) => {
              const Icon = tag.icon;
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-amber-100 border-[#C59B27] text-stone-900 shadow-sm'
                      : 'bg-[#FAF8F5] border-[#E8E2D5] text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#B3801A]' : 'text-stone-400'}`} />
                  <span className="truncate">{tag.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional customer notes */}
          <div className="mt-3">
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Mention specific dishes or staff name (optional)..."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DCD4C5] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-colors"
            />
          </div>
        </div>

        {/* STEP 2: Tone Selection & Draft Generator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B3801A]" />
              <span>Step 2: AI Review Assistant</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-stone-500 font-semibold">
              <span>Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-white border border-[#DCD4C5] rounded-lg px-2 py-0.5 text-xs text-stone-800 focus:outline-none"
              >
                <option value="warm">Warm</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="professional">Professional</option>
                <option value="brief">Brief</option>
              </select>
            </div>
          </div>

          {/* Draft variations selector tabs */}
          {drafts.length > 0 && !isEditingDraft && (
            <div className="flex gap-1.5 mb-2.5">
              {drafts.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedDraftIndex(idx);
                    setCustomText(drafts[idx]);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDraftIndex === idx
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 shadow-sm'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-[#E8E2D5]'
                  }`}
                >
                  Draft {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Draft text display or editable box */}
          <div className="relative">
            {isEditingDraft ? (
              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Write your personal review experience..."
                className="w-full p-3.5 bg-[#FAF8F5] border border-[#C59B27] rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none leading-relaxed"
              />
            ) : (
              <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl min-h-[96px] text-xs sm:text-sm text-stone-800 leading-relaxed italic relative">
                "{currentActiveText}"
                {draftSource && (
                  <span className="absolute bottom-2 right-2 text-[10px] text-stone-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#B3801A]" />
                    {draftSource === 'ai' ? 'AI Grounded Draft' : 'Smart Template Draft'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Secondary Draft actions: Regenerate & Edit toggle */}
          <div className="flex items-center justify-between mt-2.5 text-xs text-stone-500 font-semibold">
            <button
              type="button"
              onClick={handleGenerateDrafts}
              disabled={isGenerating}
              className="inline-flex items-center gap-1 text-[#B3801A] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate drafts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                if (!isEditingDraft) {
                  setCustomText(currentActiveText);
                }
                setIsEditingDraft(!isEditingDraft);
              }}
              className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingDraft ? 'Done editing' : 'Edit text / Write own'}</span>
            </button>
          </div>
        </div>

        {/* STEP 3 & 4: Actions to Copy and Continue to Google Reviews */}
        <div className="space-y-3">
          {/* Copy Button */}
          <button
            type="button"
            onClick={() => handleCopyReview(currentActiveText)}
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#FAF8F5] hover:bg-stone-100 text-stone-800 border border-[#DCD4C5] shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Review Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#B3801A]" />
                <span>1. Copy Review Text</span>
              </>
            )}
          </button>

          {/* Continue to Google Reviews Action Button */}
          <button
            type="button"
            onClick={handleOpenGoogle}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27] text-stone-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <span>2. Open Google Reviews</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Google Reviews Policy Notice */}
        <div className="mt-6 pt-5 border-t border-[#EFEAE1] text-[11px] text-stone-500 leading-normal">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span>
              <strong>Google Review Policy Compliance:</strong> You have complete freedom to share any genuine experience (positive, neutral, or critical). Reviews are manually reviewed, edited, and submitted by you directly on Google's interface. TapReview does not publish on your behalf.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

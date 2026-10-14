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

  const businessName = business?.name || 'Local Hospitality Partner';
  const targetGoogleUrl = stand.destinationUrlOverride || business?.googleReviewUrl || 'https://search.google.com';

  const toggleTag = (tag: string) => {
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

  // Generate initial draft on mount if none yet
  React.useEffect(() => {
    handleGenerateDrafts();
  }, []);

  const handleCopyReview = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenGoogle = () => {
    const textToCopy = isEditingDraft ? customText : (drafts[selectedDraftIndex] || customText);
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    window.open(targetGoogleUrl, '_blank', 'noopener,noreferrer');
  };

  const currentActiveText = isEditingDraft ? customText : (drafts[selectedDraftIndex] || customText);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 pb-20">
      {/* Top Banner & Physical Stand Chip Indicator */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <Radio className={`w-3.5 h-3.5 ${isNfc ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{isNfc ? 'Connected via NFC Tap' : 'Connected via QR Code'}</span>
        </div>
        <span className="text-slate-500">Stand #{stand.slug}</span>
      </div>

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Business Branding Header */}
        <div className="text-center mb-6">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={businessName} 
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-emerald-500/30 shadow-lg mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl mx-auto bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
              {businessName.charAt(0)}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Smart Stand</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {businessName}
          </h1>

          {business?.address && (
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto line-clamp-1">
              {business.address}
            </p>
          )}

          {/* Star rating illustration */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-medium text-amber-300 ml-1.5">Official Google Reviews</span>
          </div>
        </div>

        {/* STEP 1: Authentic Experience Highlights */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
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
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
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
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* STEP 2: Tone Selection & Draft Generator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Step 2: AI Review Draft Assistant
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
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
                    setSelectedDraftIndex(idx);
                    setCustomText(drafts[idx]);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDraftIndex === idx
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
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
                className="w-full p-3.5 bg-slate-950/80 border border-emerald-500/50 rounded-2xl text-xs sm:text-sm text-slate-200 focus:outline-none leading-relaxed"
              />
            ) : (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl min-h-[96px] text-xs sm:text-sm text-slate-300 leading-relaxed italic relative">
                "{currentActiveText}"
                {draftSource && (
                  <span className="absolute bottom-2 right-2 text-[10px] text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    {draftSource === 'ai' ? 'AI Grounded Draft' : 'Smart Template Draft'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Secondary Draft actions: Regenerate & Edit toggle */}
          <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400">
            <button
              type="button"
              onClick={handleGenerateDrafts}
              disabled={isGenerating}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate drafts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isEditingDraft) {
                  setCustomText(currentActiveText);
                }
                setIsEditingDraft(!isEditingDraft);
              }}
              className="inline-flex items-center gap-1 hover:text-slate-200"
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
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-500 text-white shadow-glow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Review Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>1. Copy Review Text</span>
              </>
            )}
          </button>

          {/* Continue to Google Reviews Action Button */}
          <button
            type="button"
            onClick={handleOpenGoogle}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.99]"
          >
            <span>2. Continue to Google Reviews</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Google Reviews Policy & Transparent Feedback Disclosure */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-500 leading-normal">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Google Review Policy Compliance:</strong> You have complete freedom to share any genuine experience (positive, neutral, or critical). Reviews are manually reviewed, edited, and submitted by you directly on Google's interface. TapReview does not filter reviews or publish on your behalf.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

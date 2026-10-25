import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Edit3, 
  Quote
} from 'lucide-react';
import type { Stand, Business } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface ReviewSliderPageProps {
  stand: Stand;
  business?: Business;
  isNfc?: boolean;
  onBack?: () => void;
}

interface DraftReview {
  id: number;
  tag: string;
  text: string;
}

export const ReviewSliderPage: React.FC<ReviewSliderPageProps> = ({
  stand,
  business,
  isNfc,
  onBack,
}) => {
  const businessName = business?.name || stand.businessName || 'Hospitality Partner';
  const category = business?.category || 'Restaurant';
  const targetGoogleUrl = stand.destinationUrlOverride || business?.googleReviewUrl || 'https://search.google.com';

  const [drafts, setDrafts] = useState<DraftReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableText, setEditableText] = useState<string>('');
  const [hasOpenedGoogle, setHasOpenedGoogle] = useState<boolean>(false);

  // Touch Swipe coordinates
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-generate 4 reviews on mount
  const generateReviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.generateReviewDrafts({
        businessName,
        category,
        experienceTags: ['Delicious Food', 'Courteous Staff', 'Great Ambience'],
        tone: 'warm',
      });

      // Prepare 4 distinct review drafts
      const defaultTemplates = [
        `The food at ${businessName} is absolutely phenomenal! Delicious flavours, generous portions, and the presentation was top-notch. Can't wait to visit again!`,
        `Had such a delightful experience at ${businessName}! The staff were remarkably warm, attentive, and made us feel right at home. Outstanding hospitality!`,
        `Loved everything about ${businessName}! Beautiful atmosphere, fast service, and each dish was bursting with authentic taste. Highly recommended to everyone!`,
        `One of the best dining experiences in town! ${businessName} truly exceeds expectations in every way. 5 stars all around!`,
      ];

      const incomingDrafts = res.drafts || [];
      const texts = [
        incomingDrafts[0] || defaultTemplates[0],
        incomingDrafts[1] || defaultTemplates[1],
        incomingDrafts[2] || defaultTemplates[2],
        incomingDrafts[3] || defaultTemplates[3],
      ];

      const tags = [
        'Taste & Flavour',
        'Hospitality & Service',
        'Ambience & Vibe',
        '5-Star Recommendation',
      ];

      const mapped: DraftReview[] = texts.map((t, idx) => ({
        id: idx,
        tag: tags[idx] || `Review Draft ${idx + 1}`,
        text: t,
      }));

      setDrafts(mapped);
      setCurrentIndex(0);
      setEditableText(mapped[0]?.text || '');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to auto-generate reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateReviews();
  }, [businessName, category]);

  // Slide navigation
  const handlePrev = () => {
    sounds.playTap();
    setIsEditing(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : drafts.length - 1));
  };

  const handleNext = () => {
    sounds.playTap();
    setIsEditing(false);
    setCurrentIndex((prev) => (prev < drafts.length - 1 ? prev + 1 : 0));
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Update editable text when index changes
  useEffect(() => {
    if (drafts[currentIndex]) {
      setEditableText(drafts[currentIndex].text);
    }
  }, [currentIndex, drafts]);

  // SELECT REVIEW & INSTANTLY OPEN GOOGLE REVIEW PAGE WITH AUTO-COPY
  const handleSelectAndOpen = async (reviewText: string) => {
    const textToCopy = isEditing ? editableText : reviewText;
    
    // 1. Play audio feedback
    sounds.playScanSuccess();

    // 2. Automatically copy review to clipboard
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(currentIndex);
    } catch {
      // Fallback
      setCopiedIndex(currentIndex);
    }

    // 3. Mark state as opened
    setHasOpenedGoogle(true);

    // 4. Instantly open Google Review page in a new window/tab
    setTimeout(() => {
      window.open(targetGoogleUrl, '_blank', 'noopener,noreferrer');
    }, 150);
  };

  const currentDraft = drafts[currentIndex];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-start p-4 sm:p-6 pb-24">
      {/* Top Banner Indicator */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={() => {
            sounds.playTap();
            if (onBack) onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D5] text-stone-700 font-bold hover:text-stone-900 hover:border-stone-400 shadow-sm transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Links</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D5] shadow-sm">
          <Radio className={`w-3.5 h-3.5 ${isNfc ? 'text-emerald-600 animate-pulse' : 'text-[#B3801A]'}`} />
          <span className="font-semibold text-stone-700">
            Stand #{stand.slug}
          </span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Top Gold Ambient Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27]" />

        {/* Business Branding Header */}
        <div className="text-center mb-6 pt-2">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={businessName} 
              className="w-16 h-16 rounded-2xl mx-auto object-cover border border-[#E8E2D5] shadow-md mb-2.5"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-2xl mx-auto bg-gradient-to-tr from-[#D4AF37] to-[#C59B27] flex items-center justify-center text-stone-950 text-2xl font-black shadow-md mb-2.5"
            >
              {businessName.charAt(0)}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B3801A]" />
            <span>AI Review Assistant</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {businessName}
          </h1>

          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Slide to choose your favourite review, then tap to copy & open Google!
          </p>

          {/* 5-Star Rating Visual */}
          <div className="flex items-center justify-center gap-1 mt-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        {/* COPIED ALERT NOTIFICATION (After Selection) */}
        {hasOpenedGoogle && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <strong className="block text-sm font-black text-emerald-950 mb-0.5">
                  Review Copied to Clipboard!
                </strong>
                <p className="text-emerald-800 leading-relaxed mb-2">
                  Google Reviews is now open. Simply <strong>paste</strong> (tap and hold in the review text box) to publish!
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sounds.playScanSuccess();
                      navigator.clipboard.writeText(isEditing ? editableText : currentDraft?.text || '');
                      alert('Re-copied to clipboard!');
                    }}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 shadow-sm hover:bg-emerald-100"
                  >
                    Copy Again
                  </button>
                  <button
                    onClick={() => window.open(targetGoogleUrl, '_blank', 'noopener,noreferrer')}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <span>Re-open Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDER CAROUSEL SECTION */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#B3801A] animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">
              Generating 4 authentic reviews for {businessName}...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slide Navigation Header: Dots & Arrows */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Review {currentIndex + 1} of {drafts.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] text-stone-600 text-[10px] font-semibold border border-[#E8E2D5]">
                  {currentDraft?.tag}
                </span>
              </div>

              {/* Slider Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-stone-100 border border-[#DCD4C5] flex items-center justify-center text-stone-700 shadow-sm transition-all active:scale-95"
                  title="Previous Review"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-stone-100 border border-[#DCD4C5] flex items-center justify-center text-stone-700 shadow-sm transition-all active:scale-95"
                  title="Next Review"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Slide Card (Touch-Swipeable) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#FAF8F5] to-white border-2 border-[#D4AF37] shadow-lg transition-all duration-300"
            >
              <Quote className="w-8 h-8 text-amber-300/40 absolute top-4 right-4" />

              {/* 5 Stars Header */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[11px] font-bold text-[#B3801A] ml-2">
                  5.0 Star Rating
                </span>
              </div>

              {/* Review Text or Editable Area */}
              {isEditing ? (
                <div className="space-y-2 mb-4">
                  <textarea
                    rows={4}
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="w-full p-3 bg-white border border-[#C59B27] rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-serif italic mb-5 min-h-[72px]">
                  "{currentDraft?.text}"
                </p>
              )}

              {/* Slide Dots Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {drafts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setCurrentIndex(idx);
                      setIsEditing(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      currentIndex === idx
                        ? 'w-6 bg-[#B3801A]'
                        : 'w-2 bg-stone-300 hover:bg-stone-400'
                    }`}
                  />
                ))}
              </div>

              {/* PRIMARY ACTION BUTTON: SELECT & OPEN GOOGLE REVIEW */}
              <button
                type="button"
                onClick={() => handleSelectAndOpen(currentDraft?.text || '')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#C59B27] text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Select & Open Google Reviews</span>
                <ExternalLink className="w-4 h-4 text-stone-950" />
              </button>

              {/* Secondary Tools: Edit & Re-copy */}
              <div className="flex items-center justify-between mt-3 text-xs text-stone-500 font-medium">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setIsEditing(!isEditing);
                  }}
                  className="inline-flex items-center gap-1 hover:text-stone-900"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Personalize text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playScanSuccess();
                    navigator.clipboard.writeText(isEditing ? editableText : currentDraft?.text || '');
                    setCopiedIndex(currentIndex);
                    setTimeout(() => setCopiedIndex(null), 2500);
                  }}
                  className="inline-flex items-center gap-1 hover:text-stone-900"
                >
                  {copiedIndex === currentIndex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#B3801A]" />
                      <span>Copy Text Only</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Slider Hint & Regenerate */}
            <div className="flex items-center justify-between pt-1 px-1 text-xs text-stone-500">
              <span className="italic">
                Swipe left / right to view other reviews
              </span>

              <button
                type="button"
                onClick={generateReviews}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[#B3801A] font-bold hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate 4 New Reviews</span>
              </button>
            </div>
          </div>
        )}

        {/* Policy Notice */}
        <div className="mt-6 pt-5 border-t border-[#EFEAE1] text-[11px] text-stone-500 leading-relaxed">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span>
              <strong>Google Review Policy Compliance:</strong> You have complete freedom to publish genuine reviews. Reviews are submitted directly by you on Google's interface. TapReview does not publish on your behalf.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

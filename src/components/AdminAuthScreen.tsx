import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { authService } from '../services/auth';
import { sounds } from '../utils/audio';

interface AdminAuthScreenProps {
  onSuccess: () => void;
}

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your admin access key or password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      const isValid = authService.login(password, rememberMe);
      if (isValid) {
        sounds.playScanSuccess();
        onSuccess();
      } else {
        sounds.playTap();
        setError('Invalid admin credentials. Please verify your password.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      setIsSubmitting(false);
    }, 250);
  };

  const isEnvConfigured = authService.isConfiguredViaEnv();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#D4AF37]/10 via-[#FAF8F5] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container Card */}
      <div className={`w-full max-w-md bg-white rounded-3xl border border-[#E8E2D5] shadow-[0_20px_60px_rgba(70,55,40,0.08)] p-8 sm:p-10 relative z-10 transition-transform duration-200 ${shake ? 'animate-shake' : ''}`}>
        
        {/* Top Icon Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D4AF37] via-[#E8C872] to-[#B3801A] p-[2px] shadow-[0_8px_25px_rgba(197,155,39,0.3)] mb-4">
            <div className="w-full h-full bg-[#FAF8F5] rounded-[22px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#B3801A]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#B3801A] text-[11px] font-bold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restricted Access</span>
          </div>

          <h1 className="text-2xl font-black font-display text-stone-900 tracking-tight">
            Tap<span className="gold-text-gradient">Review</span> Admin
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
            Enter your admin master key or password to manage NFC stands, menus, and client routing.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Admin Password / Master Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: admin123)"
                autoFocus
                className="w-full pl-10 pr-12 py-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#D4AF37] text-[#B3801A] focus:ring-[#D4AF37] w-4 h-4"
              />
              <span>Remember this device</span>
            </label>
            <span className="text-[11px] text-stone-400">
              {isEnvConfigured ? 'Secured by .env' : 'Default: admin123'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E8C872] to-[#B3801A] text-stone-950 font-extrabold text-sm shadow-[0_6px_25px_rgba(197,155,39,0.35)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Admin Portal</span>
                <ArrowRight className="w-4 h-4 text-stone-950" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-8 pt-6 border-t border-[#EFEAE1] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <Sparkles className="w-3.5 h-3.5 text-[#B3801A]" />
            <span>Update password anytime via <strong className="text-stone-800">.env</strong> or Settings</span>
          </div>
        </div>

      </div>

      {/* Subtle Footer */}
      <div className="mt-8 text-center text-xs text-stone-400">
        TapReview Enterprise Cloud &bull; Sub-50ms Global Routing
      </div>
    </div>
  );
};

/**
 * Authentication & Security Service for TapReview Admin Portal
 * Manages access keys, session verification, and credentials.
 */

const AUTH_STORAGE_KEY = 'tapreview_admin_auth_v1';
const CUSTOM_PASSWORD_KEY = 'tapreview_custom_admin_password';

export const authService = {
  /**
   * Retrieves the active admin password.
   * Priority:
   * 1. .env variable: VITE_ADMIN_PASSWORD (e.g. VITE_ADMIN_PASSWORD=mysecret)
   * 2. Custom password saved by user in Settings
   * 3. Default fallback: 'admin123'
   */
  getAdminPassword(): string {
    const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (envPass && typeof envPass === 'string' && envPass.trim()) {
      return envPass.trim();
    }
    const customPass = localStorage.getItem(CUSTOM_PASSWORD_KEY);
    if (customPass && customPass.trim()) {
      return customPass.trim();
    }
    return 'admin123';
  },

  /**
   * Verifies if candidate password matches admin password
   */
  verifyPassword(candidate: string): boolean {
    if (!candidate) return false;
    const target = this.getAdminPassword();
    return candidate.trim() === target;
  },

  /**
   * Checks if current browser session is authenticated
   */
  isAuthenticated(): boolean {
    try {
      // 1. Session storage (current tab)
      if (sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated') {
        return true;
      }
      // 2. Local storage ("remember this device")
      if (localStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Log in with password and optional persistent "remember me"
   */
  login(password: string, rememberMe = true): boolean {
    if (this.verifyPassword(password)) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return true;
    }
    return false;
  },

  /**
   * Log out and lock the admin portal
   */
  logout(): void {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to log out:', e);
    }
  },

  /**
   * Updates custom password in browser storage
   */
  setCustomPassword(newPass: string): void {
    if (newPass && newPass.trim()) {
      localStorage.setItem(CUSTOM_PASSWORD_KEY, newPass.trim());
    }
  },

  /**
   * Resets custom password back to .env or default
   */
  resetToDefaultPassword(): void {
    localStorage.removeItem(CUSTOM_PASSWORD_KEY);
  },

  /**
   * Returns true if password is set via .env
   */
  isConfiguredViaEnv(): boolean {
    const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
    return Boolean(envPass && typeof envPass === 'string' && envPass.trim());
  }
};

/**
 * LocalStorage Helpers for SafeSignal (On-device persistence)
 * Core Design Principle 1: No server / No database — all state persists strictly in browser localStorage.
 */

const STORAGE_KEYS = {
  SAFE_WORD: 'safesignal_safe_word',
  ONBOARDED: 'safesignal_onboarded',
  MODE: 'safesignal_mode',
  TRUSTED_CIRCLE: 'safesignal_circle',
  FAMILIAR_PLACES: 'safesignal_places',
  SETTINGS: 'safesignal_settings'
};

export const storage = {
  getSafeWord: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SAFE_WORD) || '';
    } catch {
      return '';
    }
  },

  setSafeWord: (word) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAFE_WORD, word);
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
    } catch {
      // Graceful fallback for storage quota or restricted environment
    }
  },

  isOnboarded: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
    } catch {
      return false;
    }
  },

  getMode: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.MODE) || 'Solo';
    } catch {
      return 'Solo';
    }
  },

  setMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, mode);
    } catch {
      // Graceful fallback
    }
  },

  getTrustedCircle: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRUSTED_CIRCLE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setTrustedCircle: (circle) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRUSTED_CIRCLE, JSON.stringify(circle));
    } catch {
      // Graceful fallback
    }
  },

  getFamiliarPlaces: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAMILIAR_PLACES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setFamiliarPlaces: (places) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAMILIAR_PLACES, JSON.stringify(places));
    } catch {
      // Graceful fallback
    }
  },

  resetOnboarding: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SAFE_WORD);
      localStorage.removeItem(STORAGE_KEYS.ONBOARDED);
      localStorage.removeItem(STORAGE_KEYS.MODE);
      localStorage.removeItem(STORAGE_KEYS.TRUSTED_CIRCLE);
      localStorage.removeItem(STORAGE_KEYS.FAMILIAR_PLACES);
    } catch {
      // Graceful fallback
    }
  }
};

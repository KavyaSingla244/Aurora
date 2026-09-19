/**
 * LocalStorage Helpers for Aurora (On-device persistence)
 * Core Design Principle 1: No server / No database — all state persists strictly in browser localStorage.
 */

const STORAGE_KEYS = {
  SAFE_WORD: 'aurora_safe_word',
  ONBOARDED: 'aurora_onboarded',
  MODE: 'aurora_mode',
  TRUSTED_CIRCLE: 'aurora_circle',
  FAMILIAR_PLACES: 'aurora_places',
  SETTINGS: 'aurora_settings',
  // Legacy fallback keys
  LEGACY_SAFE_WORD: 'safesignal_safe_word',
  LEGACY_ONBOARDED: 'safesignal_onboarded',
  LEGACY_MODE: 'safesignal_mode',
  LEGACY_TRUSTED_CIRCLE: 'safesignal_circle',
  LEGACY_FAMILIAR_PLACES: 'safesignal_places'
};

export const storage = {
  getSafeWord: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SAFE_WORD) || localStorage.getItem(STORAGE_KEYS.LEGACY_SAFE_WORD) || '';
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
      return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true' || localStorage.getItem(STORAGE_KEYS.LEGACY_ONBOARDED) === 'true';
    } catch {
      return false;
    }
  },

  getMode: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.MODE) || localStorage.getItem(STORAGE_KEYS.LEGACY_MODE) || 'Solo';
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
      const data = localStorage.getItem(STORAGE_KEYS.TRUSTED_CIRCLE) || localStorage.getItem(STORAGE_KEYS.LEGACY_TRUSTED_CIRCLE);
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
      const data = localStorage.getItem(STORAGE_KEYS.FAMILIAR_PLACES) || localStorage.getItem(STORAGE_KEYS.LEGACY_FAMILIAR_PLACES);
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
      localStorage.removeItem(STORAGE_KEYS.LEGACY_SAFE_WORD);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_ONBOARDED);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_MODE);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_TRUSTED_CIRCLE);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_FAMILIAR_PLACES);
    } catch {
      // Graceful fallback
    }
  }
};

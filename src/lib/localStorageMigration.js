/**
 * One-time localStorage migration from legacy keys (emad_, al_raid_) to basha_.
 * Runs on app load. Safe to call multiple times — only migrates once.
 * Never loses data: only copies old → new if new doesn't exist, then deletes old.
 */

const MIGRATION_FLAG = 'basha_lsmigration_v1';

const KEY_MAP = {
  emad_cart: 'basha_cart',
  emad_favorites: 'basha_favorites',
  emad_compare: 'basha_compare',
  emad_coupon: 'basha_coupon',
  emad_recently_viewed: 'basha_recently_viewed',
  emad_viewed_stores: 'basha_viewed_stores',
  al_raid_store_currency: 'basha_currency',
};

export function migrateLocalStorage() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, oldValue);
        }
        localStorage.removeItem(oldKey);
      }
    }

    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch (e) {
    // localStorage may be unavailable (incognito, etc.) — fail silently
  }
}
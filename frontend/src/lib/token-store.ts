const STORAGE_KEY = "cupcraft.token";
const CHANGE_EVENT = "cupcraft:token-change";

/**
 * Tiny external store over localStorage, consumed with useSyncExternalStore.
 * The server snapshot is `undefined` ("not known yet") so nothing auth-dependent
 * is decided before hydration; `null` means "known to be signed out".
 */
export const tokenStore = {
  get(): string | null {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },

  getServerSnapshot(): string | null | undefined {
    return undefined;
  },

  set(token: string | null) {
    try {
      if (token) window.localStorage.setItem(STORAGE_KEY, token);
      else window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  },

  subscribe(callback: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) callback();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, callback);
    };
  },
};

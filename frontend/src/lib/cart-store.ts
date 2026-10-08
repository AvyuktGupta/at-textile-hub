import type { StockStatus } from "@/types";

/** Display snapshot so the cart renders instantly; prices are always re-quoted by the API. */
export interface CartItem {
  productId: string;
  quantity: number;
  title: string;
  slug: string;
  sku: string;
  image: string;
  unit: string;
  minOrderQty: number;
  unitPrice: number;
  stockStatus: StockStatus;
  addedAt: number;
}

const STORAGE_KEY = "cupcraft.cart.v1";
const CHANGE_EVENT = "cupcraft:cart-change";
const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem;
  return (
    typeof item?.productId === "string" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.title === "string"
  );
}

/**
 * localStorage-backed store for useSyncExternalStore. Snapshots are cached by the raw string so
 * repeated reads return the same array (required to avoid render loops). The server snapshot is
 * `undefined` so nothing cart-dependent renders before hydration.
 */
export const cartStore = {
  get(): CartItem[] {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return EMPTY;
    }
    if (raw === cachedRaw) return cachedItems;
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedItems = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
    return cachedItems;
  },

  getServerSnapshot(): CartItem[] | undefined {
    return undefined;
  },

  set(items: CartItem[]) {
    try {
      if (items.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

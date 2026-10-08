"use client";

import { createContext, use, useMemo, useSyncExternalStore } from "react";
import { cartStore, type CartItem } from "@/lib/cart-store";

export const MAX_LINE_QUANTITY = 1_000_000;
const MAX_LINES = 100;

type CartProduct = Omit<CartItem, "quantity" | "addedAt">;

interface CartContextValue {
  /** `undefined` until the cart has been read from storage after hydration. */
  items: CartItem[] | undefined;
  /** Number of distinct products. */
  count: number;
  add: (product: CartProduct, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const clampQuantity = (quantity: number) => Math.min(Math.max(Math.floor(quantity) || 0, 1), MAX_LINE_QUANTITY);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore<CartItem[] | undefined>(
    cartStore.subscribe,
    cartStore.get,
    cartStore.getServerSnapshot
  );

  const value = useMemo<CartContextValue>(() => {
    // Mutations read the latest stored cart so they never act on a stale render's copy.
    const add: CartContextValue["add"] = (product, quantity) => {
      const current = cartStore.get();
      const existing = current.find((item) => item.productId === product.productId);
      if (existing) {
        cartStore.set(
          current.map((item) =>
            item.productId === product.productId
              ? { ...item, ...product, quantity: clampQuantity(item.quantity + quantity) }
              : item
          )
        );
        return;
      }
      if (current.length >= MAX_LINES) throw new Error(`An order can contain at most ${MAX_LINES} products`);
      cartStore.set([...current, { ...product, quantity: clampQuantity(quantity), addedAt: Date.now() }]);
    };

    return {
      items,
      count: items?.length ?? 0,
      add,
      setQuantity: (productId, quantity) =>
        cartStore.set(
          cartStore.get().map((item) => (item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item))
        ),
      remove: (productId) => cartStore.set(cartStore.get().filter((item) => item.productId !== productId)),
      clear: () => cartStore.set([]),
      quantityOf: (productId) => items?.find((item) => item.productId === productId)?.quantity ?? 0,
    };
  }, [items]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = use(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}

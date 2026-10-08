import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <CartView />
    </div>
  );
}

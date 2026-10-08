"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

/** Adds the product to the signed-in buyer's "Recently viewed" row. */
export function TrackProductView({ productId }: { productId: string }) {
  const { status, token } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    apiFetch("/me/recently-viewed", { method: "POST", token, body: { productId } }).catch(() => {
      // Best effort; a missed view isn't worth bothering the buyer about.
    });
  }, [status, token, productId]);

  return null;
}

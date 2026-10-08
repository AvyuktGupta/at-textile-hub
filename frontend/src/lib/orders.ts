import type { BadgeTone } from "@/components/ui/badge";
import type { EmailDeliveryStatus, OrderStatus } from "@/types";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; tone: BadgeTone }[] = [
  { value: "submitted", label: "Received", tone: "warning" },
  { value: "confirmed", label: "Confirmed", tone: "brand" },
  { value: "dispatched", label: "Dispatched", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];

export function orderStatusMeta(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status) ?? ORDER_STATUS_OPTIONS[0];
}

export const EMAIL_STATUS_META: Record<EmailDeliveryStatus, { label: string; tone: BadgeTone }> = {
  sent: { label: "Emailed", tone: "success" },
  pending: { label: "Sending", tone: "neutral" },
  skipped: { label: "Not sent (no SMTP)", tone: "warning" },
  failed: { label: "Email failed", tone: "danger" },
};

export function formatOrderDate(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(withTime && { timeStyle: "short" }),
  }).format(new Date(iso));
}

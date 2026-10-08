"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ImageManager } from "@/components/admin/image-manager";
import { TagInput } from "@/components/admin/tag-input";
import { useTagSuggestions } from "@/components/admin/use-tag-suggestions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { AffixInput, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminApi, type ProductInput } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { STOCK_STATUS_OPTIONS } from "@/lib/catalog";
import { calculateFinalPrice, formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { Product } from "@/types";

const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25];

type FormState = Omit<ProductInput, "basePrice" | "discountPercentage" | "minOrderQty"> & {
  basePrice: string;
  discountPercentage: string;
  minOrderQty: string;
};

type Errors = Partial<Record<keyof ProductInput, string>>;

function toFormState(product?: Product): FormState {
  return {
    title: product?.title ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    basePrice: product ? String(product.basePrice) : "",
    discountPercentage: product ? String(product.discountPercentage) : "0",
    images: product?.images ?? [],
    tags: product?.tags ?? [],
    stockStatus: product?.stockStatus ?? "in_stock",
    minOrderQty: product ? String(product.minOrderQty) : "100",
    unit: product?.unit ?? "pcs",
    isActive: product?.isActive ?? true,
  };
}

function validate(form: FormState): Errors {
  const errors: Errors = {};
  const price = Number(form.basePrice);
  const discount = Number(form.discountPercentage);
  const moq = Number(form.minOrderQty);

  if (!form.title.trim()) errors.title = "Give the product a title";
  if (!form.sku.trim()) errors.sku = "SKU is required";
  if (form.basePrice === "" || !Number.isFinite(price) || price < 0) errors.basePrice = "Enter a valid price";
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    errors.discountPercentage = "Discount must be between 0 and 100";
  }
  if (!Number.isInteger(moq) || moq < 1) errors.minOrderQty = "Minimum order must be a whole number of at least 1";
  return errors;
}

export function ProductForm({ product }: { product?: Product }) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const tagSuggestions = useTagSuggestions();

  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key as keyof Errors]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const unitLabel = form.unit.trim() === "pcs" || !form.unit.trim() ? "pc" : form.unit.trim();
  const basePrice = Number(form.basePrice) || 0;
  const discount = Math.min(Math.max(Number(form.discountPercentage) || 0, 0), 100);
  const finalPrice = calculateFinalPrice(basePrice, discount);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload: ProductInput = {
      ...form,
      title: form.title.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      unit: form.unit.trim() || "pcs",
      basePrice: Number(form.basePrice),
      discountPercentage: Number(form.discountPercentage) || 0,
      minOrderQty: Number(form.minOrderQty),
    };

    setSaving(true);
    try {
      if (product) {
        const res = await adminApi.updateProduct(token, product._id, payload);
        setForm(toFormState(res.data));
        toast.success("Product saved");
        router.refresh();
      } else {
        const res = await adminApi.createProduct(token, payload);
        toast.success("Product created");
        // Next keeps this route mounted (hidden) after navigating away, so clear it for the next visit.
        setForm(toFormState());
        setErrors({});
        router.replace(`/admin/products/${res.data._id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) setErrors(err.details as Errors);
        if (err.status === 409) setErrors((current) => ({ ...current, sku: "Another product already uses this SKU" }));
        toast.error(err.message);
      } else {
        toast.error("Could not save the product");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !product) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(token, product._id);
      toast.success(`Deleted “${product.title}”`);
      router.replace("/admin/products");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete product");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24 lg:pb-0">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> All products
          </Link>
          <h1 className="text-[28px] leading-tight sm:text-[34px]">
            {isEdit ? form.title || "Untitled product" : "New product"}
          </h1>
          {isEdit && <p className="mt-1 text-sm text-ink-muted">SKU {product?.sku}</p>}
        </div>
        <div className="hidden gap-2 lg:flex">
          {isEdit && (
            <Button variant="danger-ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2 /> Delete
            </Button>
          )}
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-5">
          <SectionCard title="Details" description="What buyers see on the product card and detail page.">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Field label="Title" htmlFor="title" required error={errors.title}>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => set("title", event.target.value)}
                  placeholder="Ripple-wall hot cup, 8 oz"
                  aria-invalid={Boolean(errors.title)}
                  maxLength={160}
                />
              </Field>
              <Field label="SKU" htmlFor="sku" required error={errors.sku}>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(event) => set("sku", event.target.value.toUpperCase())}
                  placeholder="RWC-08-WHT"
                  aria-invalid={Boolean(errors.sku)}
                  autoCapitalize="characters"
                  className="font-mono text-sm tracking-wide"
                  maxLength={64}
                />
              </Field>
            </div>
            <Field
              label="Description"
              htmlFor="description"
              className="mt-5"
              hint="Material, GSM, dimensions, carton quantity, print options."
              error={errors.description}
            >
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                rows={6}
                maxLength={5000}
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Images"
            description="The first image is used as the cover on product cards."
            action={<span className="text-[13px] text-ink-muted tabular-nums">{form.images.length}/10</span>}
          >
            <ImageManager value={form.images} onChange={(images) => set("images", images)} />
          </SectionCard>

          <SectionCard
            title="Tags"
            description="Tags power storefront filters. Highlighted tags feed a homepage section."
          >
            <TagInput id="tags" value={form.tags} onChange={(tags) => set("tags", tags)} suggestions={tagSuggestions} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-10">
          <SectionCard title="Pricing" description="Per-unit wholesale price.">
            <div className="flex flex-col gap-5">
              <Field label="Base price" htmlFor="basePrice" required error={errors.basePrice}>
                <AffixInput
                  id="basePrice"
                  prefix="₹"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={form.basePrice}
                  onChange={(event) => set("basePrice", event.target.value)}
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.basePrice)}
                />
              </Field>

              <Field label="Discount" htmlFor="discountPercentage" error={errors.discountPercentage}>
                <AffixInput
                  id="discountPercentage"
                  suffix="% off"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.5"
                  value={form.discountPercentage}
                  onChange={(event) => set("discountPercentage", event.target.value)}
                  aria-invalid={Boolean(errors.discountPercentage)}
                />
                <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label="Discount presets">
                  {DISCOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => set("discountPercentage", String(preset))}
                      className={cn(
                        "h-8 rounded-md border px-2.5 text-[13px] font-medium tabular-nums transition-colors",
                        discount === preset
                          ? "border-clay bg-clay-soft text-clay"
                          : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                      )}
                    >
                      {preset === 0 ? "None" : `${preset}%`}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-xl border border-line bg-canvas p-4" aria-live="polite">
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Card preview</p>
                <div className="mt-3 flex items-center gap-2">
                  {discount > 0 ? (
                    <span className="rounded-md bg-clay px-2 py-1 text-[11px] font-bold text-white">
                      {discount}% OFF
                    </span>
                  ) : (
                    <Badge>No discount</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-2 tabular-nums">
                  <span className="text-2xl font-bold text-ink">{formatPrice(finalPrice)}</span>
                  {discount > 0 && (
                    <span className="text-sm text-ink-faint line-through">{formatPrice(basePrice)}</span>
                  )}
                  <span className="ml-auto text-xs text-ink-muted">/ {unitLabel}</span>
                </div>
                {discount > 0 && basePrice > 0 && (
                  <p className="mt-1 text-[13px] text-success">
                    Buyer saves {formatPrice(basePrice - finalPrice)} per {unitLabel}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Inventory & ordering">
            <div className="flex flex-col gap-5">
              <Field label="Stock status" htmlFor="stockStatus">
                <Select
                  id="stockStatus"
                  value={form.stockStatus}
                  onChange={(event) => set("stockStatus", event.target.value as FormState["stockStatus"])}
                >
                  {STOCK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                <Field label="Minimum order" htmlFor="minOrderQty" error={errors.minOrderQty}>
                  <Input
                    id="minOrderQty"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={form.minOrderQty}
                    onChange={(event) => set("minOrderQty", event.target.value)}
                    aria-invalid={Boolean(errors.minOrderQty)}
                    className="tabular-nums"
                  />
                </Field>
                <Field label="Unit" htmlFor="unit">
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(event) => set("unit", event.target.value)}
                    placeholder="pcs"
                    maxLength={20}
                  />
                </Field>
              </div>
              <div className="border-t border-line pt-4">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => set("isActive", checked)}
                  label="Visible in store"
                  description={form.isActive ? "Buyers can find and order this product." : "Hidden from the storefront."}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        {isEdit && (
          <Button
            variant="danger-ghost"
            size="icon"
            className="size-11"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete product"
          >
            <Trash2 />
          </Button>
        )}
        <Button type="submit" loading={saving} className="flex-1">
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this product?"
        description="It will be removed from the catalogue along with its uploaded images. This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </form>
  );
}

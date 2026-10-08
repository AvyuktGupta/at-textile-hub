"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { adminApi } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { ProductImage } from "@/types";

const MAX_IMAGES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

interface ImageManagerProps {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** Single-image mode for things like the hero banner. */
  single?: boolean;
}

export function ImageManager({ value, onChange, single = false }: ImageManagerProps) {
  const { token } = useAuth();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const limit = single ? 1 : MAX_IMAGES;
  const remaining = limit - value.length;

  async function upload(fileList: FileList | File[]) {
    if (!token) return;
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    const accepted = single ? files.slice(0, 1) : files.slice(0, Math.max(remaining, 0));
    if (!single && accepted.length < files.length) {
      toast.error(`Only ${MAX_IMAGES} images are allowed per product.`);
    }
    if (!accepted.length) return;

    setUploading(true);
    try {
      const res = await adminApi.uploadImages(token, accepted);
      const uploaded = res.data.map((file) => ({ url: file.url }));
      onChange(single ? uploaded : [...value, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      toast.error("Enter a full image URL starting with http:// or https://");
      return;
    }
    onChange(single ? [{ url }] : [...value, { url }]);
    setUrlDraft("");
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  const canAddMore = single || remaining > 0;

  return (
    <div className="flex flex-col gap-4">
      {value.length > 0 && (
        <ul className={cn("grid gap-3", single ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
          {value.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-line bg-sunken"
            >
              <MediaImage
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                className={cn("w-full", single ? "aspect-[21/9]" : "aspect-square")}
              />
              {!single && index === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-surface/95 px-1.5 py-0.5 text-[11px] font-semibold text-ink shadow-sm">
                  <Star className="size-3 fill-clay text-clay" aria-hidden /> Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/60 to-transparent p-2 pt-6 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                {!single ? (
                  <div className="flex gap-1">
                    <IconAction label="Move left" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowLeft />
                    </IconAction>
                    <IconAction
                      label="Move right"
                      disabled={index === value.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight />
                    </IconAction>
                  </div>
                ) : (
                  <span />
                )}
                <IconAction label="Remove image" onClick={() => onChange(value.filter((_, i) => i !== index))}>
                  <Trash2 />
                </IconAction>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAddMore && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
            dragging ? "border-brand bg-brand-soft/60" : "border-line-strong bg-canvas"
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-ink-soft">
              {single && value.length ? "Replace image" : "Drop images here, or"}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-muted">JPG, PNG, WebP or AVIF · up to 5 MB each</p>
          </div>
          <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? "Uploading…" : "Choose files"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            multiple={!single}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => event.target.files && void upload(event.target.files)}
          />
        </div>
      )}

      {canAddMore && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              type="url"
              inputMode="url"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addUrl();
                }
              }}
              placeholder="…or paste an image URL"
              className="pl-9"
              aria-label="Image URL"
            />
          </div>
          <Button variant="secondary" onClick={addUrl} disabled={!urlDraft.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg bg-surface/95 text-ink shadow-sm transition-colors hover:bg-surface disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

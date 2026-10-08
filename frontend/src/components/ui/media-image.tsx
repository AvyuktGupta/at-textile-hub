/* eslint-disable @next/next/no-img-element -- admins can paste images from any host, which next/image can't allow-list */
"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
}

export function MediaImage({ src, alt, className, ...props }: MediaImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = resolveMediaUrl(src);

  if (!resolved || failedSrc === resolved) {
    return (
      <div className={cn("flex items-center justify-center bg-sunken text-ink-faint", className)} aria-label={alt}>
        <ImageOff className="size-1/4 max-h-8 max-w-8" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(resolved)}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

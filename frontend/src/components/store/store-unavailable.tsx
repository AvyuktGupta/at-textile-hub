import { PlugZap } from "lucide-react";

export function StoreUnavailable({ what = "the catalogue" }: { what?: string }) {
  return (
    <div className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-sunken text-ink-muted">
        <PlugZap className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl">We can’t load {what} right now</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        This is usually brief. Please refresh the page in a minute.
      </p>
    </div>
  );
}

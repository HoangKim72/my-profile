import { Loader2 } from "lucide-react";

interface FullscreenLoaderProps {
  title: string;
  description: string;
}

export function FullscreenLoader({
  title,
  description,
}: FullscreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-md">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Loader2 size={28} className="animate-spin" aria-hidden="true" />
        </div>

        <div className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          Đang xử lý
        </div>

        <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

import { Loader, ShieldCheck } from "lucide-react";

interface FullscreenLoaderProps {
  title: string;
  description: string;
}

export function FullscreenLoader({
  title,
  description,
}: FullscreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 backdrop-blur-md dark:bg-black/80">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-[0_30px_90px_-35px_rgba(37,99,235,0.45)] dark:border-blue-950 dark:bg-gray-950">
        <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <Loader size={30} className="animate-spin" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <ShieldCheck size={14} />
          Admin Access
        </div>

        <h2 className="mt-5 text-2xl font-bold text-gray-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </div>
    </div>
  );
}

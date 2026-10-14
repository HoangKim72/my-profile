import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui";
import { SiteLogo } from "@/components/layout/SiteLogo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-custom flex h-16 items-center justify-between gap-3">
          <SiteLogo compactOnMobile />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Về trang chủ
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-4 py-10"
      >
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}

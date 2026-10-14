import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink focus:shadow-md"
      >
        Bỏ qua tới nội dung
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}

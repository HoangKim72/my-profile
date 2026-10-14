import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME } from "@/lib/utils/constants";
import { themeInitScript } from "@/lib/theme/theme";

const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-be-vietnam",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Bảng công cụ, kho tài liệu và hồ sơ của Anh coder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        {/* Sets data-theme before first paint so there is no colour flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-ink">
        {children}
      </body>
    </html>
  );
}

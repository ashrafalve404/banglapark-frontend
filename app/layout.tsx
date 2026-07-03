import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bangla Park Limited",
    template: "%s | Bangla Park Limited",
  },
  description:
    "বাংলা পার্ক লিমিটেড — MLM ই-কমার্স প্ল্যাটফর্ম। পণ্য কিনুন, রেফার করুন, আয় করুন।",
  keywords: ["bangla park", "mlm", "ecommerce", "bangladesh"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

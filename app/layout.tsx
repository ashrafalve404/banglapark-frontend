import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.banglapark.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bangla Park Limited",
    template: "%s | Bangla Park Limited",
  },
  description:
    "বাংলা পার্ক লিমিটেড — বাংলাদেশের শীর্ষস্থানীয় ই-কমার্স প্ল্যাটফর্ম। সেরা মূল্যে কেনাকাটা করুন, পণ্য রেফার করে আয় করুন। Bangla Park Limited — Bangladesh's trusted e-commerce platform. Shop online at best prices, earn by referring products.",
  keywords: [
    "bangla park",
    "banglapark",
    "bangla park limited",
    "banglaparklimited",
    "banglaparkltd",
    "bangla park ltd",
    "bangladeshi ecommerce site",
    "bangladesh online shop",
    "bangladesh ecommerce",
    "online shopping bangladesh",
    "best ecommerce site in bangladesh",
    "bangla park ecommerce",
    "বাংলা পার্ক",
    "বাংলাদেশ ই-কমার্স",
    "অনলাইন শপিং বাংলাদেশ",
    "bangladesh online marketplace",
  ],
  authors: [{ name: "Bangla Park Limited" }],
  creator: "Bangla Park Limited",
  publisher: "Bangla Park Limited",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Bangla Park Limited — Trusted E-commerce Platform in Bangladesh",
    description:
      "বাংলা পার্ক লিমিটেড — বাংলাদেশের শীর্ষস্থানীয় ই-কমার্স প্ল্যাটফর্ম। সেরা মূল্যে কেনাকাটা করুন, পণ্য রেফার করে আয় করুন। Shop online at best prices across Bangladesh.",
    url: siteUrl,
    siteName: "Bangla Park Limited",
    locale: "bn_BD",
    alternateLocale: ["en_US"],
    type: "website",
    countryName: "Bangladesh",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Bangla Park Limited — Best Online Shopping in Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bangla Park Limited — Trusted E-commerce Platform in Bangladesh",
    description:
      "Shop online at best prices across Bangladesh. Earn by referring products. Bangla Park Limited — Bangladesh's trusted e-commerce platform.",
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "bn-BD": siteUrl,
      "en-US": siteUrl,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#22c55e",
    "google-site-verification": "",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Bangladesh" />
        <meta name="facebook-domain-verification" content="" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Bangla Park Limited",
              alternateName: ["Bangla Park", "BanglaPark", "BanglaParkLtd"],
              url: siteUrl,
              logo: `${siteUrl}/favicon-96x96.png`,
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+8801823674796",
                contactType: "customer service",
                email: "banglaparkltd@gmail.com",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "BD",
              },
              sameAs: [
                "https://facebook.com/banglaparkltd",
                "https://youtube.com/@banglaparkltd",
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}

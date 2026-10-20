import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_SETTINGS } from "@/data/site-settings";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Orbitron — squared, wide techno letterforms in the spirit of the
 * Cybertruck wordmark. Reserved for major headings (neon treatments).
 * Only font-bold (700) is used across the neon system.
 */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Canonical origin comes from the deployment environment; localhost is the
  // dev-only fallback — never a hardcoded deployment hostname.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Vapetive — #1 Vape Shop in UAE | Instant Vape Delivery Online",
    // Pipe separator keeps generated titles scannable in SERPs while the
    // page-level titles carry the primary keywords.
    template: `%s | ${SITE_SETTINGS.brandName}`,
  },
  description: SITE_SETTINGS.description,
  keywords: [
    "vape shop UAE",
    "vape shop Dubai",
    "buy vape online UAE",
    "instant vape delivery UAE",
    "same day vape delivery Dubai",
    "disposable vape UAE",
    "e-liquid Dubai",
    "pod systems UAE",
    "nicotine salt e-liquid",
    "vape delivery UAE",
    "Elf Bar UAE",
    "Lost Mary UAE",
    "Geek Bar UAE",
    "Al Fakher vape",
    "Tugboat vape Dubai",
    "HQD Cuvie UAE",
    "Vozol vape",
    "Yuoto vape",
    "Fummo vape",
    "Maskking vape",
    "VGOD Stig UAE",
    "Silvaper vape",
    "vape AED price",
    "authentic vape UAE",
    "Vapetive",
  ],
  applicationName: SITE_SETTINGS.brandName,
  authors: [{ name: SITE_SETTINGS.brandLegalName }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: `${SITE_SETTINGS.brandName} — ${SITE_SETTINGS.tagline}`,
    description: SITE_SETTINGS.description,
    siteName: SITE_SETTINGS.brandName,
    type: "website",
    locale: "en_AE",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${SITE_SETTINGS.brandName} — ${SITE_SETTINGS.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_SETTINGS.brandName} — ${SITE_SETTINGS.tagline}`,
    description: SITE_SETTINGS.description,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#060409",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Smoke textures are referenced from CSS masks, which browsers
            discover late — preload the page-wide one so the vapor is
            visible on first paint, not seconds after. */}
        <link rel="preload" as="image" href="/smoke/smoke-wisps.png" fetchPriority="high" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only z-[9999] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
        {/* Site-wide structured data: Organisation + WebSite/SearchAction. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SITE_ORIGIN, JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/**
 * Root metadata constants — inlined here (NOT imported from src/data, which
 * is seed-only input). Runtime-editable settings live in KV via the settings
 * repo and surface on pages; the root document metadata stays static.
 */
const BRAND = {
  name: "VAPETIVE",
  legalName: "Vapetive Trading L.L.C.",
  tagline: "The UAE's #1 vape shop for instant online delivery",
  description:
    "Vapetive is the UAE's #1 vape shop for instant online delivery. Shop authentic disposable vapes, pod systems and e-liquids with transparent AED pricing, age-verified UAE-wide delivery and same-day dispatch from Dubai.",
} as const;

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
  // Canonical origin comes from the deployment environment; production builds
  // default to the live domain so a missing build-time variable can never bake
  // `localhost` into metadata (single source of truth: SITE_ORIGIN in seo.tsx).
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Vapetive — #1 Vape Shop in UAE | Instant Vape Delivery Online",
    // Pipe separator keeps generated titles scannable in SERPs while the
    // page-level titles carry the primary keywords.
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [
    "vape shop UAE",
    "vape shop Dubai",
    "buy vape online UAE",
    "instant vape delivery UAE",
    "same day vape delivery Dubai",
    "heat not burn UAE",
    "IQOS ILUMA UAE",
    "IQOS ILUMA sticks Dubai",
    "tobacco sticks UAE",
    "heat-not-burn tobacco",
    "IQOS ILUMA delivery Dubai",
    "IQOS ILUMA flavours",
    "vape delivery UAE",
    "vape AED price",
    "authentic vape UAE",
    "Vapetive",
  ],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.legalName }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    siteName: BRAND.name,
    type: "website",
    locale: "en_AE",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
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
        {/* ThemeProvider owns the html.light/dark class for the whole app
            (storefront + admin); default stays the dark brand palette. */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        {/* Site-wide structured data: Organisation + WebSite/SearchAction. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}

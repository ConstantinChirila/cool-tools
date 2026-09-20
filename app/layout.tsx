import type { Metadata, Viewport } from "next";
import { Gabarito, Nunito, Space_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const heading = Gabarito({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "800", "900"],
});

const body = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Free UK Calculators for Money and Everyday Maths`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  keywords: [
    "free online calculator",
    "UK calculators",
    "take home pay calculator",
    "mortgage calculator",
    "compound interest calculator",
    "percentage calculator",
  ],
  authors: [{ name: "Constantin Chirila", url: "https://constantinchirila.com" }],
  creator: "Constantin Chirila",
  category: "finance",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    url: "/",
    title: `${SITE_NAME}: Free UK Calculators for Money and Everyday Maths`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: Free UK Calculators`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f4",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${heading.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="dot-grid flex min-h-full flex-col">
        <CommandPalette />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "5f22e087a1b949a69a8dbe87597e46c4"}'
        />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Gabarito, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";

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
  title: {
    default: "Bits & Bobs",
    template: "%s · Bits & Bobs",
  },
  description:
    "Odd little tools that just work. Free calculators, no sign-up, nobody asks for your email.",
};

export const viewport: Viewport = {
  themeColor: "#fbf9f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="dot-grid flex min-h-full flex-col">
        <CommandPalette />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

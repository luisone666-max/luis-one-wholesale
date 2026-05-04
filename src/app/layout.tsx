import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://luisonesupplyhub.com"),
  title: "Luis One Supply Hub | Wholesale Ordering",
  description: "A professional Philippine wholesale shopping site with public tier pricing.",
  icons: {
    icon: "/brand/luis-one-logo.jpg",
    apple: "/brand/luis-one-logo.jpg",
  },
  verification: {
    google: "r77e8LP4lW3rg86Bu7f3LonWcWu0JCeb162YeGaF7X0",
  },
  openGraph: {
    title: "Luis One Supply Hub | Wholesale Ordering",
    description: "Wholesale supply for resellers and shops with public tier pricing.",
    url: "https://luisonesupplyhub.com",
    siteName: "Luis One Supply Hub",
    type: "website",
    images: [
      {
        url: "/brand/luis-one-logo.jpg",
        width: 1200,
        height: 1200,
        alt: "Luis One Supply Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luis One Supply Hub | Wholesale Ordering",
    description: "Wholesale supply for resellers and shops with public tier pricing.",
    images: ["/brand/luis-one-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950">{children}</body>
    </html>
  );
}

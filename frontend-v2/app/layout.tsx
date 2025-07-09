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
  title: "DownLink",
  description: "Download videos from YouTube and Instagram with ease.",
  keywords: [
    "DownLink",
    "video downloader",
    "YouTube downloader",
    "Instagram downloader"
  ],
  authors: [{ name: "DownLink" }],
  openGraph: {
    title: "DownLink",
    description: "Download videos from YouTube and Instagram with ease.",
    url: "https://downlink.webark.in",
    siteName: "DownLink",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DownLink Open Graph Image"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DownLink",
    description: "Download videos from YouTube and Instagram with ease.",
    images: ["/twitter-card.png"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

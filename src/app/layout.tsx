import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MetaPixel from "@/components/MetaPixel";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import PageViewTracker from "@/components/PageViewTracker";
import PageLoadingIndicator from "@/components/PageLoadingIndicator";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "Aralya | Compare Preschools in Metro Manila",
  description:
    "Aralya helps Filipino parents compare preschools across Metro Manila — updated tuition, curriculum, schedules & contact info in one easy place.",
  keywords: [
    "preschools in Metro Manila",
    "preschools in Taguig",
    "best preschools in BGC",
    "preschool tuition Manila",
    "compare preschools Metro Manila",
  ],
  icons: {
    icon: [
      { url: `${baseUrl}/images/card-logo.svg`, type: "image/svg+xml" },
      { url: `${baseUrl}/images/card-logo.svg`, sizes: "any" },
    ],
    apple: `${baseUrl}/images/card-logo.svg`,
    shortcut: `${baseUrl}/images/card-logo.svg`,
  },
  alternates: {
    canonical: `${baseUrl}/`,
  },
  openGraph: {
    title: "Aralya | Compare Preschools in Metro Manila",
    description:
      "Aralya helps Filipino parents compare preschools across Metro Manila — updated tuition, curriculum, schedules & contact info in one easy place.",
    url: baseUrl,
    siteName: "Aralya",
    images: [
      {
        url: `${baseUrl}/images/Logo.png`,
        width: 1200,
        height: 630,
        alt: "Aralya - Compare Preschools in Metro Manila",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aralya | Compare Preschools in Metro Manila",
    description:
      "Aralya helps Filipino parents compare preschools across Metro Manila — updated tuition, curriculum, schedules & contact info in one easy place.",
    images: [`${baseUrl}/images/Logo.png`],
  },
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
  metadataBase: new URL(baseUrl),
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
        <GoogleAnalytics />
        <MetaPixel />
        <MicrosoftClarity />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Suspense fallback={null}>
          <PageLoadingIndicator />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

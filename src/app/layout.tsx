import type { Metadata } from "next";
import { Young_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import FeedbackButton from "./components/FeedbackButton";

const youngSerif = Young_Serif({
  weight: "400",
  variable: "--font-young-serif",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Recipe Index — The recipe site you actually want to use",
    template: "%s | Recipe Index",
  },
  description: "A free, ad-free, community-driven recipe index. Structured recipes with cook mode, servings adjuster, and AI-powered recipe extraction from cooking videos.",
  metadataBase: new URL("https://www.recipeindex.org"),
  openGraph: {
    type: "website",
    siteName: "Recipe Index",
    title: "Recipe Index",
    description: "A free, ad-free, community-driven recipe index. No paywalls, no life stories. Just food.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Index",
    description: "A free, ad-free, community-driven recipe index. No paywalls, no life stories. Just food.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1C1917" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RecDex" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('recdex-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${youngSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <FeedbackButton />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){if(location.hostname!=='localhost'&&location.hostname!=='127.0.0.1'){navigator.serviceWorker.register('/sw.js')}})}`,
          }}
        />
      </body>
    </html>
  );
}

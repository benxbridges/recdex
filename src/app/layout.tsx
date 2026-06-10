import type { Metadata, Viewport } from "next";
import { Young_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";

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
    default: "Recipe Index — Any recipe, cook-ready",
    template: "%s | Recipe Index",
  },
  description: "Paste any recipe link or snap a cookbook page — get clean steps and timers that actually ring in cook mode. Free, ad-free, no app to install.",
  metadataBase: new URL("https://www.recipeindex.org"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Recipe Index",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    siteName: "Recipe Index",
    title: "Recipe Index",
    description: "Any recipe, cook-ready. No paywalls, no life stories. Just food.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Index",
    description: "Any recipe, cook-ready. No paywalls, no life stories. Just food.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1917",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('recdex-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${youngSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}

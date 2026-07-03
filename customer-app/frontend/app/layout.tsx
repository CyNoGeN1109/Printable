import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import config from "../store.config.json";

export const metadata: Metadata = {
  title: `${config.storeName} — Print shop`,
  description: config.storeTagline,
  openGraph: {
    title: `${config.storeName} — Print shop`,
    description: config.storeTagline,
    type: "website",
  },
  other: {
    "theme-color": "#0C831F",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Apply theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}

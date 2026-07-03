import type { Metadata } from "next";
import "./globals.css";

/* NOTE: update metadataBase when the final domain goes live */
const SITE_URL = "https://printable.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Printable — Smart QR & WhatsApp Printing | A Cynogen Product",
  description:
    "Printable automates printing via QR codes and WhatsApp. Scan or send, pay and print — no queues, no hassle. Your documents stay 100% private, never shared with the print partner. A Cynogen product.",
  keywords: [
    "print shop automation",
    "QR code printing",
    "WhatsApp printing",
    "online printing India",
    "print shop software",
    "Printable",
    "Cynogen",
  ],
  icons: { icon: "/printable-logo.jpeg" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Printable",
    title: "Printable — Scan. Send. Print. Private.",
    description:
      "QR + WhatsApp powered printing for India's print shops. Documents stay 100% private and the vendor's job runs itself. A Cynogen product.",
    images: [{ url: "/screenshots/screen-11.png", width: 1600, height: 900, alt: "Printable partner dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Printable — Scan. Send. Print. Private.",
    description:
      "QR + WhatsApp powered printing for India's print shops. Documents stay 100% private. A Cynogen product.",
    images: ["/screenshots/screen-11.png"],
  },
};

/* structured data for search engines */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Cynogen",
      brand: { "@type": "Brand", name: "Printable" },
      description:
        "Cynogen builds Printable — QR and WhatsApp powered printing automation for India's print shops.",
      email: "darsh.dave999@gmail.com",
      address: { "@type": "PostalAddress", addressLocality: "Indore", addressRegion: "Madhya Pradesh", addressCountry: "IN" },
      logo: `${SITE_URL}/printable-logo.jpeg`,
      url: SITE_URL,
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do I need to install an app to use Printable?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Scan the shop's QR and everything runs in your phone's browser — or forward your file to Printable's WhatsApp number with the shop code.",
          },
        },
        {
          "@type": "Question",
          name: "Is my document private?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Files upload to encrypted cloud storage, stream directly to the printer, and auto-delete. They are never stored on the print shop's computer.",
          },
        },
        {
          "@type": "Question",
          name: "How do I pay for prints?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "UPI, cards and wallets through Razorpay, or cash at the counter.",
          },
        },
        {
          "@type": "Question",
          name: "What does a print shop need to join Printable?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A Windows PC connected to a printer. Install the Printable desktop app, place the QR standee on the counter, and setup is done in under 30 minutes.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#f7faf5" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

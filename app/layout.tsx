import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import HashScrollManager from "../components/HashScrollManager";
import MicroInteractions from "../components/MicroInteractions";
import MotionProvider from "../components/MotionProvider";
import RouteTransition from "../components/RouteTransition";
import "./globals.css";

const instrumentSans = localFont({
  src: "../public/fonts/InstrumentSans-Variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  applicationName: "Karliq",
  title: {
    default: "Karliq | Design, utveckling & automation",
    template: "%s | Karliq",
  },
  description:
    "Karliq är Erik Karlssons digitala studio i Jönköpings län för design, interaktiva webbupplevelser, smart företagsautomation och AI-stödda lösningar.",
  metadataBase: new URL("https://karliq.se"),
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/karliq-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/karliq-icon.png", sizes: "512x512", type: "image/png" }],
  },
  keywords: [
    "Karliq",
    "webbdesign Jönköping",
    "webbutveckling Jönköping",
    "automation",
    "AI-lösningar",
    "digital studio",
  ],
  creator: "Karliq",
  publisher: "Karliq",
  openGraph: {
    title: "Karliq | Design, utveckling & automation",
    description: "Webbupplevelser och smarta företagsflöden där design, rörelse, kod och AI hänger ihop.",
    url: "/",
    siteName: "Karliq",
    locale: "sv_SE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Karliq webbstudio i Jönköpings län" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karliq | Webbstudio i Jönköpings län",
    description: "Digital design, utveckling, automation och AI-stödda lösningar från Karliq i Jönköpings län.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7c3aed",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://karliq.se/#business",
        "name": "Karliq",
        "alternateName": "Karliq Digital Studio",
        "url": "https://karliq.se",
        "logo": {
          "@type": "ImageObject",
          "url": "https://karliq.se/karliq-icon.png",
          "width": 512,
          "height": 512
        },
        "telephone": "+46763050531",
        "email": "erikkarlsson09@hotmail.com",
        "founder": {
          "@type": "Person",
          "name": "Erik Karlsson",
          "jobTitle": "Grundare & Utvecklare"
        },
        "address": {
          "@type": "PostalAddress",
        "addressLocality": "Jönköpings län",
          "addressCountry": "SE"
        },
        "description": "Digital studio i Jönköpings län för design, interaktiva webbupplevelser, företagsautomation och AI-stödda lösningar."
      },
      {
        "@type": "ProfessionalService",
        "@id": "https://karliq.se/#service",
        "name": "Karliq Digital Studio",
        "provider": { "@id": "https://karliq.se/#business" },
        "serviceType": [
          "Web Design & Development",
          "Interactive Web Experiences",
          "Motion Design",
          "3D Web Development",
          "Business Process Automation",
          "AI-assisted Business Solutions",
          "Systems Integration"
        ]
      }
    ]
  };

  return (
    <html lang="sv" className={instrumentSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Hoppa till innehållet</a>
        <MotionProvider>
          <RouteTransition />
          <MicroInteractions />
          <HashScrollManager />
          {children}
        </MotionProvider>
        <noscript>
          <div className="noscript-note">
            Karliq skapar digitala upplevelser och smarta företagsflöden genom design, motion, utveckling, automation och AI. Kontakta erikkarlsson09@hotmail.com.
          </div>
        </noscript>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import HashScrollManager from "../components/HashScrollManager";
import MicroInteractions from "../components/MicroInteractions";
import MotionProvider from "../components/MotionProvider";
import RouteTransition from "../components/RouteTransition";
import SiteHeader from "../components/SiteHeader";
import { email, siteOrigin, telephone, type Locale } from "../lib/site";
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
  metadataBase: new URL(siteOrigin),
  icons: {
    icon: [{ url: "/karliq-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/karliq-icon.png", sizes: "512x512", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7c3aed",
  colorScheme: "light",
};

export default function SiteLayout({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  const swedish = locale === "sv";

  const business = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteOrigin}/#business`,
    name: "Karliq",
    url: siteOrigin,
    logo: `${siteOrigin}/karliq-icon.png`,
    email,
    telephone,
    founder: { "@type": "Person", name: "Erik Karlsson" },
    address: {
      "@type": "PostalAddress",
      addressRegion: "Jönköpings län",
      addressCountry: "SE",
    },
    description: swedish
      ? "Automation och webbutveckling för företag."
      : "Business automation and web development.",
  };

  return (
    <html lang={locale} className={instrumentSans.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replace(/</g, "\\u003c") }}
        />
        <a className="skip-link" href="#main-content">
          {swedish ? "Hoppa till innehållet" : "Skip to content"}
        </a>
        <MotionProvider>
          <RouteTransition locale={locale} />
          <MicroInteractions />
          <HashScrollManager />
          <SiteHeader locale={locale} />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}

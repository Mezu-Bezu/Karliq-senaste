import type { Metadata } from "next";
import AgencyServices from "../components/AgencyServices";
import ClosingSwarm from "../components/ClosingSwarm";
import FounderSection from "../components/FounderSection";
import HeroVisual from "../components/HeroVisual";
import HomeMotion from "../components/HomeMotion";
import IntroSignal from "../components/IntroSignal";
import LogoMark from "../components/LogoMark";
import MethodWorkbench from "../components/MethodWorkbench";
import SignatureBridge from "../components/SignatureBridge";
import introStyles from "../components/IntroSignal.module.css";
import { tourCopy } from "../lib/tour";
import {
  alternatePaths, email, instagram, linkedin, pagePath, telephone, telephoneLabel, type Locale,
} from "../lib/site";
import styles from "./site-content.module.css";

const copy = {
  sv: {
    title: "Karliq | Automation och webbutveckling",
    description: "Karliq kopplar ihop dina system, automatiserar repetitiva uppgifter och bygger webbplatser för företag.",
    location: "Jönköpings län, Sverige",
    hero: ["Automatisera", "det som tar tid."],
    lead: "Jag kopplar ihop dina system så att du slipper mata in samma uppgifter flera gånger. Jag bygger också webbplatser, från design till lansering.",
    services: "Se tjänster",
    contact: "Prata om ett projekt",
    scroll: "Utforska Karliq",
    example: ["En förfrågan.", "Rätt person."],
    exampleText: "En ny förfrågan från din webbplats kan gå direkt in i kundregistret och ge rätt person en uppgift.",
    process: "Så går ett projekt till",
    web: "Webbutveckling",
    webText: "Jag designar och bygger webbplatser för företag. Om du behöver bokning eller formulär kopplar jag dem till kalendern eller kundsystemet.",
    work: "Projekt",
    closing: ["Vad vill du", "få gjort?"],
    phone: "Telefon",
    privacy: "Integritet och kakor",
  },
  en: {
    title: "Karliq | Business automation and web development",
    description: "Karliq connects your systems, automates repetitive tasks and builds websites for businesses.",
    location: "Jönköping County, Sweden",
    hero: ["Automate", "the busywork."],
    lead: "I connect the tools you use so you only enter information once. I also design and build websites.",
    services: "See services",
    contact: "Talk about a project",
    scroll: "Explore Karliq",
    example: ["A new enquiry.", "The right person."],
    exampleText: "An enquiry from your website can go straight into your CRM and create a task for the person who needs to follow up.",
    process: "How a project works",
    web: "Web development",
    webText: "I design and build websites for businesses. If you need bookings or forms, I can connect them to your calendar or CRM.",
    work: "Projects",
    closing: ["What needs", "to get done?"],
    phone: "Phone",
    privacy: "Privacy and cookies",
  },
};

export function homeMetadata(locale: Locale): Metadata {
  const { title, description } = copy[locale];
  const url = pagePath(locale);

  return {
    title,
    description,
    alternates: { canonical: url, languages: alternatePaths("home") },
    openGraph: {
      title,
      description,
      url,
      siteName: "Karliq",
      locale: locale === "sv" ? "sv_SE" : "en_GB",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Karliq" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

export default function Home({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const tour = tourCopy[locale];

  return (
    <main id="main-content" tabIndex={-1}>
      <HomeMotion />

      <div className={introStyles.sequence}>
        <section className="hero hero-green" id="top" aria-labelledby="hero-title">
          <HeroVisual />
          <div className="hero-grain" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-note hero-intro-item">{text.location}</p>
            <h1 id="hero-title">
              <span className="hero-line"><span>{text.hero[0]}</span></span>{" "}
              <span className="hero-line"><span>{text.hero[1]}</span></span>
            </h1>
            <div className="hero-bottom">
              <p className="hero-lead hero-intro-item">{text.lead}</p>
              <div className="hero-actions hero-intro-item">
                <a className="button button-primary" href="#services" data-magnetic>{text.services}</a>
                <a className="button button-secondary" href="#contact" data-magnetic>{text.contact}</a>
              </div>
            </div>
          </div>
          <div className="hero-route" aria-hidden="true">
            <span className="hero-route-progress" />
            <p>{text.scroll}</p>
          </div>
        </section>

        <div className={introStyles.story}>
          <IntroSignal />
          <section className="manifesto-scene" id="approach" aria-labelledby="approach-title">
            <div className="manifesto-copy" data-reveal="mask">
              <h2 id="approach-title">{text.example[0]}<br />{text.example[1]}</h2>
            </div>
            <div className="manifesto-note" data-reveal="line">
              <p>{text.exampleText}</p>
              <a href="#method">{text.process}</a>
            </div>
            <div className="manifesto-window" aria-hidden="true">
              <div className="manifesto-browser">
                <span>K</span><i /><i />
                <div><b /><b /><b /></div>
              </div>
            </div>
          </section>
          <MethodWorkbench locale={locale} />
        </div>
      </div>

      <SignatureBridge locale={locale} />
      <AgencyServices locale={locale} />
      <div className={styles.offerAndWork}>
        <section className={styles.offer} aria-labelledby="web-title">
          <h2 id="web-title" data-reveal="mask">{text.web}</h2>
          <div data-reveal="line">
            <p>{text.webText}</p>
            <a className={styles.textLink} href="#contact" data-micro>
              {text.contact} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <section className={styles.work} id="work" aria-labelledby="work-title">
          <h2 id="work-title" data-reveal="line">{text.work}</h2>
          <div data-reveal="line">
            <a className={styles.projectCard} href={pagePath(locale, "tour")} aria-labelledby="tour-title" data-micro>
              <div className={styles.projectText}>
                <h3 id="tour-title">{tour.title}</h3>
                <p>{tour.summary}</p>
              </div>
              <span className={styles.projectArrow} aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
      <FounderSection locale={locale} />

      <section className="closing-scene closing-green" id="contact" aria-labelledby="contact-title">
        <ClosingSwarm className="closing-swarm-field" locale={locale} />
        <div className="closing-green-top">
          <a href="#top" style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}>
            <LogoMark size={28} />
            <span>KARLIQ</span>
          </a>
        </div>
        <div className="closing-green-copy" data-reveal="mask">
          <h2 id="contact-title">{text.closing[0]}<br />{text.closing[1]}</h2>
          <a className="closing-mail" href={`mailto:${email}`} data-magnetic>{email}</a>
        </div>
        <div>
          <div className="closing-green-links">
            <a href={`tel:${telephone}`}>
              <span>{text.phone}</span><strong>{telephoneLabel}</strong>
            </a>
            <a href={linkedin} target="_blank" rel="noreferrer">
              <span>LinkedIn</span><strong>Erik Karlsson</strong>
            </a>
            <a href={instagram} target="_blank" rel="noreferrer">
              <span>Instagram</span><strong>@karliq.se</strong>
            </a>
            <a href="https://github.com/Mezu-Bezu" target="_blank" rel="noreferrer">
              <span>GitHub</span><strong>Mezu-Bezu</strong>
            </a>
          </div>
          <footer className={styles.closingLegal}>
            <a href={pagePath(locale, "privacy")} data-micro>{text.privacy}</a>
          </footer>
        </div>
      </section>
    </main>
  );
}

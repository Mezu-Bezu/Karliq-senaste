import AgencyServices from "../components/AgencyServices";
import ClosingSwarm from "../components/ClosingSwarm";
import FounderSection from "../components/FounderSection";
import HeroVisual from "../components/HeroVisual";
import HomeMotion from "../components/HomeMotion";
import LogoMark from "../components/LogoMark";
import MethodWorkbench from "../components/MethodWorkbench";
import SignatureBridge from "../components/SignatureBridge";
import SiteHeader from "../components/SiteHeader";
import IntroSignal from "../components/IntroSignal";
import introStyles from "../components/IntroSignal.module.css";

const linkedin = "https://www.linkedin.com/in/erik-karlsson-b41329424/";
const instagram = "https://www.instagram.com/karliq.se/";
const github = "https://github.com/Mezu-Bezu";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <HomeMotion />

        <div className={introStyles.sequence}>
          <section className="hero hero-green" id="top" aria-labelledby="hero-title">
            <HeroVisual />
            <div className="hero-grain" aria-hidden="true" />

            <div className="hero-copy">
              <p className="hero-note hero-intro-item">Karliq / digital studio / Jönköpings län</p>
              <h1 id="hero-title">
                <span className="hero-line"><span>Webb som lyfter.</span></span>
                <span className="hero-line"><span>Flöden som jobbar.</span></span>
              </h1>
              <div className="hero-bottom">
                <p className="hero-lead hero-intro-item">
                  Jag bygger webbsidor som sticker ut och automation som frigör din tid.
                </p>
                <div className="hero-actions hero-intro-item">
                  <a className="button button-primary" href="#services" data-magnetic>
                    Utforska tjänster
                  </a>
                  <a className="button button-secondary" href="#contact" data-magnetic>
                    Starta projekt
                  </a>
                </div>
              </div>
            </div>

            <div className="hero-side-note hero-intro-item" aria-hidden="true">
              <p>Webbdesign<br />Utveckling<br />Automation</p>
            </div>
            <p className="sr-only">
              Karliqs tredimensionella bokstäver och kopplingsformer rör sig i ett lila
              fält och reagerar på muspekaren.
            </p>
            <div className="hero-route" aria-hidden="true">
              <span className="hero-route-progress" />
              <p>Utforska Karliq</p>
            </div>
          </section>

          <div className={introStyles.story}>
            <IntroSignal />
          <section className="manifesto-scene" id="approach" aria-labelledby="approach-title">
            <div className="manifesto-copy" data-reveal="mask">
              <p>Nyfikenhet först. Teknik sedan.</p>
              <h2 id="approach-title">Det börjar<br />med ditt behov.</h2>
            </div>
            <div className="manifesto-note" data-reveal="line">
              <p>
                En tydligare webbplats. Färre manuella steg. Jag kopplar ihop det kunden ser med det som händer bakom.
              </p>
              <a href="#method">Se processen</a>
            </div>
            <div className="manifesto-window" aria-hidden="true">
              <div className="manifesto-browser">
                <span>K</span><i /><i />
                <div><b /><b /><b /></div>
              </div>
            </div>
          </section>
          <MethodWorkbench />
          </div>
        </div>

        <SignatureBridge />
        <AgencyServices />
        <div className="services-to-founder-transition" aria-hidden="true" />
        <FounderSection />

        <section className="closing-scene closing-green" id="contact" aria-labelledby="contact-title">
          <ClosingSwarm className="closing-swarm-field" />
          <div className="closing-green-top">
            <a href="#top" style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}>
              <LogoMark size={28} />
              <span>KARLIQ</span>
            </a>
            <p>Har du något som förtjänar att sticka ut?</p>
          </div>
          <div className="closing-green-copy" data-reveal="mask">
            <h2 id="contact-title">Låt oss bygga<br />något levande.</h2>
            <a className="closing-mail" href="mailto:contact@karliq.se" data-magnetic>
              Starta ett projekt
            </a>
          </div>
          <div className="closing-green-links">
            <a href="tel:+46763050531">
              <span>Telefon</span><strong>+46 76 305 05 31</strong>
            </a>
            <a href={linkedin} target="_blank" rel="noreferrer">
              <span>LinkedIn</span><strong>Erik Karlsson</strong>
            </a>
            <a href={instagram} target="_blank" rel="noreferrer">
              <span>Instagram</span><strong>@karliq.se</strong>
            </a>
            <a href={github} target="_blank" rel="noreferrer">
              <span>GitHub</span><strong>Mezu-Bezu</strong>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}

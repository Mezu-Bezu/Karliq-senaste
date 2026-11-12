import type { Locale } from "../lib/site";

export default function FounderSection({ locale }: { locale: Locale }) {
  const swedish = locale === "sv";

  return (
    <section className="agency-founder" id="founder" aria-labelledby="founder-title">
      <div className="founder-intro" data-reveal="mask">
        <h2 id="founder-title">{swedish ? "Bakom Karliq" : "Behind Karliq"}</h2>
      </div>

      <div className="founder-layout">
        <div className="founder-statement" data-reveal="line">
          <p>
            {swedish
              ? "Jag driver Karliq från Jönköpings län och jobbar med företag i hela Sverige. Du har kontakt med mig genom hela projektet."
              : "I run Karliq from Jönköping County and work with businesses across Sweden. You’ll deal directly with me throughout your project."}
          </p>
          <div className="founder-actions">
            <a className="button button-primary" href="#contact">{swedish ? "Kontakta mig" : "Get in touch"}</a>
          </div>
        </div>

        <dl className="founder-facts" data-reveal="line">
          <div>
            <dt>{swedish ? "Grundare och utvecklare" : "Founder and developer"}</dt>
            <dd>Erik Karlsson</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

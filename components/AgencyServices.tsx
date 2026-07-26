const services = [
  {
    number: "01",
    title: "Digital design",
    description:
      "Jag börjar med hierarkin: vad ska synas först, vad ska kännas och vad kan tas bort.",
    deliverables: ["Creative direction", "UX/UI", "Designsystem", "Responsiv art direction"],
    label: "Form",
  },
  {
    number: "02",
    title: "Motion & 3D",
    description:
      "Varje rörelse visar, svarar eller leder. Annars åker den bort.",
    deliverables: ["Scrollregi", "Microinteractions", "WebGL & 3D", "Prototyping"],
    label: "Rörelse",
  },
  {
    number: "03",
    title: "Utveckling",
    description:
      "Det du ser blir riktig Next.js-kod, testad på mobil och redo att publiceras.",
    deliverables: ["Next.js", "Interaktiva system", "CMS & integrationer", "Lansering"],
    label: "Kod",
  },
  {
    number: "04",
    title: "Automation & AI",
    description:
      "Jag bygger smarta flöden som kopplar ihop formulär, mejl, CRM och interna verktyg. AI används där den faktiskt kan tolka, sortera eller spara tid.",
    deliverables: ["Workflow automation", "AI-assistenter", "Systemintegrationer", "Interna verktyg"],
    label: "Flöden",
  },
] as const;

export default function AgencyServices() {
  return (
    <section className="agency-services" id="services" aria-labelledby="services-title">
      <header className="agency-services-head" data-reveal="mask">
        <div>
          <span>Vad Karliq gör</span>
          <h2 id="services-title">Design. Kod. Smarta flöden.</h2>
        </div>
        <p>
          Jag bygger både det kunden ser och flödena företaget behöver bakom.
        </p>
      </header>

      <div className="service-ledger" data-reveal="line">
        {services.map((service) => (
          <article className="service-ledger-row" key={service.number}>
            <span className="service-number">{service.number}</span>
            <div className="service-ledger-copy">
              <div>
                <h3>{service.title}</h3>
                <span>{service.label}</span>
              </div>
              <p>{service.description}</p>
            </div>
            <ul aria-label={`Detta ingår i ${service.title}`}>
              {service.deliverables.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <div className="services-closure" data-reveal="line">
        <p>Du pratar med samma person som formar, animerar och kodar.</p>
      </div>
    </section>
  );
}

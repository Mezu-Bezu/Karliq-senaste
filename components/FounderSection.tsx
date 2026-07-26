export default function FounderSection() {
  return (
    <section className="agency-founder" id="founder" aria-labelledby="founder-title">
      <div className="founder-intro" data-reveal="mask">
        <span>Studion bakom arbetet</span>
        <h2 id="founder-title">Direkt med den som bygger.</h2>
      </div>

      <div className="founder-layout">
        <div className="founder-statement" data-reveal="line">
          <p>
            Jag heter Erik Karlsson, är 17 år och driver Karliq från Jönköpings län. Jag är
            ambitiös i varje uppdrag, gillar att lära mig nytt och anpassar arbetssättet efter
            vad just ditt projekt behöver. Från första mötet till publicering jobbar du direkt med mig.
          </p>
          <div className="founder-actions">
            <a className="button button-primary" href="#contact">Prata projekt</a>
            <a className="founder-proof-link" href="#services">Se tjänster</a>
          </div>
        </div>

        <dl className="founder-facts" data-reveal="line">
          <div><dt>Grundare & utvecklare</dt><dd>Erik Karlsson</dd></div>
          <div><dt>Bas</dt><dd>Jönköpings län / arbetar i hela Sverige</dd></div>
          <div><dt>Arbetssätt</dt><dd>Ambitiös, nyfiken och anpassningsbar</dd></div>
          <div><dt>Fokus</dt><dd>Design, motion, automation, AI & utveckling</dd></div>
        </dl>
      </div>
    </section>
  );
}

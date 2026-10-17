export default function FounderSection() {
  return (
    <section className="agency-founder" id="founder" aria-labelledby="founder-title">
      <div className="founder-intro" data-reveal="mask">
        <span>Studion bakom arbetet</span>
        <h2 id="founder-title">Nära till nästa steg.</h2>
      </div>

      <div className="founder-layout">
        <div className="founder-statement" data-reveal="line">
          <p>
            Bakom Karliq finns Erik Karlsson i Jönköpings län. Här börjar ett projekt med
            ett samtal om vad du behöver. Du behöver inte ha en färdig plan eller veta
            vilken teknik som passar — det tar vi reda på tillsammans.
          </p>
          <div className="founder-actions">
            <a className="button button-primary" href="#contact">Prata projekt</a>
            <a className="founder-proof-link" href="#services">Se tjänster</a>
          </div>
        </div>

        <dl className="founder-facts" data-reveal="line">
          <div><dt>Grundare & utvecklare</dt><dd>Erik Karlsson</dd></div>
          <div><dt>Bas</dt><dd>Jönköpings län / arbetar i hela Sverige</dd></div>
          <div><dt>Arbetssätt</dt><dd>Direkt kontakt, tydliga förslag och löpande dialog</dd></div>
          <div><dt>Fokus</dt><dd>Webbutveckling & automationslösningar</dd></div>
        </dl>
      </div>
    </section>
  );
}

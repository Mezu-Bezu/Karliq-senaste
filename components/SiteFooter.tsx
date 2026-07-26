import LogoMark from "./LogoMark";

const email = "erikkarlsson09@hotmail.com";
const linkedin = "https://www.linkedin.com/in/erik-karlsson-b41329424/";
const instagram = "https://www.instagram.com/karliq.se/";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-topline" aria-hidden="true"><span /></div>
      <div className="footer-grid">
        <p>Karliq är Erik Karlssons studio för design, motion, utveckling och smart automation.</p>
        <div>
          <span>Kontakt</span>
          <a href={`mailto:${email}`}>{email}</a>
          <a href="tel:+46763050531">+46 76 305 05 31</a>
        </div>
        <div>
          <span>Följ</span>
          <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={instagram} target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </div>
      <a className="footer-word" href="#main-content" aria-label="Till sidans topp">
        <LogoMark size={64} className="footer-logo-mark" />
        {"KARLIQ".split("").map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
      </a>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} Erik Karlsson</span>
        <span>Byggd i Jönköpings län</span>
      </div>
    </footer>
  );
}

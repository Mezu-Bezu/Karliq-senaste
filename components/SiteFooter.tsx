import styles from "../app/site-content.module.css";
import { email, pagePath, type Locale } from "../lib/site";

export default function SiteFooter({ locale, showPrivacy }: { locale: Locale; showPrivacy: boolean }) {
  return (
    <footer className={styles.smallFooter}>
      <span>Karliq · Erik Karlsson</span>
      <div>
        <a href={`mailto:${email}`}>{email}</a>
        {showPrivacy && (
          <a href={pagePath(locale, "privacy")}>{locale === "sv" ? "Integritet och kakor" : "Privacy and cookies"}</a>
        )}
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import PrivacyNotice, { privacyMetadata } from "../components/PrivacyNotice";
import SiteFooter from "../components/SiteFooter";
import { alternatePaths, email, pagePath, type Locale, type SitePage } from "../lib/site";
import { tourCopy } from "../lib/tour";
import styles from "./site-content.module.css";

type Detail = Exclude<SitePage, "home">;

export function detailMetadata(locale: Locale, page: Detail): Metadata {
  const text = page === "tour" ? tourCopy[locale] : privacyMetadata(locale);
  const title = `${text.title} | Karliq`;
  const url = pagePath(locale, page);

  return {
    title,
    description: text.description,
    alternates: { canonical: url, languages: alternatePaths(page) },
    openGraph: {
      title,
      description: text.description,
      url,
      siteName: "Karliq",
      locale: locale === "sv" ? "sv_SE" : "en_GB",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Karliq" }],
    },
  };
}

export default function DetailPage({ locale, page }: { locale: Locale; page: Detail }) {
  const isTour = page === "tour";
  const tour = tourCopy[locale];
  const swedish = locale === "sv";
  const home = pagePath(locale);

  return (
    <main id="main-content" className={styles.detailPage} tabIndex={-1}>
      <div className={styles.detailInner}>
        <a className={styles.backLink} href={isTour ? `${home}#work` : home} data-micro>
          <span aria-hidden="true">←</span>
          {isTour ? tour.back : swedish ? "Till startsidan" : "Back to home"}
        </a>
        {isTour ? (
          <article className={styles.tourDetail} aria-labelledby="detail-title">
            <div>
              <h1 id="detail-title">{tour.title}</h1>
              <p className={styles.detailLead}>{tour.description}</p>
              <p className={styles.projectUpdate}>{tour.update}</p>
              <a
                className={styles.textLink}
                href={`mailto:${email}?subject=${encodeURIComponent(tour.title)}`}
                data-micro
              >
                {tour.contact} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className={styles.tourIllustration} aria-hidden="true">
              <span /><span /><span />
            </div>
          </article>
        ) : (
          <article className={styles.privacy} aria-labelledby="detail-title">
            <h1 id="detail-title">{privacyMetadata(locale).title}</h1>
            <PrivacyNotice locale={locale} />
          </article>
        )}
      </div>
      <SiteFooter locale={locale} showPrivacy={isTour} />
    </main>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { instagram, linkedin, pagePath, type Locale, type SitePage } from "../lib/site";
import LogoMark from "./LogoMark";

const navigation = {
  sv: {
    sections: ["Tjänster", "Projekt", "Om Karliq"],
    home: "Karliq, startsida",
    primary: "Primär navigering",
    mobile: "Mobil navigering",
    contact: "Kontakt",
    open: "Öppna meny",
    close: "Stäng menyn",
  },
  en: {
    sections: ["Services", "Projects", "About"],
    home: "Karliq, home",
    primary: "Primary navigation",
    mobile: "Mobile navigation",
    contact: "Contact",
    open: "Open menu",
    close: "Close menu",
  },
};

const sectionIds = ["services", "work", "founder"];

function focusNavigationDestination(destination: HTMLElement) {
  const addedTabIndex = !destination.hasAttribute("tabindex");
  if (addedTabIndex) destination.setAttribute("tabindex", "-1");
  destination.focus({ preventScroll: true });

  if (addedTabIndex) {
    destination.addEventListener(
      "blur",
      () => destination.removeAttribute("tabindex"),
      { once: true },
    );
  }
}

export default function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const text = navigation[locale];
  const home = pagePath(locale);
  const currentPage: SitePage = pathname === pagePath(locale, "tour")
    ? "tour"
    : pathname === pagePath(locale, "privacy") ? "privacy" : "home";
  const otherLocale = locale === "sv" ? "en" : "sv";
  const otherLanguage = locale === "sv" ? "English" : "Svenska";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tone, setTone] = useState<"light" | "dark" | "green">("light");
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pendingSection = useRef<string | null>(null);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 28);

      const sampleY = window.innerWidth <= 960 ? 54 : 48;
      const darkSection = Array.from(
        document.querySelectorAll<HTMLElement>(".agency-founder, .proof-case-2"),
      ).some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom > sampleY;
      });
      const greenSection = Array.from(
        document.querySelectorAll<HTMLElement>(".closing-green, .proof-case-1, .proof-case-3"),
      ).some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom > sampleY;
      });

      setTone(darkSection ? "dark" : greenSection ? "green" : "light");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main");

    if (!menuOpen) {
      main?.removeAttribute("inert");
      document.body.classList.remove("menu-open");
      const section = pendingSection.current;
      pendingSection.current = null;
      if (section) {
        const frame = requestAnimationFrame(() => {
          const destination = document.getElementById(section);
          if (destination) focusNavigationDestination(destination);
        });
        return () => cancelAnimationFrame(frame);
      }
      return;
    }

    main?.setAttribute("inert", "");
    document.body.classList.add("menu-open");

    const focusable = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    );
    focusable[0]?.focus();
    if (menuButtonRef.current) focusable.unshift(menuButtonRef.current);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      main?.removeAttribute("inert");
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  const sectionHref = (id: string) => `${pathname === home ? "" : home}#${id}`;
  const languageLink = (
    <a
      className="language-link"
      href={pagePath(otherLocale, currentPage)}
      hrefLang={otherLocale}
      lang={otherLocale}
      data-micro
      data-no-transition
    >
      {otherLanguage}
    </a>
  );

  return (
    <header className="site-header" data-scrolled={scrolled} data-open={menuOpen} data-tone={tone}>
      <a className="wordmark" href={sectionHref("top")} aria-label={text.home} inert={menuOpen}>
        <LogoMark size={28} />
        <span>KARLIQ</span>
        <i aria-hidden="true" />
      </a>

      <nav className="desktop-nav" aria-label={text.primary}>
        {sectionIds.map((id, index) => (
          <a className="nav-swap" href={sectionHref(id)} key={id} data-magnetic>
            <span>{text.sections[index]}</span>
            <span aria-hidden="true">{text.sections[index]}</span>
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <span className="header-language" inert={menuOpen}>{languageLink}</span>
        <a className="header-cta" href={sectionHref("contact")} data-magnetic>
          <span>{text.contact}</span>
        </a>
        <button
          className="menu-toggle"
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? text.close : text.open}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
      </div>

      <nav
        className="menu-panel"
        id="site-menu"
        ref={menuRef}
        aria-label={text.mobile}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="menu-panel-top">
          <span>Karliq</span>
        </div>
        <div className="menu-links">
          {[...sectionIds, "contact"].map((id, index) => (
            <a
              href={sectionHref(id)}
              key={id}
              style={{ "--menu-index": index } as React.CSSProperties}
              onClick={() => {
                if (pathname === home) pendingSection.current = id;
                setMenuOpen(false);
              }}
            >
              <span>{id === "contact" ? text.contact : text.sections[index]}</span>
              <i aria-hidden="true">↗</i>
            </a>
          ))}
        </div>
        <div className="menu-panel-bottom">
          <div>
            <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={instagram} target="_blank" rel="noreferrer">Instagram</a>
          </div>
          {languageLink}
        </div>
      </nav>
    </header>
  );
}

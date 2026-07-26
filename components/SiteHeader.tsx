"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LogoMark from "./LogoMark";

const navItems = [
  { label: "Process", href: "/#method" },
  { label: "Tjänster", href: "/#services" },
  { label: "Studio", href: "/#founder" },
];

const MOBILE_NAV_FOCUS_KEY = "karliq:mobile-navigation-focus";

type PendingMobileNavigation = {
  hash: string;
  pathname: string;
  search: string;
};

function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return "";
  }
}

function readPendingMobileNavigation(): PendingMobileNavigation | null {
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(MOBILE_NAV_FOCUS_KEY) ?? "null",
    ) as Partial<PendingMobileNavigation> | null;
    if (
      !value
      || typeof value.hash !== "string"
      || typeof value.pathname !== "string"
      || typeof value.search !== "string"
    ) {
      return null;
    }
    return value as PendingMobileNavigation;
  } catch {
    return null;
  }
}

function rememberMobileNavigation(anchor: HTMLAnchorElement) {
  try {
    const url = new URL(anchor.href);
    const pending: PendingMobileNavigation = {
      hash: url.hash,
      pathname: url.pathname,
      search: url.search,
    };
    window.sessionStorage.setItem(MOBILE_NAV_FOCUS_KEY, JSON.stringify(pending));
  } catch {
    // Navigation still works if storage is unavailable.
  }
}

function focusNavigationDestination(destination: HTMLElement) {
  const addedTabIndex = !destination.hasAttribute("tabindex");
  if (addedTabIndex) destination.setAttribute("tabindex", "-1");
  destination.focus({ preventScroll: true });

  if (document.activeElement !== destination) {
    if (addedTabIndex) destination.removeAttribute("tabindex");
    return false;
  }

  if (addedTabIndex) {
    destination.addEventListener(
      "blur",
      () => destination.removeAttribute("tabindex"),
      { once: true },
    );
  }
  return true;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tone, setTone] = useState<"light" | "dark" | "green">("light");
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
  }, []);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main");
    const footer = document.querySelector<HTMLElement>(".site-footer");

    if (!menuOpen) {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      document.body.classList.remove("menu-open");
      return;
    }

    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    document.body.classList.add("menu-open");

    const focusable = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    );
    focusable[0]?.focus();

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
      footer?.removeAttribute("inert");
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) return;

    let frame = 0;
    const timers: number[] = [];
    const focusPendingDestination = () => {
      const pending = readPendingMobileNavigation();
      if (
        !pending
        || pending.pathname !== window.location.pathname
        || pending.search !== window.location.search
      ) {
        return;
      }

      const destinationId = decodeHash(pending.hash);
      if (pending.hash && decodeHash(window.location.hash) !== destinationId) return;

      const destination = (
        destinationId ? document.getElementById(destinationId) : null
      ) ?? document.querySelector<HTMLElement>("main");
      if (!destination || destination.closest("[inert]")) return;
      if (!focusNavigationDestination(destination)) return;

      try {
        window.sessionStorage.removeItem(MOBILE_NAV_FOCUS_KEY);
      } catch {
        // Focus has already moved; storage cleanup is best-effort.
      }
    };
    const scheduleFocus = () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
      frame = window.requestAnimationFrame(focusPendingDestination);
      for (const delay of [120, 420, 900]) {
        timers.push(window.setTimeout(focusPendingDestination, delay));
      }
    };

    scheduleFocus();
    window.addEventListener("hashchange", scheduleFocus);
    window.addEventListener("pageshow", scheduleFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("hashchange", scheduleFocus);
      window.removeEventListener("pageshow", scheduleFocus);
    };
  }, [menuOpen, pathname]);

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const sectionHref = (href: string) => (pathname === "/" ? href.slice(1) : href);

  return (
    <header className="site-header" data-scrolled={scrolled} data-open={menuOpen} data-tone={tone}>
      <a className="wordmark" href={sectionHref("/#top")} aria-label="Karliq, startsida" onClick={() => closeMenu()}>
        <LogoMark size={28} />
        <span>KARLIQ</span>
        <i aria-hidden="true" />
      </a>

      <nav className="desktop-nav" aria-label="Primär navigering">
        {navItems.map((item) => (
          <a className="nav-swap" href={sectionHref(item.href)} key={item.href} data-magnetic>
            <span>{item.label}</span>
            <span aria-hidden="true">{item.label}</span>
          </a>
        ))}
      </nav>

      <a className="header-cta" href={sectionHref("/#contact")} data-magnetic>
        <span>Starta projekt</span>
      </a>

      <button
        className="menu-toggle"
        ref={menuButtonRef}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
      </button>

      <nav
        className="menu-panel"
        id="site-menu"
        ref={menuRef}
        aria-label="Mobil navigering"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="menu-panel-top">
          <span>Karliq / Jönköpings län</span>
          <span>{new Date().getFullYear()}</span>
        </div>
        <div className="menu-links">
          {navItems.map((item, index) => (
            <a
              href={sectionHref(item.href)}
              key={item.href}
              style={{ "--menu-index": index } as React.CSSProperties}
              onClick={(event) => {
                rememberMobileNavigation(event.currentTarget);
                closeMenu();
              }}
            >
              <small>0{index + 1}</small>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
        <div className="menu-panel-bottom">
          <div>
            <a href="https://www.linkedin.com/in/erik-karlsson-b41329424/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://www.instagram.com/karliq.se/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <button type="button" onClick={() => closeMenu(true)}>Stäng menyn</button>
        </div>
      </nav>
    </header>
  );
}

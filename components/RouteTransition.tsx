"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./RouteTransition.module.css";

type Phase = "hidden" | "cover" | "hold" | "reveal";

const PREFETCH_ROUTES = ["/"] as const;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ROUTE_TIMEOUT = 8_000;
const COVER_DURATION = 640;

function routeLabel(pathname: string) {
  if (pathname === "/") return "KARLIQ";
  return "KARLIQ";
}

function prepareHashTarget(hash: string) {
  if (!hash) return;

  let target: HTMLElement | null = null;
  try {
    target = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return;
  }
  if (!target) return;

  const computedMargin = Number.parseFloat(
    window.getComputedStyle(target).scrollMarginTop,
  ) || 0;
  if (computedMargin >= 1) return;

  const previousInlineMargin = target.style.scrollMarginTop;
  target.style.scrollMarginTop = "1px";
  window.setTimeout(() => {
    target?.style.setProperty("scroll-margin-top", previousInlineMargin);
  }, 1_200);
}

function focusDestination(hash: string, preserveScroll: boolean) {
  const expectedPath = window.location.pathname;
  let completed = false;

  const attempt = () => {
    if (completed || window.location.pathname !== expectedPath) return;
    if (!preserveScroll && !hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    let target: HTMLElement | null = null;
    if (hash) {
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        target = null;
      }
      if (!target) return;
    } else {
      target = document.querySelector<HTMLElement>("main#main-content");
    }
    if (!target) return;
    completed = true;

    if (hash) {
      prepareHashTarget(hash);
      target.scrollIntoView({ block: "start", behavior: "instant" });
    }

    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!hadTabIndex) {
      target.addEventListener("blur", () => target?.removeAttribute("tabindex"), {
        once: true,
      });
    }
  };

  attempt();
  window.requestAnimationFrame(attempt);
  for (const delay of [80, 220, 520, 980]) {
    window.setTimeout(attempt, delay);
  }
}

export default function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
  const pendingUrlRef = useRef<URL | null>(null);
  const transitionStartedAtRef = useRef(0);
  const pushTimerRef = useRef<number>(0);
  const settleTimerRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);
  const focusFrameRef = useRef<number>(0);
  const focusTimersRef = useRef<number[]>([]);
  const keyboardNavigationRef = useRef(false);
  const phaseRef = useRef<Phase>("hidden");
  const [phase, setPhaseState] = useState<Phase>("hidden");
  const [label, setLabel] = useState("KARLIQ");
  const [announcement, setAnnouncement] = useState("");

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const clearNavigationTimers = () => {
    window.clearTimeout(pushTimerRef.current);
    window.clearTimeout(settleTimerRef.current);
    window.clearTimeout(timeoutRef.current);
    pushTimerRef.current = 0;
    settleTimerRef.current = 0;
    timeoutRef.current = 0;
  };

  useEffect(() => {
    const prefetchTimer = window.setTimeout(() => {
      for (const route of PREFETCH_ROUTES) {
        if (route !== window.location.pathname) router.prefetch(route);
      }
    }, 120);

    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || phaseRef.current === "cover"
        || phaseRef.current === "hold"
      ) {
        return;
      }

      const source = event.target;
      if (!(source instanceof Element)) return;
      const anchor = source.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor
        || anchor.hasAttribute("download")
        || anchor.hasAttribute("data-no-transition")
      ) {
        return;
      }

      const target = anchor.getAttribute("target");
      if (target && target.toLowerCase() !== "_self") return;

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (
        (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:")
        || nextUrl.origin !== window.location.origin
        || nextUrl.pathname === window.location.pathname
      ) {
        return;
      }

      event.preventDefault();
      clearNavigationTimers();
      pendingUrlRef.current = nextUrl;
      transitionStartedAtRef.current = performance.now();
      setLabel(routeLabel(nextUrl.pathname));
      setAnnouncement(`Öppnar ${routeLabel(nextUrl.pathname).toLocaleLowerCase("sv-SE")}.`);
      setPhase("cover");

      const href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      const instant = window.matchMedia(REDUCED_MOTION_QUERY).matches;

      pushTimerRef.current = window.setTimeout(() => {
        setPhase("hold");
        try {
          router.push(href, { scroll: !nextUrl.hash });
        } catch {
          window.location.assign(href);
        }
      }, instant ? 0 : COVER_DURATION);

      timeoutRef.current = window.setTimeout(() => {
        window.location.assign(href);
      }, ROUTE_TIMEOUT);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearNavigationTimers();
      pendingUrlRef.current = null;
      setPhase("hidden");
      setAnnouncement("");
    };

    const clearFocusChecks = () => {
      window.cancelAnimationFrame(focusFrameRef.current);
      focusTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      focusTimersRef.current = [];
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keyboardNavigationRef.current = event.key === "Tab";
    };

    const onPointerDown = () => {
      keyboardNavigationRef.current = false;
      clearFocusChecks();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!keyboardNavigationRef.current) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      clearFocusChecks();

      const keepFocusedTargetVisible = () => {
        if (document.activeElement !== target) return;
        const bounds = target.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
          target.scrollIntoView({
            behavior: "instant",
            block: "center",
            inline: "nearest",
          });
        }
      };

      focusFrameRef.current = window.requestAnimationFrame(keepFocusedTargetVisible);
      for (const delay of [150, 450, 950]) {
        focusTimersRef.current.push(
          window.setTimeout(keepFocusedTargetVisible, delay),
        );
      }
    };

    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(prefetchTimer);
      clearNavigationTimers();
      clearFocusChecks();
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  useEffect(() => {
    if (pathname === previousPathRef.current) return;
    previousPathRef.current = pathname;

    // Browser history and programmatic changes stay native: this surface is
    // reserved for navigation clicks handled above.
    if (!pendingUrlRef.current) return;

    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(pushTimerRef.current);

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const elapsed = performance.now() - transitionStartedAtRef.current;
    const coverFloor = reducedMotion ? 0 : COVER_DURATION;
    const revealDelay = Math.max(0, coverFloor - elapsed);
    const pendingUrl = pendingUrlRef.current;
    prepareHashTarget(pendingUrl?.hash ?? window.location.hash);

    settleTimerRef.current = window.setTimeout(() => {
      setPhase("reveal");
      focusDestination(
        pendingUrl?.hash ?? window.location.hash,
        false,
      );

      settleTimerRef.current = window.setTimeout(() => {
        setPhase("hidden");
        setAnnouncement("");
        pendingUrlRef.current = null;
        }, reducedMotion ? 25 : 1_050);
    }, revealDelay);

    return () => window.clearTimeout(settleTimerRef.current);
  }, [pathname]);

  return (
    <>
      <div
        className={styles.overlay}
        data-route-transition
        data-phase={phase}
        aria-hidden="true"
      >
        <div className={styles.surface}>
          <div className={styles.whiteShape} />
          <div className={styles.darkShape} />
          <div className={styles.grain} />

          <div className={styles.copy}>
            <span>KARLIQ / VIDARE</span>
            <strong>{label}</strong>
          </div>

          <svg
            className={styles.route}
            viewBox="0 0 1600 700"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              className={styles.routeGhost}
              d="M-120 540C218 238 430 665 714 359C972 81 1140 491 1722 82"
            />
            <path
              className={styles.routeLive}
              d="M-120 540C218 238 430 665 714 359C972 81 1140 491 1722 82"
            />
          </svg>

          <div className={styles.mark}>
            <img src="/karliq-logo-mark.png" alt="Karliq" />
          </div>
        </div>
      </div>

      <p className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>

      <noscript>
        <style>{`.${styles.overlay}{display:none!important}`}</style>
      </noscript>
    </>
  );
}

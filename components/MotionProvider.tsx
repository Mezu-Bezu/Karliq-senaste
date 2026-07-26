"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, registerMotion, ScrollTrigger } from "./motion";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const STATIC_REVEAL_TARGETS = [
  "[data-reveal]",
  "[data-proof-reveal]",
  ".site-header",
  ".hero-line > span",
  ".hero-intro-item",
  ".hero-copy",
  ".proof-page-hero .proof-hero-line > span",
  ".proof-hero-support > *",
  ".proof-specimen",
  ".service-ledger-row",
  ".service-ledger-row li",
  ".founder-facts > div",
  ".closing-green-copy h2",
].join(", ");

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    registerMotion();
    const timer = window.setTimeout(() => {
      if (!window.matchMedia(REDUCED_MOTION_QUERY).matches) ScrollTrigger.refresh();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    registerMotion();
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const pointerQuery = window.matchMedia(COARSE_POINTER_QUERY);
    let disposed = false;
    let refreshFrame = 0;
    let lenis: Lenis | null = null;
    let removeLenisScrollListener: (() => void) | null = null;
    let tickerUpdate: ((time: number) => void) | null = null;
    let scrollTriggersDisabled = false;
    let timelinePausedByPreference = false;

    const scheduleRefresh = () => {
      if (disposed) return;
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        if (!disposed && !motionQuery.matches) ScrollTrigger.refresh();
      });
    };

    const stopSmoothScroll = () => {
      if (tickerUpdate) {
        gsap.ticker.remove(tickerUpdate);
        tickerUpdate = null;
      }
      removeLenisScrollListener?.();
      removeLenisScrollListener = null;
      if (lenis) {
        lenis.stop();
        lenis.destroy();
        lenis = null;
      }
    };

    const startSmoothScroll = () => {
      if (lenis || motionQuery.matches || pointerQuery.matches) return;

      const instance = new Lenis({
        duration: 1.05,
        wheelMultiplier: 0.9,
        smoothWheel: true,
        touchMultiplier: 1,
      });
      const update = (time: number) => instance.raf(time * 1000);

      lenis = instance;
      tickerUpdate = update;
      removeLenisScrollListener = instance.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(1000, 16);
    };

    const showStaticReveals = () => {
      gsap.set(STATIC_REVEAL_TARGETS, {
        clearProps: "transform,clipPath,opacity,visibility",
        autoAlpha: 1,
      });
    };

    const applyPreferences = () => {
      const reduced = motionQuery.matches;
      document.documentElement.dataset.motion = reduced ? "reduced" : "full";

      if (reduced) {
        stopSmoothScroll();
        if (!scrollTriggersDisabled) {
          ScrollTrigger.disable(true, false);
          scrollTriggersDisabled = true;
        }
        showStaticReveals();
        if (!gsap.globalTimeline.paused()) {
          gsap.globalTimeline.pause();
          timelinePausedByPreference = true;
        }
        return;
      }

      if (timelinePausedByPreference) {
        gsap.globalTimeline.resume();
        timelinePausedByPreference = false;
      }
      if (scrollTriggersDisabled) {
        ScrollTrigger.enable();
        scrollTriggersDisabled = false;
      }

      if (pointerQuery.matches) stopSmoothScroll();
      else startSmoothScroll();
      scheduleRefresh();
    };

    const refresh = () => scheduleRefresh();
    applyPreferences();
    motionQuery.addEventListener("change", applyPreferences);
    pointerQuery.addEventListener("change", applyPreferences);
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener("load", refresh, { once: true });

    return () => {
      disposed = true;
      motionQuery.removeEventListener("change", applyPreferences);
      pointerQuery.removeEventListener("change", applyPreferences);
      window.removeEventListener("load", refresh);
      window.cancelAnimationFrame(refreshFrame);
      stopSmoothScroll();
      if (timelinePausedByPreference) gsap.globalTimeline.resume();
      if (scrollTriggersDisabled) ScrollTrigger.enable();
      delete document.documentElement.dataset.motion;
    };
  }, []);

  return children;
}

"use client";

import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSyncExternalStore } from "react";

let registered = false;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function registerMotion() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(Observer, ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.defaults({ invalidateOnRefresh: true });
  registered = true;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => true,
  );
}

export { gsap, Observer, ScrollTrigger };

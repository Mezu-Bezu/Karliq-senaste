"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SCROLL_KEYS = new Set([
  " ",
  "Spacebar",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

function getCurrentHashTarget() {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash) return null;

  try {
    return document.getElementById(decodeURIComponent(rawHash));
  } catch {
    return null;
  }
}

export default function HashScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const timers: number[] = [];
    let frame = 0;
    let userInterrupted = false;

    const cancelScheduledScrolls = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
    };

    const interruptForUserScroll = () => {
      userInterrupted = true;
      cancelScheduledScrolls();
    };

    const scrollToCurrentHash = () => {
      if (userInterrupted) return;
      const target = getCurrentHashTarget();
      if (!target) return;

      target.scrollIntoView({ block: "start", behavior: "instant" });
    };

    const scheduleScroll = () => {
      cancelScheduledScrolls();
      userInterrupted = false;

      frame = window.requestAnimationFrame(scrollToCurrentHash);
      for (const delay of [120, 420, 900]) {
        timers.push(window.setTimeout(scrollToCurrentHash, delay));
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && SCROLL_KEYS.has(event.key)) interruptForUserScroll();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.pointerType === "mouse"
        && event.clientX >= document.documentElement.clientWidth
      ) {
        interruptForUserScroll();
      }
    };

    scheduleScroll();
    window.addEventListener("hashchange", scheduleScroll);
    window.addEventListener("pageshow", scheduleScroll);
    window.addEventListener("wheel", interruptForUserScroll, { passive: true });
    window.addEventListener("touchstart", interruptForUserScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      cancelScheduledScrolls();
      window.removeEventListener("hashchange", scheduleScroll);
      window.removeEventListener("pageshow", scheduleScroll);
      window.removeEventListener("wheel", interruptForUserScroll);
      window.removeEventListener("touchstart", interruptForUserScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pathname]);

  return null;
}

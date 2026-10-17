"use client";

import { useEffect, useRef } from "react";
import { gsap, registerMotion, usePrefersReducedMotion } from "./motion";
import styles from "./IntroSignal.module.css";

// A travelling stroke, measured in the actual section's coordinate space.
// Equal scroll distances reveal equal lengths of the stroke, including loops.
export default function IntroSignal({ variant = "scene" }: { variant?: "scene" | "bridge" }) {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const svg = ref.current;
    const container = svg?.parentElement;
    const section = container?.querySelector<HTMLElement>(".manifesto-scene") ?? container;
    const path = svg?.querySelector("path");
    if (!svg || !section || !path) return;
    registerMotion();
    const progress = { value: 0 };
    let routeHeight = 1;
    const scrollDistance = () => routeHeight + window.innerHeight * .3;
    const render = () => {
      const head = reduced ? 100 : gsap.utils.clamp(0, 100, progress.value * 100);
      path.style.strokeDasharray = `${Math.max(.001, head)} 100`;
      path.style.strokeDashoffset = "0";
      path.style.opacity = "1";
    };
    const measure = () => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      const extension = variant === "scene" ? Math.max(320, h * .46) : 0;
      routeHeight = h + extension;
      svg.setAttribute("viewBox", `0 0 ${w} ${h + extension}`);
      svg.style.height = `${h + extension}px`;
      const point = (x: number, y: number) => `${(x * w).toFixed(2)} ${(y * h).toFixed(2)}`;
      const mobile = w < 720;
      // Route the loops through the negative space, rather than assigning
      // a separate display area to the line.
      const d = variant === "bridge"
        ? mobile
          ? `M${point(1.08, .03)} C${point(.74, -.02)} ${point(.54, .06)} ${point(.69, .13)} C${point(.94, .22)} ${point(1.1, .09)} ${point(.87, .08)} C${point(.53, .06)} ${point(.05, .18)} ${point(.04, .35)} C${point(.03, .52)} ${point(.09, .7)} ${point(-.08, .86)}`
          : `M${point(1.08, .04)} C${point(.72, -.05)} ${point(.55, .13)} ${point(.76, .22)} C${point(.99, .32)} ${point(1.05, .1)} ${point(.84, .13)} C${point(.58, .17)} ${point(.3, .28)} ${point(.28, .48)} C${point(.25, .72)} ${point(.45, .88)} ${point(.27, 1.08)}`
        : mobile
          ? `M${point(-.1, .17)} C${point(.13, .16)} ${point(.52, .24)} ${point(.48, .4)} C${point(.44, .57)} ${point(-.11, .54)} ${point(.05, .4)} C${point(.23, .25)} ${point(.93, .36)} ${point(.94, .57)} C${point(.96, .81)} ${point(.58, .87)} ${point(.83, 1.1)} C${point(.98, 1.24)} ${point(.88, 1.32)} ${point(1.1, 1.42)}`
          : `M${point(-.08, .13)} C${point(.12, .12)} ${point(.27, .29)} ${point(.22, .49)} C${point(.16, .73)} ${point(-.02, .65)} ${point(.07, .46)} C${point(.17, .24)} ${point(.55, .42)} ${point(.75, .34)} C${point(1.02, .24)} ${point(1.05, .71)} ${point(.8, .72)} C${point(.51, .73)} ${point(.69, .92)} ${point(.76, 1.08)} C${point(.83, 1.24)} ${point(.98, 1.24)} ${point(1.1, 1.34)}`;
      path.setAttribute("d", d);
      render();
    };
    measure();
    const context = gsap.context(() => {
      if (reduced) { progress.value = 1; return; }
      gsap.to(progress, { value: 1, ease: "none", onUpdate: render,
        scrollTrigger: { trigger: section, start: "top bottom", end: () => `+=${scrollDistance()}`, scrub: .45 } });
    }, section);
    const resize = new ResizeObserver(measure);
    resize.observe(section);
    return () => { resize.disconnect(); context.revert(); };
  }, [reduced, variant]);
  return (
    <svg ref={ref} className={styles.signal} data-variant={variant} data-scroll-ribbons
      fill="none" aria-hidden="true">
      <path className={styles.ink} pathLength="100" />
    </svg>
  );
}

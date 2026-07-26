"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";

export default function ProofMotion() {
  useEffect(() => {
    registerMotion();
    const reducedMotion = prefersReducedMotion();
    const revealTweens = new Map<HTMLElement, gsap.core.Tween>();

    const context = gsap.context(() => {
      const indexElement = document.querySelector<HTMLElement>(".proof-index");
      const cases = Array.from(document.querySelectorAll<HTMLElement>(".proof-case"));
      if (indexElement && cases.length) {
        const links = Array.from(indexElement.querySelectorAll<HTMLAnchorElement>("a"));
        const setCurrent = (activeIndex: number) => {
          links.forEach((link, index) => {
            if (index === activeIndex) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        };

        cases.forEach((item, index) => {
          ScrollTrigger.create({
            trigger: item,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: ({ isActive }) => {
              if (isActive) setCurrent(index);
            },
          });
        });
      }

      if (reducedMotion) {
        gsap.set("[data-proof-reveal]", { clearProps: "all", autoAlpha: 1 });
        return;
      }

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .fromTo(".proof-page-hero .proof-hero-line > span", { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.08 }, 0.15)
        .fromTo(".proof-hero-support > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.08 }, 0.5)
        .fromTo(".proof-specimen", { scale: 0.9, rotate: 7, autoAlpha: 0 }, { scale: 1, rotate: 2, autoAlpha: 1, duration: 1.15 }, 0.28);

      gsap.utils.toArray<HTMLElement>("[data-proof-reveal]").forEach((element, index) => {
        const line = index % 2 === 0;
        const tween = gsap.fromTo(
          element,
          line ? { x: -24, opacity: 0 } : { clipPath: "inset(0 0 100% 0)", y: 24, opacity: 0 },
          {
            x: 0,
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            opacity: 1,
            duration: 0.9,
            ease: "power4.out",
            scrollTrigger: { trigger: element, start: "top 84%", once: true },
          },
        );
        revealTweens.set(element, tween);
      });

      gsap.to(".proof-specimen", {
        yPercent: 13,
        rotate: -2,
        ease: "none",
        scrollTrigger: { trigger: ".proof-page-hero", start: "top top", end: "bottom top", scrub: 0.8 },
      });
    });

    const revealFocusedContainer = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const element = target.closest<HTMLElement>("[data-proof-reveal]");
      if (!element) return;

      const tween = revealTweens.get(element);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      revealTweens.delete(element);
      gsap.set(element, {
        clearProps: "transform,clipPath,opacity,visibility",
      });
      window.requestAnimationFrame(() => {
        if (document.activeElement !== target) return;
        const bounds = target.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
          target.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
        }
      });
    };
    document.addEventListener("focusin", revealFocusedContainer);

    ScrollTrigger.refresh();
    return () => {
      document.removeEventListener("focusin", revealFocusedContainer);
      context.revert();
    };
  }, []);

  return null;
}

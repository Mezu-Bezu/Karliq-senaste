"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";

export default function HomeMotion() {
  useEffect(() => {
    registerMotion();
    const reduced = prefersReducedMotion();
    const cleanups: Array<() => void> = [];
    const revealTweens = new Map<HTMLElement, gsap.core.Tween>();

    if (reduced) {
      gsap.set("[data-reveal], .hero-line > span, .hero-intro-item", {
        clearProps: "all",
        autoAlpha: 1,
      });
      return;
    }

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .fromTo(
          ".site-header",
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.72,
            clearProps: "all",
          },
          0.08,
        )
        .fromTo(".hero-line > span", { yPercent: 115 }, { yPercent: 0, duration: 1.05, stagger: 0.08 }, 0.14)
        .fromTo(".hero-intro-item", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.82, stagger: 0.08 }, 0.48);

      gsap.utils.toArray<HTMLElement>('[data-reveal="mask"]').forEach((element) => {
        const isServicesHeading = element.classList.contains("agency-services-head");
        const tween = gsap.fromTo(
          element,
          {
            clipPath: "inset(0 0 100% 0)",
            y: isServicesHeading ? 16 : 28,
            opacity: 0,
          },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            opacity: 1,
            duration: isServicesHeading ? 0.58 : 0.95,
            ease: "power4.out",
            scrollTrigger: {
              trigger: element,
              start: isServicesHeading ? "top 94%" : "top 84%",
              once: true,
            },
          },
        );
        revealTweens.set(element, tween);
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal="line"]').forEach((element) => {
        const tween = gsap.fromTo(
          element,
          { x: -24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.78,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          },
        );
        revealTweens.set(element, tween);
      });

      gsap.to(".hero-copy", {
        yPercent: 13,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 36%", scrub: 0.7 },
      });

      gsap.to(".hero-route-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      gsap.fromTo(
        ".founder-facts > div",
        { x: 34, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.68,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".founder-facts",
            start: "top 82%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".closing-green-copy h2",
        { scale: 0.88, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".closing-green",
            start: "top 72%",
            end: "top 28%",
            scrub: 0.55,
          },
        },
      );
    });

    const revealFocusedContainer = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const element = target.closest<HTMLElement>("[data-reveal]");
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
    cleanups.push(() => document.removeEventListener("focusin", revealFocusedContainer));

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (finePointer.matches) {
      const magnetic = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
      magnetic.forEach((element) => {
        const onMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) * 0.1;
          const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
          gsap.to(element, { x, y, duration: 0.34, ease: "power3.out", overwrite: true });
        };
        const onLeave = () => gsap.to(element, { x: 0, y: 0, duration: 0.5, ease: "power4.out", overwrite: true });
        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          element.removeEventListener("pointermove", onMove);
          element.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-proof-parallax]"));
    parallax.forEach((element) => {
      const onMove = (event: PointerEvent) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.setProperty("--proof-x", x.toFixed(3));
        element.style.setProperty("--proof-y", y.toFixed(3));
      };
      const onLeave = () => {
        element.style.setProperty("--proof-x", "0");
        element.style.setProperty("--proof-y", "0");
      };
      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
      });
    });

    ScrollTrigger.refresh();
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return null;
}

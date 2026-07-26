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
      const heroThread = document.querySelector<SVGPathElement>(".green-thread-hero path");
      const manifestoThread = document.querySelector<SVGPathElement>(".green-thread-manifesto path");

      if (heroThread) {
        const length = heroThread.getTotalLength();
        gsap.set(heroThread, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        intro.to(
          heroThread,
          {
            strokeDashoffset: 0,
            duration: 1.65,
            ease: "power3.inOut",
          },
          0.05,
        );
      }

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

      if (manifestoThread) {
        const length = manifestoThread.getTotalLength();
        gsap.fromTo(
          manifestoThread,
          {
            strokeDasharray: length,
            strokeDashoffset: length,
          },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".manifesto-scene",
              start: "top 82%",
              end: "bottom 48%",
              scrub: 0.75,
            },
          },
        );
      }

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

      [[".method-thread-entry span", ".method-scene"]].forEach(([line, trigger]) => {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger, start: "top bottom", end: "top 35%", scrub: true },
          },
        );
      });

      gsap.fromTo(
        ".manifesto-window",
        { yPercent: 14, rotate: -2.4 },
        {
          yPercent: -5,
          rotate: -0.8,
          ease: "none",
          scrollTrigger: {
            trigger: ".manifesto-scene",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".service-ledger-row").forEach((row, index) => {
        gsap.fromTo(
          row,
          { y: 44, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.85,
            delay: index * 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 88%", once: true },
          },
        );

        gsap.fromTo(
          row.querySelectorAll("li"),
          { x: 18, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 78%", once: true },
          },
        );
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

    const manifestoWindow = document.querySelector<HTMLElement>(".manifesto-window");
    if (manifestoWindow) {
      const onMove = (event: PointerEvent) => {
        const rect = manifestoWindow.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        gsap.to(manifestoWindow, {
          rotateX: y * -4,
          rotateY: x * 5,
          transformPerspective: 900,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
      };
      const onLeave = () => {
        gsap.to(manifestoWindow, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.7,
          ease: "power4.out",
          overwrite: "auto",
        });
      };
      manifestoWindow.addEventListener("pointermove", onMove);
      manifestoWindow.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        manifestoWindow.removeEventListener("pointermove", onMove);
        manifestoWindow.removeEventListener("pointerleave", onLeave);
      });
    }

    const serviceRows = Array.from(document.querySelectorAll<HTMLElement>(".service-ledger-row"));
    serviceRows.forEach((row) => {
      const heading = row.querySelector<HTMLElement>("h3");
      const number = row.querySelector<HTMLElement>(".service-number");
      const onMove = (event: PointerEvent) => {
        const rect = row.getBoundingClientRect();
        const xProgress = (event.clientX - rect.left) / rect.width;
        const yProgress = (event.clientY - rect.top) / rect.height;
        row.style.setProperty("--service-x", `${(xProgress * 100).toFixed(1)}%`);
        row.style.setProperty("--service-y", `${(yProgress * 100).toFixed(1)}%`);
        if (heading) {
          gsap.to(heading, {
            x: (xProgress - 0.5) * 16,
            y: (yProgress - 0.5) * 8,
            duration: 0.38,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
        if (number) {
          gsap.to(number, {
            y: (yProgress - 0.5) * -12,
            duration: 0.42,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      };
      const onLeave = () => {
        row.style.setProperty("--service-x", "50%");
        row.style.setProperty("--service-y", "50%");
        if (heading) gsap.to(heading, { x: 0, y: 0, duration: 0.65, ease: "power4.out" });
        if (number) gsap.to(number, { y: 0, duration: 0.65, ease: "power4.out" });
      };
      row.addEventListener("pointermove", onMove);
      row.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        row.removeEventListener("pointermove", onMove);
        row.removeEventListener("pointerleave", onLeave);
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

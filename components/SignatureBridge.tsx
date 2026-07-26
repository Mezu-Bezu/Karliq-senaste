"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";
import styles from "./SignatureBridge.module.css";

const stages = [
  { number: "01", label: "Idé" },
  { number: "02", label: "Form" },
  { number: "03", label: "Kod" },
] as const;

export default function SignatureBridge() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const carrierRef = useRef<SVGGElement>(null);
  const pointerFieldRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    registerMotion();

    const root = rootRef.current;
    const stage = stageRef.current;
    const route = routeRef.current;
    const carrier = carrierRef.current;
    const pointerField = pointerFieldRef.current;
    if (!root || !stage || !route || !carrier || !pointerField) return;

    const reducedMotion = prefersReducedMotion();
    const routeLength = route.getTotalLength();
    route.style.strokeDasharray = `${routeLength}`;
    route.style.strokeDashoffset = reducedMotion ? "0" : `${routeLength}`;

    const selectStage = (next: number) => {
      if (next === activeRef.current) return;
      activeRef.current = next;
      setActive(next);
    };

    const placeCarrier = (progress: number) => {
      const clamped = Math.min(1, Math.max(0, progress));
      const carrierProgress = 0.055 + clamped * 0.88;
      const point = route.getPointAtLength(routeLength * carrierProgress);
      const next = route.getPointAtLength(
        Math.min(routeLength, routeLength * carrierProgress + 2),
      );
      const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);
      carrier.setAttribute(
        "transform",
        `translate(${point.x} ${point.y}) rotate(${angle})`,
      );
    };

    if (reducedMotion) {
      selectStage(1);
      placeCarrier(0.52);
      gsap.set("[data-bridge-line]", { yPercent: 0 });
      gsap.set("[data-bridge-kicker]", { opacity: 1, y: 0 });
      return;
    }

    const context = gsap.context(() => {
      gsap.set("[data-bridge-line]", { yPercent: 140 });
      gsap.set("[data-bridge-kicker]", { opacity: 0, y: 18 });
      gsap.set("[data-bridge-exit]", { yPercent: 105 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.65,
            onUpdate: ({ progress }) => {
              const routeProgress = gsap.utils.clamp(0, 1, (progress - 0.1) / 0.78);
              route.style.strokeDashoffset = `${routeLength * (1 - routeProgress)}`;
              placeCarrier(routeProgress);
              selectStage(Math.min(2, Math.floor(routeProgress * 2.75)));
            },
          },
        })
        .to("[data-bridge-entry]", { yPercent: -112, duration: 0.14, ease: "power2.inOut" }, 0)
        .to("[data-bridge-line]", { yPercent: 0, duration: 0.18, stagger: 0.035, ease: "power3.out" }, 0.06)
        .to("[data-bridge-kicker]", { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.1)
        .to("[data-bridge-title]", { xPercent: 2.2, duration: 0.72, ease: "none" }, 0.2)
        .to("[data-bridge-title='reverse']", { xPercent: -4.4, duration: 0.72, ease: "none" }, 0.2)
        .to("[data-bridge-loop]", { rotate: 205, scale: 1.13, duration: 0.72, ease: "none" }, 0.18)
        .to("[data-bridge-exit]", { yPercent: 0, duration: 0.16, ease: "power2.inOut" }, 0.84);
    }, root);

    const moveX = gsap.quickTo(pointerField, "x", {
      duration: 0.7,
      ease: "power3.out",
    });
    const moveY = gsap.quickTo(pointerField, "y", {
      duration: 0.7,
      ease: "power3.out",
    });
    const rotate = gsap.quickTo(pointerField, "rotation", {
      duration: 1,
      ease: "power3.out",
    });

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      moveX(x * 30);
      moveY(y * 20);
      rotate(x * 2.5);
    };

    const onPointerLeave = () => {
      moveX(0);
      moveY(0);
      rotate(0);
    };

    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", onPointerLeave);
    ScrollTrigger.refresh();

    return () => {
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      context.revert();
    };
  }, []);

  const chooseStage = (index: number) => {
    activeRef.current = index;
    setActive(index);

    const route = routeRef.current;
    const carrier = carrierRef.current;
    if (!route || !carrier || prefersReducedMotion()) return;

    const routeLength = route.getTotalLength();
    const progress = [0.08, 0.52, 0.91][index];
    route.style.strokeDashoffset = `${routeLength * (1 - progress)}`;
    const point = route.getPointAtLength(routeLength * progress);
    carrier.setAttribute("transform", `translate(${point.x} ${point.y})`);
  };

  const moveStageFocus = (index: number) => {
    chooseStage(index);
    window.requestAnimationFrame(() => {
      const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>(
        `.${styles.stageControls} button`,
      );
      buttons?.[index]?.focus();
    });
  };

  return (
    <section
      className={styles.root}
      id="signature-bridge"
      ref={rootRef}
      data-phase={active}
      aria-labelledby="signature-bridge-title"
    >
      <div className={styles.sticky} ref={stageRef}>
        <div className={styles.entryWipe} data-bridge-entry aria-hidden="true" />
        <div className={styles.exitWipe} data-bridge-exit aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        <header className={styles.heading}>
          <p data-bridge-kicker>Från första strecket till sista raden</p>
          <h2 id="signature-bridge-title">
            <span className={styles.lineMask}>
              <span data-bridge-line style={{ display: "inline-block" }}>
                <span data-bridge-title style={{ display: "inline-block" }}>
                  Samma hand.
                </span>
              </span>
            </span>
            <span className={styles.lineMask}>
              <span data-bridge-line style={{ display: "inline-block" }}>
                <span data-bridge-title="reverse" style={{ display: "inline-block" }}>
                  Hela vägen.
                </span>
              </span>
            </span>
          </h2>
        </header>

        <div className={styles.pointerField} ref={pointerFieldRef} aria-hidden="true">
          <div className={`${styles.artifact} ${styles.sketch}`} data-active={active === 0}>
            <span>IDÉ / 01</span>
            <svg viewBox="0 0 180 160" fill="none">
              <path d="M25 116C41 62 73 27 145 35C118 46 95 75 80 130" />
              <path d="M44 103C78 93 105 98 143 124" />
              <circle cx="145" cy="35" r="5" />
            </svg>
          </div>

          <div className={`${styles.artifact} ${styles.motion}`} data-active={active === 1}>
            <span>FORM / 02</span>
            <div className={styles.loop} data-bridge-loop>
              <i />
              <i />
              <b />
            </div>
          </div>

          <div className={`${styles.artifact} ${styles.code}`} data-active={active === 2}>
            <span>KOD / 03</span>
            <div>
              <i>&lt;main&gt;</i>
              <i>&nbsp;&nbsp;motion=&quot;true&quot;</i>
              <i>&nbsp;&nbsp;idea=&quot;intact&quot;</i>
              <i>&lt;/main&gt;</i>
            </div>
          </div>
        </div>

        <svg
          className={styles.route}
          viewBox="0 0 1200 500"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            className={styles.routeGhost}
            d="M-80 386C147 168 288 435 481 281C666 134 697 410 873 249C1018 117 1100 197 1280 58"
          />
          <path
            className={styles.routeLive}
            ref={routeRef}
            d="M-80 386C147 168 288 435 481 281C666 134 697 410 873 249C1018 117 1100 197 1280 58"
          />
          <g className={styles.carrier} ref={carrierRef}>
            <circle r="34" />
            <image
              href="/karliq-logo-mark-white.png"
              x="-22"
              y="-15"
              width="44"
              height="30"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </svg>

        <div className={styles.stageControls} role="group" aria-label="Visa stegen från idé till kod">
          {stages.map((item, index) => (
            <button
              type="button"
              key={item.label}
              aria-pressed={active === index}
              tabIndex={active === index ? 0 : -1}
              onClick={() => chooseStage(index)}
              onFocus={() => chooseStage(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  moveStageFocus((index + 1) % stages.length);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveStageFocus((index - 1 + stages.length) % stages.length);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  moveStageFocus(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  moveStageFocus(stages.length - 1);
                }
              }}
            >
              <span>{item.number}</span>
              {item.label}
            </button>
          ))}
        </div>

        <p className={styles.srOnly}>
          Samma person formar idén, regisserar rörelsen och skriver koden.
        </p>
      </div>
    </section>
  );
}

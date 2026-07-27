"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, Observer, prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";
import styles from "./SignatureBridge.module.css";

const MOBILE_SCROLL_QUERY = "(max-width: 760px) and (pointer: coarse)";
const MOBILE_MAX_PROGRESS_PER_SECOND = 0.34;
const MOBILE_TOUCH_MOMENTUM_MS = 850;

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
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const governMobileScroll = window.matchMedia(MOBILE_SCROLL_QUERY).matches;
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
      if (coarsePointer) {
        // The route intentionally fills a tall phone viewport. Its SVG is
        // therefore stretched more vertically than horizontally, so counter
        // that stretch for the circular Karliq marker only.
        const bounds = route.ownerSVGElement?.getBoundingClientRect();
        const scaleX = (bounds?.width ?? 1200) / 1200;
        const scaleY = (bounds?.height ?? 500) / 500;
        const compensateX = scaleX > 0 ? scaleY / scaleX : 1;
        carrier.setAttribute(
          "transform",
          `translate(${point.x} ${point.y}) scale(${compensateX} 1)`,
        );
        return;
      }

      carrier.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
    };

    if (reducedMotion) {
      selectStage(1);
      placeCarrier(0.52);
      gsap.set("[data-bridge-line]", { yPercent: 0 });
      gsap.set("[data-bridge-kicker]", { opacity: 1, y: 0 });
      return;
    }

    let removeMobileGovernor = () => {};

    const context = gsap.context(() => {
      gsap.set("[data-bridge-line]", { yPercent: 140 });
      gsap.set("[data-bridge-kicker]", { opacity: 0, y: 18 });
      gsap.set("[data-bridge-exit]", { yPercent: 105 });

      const timeline = gsap
        .timeline({ paused: governMobileScroll })
        .to("[data-bridge-entry]", { yPercent: -112, duration: 0.14, ease: "power2.inOut" }, 0)
        .to("[data-bridge-line]", { yPercent: 0, duration: 0.18, stagger: 0.035, ease: "power3.out" }, 0.06)
        .to("[data-bridge-kicker]", { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.1)
        .to("[data-bridge-title]", { xPercent: 2.2, duration: 0.72, ease: "none" }, 0.2)
        .to("[data-bridge-title='reverse']", { xPercent: -4.4, duration: 0.72, ease: "none" }, 0.2)
        .to("[data-bridge-loop]", { rotate: 205, scale: 1.13, duration: 0.72, ease: "none" }, 0.18)
        .to("[data-bridge-exit]", { yPercent: 0, duration: 0.16, ease: "power2.inOut" }, 0.84);

      const renderProgress = (progress: number) => {
        const clamped = gsap.utils.clamp(0, 1, progress);
        const routeProgress = gsap.utils.clamp(0, 1, (clamped - 0.1) / 0.78);
        route.style.strokeDashoffset = `${routeLength * (1 - routeProgress)}`;
        placeCarrier(routeProgress);
        selectStage(Math.min(2, Math.floor(routeProgress * 2.75)));
        root.dataset.bridgeProgress = clamped.toFixed(3);
      };

      if (!governMobileScroll) {
        ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          animation: timeline,
          scrub: coarsePointer ? 1.25 : 0.65,
          onUpdate: ({ progress }) => renderProgress(progress),
        });
        return;
      }

      let displayedProgress = 0;
      let targetProgress = 0;
      let governorFrame = 0;
      let lastFrameTime = 0;
      let lastTouchTime = Number.NEGATIVE_INFINITY;
      let locked = false;
      let lockScrollY = 0;
      let queuedDirection = 1;
      let bypassUntil = 0;
      let bridgeTrigger: ScrollTrigger | null = null;

      const renderGovernedProgress = (progress: number) => {
        displayedProgress = gsap.utils.clamp(0, 1, progress);
        timeline.progress(displayedProgress).pause();
        renderProgress(displayedProgress);
      };

      const release = (direction: 1 | -1) => {
        if (!bridgeTrigger) return;
        locked = false;
        root.dataset.mobileScrollGoverned = "false";
        touchObserver.disable();
        bypassUntil = performance.now() + MOBILE_TOUCH_MOMENTUM_MS;
        const destination =
          direction > 0 ? bridgeTrigger.end + 2 : bridgeTrigger.start - 2;
        window.requestAnimationFrame(() => {
          window.scrollTo(0, destination);
          ScrollTrigger.update();
        });
      };

      const advanceGovernor = (time: number) => {
        if (!lastFrameTime) lastFrameTime = time;
        const elapsed = Math.min(0.05, Math.max(0, (time - lastFrameTime) / 1000));
        lastFrameTime = time;
        const distance = targetProgress - displayedProgress;
        const step = MOBILE_MAX_PROGRESS_PER_SECOND * elapsed;

        if (Math.abs(distance) <= Math.max(step, 0.0005)) {
          renderGovernedProgress(targetProgress);
          governorFrame = 0;
          lastFrameTime = 0;

          if (targetProgress >= 0.999 && queuedDirection > 0) release(1);
          else if (targetProgress <= 0.001 && queuedDirection < 0) release(-1);
          return;
        }

        renderGovernedProgress(displayedProgress + Math.sign(distance) * step);
        governorFrame = window.requestAnimationFrame(advanceGovernor);
      };

      const startGovernor = () => {
        if (governorFrame) return;
        lastFrameTime = 0;
        governorFrame = window.requestAnimationFrame(advanceGovernor);
      };

      const touchObserver = Observer.create({
        target: window,
        type: "touch",
        preventDefault: true,
        lockAxis: true,
        tolerance: 2,
        onChangeY: (self) => {
          if (!locked) return;
          const delta = -self.deltaY / Math.max(640, window.innerHeight * 1.05);
          if (Math.abs(delta) < 0.001) return;
          queuedDirection = delta > 0 ? 1 : -1;
          targetProgress = gsap.utils.clamp(0, 1, targetProgress + delta);
          startGovernor();
        },
      });
      touchObserver.disable();

      const activateLock = (direction: 1 | -1, self: ScrollTrigger) => {
        if (locked || performance.now() < bypassUntil) return;
        locked = true;
        queuedDirection = direction;
        displayedProgress = direction > 0 ? 0 : 1;
        targetProgress = displayedProgress;
        lockScrollY = direction > 0 ? self.start : self.end;
        renderGovernedProgress(displayedProgress);
        root.dataset.mobileScrollGoverned = "true";
        window.scrollTo(0, lockScrollY);
        touchObserver.enable();
      };

      const markTouch = () => {
        lastTouchTime = performance.now();
      };
      window.addEventListener("touchstart", markTouch, { passive: true });

      const isTouchDriven = () =>
        performance.now() - lastTouchTime <= MOBILE_TOUCH_MOMENTUM_MS;

      bridgeTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onEnter: (self) => {
          if (isTouchDriven()) activateLock(1, self);
        },
        onEnterBack: (self) => {
          if (isTouchDriven()) activateLock(-1, self);
        },
        onUpdate: (self) => {
          if (locked) return;
          if (isTouchDriven() && self.isActive) {
            activateLock(self.direction > 0 ? 1 : -1, self);
          } else if (!isTouchDriven()) {
            renderGovernedProgress(self.progress);
          }
        },
      });

      root.dataset.mobileScrollGoverned = "false";
      renderGovernedProgress(bridgeTrigger.progress);

      removeMobileGovernor = () => {
        window.cancelAnimationFrame(governorFrame);
        window.removeEventListener("touchstart", markTouch);
        touchObserver.kill();
        delete root.dataset.mobileScrollGoverned;
        delete root.dataset.bridgeProgress;
      };
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
      removeMobileGovernor();
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

    if (window.matchMedia("(pointer: coarse)").matches) {
      const bounds = route.ownerSVGElement?.getBoundingClientRect();
      const scaleX = (bounds?.width ?? 1200) / 1200;
      const scaleY = (bounds?.height ?? 500) / 500;
      const compensateX = scaleX > 0 ? scaleY / scaleX : 1;
      carrier.setAttribute(
        "transform",
        `translate(${point.x} ${point.y}) scale(${compensateX} 1)`,
      );
      return;
    }

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

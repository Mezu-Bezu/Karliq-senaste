"use client";

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type KineticTypePlaygroundProps = {
  className?: string;
};

type Composition = {
  word: string;
  eyebrow: string;
  caption: string;
  size: "short" | "medium" | "long";
};

type GlyphMotion = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  vx: number;
  vy: number;
  vr: number;
  vsx: number;
  vsy: number;
};

type GlyphCenter = {
  x: number;
  y: number;
};

const COMPOSITIONS: Composition[] = [
  {
    word: "FORM",
    eyebrow: "01 / FORM",
    caption: "BÖJ DEN",
    size: "short",
  },
  {
    word: "RÖRELSE",
    eyebrow: "02 / RÖRELSE",
    caption: "SÄTT FART",
    size: "long",
  },
  {
    word: "KOD",
    eyebrow: "03 / KOD",
    caption: "BYGG DEN",
    size: "short",
  },
  {
    word: "KARLIQ",
    eyebrow: "04 / KARLIQ",
    caption: "IGEN",
    size: "medium",
  },
];

const EMPTY_MOTION = (): GlyphMotion => ({
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  vx: 0,
  vy: 0,
  vr: 0,
  vsx: 0,
  vsy: 0,
});

export default function KineticTypePlayground({
  className = "",
}: KineticTypePlaygroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const echoRef = useRef<HTMLDivElement>(null);
  const glyphRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const centersRef = useRef<GlyphCenter[]>([]);
  const motionRef = useRef<GlyphMotion[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    active: false,
    velocityX: 0,
    velocityY: 0,
    previousX: 0,
    previousY: 0,
  });
  const measureRef = useRef(true);
  const visibleRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const reducedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const [compositionIndex, setCompositionIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const composition = COMPOSITIONS[compositionIndex];

  useLayoutEffect(() => {
    glyphRefs.current = glyphRefs.current.slice(0, composition.word.length);
    centersRef.current = [];
    motionRef.current = Array.from(
      { length: composition.word.length },
      EMPTY_MOTION,
    );
    measureRef.current = true;
  }, [composition.word]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      const rootBounds = root.getBoundingClientRect();
      centersRef.current = glyphRefs.current.map((glyph) => {
        if (!glyph) {
          return { x: rootBounds.width / 2, y: rootBounds.height / 2 };
        }

        const bounds = glyph.getBoundingClientRect();
        return {
          x: bounds.left - rootBounds.left + bounds.width / 2,
          y: bounds.top - rootBounds.top + bounds.height / 2,
        };
      });
      measureRef.current = false;
    };

    const stopLoop = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const drawStatic = () => {
      glyphRefs.current.forEach((glyph) => {
        if (glyph) glyph.style.transform = "";
      });
      if (echoRef.current) echoRef.current.style.transform = "";
    };

    const frame = (now: number) => {
      frameRef.current = null;
      if (
        reducedRef.current ||
        !visibleRef.current ||
        !pageVisibleRef.current
      ) {
        return;
      }

      if (measureRef.current) measure();

      const previous = lastFrameRef.current || now;
      const delta = Math.min(2, Math.max(0.35, (now - previous) / 16.667));
      lastFrameRef.current = now;
      const pointer = pointerRef.current;
      const rootBounds = root.getBoundingClientRect();
      const radius = Math.max(
        150,
        Math.min(330, rootBounds.width * 0.27),
      );
      const time = now * 0.001;
      const speed = Math.min(
        1,
        Math.hypot(pointer.velocityX, pointer.velocityY) / 55,
      );

      glyphRefs.current.forEach((glyph, index) => {
        if (!glyph) return;

        const center = centersRef.current[index] ?? {
          x: rootBounds.width / 2,
          y: rootBounds.height / 2,
        };
        const dx = center.x - pointer.x;
        const dy = center.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const proximity = pointer.active
          ? Math.pow(Math.max(0, 1 - distance / radius), 1.7)
          : 0;
        const directionX = dx / distance;
        const directionY = dy / distance;
        const polarity = index % 2 === 0 ? 1 : -1;
        const idle = Math.sin(time * 1.35 + index * 0.82);
        const motion =
          motionRef.current[index] ??
          (motionRef.current[index] = EMPTY_MOTION());

        const targetX =
          directionX * proximity * 42 +
          -directionY * proximity * speed * 20 +
          idle * 0.65;
        const targetY =
          directionY * proximity * 30 +
          directionX * proximity * speed * 13 +
          Math.cos(time * 1.08 + index * 0.74) * 1.3;
        const targetRotation =
          polarity * proximity * (8 + speed * 7) + idle * 0.42;
        const targetScaleX = 1 + proximity * (0.2 + speed * 0.08);
        const targetScaleY = 1 - proximity * 0.095;
        const spring = 0.095 * delta;
        const damping = Math.pow(0.74, delta);

        motion.vx = (motion.vx + (targetX - motion.x) * spring) * damping;
        motion.vy = (motion.vy + (targetY - motion.y) * spring) * damping;
        motion.vr =
          (motion.vr + (targetRotation - motion.rotation) * spring) *
          damping;
        motion.vsx =
          (motion.vsx + (targetScaleX - motion.scaleX) * spring) * damping;
        motion.vsy =
          (motion.vsy + (targetScaleY - motion.scaleY) * spring) * damping;

        motion.x += motion.vx * delta;
        motion.y += motion.vy * delta;
        motion.rotation += motion.vr * delta;
        motion.scaleX += motion.vsx * delta;
        motion.scaleY += motion.vsy * delta;

        glyph.style.transform = `translate3d(${motion.x.toFixed(2)}px, ${motion.y.toFixed(2)}px, 0) rotate(${motion.rotation.toFixed(2)}deg) scale(${motion.scaleX.toFixed(3)}, ${motion.scaleY.toFixed(3)})`;
      });

      if (echoRef.current) {
        const normalizedX =
          pointer.active && rootBounds.width > 0
            ? pointer.x / rootBounds.width - 0.5
            : 0;
        const normalizedY =
          pointer.active && rootBounds.height > 0
            ? pointer.y / rootBounds.height - 0.5
            : 0;
        echoRef.current.style.transform = `translate3d(calc(-50% + ${(normalizedX * -22).toFixed(2)}px), calc(-50% + ${(normalizedY * -14).toFixed(2)}px), 0) rotate(${(-4 + normalizedX * 3).toFixed(2)}deg)`;
      }

      pointer.velocityX *= 0.82;
      pointer.velocityY *= 0.82;
      frameRef.current = window.requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (
        frameRef.current !== null ||
        reducedRef.current ||
        !visibleRef.current ||
        !pageVisibleRef.current
      ) {
        return;
      }
      lastFrameRef.current = performance.now();
      frameRef.current = window.requestAnimationFrame(frame);
    };

    const updateMotionPreference = () => {
      reducedRef.current = motionQuery.matches;
      setReducedMotion(motionQuery.matches);
      if (motionQuery.matches) {
        stopLoop();
        drawStatic();
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      measureRef.current = true;
    });
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: "12% 0px", threshold: 0.01 },
    );
    const onVisibilityChange = () => {
      pageVisibleRef.current = document.visibilityState === "visible";
      if (pageVisibleRef.current) startLoop();
      else stopLoop();
    };

    resizeObserver.observe(root);
    intersectionObserver.observe(root);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", updateMotionPreference);
    updateMotionPreference();
    startLoop();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", updateMotionPreference);
    };
  }, [composition.word]);

  const updatePointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) return;

      const bounds = root.getBoundingClientRect();
      const x = Math.min(bounds.width, Math.max(0, event.clientX - bounds.left));
      const y = Math.min(
        bounds.height,
        Math.max(0, event.clientY - bounds.top),
      );
      const pointer = pointerRef.current;
      pointer.velocityX = x - pointer.previousX;
      pointer.velocityY = y - pointer.previousY;
      pointer.previousX = x;
      pointer.previousY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    },
    [],
  );

  const cycleComposition = useCallback((direction = 1) => {
    setCompositionIndex(
      (current) =>
        (current + direction + COMPOSITIONS.length) % COMPOSITIONS.length,
    );
  }, []);

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (root) {
        const bounds = root.getBoundingClientRect();
        pointerRef.current.previousX = event.clientX - bounds.left;
        pointerRef.current.previousY = event.clientY - bounds.top;
      }
      updatePointer(event);
    },
    [updatePointer],
  );

  const onPointerLeave = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      pointerRef.current.active = false;
    }
  }, []);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        cycleComposition(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycleComposition(-1);
      }
    },
    [cycleComposition],
  );

  const classes = [
    "kinetic-type",
    `kinetic-type--state-${compositionIndex}`,
    `kinetic-type--${composition.size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const style = {
    "--kinetic-glyph-count": composition.word.length,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={classes}
      style={style}
      role="button"
      tabIndex={0}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label={`Kinetisk typografi, ${composition.word}. Dra med pekare eller touch för att forma bokstäverna. Tryck för nästa komposition.`}
      onPointerEnter={onPointerEnter}
      onPointerMove={updatePointer}
      onPointerDown={updatePointer}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={() => cycleComposition(1)}
      onKeyDown={onKeyDown}
    >
      <div className="kinetic-type__shape kinetic-type__shape--disc" aria-hidden="true" />
      <div className="kinetic-type__shape kinetic-type__shape--bar" aria-hidden="true" />
      <div className="kinetic-type__frame" aria-hidden="true" />

      <div className="kinetic-type__topline" aria-hidden="true">
        <span>{composition.eyebrow}</span>
        <span>{reducedMotion ? "STILL / TRYCK" : "RÖR / TRYCK"}</span>
      </div>

      <div
        ref={echoRef}
        className="kinetic-type__echo"
        data-word={composition.word}
        aria-hidden="true"
      >
        {composition.word}
      </div>

      <div
        key={composition.word}
        className="kinetic-type__word"
        aria-hidden="true"
      >
        {Array.from(composition.word).map((letter, index) => (
          <span
            key={`${composition.word}-${index}`}
            ref={(node) => {
              glyphRefs.current[index] = node;
            }}
            className="kinetic-type__glyph"
          >
            <span
              className="kinetic-type__ink"
              style={{ animationDelay: `${index * 42}ms` }}
            >
              {letter}
            </span>
          </span>
        ))}
      </div>

      <div className="kinetic-type__bottomline" aria-hidden="true">
        <span>{composition.caption}</span>
        <span>
          {String(compositionIndex + 1).padStart(2, "0")} /{" "}
          {String(COMPOSITIONS.length).padStart(2, "0")}
        </span>
      </div>

      <p className="kinetic-type__sr-only" aria-live="polite" aria-atomic="true">
        Komposition {compositionIndex + 1} av {COMPOSITIONS.length}:{" "}
        {composition.word}.
      </p>

      <style>{`
        .kinetic-type {
          position: relative;
          width: 100%;
          min-height: clamp(34rem, 74svh, 53rem);
          overflow: hidden;
          isolation: isolate;
          container-type: inline-size;
          border: 1px solid rgba(45, 10, 75, 0.22);
          border-radius: clamp(1.25rem, 2.8vw, 2.5rem);
          background: #faf6ff;
          color: #160826;
          cursor: pointer;
          outline: none;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
          transition:
            color 680ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 680ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .kinetic-type::after {
          position: absolute;
          z-index: 10;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -7rem 12rem rgba(35, 10, 60, 0.035);
          content: "";
          pointer-events: none;
        }

        .kinetic-type:focus-visible {
          box-shadow:
            0 0 0 3px #faf6ff,
            0 0 0 6px #7c3aed;
        }

        .kinetic-type--state-1 {
          border-color: rgba(245, 235, 255, 0.24);
          background: #160826;
          color: #faf6ff;
        }

        .kinetic-type--state-2 {
          border-color: rgba(45, 10, 75, 0.2);
          background: #d8b4fe;
          color: #160826;
        }

        .kinetic-type--state-3 {
          background: #faf6ff;
          color: #160826;
        }

        .kinetic-type__frame {
          position: absolute;
          z-index: 1;
          inset: clamp(3.2rem, 7cqw, 5.7rem) clamp(1.1rem, 3.2cqw, 3rem);
          border: 1px solid currentColor;
          border-radius: 999px;
          opacity: 0.13;
          transform: scaleX(1.08);
          transition:
            border-radius 800ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 500ms ease,
            transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .kinetic-type--state-1 .kinetic-type__frame {
          border-radius: clamp(1rem, 2.4cqw, 2rem);
          opacity: 0.18;
          transform: scale(0.88, 1.08) rotate(-2deg);
        }

        .kinetic-type--state-2 .kinetic-type__frame {
          border-radius: 50%;
          opacity: 0.18;
          transform: scale(0.68, 1.38) rotate(12deg);
        }

        .kinetic-type--state-3 .kinetic-type__frame {
          border-radius: clamp(1rem, 2cqw, 1.7rem);
          opacity: 0.22;
          transform: scale(0.94, 0.86) rotate(1deg);
        }

        .kinetic-type__shape {
          position: absolute;
          pointer-events: none;
          transition:
            width 900ms cubic-bezier(0.16, 1, 0.3, 1),
            height 900ms cubic-bezier(0.16, 1, 0.3, 1),
            border-radius 900ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 500ms ease,
            transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .kinetic-type__shape--disc {
          z-index: 2;
          top: 50%;
          left: 62%;
          width: min(44cqw, 33rem);
          aspect-ratio: 1;
          border-radius: 50%;
          background: #d8b4fe;
          opacity: 0.92;
          transform: translate(-50%, -50%) scale(1);
        }

        .kinetic-type--state-1 .kinetic-type__shape--disc {
          left: 18%;
          width: min(31cqw, 24rem);
          border-radius: 18%;
          background: #d8b4fe;
          opacity: 0.98;
          transform: translate(-50%, -50%) rotate(18deg);
        }

        .kinetic-type--state-2 .kinetic-type__shape--disc {
          top: 43%;
          left: 70%;
          width: min(38cqw, 29rem);
          border-radius: 50%;
          background: #faf6ff;
          opacity: 0.92;
          transform: translate(-50%, -50%) scale(1.25, 0.62) rotate(-12deg);
        }

        .kinetic-type--state-3 .kinetic-type__shape--disc {
          top: 52%;
          left: 50%;
          width: min(58cqw, 43rem);
          border: clamp(1.2rem, 3.2cqw, 3.25rem) solid #d8b4fe;
          background: transparent;
          opacity: 0.82;
          transform: translate(-50%, -50%) scale(1.16, 0.72) rotate(-5deg);
        }

        .kinetic-type__shape--bar {
          z-index: 0;
          right: -8%;
          bottom: 8%;
          width: 44%;
          height: clamp(1.5rem, 4cqw, 4rem);
          border-radius: 999px;
          background: #6d28d9;
          opacity: 0.13;
          transform: rotate(-9deg);
        }

        .kinetic-type--state-1 .kinetic-type__shape--bar {
          right: 6%;
          bottom: 11%;
          width: 62%;
          height: clamp(1.4rem, 3cqw, 3rem);
          background: #faf6ff;
          opacity: 0.16;
          transform: rotate(5deg);
        }

        .kinetic-type--state-2 .kinetic-type__shape--bar {
          right: -12%;
          bottom: 48%;
          width: 55%;
          height: clamp(1rem, 2.4cqw, 2.4rem);
          background: #160826;
          opacity: 0.16;
          transform: rotate(72deg);
        }

        .kinetic-type--state-3 .kinetic-type__shape--bar {
          right: 26%;
          bottom: 13%;
          width: 48%;
          height: clamp(0.8rem, 1.5cqw, 1.5rem);
          background: #160826;
          opacity: 0.14;
          transform: rotate(0deg);
        }

        .kinetic-type__topline,
        .kinetic-type__bottomline {
          position: absolute;
          z-index: 8;
          right: clamp(1.1rem, 3.2cqw, 3rem);
          left: clamp(1.1rem, 3.2cqw, 3rem);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          font-family: var(--font-instrument), Arial, Helvetica, sans-serif;
          font-size: clamp(0.61rem, 1.05cqw, 0.78rem);
          font-weight: 650;
          line-height: 1;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          user-select: none;
          pointer-events: none;
        }

        .kinetic-type__topline {
          top: clamp(1.25rem, 3.2cqw, 2.5rem);
        }

        .kinetic-type__bottomline {
          bottom: clamp(1.25rem, 3.2cqw, 2.5rem);
        }

        .kinetic-type__bottomline span:first-child {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
        }

        .kinetic-type__bottomline span:first-child::before {
          width: 1.65rem;
          height: 0.36rem;
          border-radius: 999px;
          background: currentColor;
          content: "";
        }

        .kinetic-type__echo,
        .kinetic-type__word {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          width: max-content;
          max-width: none;
          color: currentColor;
          font-family: var(--font-instrument), Arial, Helvetica, sans-serif;
          font-size: clamp(6.4rem, 26cqw, 20rem);
          font-weight: 560;
          line-height: 0.72;
          letter-spacing: -0.09em;
          white-space: nowrap;
          text-transform: uppercase;
          user-select: none;
          pointer-events: none;
        }

        .kinetic-type--medium .kinetic-type__echo,
        .kinetic-type--medium .kinetic-type__word {
          font-size: clamp(4.7rem, 18cqw, 14.5rem);
        }

        .kinetic-type--long .kinetic-type__echo,
        .kinetic-type--long .kinetic-type__word {
          font-size: clamp(3.35rem, 13.3cqw, 10.7rem);
        }

        .kinetic-type__word {
          transform: translate(-50%, -50%);
        }

        .kinetic-type__echo {
          z-index: 3;
          color: transparent;
          opacity: 0.16;
          -webkit-text-stroke: max(1px, 0.11cqw) #160826;
          transform: translate3d(-50%, -50%, 0) rotate(-4deg);
          will-change: transform;
        }

        .kinetic-type--state-1 .kinetic-type__echo {
          opacity: 0.22;
          -webkit-text-stroke-color: #faf6ff;
        }

        .kinetic-type--state-2 .kinetic-type__echo {
          opacity: 0.14;
          -webkit-text-stroke-color: #160826;
        }

        .kinetic-type__glyph {
          display: inline-block;
          transform-origin: 50% 68%;
          will-change: transform;
        }

        .kinetic-type__ink {
          display: block;
          animation: kinetic-type-arrive 720ms
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .kinetic-type--state-3 .kinetic-type__glyph:nth-child(even)
          .kinetic-type__ink {
          color: transparent;
          -webkit-text-stroke: max(2px, 0.16cqw) #6d28d9;
        }

        .kinetic-type__sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .kinetic-type[data-reduced-motion="true"] .kinetic-type__ink {
          animation: none;
        }

        .kinetic-type[data-reduced-motion="true"] .kinetic-type__shape,
        .kinetic-type[data-reduced-motion="true"] .kinetic-type__frame,
        .kinetic-type[data-reduced-motion="true"] {
          transition: none;
        }

        @keyframes kinetic-type-arrive {
          from {
            opacity: 0;
            clip-path: inset(100% 0 0 0);
            transform: translateY(0.55em) rotate(5deg);
          }
          to {
            opacity: 1;
            clip-path: inset(-16% -12% -20% -12%);
            transform: translateY(0) rotate(0deg);
          }
        }

        @media (max-width: 680px) {
          .kinetic-type {
            min-height: 31rem;
            border-radius: 1.2rem;
          }

          .kinetic-type__frame {
            inset: 4rem 1rem;
          }

          .kinetic-type__topline,
          .kinetic-type__bottomline {
            right: 1.15rem;
            left: 1.15rem;
            font-size: 0.59rem;
            letter-spacing: 0.1em;
          }

          .kinetic-type__topline {
            top: 1.3rem;
          }

          .kinetic-type__bottomline {
            bottom: 1.3rem;
          }

          .kinetic-type__bottomline span:first-child::before {
            width: 1rem;
          }

          .kinetic-type__echo,
          .kinetic-type__word {
            font-size: clamp(4.5rem, 25cqw, 8.5rem);
          }

          .kinetic-type--medium .kinetic-type__echo,
          .kinetic-type--medium .kinetic-type__word {
            font-size: clamp(3.5rem, 18cqw, 6.25rem);
          }

          .kinetic-type--long .kinetic-type__echo,
          .kinetic-type--long .kinetic-type__word {
            font-size: clamp(2.3rem, 12.7cqw, 4.4rem);
          }

          .kinetic-type__shape--disc {
            width: 62cqw;
          }

          .kinetic-type--state-1 .kinetic-type__shape--disc {
            left: 12%;
            width: 43cqw;
          }

          .kinetic-type--state-2 .kinetic-type__shape--disc {
            width: 58cqw;
          }

          .kinetic-type--state-3 .kinetic-type__shape--disc {
            width: 74cqw;
          }
        }

        @media (hover: none) {
          .kinetic-type__topline span:last-child {
            font-size: 0;
          }

          .kinetic-type__topline span:last-child::after {
            font-size: 0.59rem;
            content: "TRYCK / BYT";
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kinetic-type,
          .kinetic-type__shape,
          .kinetic-type__frame {
            scroll-behavior: auto;
            transition: none;
          }

          .kinetic-type__ink {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

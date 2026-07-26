"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SignalPlaygroundProps = {
  compact?: boolean;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  rotation: number;
  spin: number;
  phase: number;
  shape: number;
};

type Pulse = {
  x: number;
  y: number;
  age: number;
  strength: number;
};

type TrailPoint = {
  x: number;
  y: number;
  age: number;
};

type PointerState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  previousX: number;
  previousY: number;
  velocityX: number;
  velocityY: number;
  presence: number;
  inside: boolean;
};

const TAU = Math.PI * 2;
const MAX_DPR = 1.75;
const PARTICLE_INK = "#fcf7ff";
const MINT_INK = "#d8b4fe";

export default function SignalPlayground({
  compact = false,
  className = "",
}: SignalPlaygroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const sizeRef = useRef({ width: 1, height: 1, dpr: 1 });
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    previousX: 0,
    previousY: 0,
    velocityX: 0,
    velocityY: 0,
    presence: 0,
    inside: false,
  });
  const visibleRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const reducedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const elapsedRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const drawFrame = useCallback((now: number, forceStatic = false) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { width, height, dpr } = sizeRef.current;
    if (width <= 1 || height <= 1) return;

    const previousFrame = lastFrameRef.current || now;
    const deltaSeconds = Math.min(0.032, Math.max(0.001, (now - previousFrame) / 1000));
    const frameScale = deltaSeconds * 60;
    lastFrameRef.current = now;
    if (!forceStatic) elapsedRef.current += deltaSeconds;

    const time = elapsedRef.current;
    const pointer = pointerRef.current;
    const ease = 1 - Math.exp(-deltaSeconds * 13);
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    pointer.presence += ((pointer.inside ? 1 : 0) - pointer.presence) * ease;

    const rawVelocityX = (pointer.targetX - pointer.previousX) / Math.max(deltaSeconds, 0.016);
    const rawVelocityY = (pointer.targetY - pointer.previousY) / Math.max(deltaSeconds, 0.016);
    pointer.velocityX += (rawVelocityX - pointer.velocityX) * 0.12;
    pointer.velocityY += (rawVelocityY - pointer.velocityY) * 0.12;
    pointer.velocityX = clamp(pointer.velocityX, -900, 900);
    pointer.velocityY = clamp(pointer.velocityY, -900, 900);
    pointer.previousX = pointer.targetX;
    pointer.previousY = pointer.targetY;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(context, width, height, pointer, time, forceStatic);
    drawSignalRibbon(context, width, height, pointer, time, forceStatic);
    updateAndDrawPulses(context, pulsesRef.current, deltaSeconds, width);

    const particles = particlesRef.current;
    const interactionRadius = clamp(width * 0.105, 104, 190);
    const spring = compact ? 0.022 : 0.018;
    const damping = Math.pow(0.86, frameScale);
    const activePulses = pulsesRef.current;

    for (const particle of particles) {
      const driftX = forceStatic
        ? 0
        : Math.sin(time * (0.42 + particle.depth * 0.18) + particle.phase) *
          (3.5 + particle.depth * 7);
      const driftY = forceStatic
        ? 0
        : Math.cos(time * (0.34 + particle.depth * 0.14) + particle.phase * 1.37) *
          (2.5 + particle.depth * 5);
      const targetX = particle.homeX + driftX;
      const targetY = particle.homeY + driftY;

      if (!forceStatic) {
        particle.vx += (targetX - particle.x) * spring * frameScale;
        particle.vy += (targetY - particle.y) * spring * frameScale;

        const fromPointerX = particle.x - pointer.x;
        const fromPointerY = particle.y - pointer.y;
        const pointerDistance = Math.hypot(fromPointerX, fromPointerY);
        if (pointerDistance < interactionRadius && pointer.presence > 0.01) {
          const falloff = 1 - pointerDistance / interactionRadius;
          const normalizedX = fromPointerX / Math.max(1, pointerDistance);
          const normalizedY = fromPointerY / Math.max(1, pointerDistance);
          const push = falloff * falloff * pointer.presence * (0.6 + particle.depth * 0.72);
          particle.vx +=
            (normalizedX * push - normalizedY * push * 0.36) * frameScale +
            pointer.velocityX * falloff * 0.0009;
          particle.vy +=
            (normalizedY * push + normalizedX * push * 0.36) * frameScale +
            pointer.velocityY * falloff * 0.0009;
        }

        for (const pulse of activePulses) {
          const dx = particle.x - pulse.x;
          const dy = particle.y - pulse.y;
          const distance = Math.hypot(dx, dy);
          const waveFront = pulse.age * 390;
          const distanceFromWave = Math.abs(distance - waveFront);
          if (distanceFromWave < 32 && distance > 0.5) {
            const waveForce =
              (1 - distanceFromWave / 32) *
              Math.max(0, 1 - pulse.age / 1.35) *
              pulse.strength;
            particle.vx += (dx / distance) * waveForce * 1.45 * frameScale;
            particle.vy += (dy / distance) * waveForce * 1.45 * frameScale;
          }
        }

        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;
        particle.rotation +=
          (particle.spin + (particle.vx - particle.vy) * 0.009) * frameScale;
      } else {
        particle.x = targetX;
        particle.y = targetY;
      }
    }

    drawParticles(context, particles, pointer);
    updateAndDrawTrail(
      context,
      trailRef.current,
      pointer,
      deltaSeconds,
      forceStatic,
    );
    drawPointerLens(context, pointer, time, forceStatic);

    if (!forceStatic && visibleRef.current && pageVisibleRef.current && !reducedRef.current) {
      frameRef.current = window.requestAnimationFrame((timestamp) => drawFrame(timestamp));
    }
  }, [compact]);

  const requestStaticDraw = useCallback(() => {
    window.requestAnimationFrame((timestamp) => {
      lastFrameRef.current = timestamp;
      drawFrame(timestamp, true);
    });
  }, [drawFrame]);

  const startLoop = useCallback(() => {
    if (
      frameRef.current !== null ||
      reducedRef.current ||
      !visibleRef.current ||
      !pageVisibleRef.current
    ) {
      return;
    }
    lastFrameRef.current = performance.now();
    frameRef.current = window.requestAnimationFrame((timestamp) => {
      frameRef.current = null;
      drawFrame(timestamp);
    });
  }, [drawFrame]);

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const resize = useCallback(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const bounds = root.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const previous = sizeRef.current;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    sizeRef.current = { width, height, dpr };

    const majorResize =
      particlesRef.current.length === 0 ||
      Math.abs(previous.width - width) > 80 ||
      Math.abs(previous.height - height) > 80;

    if (majorResize) {
      particlesRef.current = createParticles(width, height, compact);
    } else {
      const xScale = width / Math.max(1, previous.width);
      const yScale = height / Math.max(1, previous.height);
      for (const particle of particlesRef.current) {
        particle.x *= xScale;
        particle.y *= yScale;
        particle.homeX *= xScale;
        particle.homeY *= yScale;
      }
    }

    const pointer = pointerRef.current;
    if (pointer.x === 0 && pointer.y === 0) {
      pointer.x = width * 0.5;
      pointer.y = height * 0.48;
      pointer.targetX = pointer.x;
      pointer.targetY = pointer.y;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
    }

    if (reducedRef.current) requestStaticDraw();
  }, [compact, requestStaticDraw]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedRef.current = motionQuery.matches;
      setReducedMotion(motionQuery.matches);
      if (motionQuery.matches) {
        stopLoop();
        requestStaticDraw();
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: "18% 0px", threshold: 0.01 },
    );
    const onVisibilityChange = () => {
      pageVisibleRef.current = document.visibilityState === "visible";
      if (pageVisibleRef.current) startLoop();
      else stopLoop();
    };

    resize();
    updateMotionPreference();
    resizeObserver.observe(root);
    intersectionObserver.observe(root);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", updateMotionPreference);
      stopLoop();
    };
  }, [requestStaticDraw, resize, startLoop, stopLoop]);

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const pointer = pointerRef.current;
    pointer.targetX = clamp(clientX - bounds.left, 0, bounds.width);
    pointer.targetY = clamp(clientY - bounds.top, 0, bounds.height);
  }, []);

  const createPulse = useCallback((x: number, y: number) => {
    if (reducedRef.current) return;
    pulsesRef.current.push({ x, y, age: 0, strength: 1 });
    if (pulsesRef.current.length > 5) pulsesRef.current.shift();
    setPulseCount((count) => (count + 1) % 100);
    startLoop();
  }, [startLoop]);

  const onPointerEnter = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointerRef.current.inside = true;
    updatePointer(event.clientX, event.clientY);
    startLoop();
  }, [startLoop, updatePointer]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    updatePointer(event.clientX, event.clientY);
  }, [updatePointer]);

  const onPointerLeave = useCallback(() => {
    pointerRef.current.inside = false;
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    updatePointer(event.clientX, event.clientY);
    const root = rootRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    createPulse(event.clientX - bounds.left, event.clientY - bounds.top);
  }, [createPulse, updatePointer]);

  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const { width, height } = sizeRef.current;
    const pointer = pointerRef.current;
    const hasPointer = pointer.inside && pointer.presence > 0.15;
    createPulse(hasPointer ? pointer.x : width / 2, hasPointer ? pointer.y : height / 2);
  }, [createPulse]);

  const classes = [
    "signal-playground",
    compact ? "signal-playground--compact" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={rootRef}
      className={classes}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      role="region"
      aria-label="Interaktivt signalfält"
      tabIndex={reducedMotion ? -1 : 0}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <canvas ref={canvasRef} className="signal-playground__canvas" aria-hidden="true" />

      <div className="signal-playground__meta">
        <span className="signal-playground__status" aria-hidden="true">
          <i />
          Levande signalfält
        </span>
        <span className="signal-playground__instruction" aria-hidden="true">
          {reducedMotion ? "Stilla läge" : "Dra genom fältet · tryck för puls"}
        </span>
      </div>

      <p className="signal-playground__sr-only">
        {reducedMotion
          ? "Dekorativ visualisering i stilla läge eftersom reducerad rörelse är aktiverad."
          : "Dra med pekare eller touch för att påverka fältet. Tryck på fältet, eller tryck Enter när det har fokus, för att skapa en puls."}
      </p>
      <p className="signal-playground__sr-only" aria-live="polite" aria-atomic="true">
        {pulseCount > 0 ? `Puls ${pulseCount} skapad.` : ""}
      </p>

      <style>{`
        .signal-playground {
          position: relative;
          width: 100%;
          min-height: clamp(34rem, 72svh, 50rem);
          overflow: hidden;
          isolation: isolate;
          border-radius: clamp(1.25rem, 2.8vw, 2.5rem);
          background: #6d28d9;
          color: #fcf7ff;
          cursor: crosshair;
          outline: none;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }

        .signal-playground--compact {
          min-height: clamp(22rem, 48svh, 32rem);
        }

        .signal-playground::before {
          position: absolute;
          z-index: 2;
          inset: 0;
          border: 1px solid rgba(245, 235, 255, 0.22);
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -5rem 8rem rgba(45, 10, 75, 0.12);
          pointer-events: none;
          content: "";
        }

        .signal-playground:focus-visible::before {
          border-color: rgba(252, 247, 255, 0.9);
          box-shadow:
            inset 0 0 0 3px rgba(124, 58, 237, 0.78),
            inset 0 0 0 5px #fcf7ff;
        }

        .signal-playground__canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .signal-playground__meta {
          position: absolute;
          z-index: 3;
          right: clamp(1rem, 2.7vw, 2rem);
          bottom: clamp(1rem, 2.7vw, 2rem);
          left: clamp(1rem, 2.7vw, 2rem);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          color: rgba(252, 247, 255, 0.94);
          font: 600 0.68rem/1.1 Arial, Helvetica, sans-serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          pointer-events: none;
          user-select: none;
        }

        .signal-playground__status {
          display: inline-flex;
          align-items: center;
          gap: 0.62rem;
        }

        .signal-playground__status i {
          width: 0.46rem;
          height: 0.46rem;
          flex: 0 0 auto;
          border: 1px solid rgba(252, 247, 255, 0.95);
          border-radius: 50%;
          background: #d8b4fe;
          box-shadow: 0 0 0 0.28rem rgba(216, 180, 254, 0.18);
          animation: signal-playground-breathe 2.2s ease-in-out infinite;
        }

        .signal-playground__instruction {
          padding: 0.72rem 0.92rem;
          border: 1px solid rgba(252, 247, 255, 0.2);
          border-radius: 999px;
          background: rgba(45, 10, 75, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
        }

        .signal-playground__sr-only {
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

        .signal-playground[data-reduced-motion="true"] {
          cursor: default;
        }

        .signal-playground[data-reduced-motion="true"] .signal-playground__status i {
          animation: none;
        }

        @keyframes signal-playground-breathe {
          0%, 100% { transform: scale(0.84); opacity: 0.76; }
          50% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 640px) {
          .signal-playground {
            min-height: 31rem;
            border-radius: 1.15rem;
          }

          .signal-playground--compact {
            min-height: 23rem;
          }

          .signal-playground__meta {
            align-items: flex-end;
            font-size: 0.59rem;
            letter-spacing: 0.09em;
          }

          .signal-playground__instruction {
            max-width: 9.5rem;
            padding: 0.62rem 0.72rem;
            text-align: right;
          }
        }

        @media (hover: none) {
          .signal-playground {
            cursor: default;
          }

          .signal-playground__instruction {
            font-size: 0;
          }

          .signal-playground__instruction::after {
            font-size: 0.59rem;
            content: "Tryck för puls";
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signal-playground__status i {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function createParticles(width: number, height: number, compact: boolean) {
  const random = seededRandom(Math.round(width * 3 + height * 7 + (compact ? 41 : 83)));
  const areaCount = Math.round((width * height) / (compact ? 1700 : 1450));
  const count = clamp(areaCount, compact ? 190 : 260, compact ? 560 : 820);
  const particles: Particle[] = [];

  for (let index = 0; index < count; index += 1) {
    const xProgress = random();
    const inField = random() < 0.88;
    const wave =
      Math.sin(xProgress * Math.PI * 2.2 + 0.8) * 0.055 +
      Math.sin(xProgress * Math.PI * 5.4) * 0.018;
    const yProgress = inField
      ? 0.47 + wave + Math.pow(random(), 0.82) * 0.58
      : 0.08 + random() * 0.58;
    const depth = 0.32 + random() * 0.68;
    const homeX = xProgress * width + (random() - 0.5) * 12;
    const homeY = clamp(yProgress * height, 10, height - 8);
    const size = (compact ? 1.1 : 1.2) + depth * (compact ? 2.2 : 2.65);

    particles.push({
      x: homeX + (random() - 0.5) * 7,
      y: homeY + (random() - 0.5) * 7,
      homeX,
      homeY,
      vx: 0,
      vy: 0,
      size,
      depth,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 0.018,
      phase: random() * TAU,
      shape: Math.floor(random() * 6),
    });
  }

  return particles;
}

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pointer: PointerState,
  time: number,
  forceStatic: boolean,
) {
  context.clearRect(0, 0, width, height);

  const base = context.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#8b5cf6");
  base.addColorStop(0.46, "#7c3aed");
  base.addColorStop(1, "#4c1d95");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  const glowX = forceStatic
    ? width * 0.68
    : width * 0.68 + Math.sin(time * 0.18) * width * 0.08;
  const glowY = forceStatic
    ? height * 0.18
    : height * 0.18 + Math.cos(time * 0.22) * height * 0.06;
  const ambientGlow = context.createRadialGradient(
    glowX,
    glowY,
    0,
    glowX,
    glowY,
    Math.max(width, height) * 0.72,
  );
  ambientGlow.addColorStop(0, "rgba(216, 180, 254, 0.38)");
  ambientGlow.addColorStop(0.48, "rgba(192, 132, 252, 0.1)");
  ambientGlow.addColorStop(1, "rgba(59, 7, 100, 0)");
  context.fillStyle = ambientGlow;
  context.fillRect(0, 0, width, height);

  const pointerGlow = context.createRadialGradient(
    pointer.x,
    pointer.y,
    0,
    pointer.x,
    pointer.y,
    clamp(width * 0.24, 180, 380),
  );
  pointerGlow.addColorStop(0, `rgba(233, 213, 255, ${0.11 * pointer.presence})`);
  pointerGlow.addColorStop(0.42, `rgba(192, 132, 252, ${0.055 * pointer.presence})`);
  pointerGlow.addColorStop(1, "rgba(192, 132, 252, 0)");
  context.fillStyle = pointerGlow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.14;
  context.fillStyle = "#250a48";
  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.42,
    Math.min(width, height) * 0.15,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.82,
  );
  vignette.addColorStop(0, "rgba(37, 10, 72, 0)");
  vignette.addColorStop(1, "rgba(22, 6, 45, 0.92)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawSignalRibbon(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pointer: PointerState,
  time: number,
  forceStatic: boolean,
) {
  const movement = forceStatic ? 0 : Math.sin(time * 0.37) * height * 0.018;
  const pointerOffsetX = (pointer.x / Math.max(1, width) - 0.5) * width * 0.07 * pointer.presence;
  const pointerOffsetY = (pointer.y / Math.max(1, height) - 0.5) * height * 0.08 * pointer.presence;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  const makePath = () => {
    context.beginPath();
    context.moveTo(-width * 0.12, height * 0.17 + movement);
    context.bezierCurveTo(
      width * 0.18,
      height * 0.02 + pointerOffsetY,
      width * 0.17 + pointerOffsetX,
      height * 0.56,
      width * 0.46,
      height * 0.42 + movement,
    );
    context.bezierCurveTo(
      width * 0.73,
      height * 0.28 + pointerOffsetY,
      width * 0.7 + pointerOffsetX,
      -height * 0.06,
      width * 1.08,
      height * 0.08,
    );
  };

  makePath();
  context.strokeStyle = "rgba(45, 10, 75, 0.16)";
  context.lineWidth = clamp(width * 0.08, 58, 124);
  context.stroke();

  makePath();
  context.strokeStyle = "rgba(216, 180, 254, 0.28)";
  context.lineWidth = clamp(width * 0.025, 18, 38);
  context.stroke();

  makePath();
  context.strokeStyle = "rgba(252, 247, 255, 0.84)";
  context.lineWidth = clamp(width * 0.0042, 4, 8);
  context.stroke();

  context.restore();
}

function drawParticles(
  context: CanvasRenderingContext2D,
  particles: Particle[],
  pointer: PointerState,
) {
  context.save();
  context.fillStyle = PARTICLE_INK;
  context.strokeStyle = PARTICLE_INK;
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const particle of particles) {
    const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
    const highlight = Math.max(0, 1 - pointerDistance / 160) * pointer.presence;
    const size = particle.size * (1 + highlight * 0.58);
    context.globalAlpha = clamp(0.42 + particle.depth * 0.54 + highlight * 0.2, 0, 1);
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);

    switch (particle.shape) {
      case 0:
        context.beginPath();
        context.arc(0, 0, size * 0.58, 0, TAU);
        context.fill();
        break;
      case 1:
        context.fillRect(-size * 0.55, -size * 0.55, size * 1.1, size * 1.1);
        break;
      case 2:
        context.beginPath();
        context.moveTo(0, -size * 0.76);
        context.lineTo(size * 0.72, size * 0.58);
        context.lineTo(-size * 0.72, size * 0.58);
        context.closePath();
        context.fill();
        break;
      case 3:
        context.lineWidth = Math.max(1, size * 0.26);
        context.beginPath();
        context.arc(0, 0, size * 0.68, 0, TAU);
        context.stroke();
        break;
      case 4:
        context.rotate(Math.PI / 4);
        context.fillRect(-size * 0.52, -size * 0.52, size * 1.04, size * 1.04);
        break;
      default:
        context.lineWidth = Math.max(1, size * 0.42);
        context.beginPath();
        context.moveTo(-size * 0.85, 0);
        context.lineTo(size * 0.85, 0);
        context.stroke();
        break;
    }

    context.restore();
  }

  context.restore();
}

function updateAndDrawPulses(
  context: CanvasRenderingContext2D,
  pulses: Pulse[],
  deltaSeconds: number,
  width: number,
) {
  if (pulses.length === 0) return;

  context.save();
  context.lineWidth = 1.25;
  context.strokeStyle = PARTICLE_INK;
  context.globalCompositeOperation = "screen";

  for (const pulse of pulses) {
    pulse.age += deltaSeconds;
    const progress = clamp(pulse.age / 1.35, 0, 1);
    const radius = pulse.age * 390;
    context.globalAlpha = (1 - progress) * 0.72;
    context.beginPath();
    context.arc(pulse.x, pulse.y, radius, 0, TAU);
    context.stroke();

    context.globalAlpha = (1 - progress) * 0.16;
    context.lineWidth = clamp(width * 0.012, 10, 22);
    context.beginPath();
    context.arc(pulse.x, pulse.y, Math.max(0, radius - 10), 0, TAU);
    context.stroke();
    context.lineWidth = 1.25;
  }

  context.restore();

  for (let index = pulses.length - 1; index >= 0; index -= 1) {
    if (pulses[index].age > 1.35) pulses.splice(index, 1);
  }
}

function updateAndDrawTrail(
  context: CanvasRenderingContext2D,
  trail: TrailPoint[],
  pointer: PointerState,
  deltaSeconds: number,
  forceStatic: boolean,
) {
  if (!forceStatic && pointer.inside && pointer.presence > 0.25) {
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last.x - pointer.x, last.y - pointer.y) > 9) {
      trail.push({ x: pointer.x, y: pointer.y, age: 0 });
      if (trail.length > 18) trail.shift();
    }
  }

  context.save();
  context.fillStyle = MINT_INK;
  for (const point of trail) {
    point.age += deltaSeconds;
    const alpha = Math.max(0, 1 - point.age / 0.72);
    context.globalAlpha = alpha * 0.42;
    context.beginPath();
    context.arc(point.x, point.y, 1.2 + alpha * 1.8, 0, TAU);
    context.fill();
  }
  context.restore();

  for (let index = trail.length - 1; index >= 0; index -= 1) {
    if (trail[index].age > 0.72) trail.splice(index, 1);
  }
}

function drawPointerLens(
  context: CanvasRenderingContext2D,
  pointer: PointerState,
  time: number,
  forceStatic: boolean,
) {
  if (pointer.presence < 0.01 || forceStatic) return;

  const radius = 28 + Math.sin(time * 3.1) * 1.8;
  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = pointer.presence * 0.62;
  context.strokeStyle = PARTICLE_INK;
  context.lineWidth = 1;
  context.beginPath();
  context.arc(pointer.x, pointer.y, radius, 0, TAU);
  context.stroke();

  context.globalAlpha = pointer.presence * 0.28;
  context.beginPath();
  context.arc(pointer.x, pointer.y, radius + 8, 0, TAU);
  context.stroke();

  context.globalAlpha = pointer.presence * 0.9;
  context.fillStyle = MINT_INK;
  context.beginPath();
  context.arc(pointer.x, pointer.y, 2.4, 0, TAU);
  context.fill();
  context.restore();
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

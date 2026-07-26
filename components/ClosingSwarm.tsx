"use client";

import { useEffect, useId, useRef, useState } from "react";

type ClosingSwarmProps = {
  className?: string;
};

type SwarmParticle = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  phase: number;
  rotation: number;
  spin: number;
  shape: number;
  tone: number;
};

type Wave = {
  x: number;
  y: number;
  age: number;
  strength: number;
};

type BurstParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  size: number;
  rotation: number;
  spin: number;
  shape: number;
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
const MAX_DPR = 1.6;
const WHITE = "#fcf7ff";
const MINT = "#e9d5ff";

export default function ClosingSwarm({ className = "" }: ClosingSwarmProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instructionId = useId();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [waveCount, setWaveCount] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!root || !canvas || !context) return;

    let frame: number | null = null;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = true;
    let pageVisible = document.visibilityState === "visible";
    let reduced = false;
    let dimensions = { width: 1, height: 1, dpr: 1 };
    let particles: SwarmParticle[] = [];
    const waves: Wave[] = [];
    const bursts: BurstParticle[] = [];
    const pointer: PointerState = {
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
    };

    const stop = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const schedule = () => {
      if (frame !== null || reduced || !visible || !pageVisible) return;
      frame = window.requestAnimationFrame(tick);
    };

    const render = (now: number, staticFrame = false) => {
      const { width, height, dpr } = dimensions;
      if (width <= 1 || height <= 1) return;

      const previousFrame = lastFrame || now;
      const deltaSeconds = staticFrame
        ? 1 / 60
        : clamp((now - previousFrame) / 1000, 0.001, 0.034);
      const frameScale = deltaSeconds * 60;
      lastFrame = now;
      if (!staticFrame) elapsed += deltaSeconds;

      const ease = 1 - Math.exp(-deltaSeconds * 12);
      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      pointer.presence += ((pointer.inside ? 1 : 0) - pointer.presence) * ease;

      const rawVelocityX =
        (pointer.targetX - pointer.previousX) / Math.max(deltaSeconds, 0.016);
      const rawVelocityY =
        (pointer.targetY - pointer.previousY) / Math.max(deltaSeconds, 0.016);
      pointer.velocityX += (rawVelocityX - pointer.velocityX) * 0.1;
      pointer.velocityY += (rawVelocityY - pointer.velocityY) * 0.1;
      pointer.velocityX = clamp(pointer.velocityX, -1100, 1100);
      pointer.velocityY = clamp(pointer.velocityY, -1100, 1100);
      pointer.previousX = pointer.targetX;
      pointer.previousY = pointer.targetY;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      drawFieldAtmosphere(context, width, height, pointer, elapsed, staticFrame);
      updateWaves(context, waves, deltaSeconds, width, staticFrame);

      const interactionRadius = clamp(width * 0.12, 118, 220);
      const damping = Math.pow(0.875, frameScale);

      for (const particle of particles) {
        const horizontalFlow = staticFrame
          ? 0
          : Math.sin(elapsed * (0.23 + particle.depth * 0.12) + particle.phase) *
            (2 + particle.depth * 10);
        const verticalFlow = staticFrame
          ? 0
          : Math.cos(elapsed * (0.31 + particle.depth * 0.08) + particle.phase * 1.31) *
            (1.5 + particle.depth * 6.5);
        const targetX = particle.homeX + horizontalFlow;
        const targetY = particle.homeY + verticalFlow;

        if (staticFrame) {
          particle.x = targetX;
          particle.y = targetY;
          continue;
        }

        const spring = 0.016 + particle.depth * 0.008;
        particle.vx += (targetX - particle.x) * spring * frameScale;
        particle.vy += (targetY - particle.y) * spring * frameScale;

        const fromPointerX = particle.x - pointer.x;
        const fromPointerY = particle.y - pointer.y;
        const pointerDistance = Math.hypot(fromPointerX, fromPointerY);

        if (pointerDistance < interactionRadius && pointer.presence > 0.01) {
          const falloff = 1 - pointerDistance / interactionRadius;
          const force = falloff * falloff * pointer.presence;
          const normalizedX = fromPointerX / Math.max(pointerDistance, 1);
          const normalizedY = fromPointerY / Math.max(pointerDistance, 1);

          particle.vx +=
            (normalizedX * force * 2.15 - normalizedY * force * 0.82) * frameScale +
            pointer.velocityX * falloff * 0.00125;
          particle.vy +=
            (normalizedY * force * 2.15 + normalizedX * force * 0.82) * frameScale +
            pointer.velocityY * falloff * 0.00125;
        }

        for (const wave of waves) {
          const dx = particle.x - wave.x;
          const dy = particle.y - wave.y;
          const distance = Math.hypot(dx, dy);
          const waveFront = wave.age * 430;
          const distanceToWave = Math.abs(distance - waveFront);

          if (distanceToWave < 42 && distance > 1) {
            const waveForce =
              (1 - distanceToWave / 42) *
              Math.max(0, 1 - wave.age / 1.45) *
              wave.strength;
            particle.vx += (dx / distance) * waveForce * 2.1 * frameScale;
            particle.vy += (dy / distance) * waveForce * 2.1 * frameScale;
          }
        }

        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;
        particle.rotation +=
          (particle.spin + (particle.vx - particle.vy) * 0.0045) * frameScale;
      }

      drawSwarm(context, particles, pointer, interactionRadius);
      updateBursts(context, bursts, deltaSeconds, staticFrame);
      drawPointerWaves(context, pointer, elapsed, staticFrame);
    };

    function tick(now: number) {
      frame = null;
      render(now);
      schedule();
    }

    const drawStaticFrame = () => {
      window.requestAnimationFrame((now) => {
        lastFrame = now;
        render(now, true);
      });
    };

    const resize = () => {
      const bounds = root.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const previous = dimensions;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      dimensions = { width, height, dpr };

      const shouldRebuild =
        particles.length === 0 ||
        Math.abs(previous.width - width) > 72 ||
        Math.abs(previous.height - height) > 72;

      if (shouldRebuild) {
        particles = createSwarm(width, height);
      } else {
        const scaleX = width / Math.max(1, previous.width);
        const scaleY = height / Math.max(1, previous.height);
        for (const particle of particles) {
          particle.x *= scaleX;
          particle.y *= scaleY;
          particle.homeX *= scaleX;
          particle.homeY *= scaleY;
        }
      }

      if (pointer.x === 0 && pointer.y === 0) {
        pointer.x = width * 0.5;
        pointer.y = height * 0.56;
        pointer.targetX = pointer.x;
        pointer.targetY = pointer.y;
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
      }

      if (reduced) drawStaticFrame();
      else schedule();
    };

    const locatePointer = (clientX: number, clientY: number) => {
      const bounds = root.getBoundingClientRect();
      pointer.targetX = clamp(clientX - bounds.left, 0, bounds.width);
      pointer.targetY = clamp(clientY - bounds.top, 0, bounds.height);
    };

    const createWave = (x: number, y: number) => {
      if (reduced) return;

      waves.push({ x, y, age: 0, strength: 1 });
      if (waves.length > 5) waves.shift();

      const random = seededRandom(
        Math.round(x * 31 + y * 17 + performance.now() * 0.1),
      );
      const burstCount = dimensions.width < 680 ? 24 : 38;

      for (let index = 0; index < burstCount; index += 1) {
        const angle = (index / burstCount) * TAU + (random() - 0.5) * 0.28;
        const speed = 2.7 + random() * 7.4;
        bursts.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          lifetime: 0.66 + random() * 0.74,
          size: 1.3 + random() * 3.6,
          rotation: random() * TAU,
          spin: (random() - 0.5) * 0.34,
          shape: Math.floor(random() * 5),
        });
      }

      if (bursts.length > 150) bursts.splice(0, bursts.length - 150);
      setWaveCount((count) => (count + 1) % 100);
      schedule();
    };

    const onPointerEnter = (event: PointerEvent) => {
      pointer.inside = true;
      locatePointer(event.clientX, event.clientY);
      schedule();
    };
    const onPointerMove = (event: PointerEvent) => {
      locatePointer(event.clientX, event.clientY);
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      locatePointer(event.clientX, event.clientY);
      const bounds = root.getBoundingClientRect();
      createWave(event.clientX - bounds.left, event.clientY - bounds.top);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const hasPointer = pointer.inside && pointer.presence > 0.1;
      createWave(
        hasPointer ? pointer.x : dimensions.width * 0.5,
        hasPointer ? pointer.y : dimensions.height * 0.57,
      );
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reduced = motionQuery.matches;
      setReducedMotion(reduced);
      if (reduced) {
        stop();
        waves.length = 0;
        bursts.length = 0;
        drawStaticFrame();
      } else {
        schedule();
      }
    };
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
      if (pageVisible) schedule();
      else stop();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
        else stop();
      },
      { rootMargin: "14% 0px", threshold: 0.01 },
    );

    root.addEventListener("pointerenter", onPointerEnter);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", updateMotionPreference);
    resizeObserver.observe(root);
    intersectionObserver.observe(root);

    resize();
    updateMotionPreference();

    return () => {
      stop();
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", updateMotionPreference);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  const classes = ["closing-swarm", className].filter(Boolean).join(" ");

  return (
    <div
      ref={rootRef}
      className={classes}
      role="region"
      aria-label="Interaktivt partikelfält"
      aria-describedby={instructionId}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      tabIndex={reducedMotion ? -1 : 0}
    >
      <canvas ref={canvasRef} className="closing-swarm__canvas" aria-hidden="true" />

      <span className="closing-swarm__hint" aria-hidden="true">
        {reducedMotion ? "Stilla fält" : "Rör fältet · tryck för våg"}
      </span>

      <p id={instructionId} className="closing-swarm__sr-only">
        {reducedMotion
          ? "Ett dekorativt partikelfält visas i stilla läge eftersom reducerad rörelse är aktiverad."
          : "Dra med pekare eller touch över fältet för att forma partiklarna. Tryck på fältet, eller fokusera det och tryck Enter, för att skapa en våg."}
      </p>
      <p
        className="closing-swarm__sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {waveCount > 0 ? `Våg ${waveCount} skapad.` : ""}
      </p>

      <style>{`
        .closing-swarm {
          position: absolute;
          z-index: 1;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: inherit;
          overflow: hidden;
          color: ${WHITE};
          cursor: default;
          outline: none;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }

        .closing-swarm::after {
          position: absolute;
          inset: 0;
          border: 1px solid transparent;
          pointer-events: none;
          content: "";
        }

        .closing-swarm:focus-visible::after {
          border-color: rgba(247, 255, 248, 0.82);
          box-shadow: inset 0 0 0 3px rgba(0, 91, 46, 0.56);
        }

        .closing-swarm__canvas {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
        }

        .closing-swarm__hint {
          position: absolute;
          right: clamp(1rem, 2.5vw, 2.25rem);
          bottom: clamp(1rem, 2.5vw, 2rem);
          z-index: 2;
          color: rgba(247, 255, 248, 0.74);
          font: 650 0.62rem/1.1 Arial, Helvetica, sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-shadow: 0 1px 18px rgba(0, 59, 28, 0.32);
          pointer-events: none;
          user-select: none;
          animation: closing-swarm-hint 2.8s ease-in-out infinite;
        }

        .closing-swarm__sr-only {
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

        .closing-swarm[data-reduced-motion="true"] {
          cursor: default;
        }

        .closing-swarm[data-reduced-motion="true"] .closing-swarm__hint {
          animation: none;
        }

        @keyframes closing-swarm-hint {
          0%, 100% { opacity: 0.58; }
          50% { opacity: 0.9; }
        }

        @media (hover: none) {
          .closing-swarm__hint {
            letter-spacing: 0.1em;
          }
        }

        @media (max-width: 640px) {
          .closing-swarm__hint {
            right: 1rem;
            bottom: 0.9rem;
            font-size: 0.56rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .closing-swarm__hint {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function createSwarm(width: number, height: number) {
  const random = seededRandom(Math.round(width * 5 + height * 13 + 317));
  const areaCount = Math.round((width * height) / 1120);
  const count = clamp(areaCount, width < 680 ? 330 : 520, 1550);
  const particles: SwarmParticle[] = [];

  for (let index = 0; index < count; index += 1) {
    const xProgress = random();
    const surface =
      0.43 +
      Math.sin(xProgress * TAU * 1.12 + 0.65) * 0.052 +
      Math.sin(xProgress * TAU * 3.25 + 2.1) * 0.019;
    const isFloatingParticle = random() < 0.055;
    const yProgress = isFloatingParticle
      ? clamp(surface - 0.05 - Math.pow(random(), 1.8) * 0.31, 0.08, 0.58)
      : surface + Math.pow(random(), 0.56) * (1.03 - surface);
    const depth = clamp(
      (yProgress - surface) / Math.max(0.1, 1 - surface),
      0,
      1,
    );
    const homeX = xProgress * width + (random() - 0.5) * 11;
    const homeY = clamp(yProgress * height, 8, height + 5);
    const size =
      (width < 680 ? 0.85 : 1) +
      depth * (width < 680 ? 1.85 : 2.45) +
      random() * 1.2;

    particles.push({
      x: homeX + (random() - 0.5) * 6,
      y: homeY + (random() - 0.5) * 6,
      homeX,
      homeY,
      vx: 0,
      vy: 0,
      size,
      depth,
      phase: random() * TAU,
      rotation: random() * TAU,
      spin: (random() - 0.5) * 0.022,
      shape: Math.floor(random() * 6),
      tone: random(),
    });
  }

  return particles;
}

function drawFieldAtmosphere(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pointer: PointerState,
  time: number,
  staticFrame: boolean,
) {
  const fieldGlow = context.createLinearGradient(0, height * 0.3, 0, height);
  fieldGlow.addColorStop(0, "rgba(246, 255, 248, 0)");
  fieldGlow.addColorStop(0.48, "rgba(230, 255, 237, 0.025)");
  fieldGlow.addColorStop(1, "rgba(213, 255, 226, 0.105)");
  context.fillStyle = fieldGlow;
  context.fillRect(0, height * 0.26, width, height * 0.74);

  const ambientX = staticFrame
    ? width * 0.18
    : width * 0.18 + Math.sin(time * 0.16) * width * 0.08;
  const ambient = context.createRadialGradient(
    ambientX,
    height * 0.78,
    0,
    ambientX,
    height * 0.78,
    Math.max(width, height) * 0.58,
  );
  ambient.addColorStop(0, "rgba(189, 255, 210, 0.09)");
  ambient.addColorStop(1, "rgba(189, 255, 210, 0)");
  context.fillStyle = ambient;
  context.fillRect(0, 0, width, height);

  if (pointer.presence > 0.005 && !staticFrame) {
    const pointerGlow = context.createRadialGradient(
      pointer.x,
      pointer.y,
      0,
      pointer.x,
      pointer.y,
      clamp(width * 0.17, 125, 260),
    );
    pointerGlow.addColorStop(
      0,
      `rgba(244, 255, 247, ${0.105 * pointer.presence})`,
    );
    pointerGlow.addColorStop(
      0.42,
      `rgba(184, 255, 205, ${0.045 * pointer.presence})`,
    );
    pointerGlow.addColorStop(1, "rgba(184, 255, 205, 0)");
    context.fillStyle = pointerGlow;
    context.fillRect(0, 0, width, height);
  }
}

function drawSwarm(
  context: CanvasRenderingContext2D,
  particles: SwarmParticle[],
  pointer: PointerState,
  interactionRadius: number,
) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const particle of particles) {
    const pointerDistance = Math.hypot(
      particle.x - pointer.x,
      particle.y - pointer.y,
    );
    const highlight =
      Math.max(0, 1 - pointerDistance / interactionRadius) * pointer.presence;
    const size = particle.size * (1 + highlight * 0.58);
    const baseAlpha = 0.44 + particle.depth * 0.48;

    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.globalAlpha = clamp(baseAlpha + highlight * 0.28, 0, 1);
    context.fillStyle = particle.tone > 0.82 ? MINT : WHITE;
    context.strokeStyle = particle.tone > 0.76 ? MINT : WHITE;

    drawGlyph(context, particle.shape, size);
    context.restore();
  }

  context.restore();
}

function drawGlyph(
  context: CanvasRenderingContext2D,
  shape: number,
  size: number,
) {
  switch (shape) {
    case 0:
      context.beginPath();
      context.arc(0, 0, size * 0.52, 0, TAU);
      context.fill();
      break;
    case 1:
      context.lineWidth = Math.max(0.75, size * 0.22);
      context.beginPath();
      context.arc(0, 0, size * 0.68, 0, TAU);
      context.stroke();
      break;
    case 2:
      context.lineWidth = Math.max(0.85, size * 0.22);
      context.beginPath();
      context.moveTo(-size * 0.95, 0);
      context.lineTo(size * 0.95, 0);
      context.stroke();
      break;
    case 3:
      context.lineWidth = Math.max(0.7, size * 0.2);
      context.beginPath();
      context.moveTo(0, -size * 0.8);
      context.lineTo(size * 0.72, size * 0.58);
      context.lineTo(-size * 0.72, size * 0.58);
      context.closePath();
      context.stroke();
      break;
    case 4:
      context.rotate(Math.PI / 4);
      context.fillRect(-size * 0.52, -size * 0.52, size * 1.04, size * 1.04);
      break;
    default:
      context.lineWidth = Math.max(0.72, size * 0.2);
      context.beginPath();
      context.moveTo(0, -size * 0.82);
      context.lineTo(size * 0.72, 0);
      context.lineTo(0, size * 0.82);
      context.lineTo(-size * 0.72, 0);
      context.closePath();
      context.stroke();
      break;
  }
}

function updateWaves(
  context: CanvasRenderingContext2D,
  waves: Wave[],
  deltaSeconds: number,
  width: number,
  staticFrame: boolean,
) {
  if (staticFrame || waves.length === 0) return;

  context.save();
  context.globalCompositeOperation = "screen";
  context.strokeStyle = WHITE;

  for (const wave of waves) {
    wave.age += deltaSeconds;
    const progress = clamp(wave.age / 1.45, 0, 1);
    const radius = wave.age * 430;

    context.globalAlpha = (1 - progress) * 0.54;
    context.lineWidth = 1.15;
    context.beginPath();
    context.arc(wave.x, wave.y, radius, 0, TAU);
    context.stroke();

    context.globalAlpha = (1 - progress) * 0.11;
    context.lineWidth = clamp(width * 0.009, 7, 17);
    context.beginPath();
    context.arc(wave.x, wave.y, Math.max(0, radius - 8), 0, TAU);
    context.stroke();
  }

  context.restore();

  for (let index = waves.length - 1; index >= 0; index -= 1) {
    if (waves[index].age > 1.45) waves.splice(index, 1);
  }
}

function updateBursts(
  context: CanvasRenderingContext2D,
  bursts: BurstParticle[],
  deltaSeconds: number,
  staticFrame: boolean,
) {
  if (staticFrame || bursts.length === 0) return;

  const frameScale = deltaSeconds * 60;
  context.save();
  context.fillStyle = WHITE;
  context.strokeStyle = WHITE;
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const burst of bursts) {
    burst.age += deltaSeconds;
    burst.vx *= Math.pow(0.964, frameScale);
    burst.vy *= Math.pow(0.964, frameScale);
    burst.vy += 0.022 * frameScale;
    burst.x += burst.vx * frameScale;
    burst.y += burst.vy * frameScale;
    burst.rotation += burst.spin * frameScale;

    const progress = clamp(burst.age / burst.lifetime, 0, 1);
    context.save();
    context.translate(burst.x, burst.y);
    context.rotate(burst.rotation);
    context.globalAlpha = Math.sin(progress * Math.PI) * 0.92;
    drawGlyph(context, burst.shape, burst.size * (1 - progress * 0.22));
    context.restore();
  }

  context.restore();

  for (let index = bursts.length - 1; index >= 0; index -= 1) {
    if (bursts[index].age >= bursts[index].lifetime) bursts.splice(index, 1);
  }
}

function drawPointerWaves(
  context: CanvasRenderingContext2D,
  pointer: PointerState,
  time: number,
  staticFrame: boolean,
) {
  if (staticFrame || pointer.presence < 0.01) return;

  context.save();
  context.strokeStyle = WHITE;
  context.globalCompositeOperation = "screen";
  context.lineWidth = 0.9;

  for (let index = 0; index < 3; index += 1) {
    const travel = (time * 0.55 + index / 3) % 1;
    const radius = 22 + travel * 72;
    context.globalAlpha =
      pointer.presence * Math.sin(travel * Math.PI) * (0.23 - index * 0.025);
    context.beginPath();
    context.ellipse(
      pointer.x,
      pointer.y,
      radius,
      radius * (0.76 + index * 0.035),
      0.08,
      0,
      TAU,
    );
    context.stroke();
  }

  context.globalAlpha = pointer.presence * 0.72;
  context.fillStyle = MINT;
  context.beginPath();
  context.arc(pointer.x, pointer.y, 1.8, 0, TAU);
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

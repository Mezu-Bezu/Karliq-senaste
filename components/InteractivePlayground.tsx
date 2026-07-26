"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./InteractivePlayground.module.css";

type Mode = "swarm" | "pulse" | "neural";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  label: string;
  type: "monogram" | "circle" | "ring" | "square";
  mass: number;
}

interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

const LABELS = ["KARLIQ", "MOTION", "CODE", "PHYSICS", "SIGNAL", "DESIGN", "KQ", "AI"];
const COLORS = ["#8b5cf6", "#c084fc", "#d8b4fe", "#faf8ff", "#7c3aed"];

export default function InteractivePlayground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("swarm");
  const [nodeCount, setNodeCount] = useState<number>(24);
  const [fps, setFps] = useState<number>(60);
  const [gravBoost, setGravBoost] = useState<boolean>(false);

  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<PulseRing[]>([]);
  const mouseRef = useRef<{ x: number; y: number; down: boolean; px: number; py: number }>({
    x: -1000,
    y: -1000,
    down: false,
    px: -1000,
    py: -1000,
  });

  const modeRef = useRef<Mode>(mode);
  const gravBoostRef = useRef<boolean>(gravBoost);
  modeRef.current = mode;
  gravBoostRef.current = gravBoost;

  // Initialize canvas physics nodes
  const initNodes = (width: number, height: number) => {
    const newNodes: Node[] = [];
    const count = 28;

    for (let i = 0; i < count; i++) {
      const radius = 18 + Math.random() * 26;
      newNodes.push({
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        radius,
        baseRadius: radius,
        color: COLORS[i % COLORS.length],
        label: LABELS[i % LABELS.length],
        type: i === 0 || i === 1 ? "monogram" : i % 3 === 0 ? "ring" : i % 4 === 0 ? "square" : "circle",
        mass: radius * 0.5,
      });
    }
    nodesRef.current = newNodes;
    setNodeCount(newNodes.length);
  };

  const spawnNode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const radius = 20 + Math.random() * 24;

    const mx = mouseRef.current.x > 0 ? mouseRef.current.x : width / 2;
    const my = mouseRef.current.y > 0 ? mouseRef.current.y : height / 2;

    nodesRef.current.push({
      x: mx,
      y: my,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius,
      baseRadius: radius,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      label: LABELS[Math.floor(Math.random() * LABELS.length)],
      type: Math.random() > 0.5 ? "monogram" : "circle",
      mass: radius * 0.5,
    });
    setNodeCount(nodesRef.current.length);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      if (nodesRef.current.length === 0) {
        initNodes(rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Draw subtle background grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isDown = mouseRef.current.down;
      const currentMode = modeRef.current;
      const isGrav = gravBoostRef.current;

      // Update & Draw Pulses
      for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
        const p = pulsesRef.current[i];
        p.radius += 8;
        p.opacity -= 0.022;

        if (p.opacity <= 0 || p.radius >= p.maxRadius) {
          pulsesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Push nodes away from shockwave
        for (const n of nodesRef.current) {
          const dx = n.x - p.x;
          const dy = n.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dist - p.radius) < 30) {
            const force = (1 - dist / p.maxRadius) * 4;
            n.vx += (dx / (dist || 1)) * force;
            n.vy += (dy / (dist || 1)) * force;
          }
        }
      }

      // Draw Neural connections if in Neural Mode
      if (currentMode === "neural") {
        ctx.save();
        for (let i = 0; i < nodesRef.current.length; i++) {
          for (let j = i + 1; j < nodesRef.current.length; j++) {
            const n1 = nodesRef.current[i];
            const n2 = nodesRef.current[j];
            const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);

            if (dist < 170) {
              const alpha = (1 - dist / 170) * 0.45;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
              ctx.lineWidth = (1 - dist / 170) * 2;
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // Update & Draw Nodes
      for (let i = 0; i < nodesRef.current.length; i++) {
        const n = nodesRef.current[i];

        // Physics velocity
        n.x += n.vx;
        n.y += n.vy;

        // Damping / Friction
        n.vx *= 0.985;
        n.vy *= 0.985;

        // Boundary bounce
        if (n.x - n.radius < 0) {
          n.x = n.radius;
          n.vx *= -0.85;
        } else if (n.x + n.radius > w) {
          n.x = w - n.radius;
          n.vx *= -0.85;
        }
        if (n.y - n.radius < 0) {
          n.y = n.radius;
          n.vy *= -0.85;
        } else if (n.y + n.radius > h) {
          n.y = h - n.radius;
          n.vy *= -0.85;
        }

        // Mouse Interaction
        if (mx > 0 && my > 0) {
          const dx = mx - n.x;
          const dy = my - n.y;
          const dist = Math.hypot(dx, dy);

          const pullRadius = isGrav ? 350 : 220;
          if (dist < pullRadius) {
            const factor = (1 - dist / pullRadius);
            
            if (currentMode === "pulse" && isDown) {
              // Push hard on click in pulse mode
              n.vx -= (dx / dist) * factor * 5;
              n.vy -= (dy / dist) * factor * 5;
            } else {
              // Gentle attraction/repulsion
              const force = factor * (isGrav ? 1.8 : 0.65);
              n.vx += (dx / dist) * force;
              n.vy += (dy / dist) * force;
            }

            // Expand radius slightly when cursor is near
            n.radius = n.baseRadius * (1 + factor * 0.4);
          } else {
            n.radius += (n.baseRadius - n.radius) * 0.1;
          }
        } else {
          n.radius += (n.baseRadius - n.radius) * 0.1;
        }

        // Node collisions
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const n2 = nodesRef.current[j];
          const dx = n2.x - n.x;
          const dy = n2.y - n.y;
          const dist = Math.hypot(dx, dy);
          const minDist = n.radius + n2.radius;

          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            n.x -= nx * overlap * 0.5;
            n.y -= ny * overlap * 0.5;
            n2.x += nx * overlap * 0.5;
            n2.y += ny * overlap * 0.5;

            const kx = n.vx - n2.vx;
            const ky = n.vy - n2.vy;
            const p = 2 * (nx * kx + ny * ky) / (n.mass + n2.mass);

            n.vx -= p * n2.mass * nx;
            n.vy -= p * n2.mass * ny;
            n2.vx += p * n.mass * nx;
            n2.vy += p * n.mass * ny;
          }
        }

        // Render Node
        ctx.save();
        ctx.translate(n.x, n.y);

        // Glow effect
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 18;

        if (n.type === "monogram") {
          // KQ Monogram node
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = "#12071f";
          ctx.font = `700 ${Math.round(n.radius * 0.75)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("KQ", 0, 1);
        } else if (n.type === "ring") {
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = `600 ${Math.round(n.radius * 0.45)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, 0, 0);
        } else if (n.type === "square") {
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.roundRect(-n.radius, -n.radius, n.radius * 2, n.radius * 2, 8);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = "#12071f";
          ctx.font = `600 ${Math.round(n.radius * 0.45)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, 0, 0);
        } else {
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = n.color === "#faf8ff" ? "#12071f" : "#ffffff";
          ctx.font = `600 ${Math.round(n.radius * 0.45)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, 0, 0);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handlePointerLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
    mouseRef.current.down = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.down = true;

    // Trigger shockwave pulse on click
    pulsesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: 280,
      opacity: 0.9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const handlePointerUp = () => {
    mouseRef.current.down = false;
  };

  return (
    <div className={styles.playgroundContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      <div className={styles.topBar}>
        <div className={styles.badgeGroup}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            STUDIO PLAYGROUND / KINETIC WORKBENCH
          </span>
        </div>

        <div className={styles.modeGroup}>
          <button
            className={`${styles.modeButton} ${mode === "swarm" ? styles.modeButtonActive : ""}`}
            onClick={() => setMode("swarm")}
            type="button"
          >
            01 / KINETIC SWARM
          </button>
          <button
            className={`${styles.modeButton} ${mode === "pulse" ? styles.modeButtonActive : ""}`}
            onClick={() => setMode("pulse")}
            type="button"
          >
            02 / SIGNAL PULSE
          </button>
          <button
            className={`${styles.modeButton} ${mode === "neural" ? styles.modeButtonActive : ""}`}
            onClick={() => setMode("neural")}
            type="button"
          >
            03 / NEURAL FLOW
          </button>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.instructionText}>
          <span className={styles.instructionIcon}>✦</span>
          <span>Dra och klicka för att skicka violetta energivågor och fjädrande noder.</span>
        </div>

        <div className={styles.actionControls}>
          <button className={styles.actionButton} onClick={spawnNode} type="button">
            + Släpp in nod
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setGravBoost(!gravBoost)}
            type="button"
            style={{
              background: gravBoost ? "rgba(139, 92, 246, 0.4)" : undefined,
              borderColor: gravBoost ? "#c084fc" : undefined,
            }}
          >
            {gravBoost ? "⚡ Magnetism PÅ" : "🧲 Aktivera Magnetism"}
          </button>
        </div>

        <div className={styles.telemetry}>
          <span>NODER: {nodeCount}</span>
          <span>FPS: {fps}</span>
          <span>FYSIK: REALTID</span>
        </div>
      </div>
    </div>
  );
}

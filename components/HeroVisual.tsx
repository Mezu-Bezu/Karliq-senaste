"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const SignalLoomScene = dynamic(() => import("./SignalLoomScene"), {
  ssr: false,
  loading: () => null,
});

export default function HeroVisual() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const rendererInfo = context?.getExtension("WEBGL_debug_renderer_info");
    const renderer = rendererInfo
      ? String(context?.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL))
      : "";
    const usesSoftwareRenderer = /swiftshader|llvmpipe|software rasterizer|basic render driver/i.test(renderer);
    const supportsWebGl = Boolean(context) && !usesSoftwareRenderer;

    const update = () => {
      setMobile(narrow.matches);
      setEnhanced(supportsWebGl && !reduced.matches);
      if (reduced.matches) setReady(false);
    };

    update();
    reduced.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "15% 0px", threshold: 0.01 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.closest<HTMLElement>(".hero");
    if (!root || !hero || (enhanced && ready)) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const word = root.querySelector<HTMLElement>(".static-word");
    const joints = Array.from(root.querySelectorAll<HTMLElement>(".static-joint"));
    let pulseTimer = 0;

    const reset = () => {
      word?.style.setProperty("--fallback-word-x", "0px");
      word?.style.setProperty("--fallback-word-y", "0px");
      joints.forEach((joint) => {
        joint.style.setProperty("--fallback-joint-x", "0px");
        joint.style.setProperty("--fallback-joint-y", "0px");
      });
      root.removeAttribute("data-fallback-reacting");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches || !finePointer.matches) return;
      const bounds = hero.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left
        && event.clientX <= bounds.right
        && event.clientY >= bounds.top
        && event.clientY <= bounds.bottom;
      if (!inside) {
        reset();
        return;
      }

      const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
      const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
      word?.style.setProperty("--fallback-word-x", `${(x * 14).toFixed(2)}px`);
      word?.style.setProperty("--fallback-word-y", `${(y * 10).toFixed(2)}px`);
      joints.forEach((joint, index) => {
        const depth = 0.46 + (index % 4) * 0.16;
        joint.style.setProperty("--fallback-joint-x", `${(x * 28 * depth).toFixed(2)}px`);
        joint.style.setProperty("--fallback-joint-y", `${(y * 22 * depth).toFixed(2)}px`);
      });
      root.setAttribute("data-fallback-reacting", "");
    };

    const onPointerDown = (event: PointerEvent) => {
      if (reduced.matches || event.button !== 0) return;
      const target = event.target as Element | null;
      if (target?.closest("a, button, input, textarea, select, label")) return;
      const bounds = hero.getBoundingClientRect();
      if (
        event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom
      ) return;

      window.clearTimeout(pulseTimer);
      root.setAttribute("data-fallback-pulse", "");
      pulseTimer = window.setTimeout(() => root.removeAttribute("data-fallback-pulse"), 360);
    };

    const onMotionChange = () => {
      if (reduced.matches) {
        root.removeAttribute("data-fallback-pulse");
        reset();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    reduced.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(pulseTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      reduced.removeEventListener("change", onMotionChange);
      root.removeAttribute("data-fallback-pulse");
      reset();
    };
  }, [enhanced, ready]);

  return (
    <div
      className="hero-world"
      ref={rootRef}
      data-visual-mode={enhanced && ready ? "webgl" : "loading"}
      aria-hidden="true"
    >
      {enhanced ? (
        <SignalLoomScene active={active} mobile={mobile} onReady={() => setReady(true)} />
      ) : null}
      <div className="hero-atmosphere" />
    </div>
  );
}


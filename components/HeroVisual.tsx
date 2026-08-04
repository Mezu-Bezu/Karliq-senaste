"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

export type HeroDeviceMotion = {
  x: number;
  y: number;
  shake: number;
};

type SensorPermission = "unknown" | "granted" | "denied";

type PermissionAwareSensor = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

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
  const deviceMotion = useRef<HeroDeviceMotion>({ x: 0, y: 0, shake: 0 });
  const sensorPermission = useRef<SensorPermission>("unknown");

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const orientationSensor = typeof DeviceOrientationEvent === "undefined"
      ? null
      : DeviceOrientationEvent as unknown as PermissionAwareSensor;
    const motionSensor = typeof DeviceMotionEvent === "undefined"
      ? null
      : DeviceMotionEvent as unknown as PermissionAwareSensor;

    if (!root || !mobile || !enhanced || !active || reducedMotion || !orientationSensor) {
      deviceMotion.current.x = 0;
      deviceMotion.current.y = 0;
      return;
    }

    let disposed = false;
    let listening = false;
    let originBeta: number | null = null;
    let originGamma: number | null = null;
    let lastShake = Number.NEGATIVE_INFINITY;

    const resetTilt = () => {
      originBeta = null;
      originGamma = null;
      deviceMotion.current.x = 0;
      deviceMotion.current.y = 0;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      originBeta ??= event.beta;
      originGamma ??= event.gamma;
      deviceMotion.current.x = Math.max(-1, Math.min(1, (event.gamma - originGamma) / 22));
      deviceMotion.current.y = Math.max(-1, Math.min(1, (event.beta - originBeta) / 22));
    };

    const onMotion = (event: DeviceMotionEvent) => {
      const linear = event.acceleration;
      const gravity = event.accelerationIncludingGravity;
      const linearMagnitude = linear
        ? Math.hypot(linear.x ?? 0, linear.y ?? 0, linear.z ?? 0)
        : 0;
      const gravityMagnitude = gravity
        ? Math.abs(Math.hypot(gravity.x ?? 0, gravity.y ?? 0, gravity.z ?? 0) - 9.81)
        : 0;
      if (Math.max(linearMagnitude, gravityMagnitude) < 5.5) return;

      const now = performance.now();
      if (now - lastShake < 650) return;
      lastShake = now;
      deviceMotion.current.shake += 1;
    };

    const detach = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
      resetTilt();
      root.dataset.deviceMotion = "paused";
    };

    const attach = () => {
      if (listening || !active || document.hidden) return;
      listening = true;
      originBeta = null;
      originGamma = null;
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
      window.addEventListener("devicemotion", onMotion, { passive: true });
      root.dataset.deviceMotion = "active";
    };

    const requestSensors = async () => {
      window.removeEventListener("touchend", requestSensors);
      try {
        const orientationRequest = orientationSensor.requestPermission?.() ?? Promise.resolve("granted" as const);
        const motionRequest = motionSensor?.requestPermission?.() ?? Promise.resolve("granted" as const);
        const [orientationResult, motionResult] = await Promise.all([orientationRequest, motionRequest]);
        if (disposed) return;
        const granted = orientationResult === "granted" && motionResult === "granted";
        sensorPermission.current = granted ? "granted" : "denied";
        root.dataset.deviceMotion = granted ? "active" : "denied";
        if (granted) attach();
      } catch {
        if (disposed) return;
        sensorPermission.current = "denied";
        root.dataset.deviceMotion = "denied";
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) detach();
      else if (sensorPermission.current === "granted") attach();
    };

    const needsGesture = Boolean(
      orientationSensor.requestPermission || motionSensor?.requestPermission,
    );
    if (sensorPermission.current === "granted") {
      attach();
    } else if (sensorPermission.current === "unknown" && needsGesture) {
      root.dataset.deviceMotion = "awaiting-touch";
      window.addEventListener("touchend", requestSensors, { once: true, passive: true });
    } else if (sensorPermission.current === "unknown") {
      sensorPermission.current = "granted";
      attach();
    } else {
      root.dataset.deviceMotion = "denied";
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      window.removeEventListener("touchend", requestSensors);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detach();
    };
  }, [active, enhanced, mobile]);

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
        <SignalLoomScene
          active={active}
          mobile={mobile}
          deviceMotion={deviceMotion}
          onReady={() => setReady(true)}
        />
      ) : null}
      <div className="hero-atmosphere" />
    </div>
  );
}


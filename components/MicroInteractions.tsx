"use client";

import { useEffect } from "react";

const MICRO_TARGETS = [
  ".wordmark",
  ".nav-swap",
  ".header-cta",
  ".menu-toggle",
  ".menu-links a",
  ".menu-panel-bottom a",
  ".menu-panel-bottom button",
  ".button",
  ".manifesto-note a",
  ".method-module",
  ".services-closure a",
  ".playground-heading a",
  ".founder-proof-link",
  ".closing-green-top > a",
  ".closing-mail",
  ".closing-green-links a",
  ".footer-grid a",
  ".footer-word",
  ".proof-hero-support a",
  ".proof-index a",
  ".proof-specimen",
  ".proof-case-meta > div",
].join(",");

function findTarget(node: EventTarget | null) {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(MICRO_TARGETS);
}

function setPointerPosition(target: HTMLElement, event: PointerEvent) {
  const bounds = target.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;

  const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
  const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
  const normalizedX = x - 0.5;
  const normalizedY = y - 0.5;

  target.style.setProperty("--micro-x", `${(x * 100).toFixed(2)}%`);
  target.style.setProperty("--micro-y", `${(y * 100).toFixed(2)}%`);
  target.style.setProperty("--micro-shift-x", `${(normalizedX * 12).toFixed(2)}px`);
  target.style.setProperty("--micro-shift-y", `${(normalizedY * 9).toFixed(2)}px`);
  target.style.setProperty("--micro-tilt", `${(normalizedX * 2.2).toFixed(2)}deg`);
}

function clearPointerPosition(target: HTMLElement) {
  target.style.setProperty("--micro-x", "50%");
  target.style.setProperty("--micro-y", "50%");
  target.style.setProperty("--micro-shift-x", "0px");
  target.style.setProperty("--micro-shift-y", "0px");
  target.style.setProperty("--micro-tilt", "0deg");
}

export default function MicroInteractions() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const pressTimers = new Map<HTMLElement, number>();
    let pointerEnabled = finePointerQuery.matches && !motionQuery.matches;

    const clearTarget = (target: HTMLElement) => {
      target.removeAttribute("data-micro-active");
      target.removeAttribute("data-micro-pressed");
      clearPointerPosition(target);
      const timer = pressTimers.get(target);
      if (timer !== undefined) window.clearTimeout(timer);
      pressTimers.delete(target);
    };

    const clearAll = () => {
      document.querySelectorAll<HTMLElement>("[data-micro-active], [data-micro-pressed]")
        .forEach(clearTarget);
    };

    const syncCapabilities = () => {
      pointerEnabled = finePointerQuery.matches && !motionQuery.matches;
      if (motionQuery.matches) clearAll();
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!pointerEnabled) return;
      const target = findTarget(event.target);
      if (!target) return;

      const previous = event.relatedTarget;
      if (previous instanceof Node && target.contains(previous)) return;
      target.setAttribute("data-micro-active", "pointer");
      setPointerPosition(target, event);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerEnabled) return;
      const target = findTarget(event.target);
      if (!target) return;
      target.setAttribute("data-micro-active", "pointer");
      setPointerPosition(target, event);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!pointerEnabled) return;
      const target = findTarget(event.target);
      if (!target) return;

      const next = event.relatedTarget;
      if (next instanceof Node && target.contains(next)) return;
      if (target.contains(document.activeElement)) {
        target.setAttribute("data-micro-active", "keyboard");
      } else {
        target.removeAttribute("data-micro-active");
      }
      clearPointerPosition(target);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (motionQuery.matches) return;
      const target = findTarget(event.target);
      if (!target) return;

      setPointerPosition(target, event);
      target.setAttribute("data-micro-pressed", "");

      const previousTimer = pressTimers.get(target);
      if (previousTimer !== undefined) window.clearTimeout(previousTimer);
      const timer = window.setTimeout(() => {
        target.removeAttribute("data-micro-pressed");
        pressTimers.delete(target);
      }, 260);
      pressTimers.set(target, timer);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (motionQuery.matches) return;
      const target = findTarget(event.target);
      if (!target) return;
      target.setAttribute("data-micro-active", "keyboard");
    };

    const onFocusOut = (event: FocusEvent) => {
      const target = findTarget(event.target);
      if (!target) return;
      const next = event.relatedTarget;
      if (next instanceof Node && target.contains(next)) return;
      target.removeAttribute("data-micro-active");
      clearPointerPosition(target);
    };

    const onPointerCancel = () => {
      document.querySelectorAll<HTMLElement>("[data-micro-pressed]")
        .forEach((target) => target.removeAttribute("data-micro-pressed"));
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("blur", clearAll);
    motionQuery.addEventListener("change", syncCapabilities);
    finePointerQuery.addEventListener("change", syncCapabilities);

    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("blur", clearAll);
      motionQuery.removeEventListener("change", syncCapabilities);
      finePointerQuery.removeEventListener("change", syncCapabilities);
      clearAll();
      pressTimers.forEach((timer) => window.clearTimeout(timer));
      pressTimers.clear();
    };
  }, []);

  return null;
}

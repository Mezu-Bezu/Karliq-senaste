"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/site";
import { prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";

const moduleIds = ["message", "structure", "interface", "launch"] as const;
type ModuleId = (typeof moduleIds)[number];

const process = {
  sv: {
    title: "Så går ett projekt till",
    enquiry: "Förfrågan",
    ready: "Klar",
    steps: [
      { title: "Kartläggning", text: "Du visar vad som tar tid eller vad webbplatsen behöver kunna göra.", output: "Vad vi ska lösa" },
      { title: "Förslag", text: "Du får ett förslag på vad som ingår, vad det kostar och när det kan vara klart.", output: "Upplägg och pris" },
      { title: "Utveckling", text: "Du får prova en första version. Jag justerar efter din återkoppling.", output: "Första version" },
      { title: "Lansering", text: "Vi testar tillsammans och går igenom hur du använder lösningen.", output: "Redo att använda" },
    ],
  },
  en: {
    title: "How a project works",
    enquiry: "Enquiry",
    ready: "Ready",
    steps: [
      { title: "Discovery", text: "Show me what takes time or what the website needs to do.", output: "What to solve" },
      { title: "Proposal", text: "I’ll set out what’s included, what it costs and when it can be ready.", output: "Scope and price" },
      { title: "Development", text: "You try the first version. I make changes based on your feedback.", output: "First version" },
      { title: "Launch", text: "We test it together and I show you how to use it.", output: "Ready to use" },
    ],
  },
};

export default function MethodWorkbench({ locale }: { locale: Locale }) {
  const text = process[locale];
  const rootRef = useRef<HTMLElement>(null);
  const lastIndex = useRef(0);
  const [active, setActive] = useState<ModuleId>("message");

  useEffect(() => {
    registerMotion();
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const media = window.matchMedia("(min-width: 1024px)");
    if (!media.matches) return;

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: ({ progress }) => {
        const nextIndex = Math.min(moduleIds.length - 1, Math.floor(progress * moduleIds.length));
        if (nextIndex === lastIndex.current) return;
        lastIndex.current = nextIndex;
        startTransition(() => setActive(moduleIds[nextIndex]));
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className="method-scene" id="method" ref={rootRef} aria-labelledby="method-title">
      <div className="method-sticky">
        <div className="method-heading method-heading--without-index" data-reveal="mask">
          <div>
            <h2 id="method-title">{text.title}</h2>
          </div>
        </div>

        <div className="method-layout">
          <div className="method-artifact" data-state={active} aria-hidden="true">
            <div className="artifact-sheet">
              <div className="artifact-top"><span>K</span><i /><i /></div>
              <div className="artifact-message"><span /><span /><span /></div>
              <div className="artifact-proof"><i /><i /><i /></div>
              <div className="artifact-contact"><span>{text.enquiry}</span></div>
              <div className="artifact-mobile"><span /><span /><i /></div>
              <div className="artifact-seal">{text.ready}</div>
            </div>
            <svg className="artifact-routes" viewBox="0 0 620 540" fill="none">
              <path d="M72 106C188 108 175 236 310 238S416 382 554 386" />
              <path d="M92 438C185 438 224 338 306 338S438 236 540 236" />
            </svg>
            <div className="artifact-state-label">{text.steps[moduleIds.indexOf(active)].output}</div>
          </div>

          <div className="method-modules" data-reveal="line">
            {text.steps.map((step, index) => (
              <button
                type="button"
                className="method-module"
                key={moduleIds[index]}
                aria-pressed={active === moduleIds[index]}
                onPointerEnter={() => setActive(moduleIds[index])}
                onFocus={() => setActive(moduleIds[index])}
                onClick={() => setActive(moduleIds[index])}
              >
                <span aria-hidden="true">0{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

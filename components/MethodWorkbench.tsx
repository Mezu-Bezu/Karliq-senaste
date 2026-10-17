"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";

const modules = [
  {
    id: "message",
    number: "01",
    title: "Riktning",
    output: "Ett tydligt behov",
    text: "Vi går igenom vad som fungerar, vad som tar tid och vad du vill förändra.",
  },
  {
    id: "structure",
    number: "02",
    title: "Förslag",
    output: "Något konkret att ta ställning till",
    text: "Du får ett förslag på upplägg, funktion och form innan arbetet går vidare.",
  },
  {
    id: "interface",
    number: "03",
    title: "Utveckling",
    output: "Från förslag till funktion",
    text: "Lösningen tar form. Vi provar, justerar och ser till att delarna fungerar ihop.",
  },
  {
    id: "launch",
    number: "04",
    title: "Lansering",
    output: "Redo för din vardag",
    text: "Vi testar i praktiken och går igenom hur allt fungerar, så att du kan ta det i bruk.",
  },
] as const;

type ModuleId = (typeof modules)[number]["id"];

export default function MethodWorkbench() {
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
        const nextIndex = Math.min(modules.length - 1, Math.floor(progress * modules.length));
        if (nextIndex === lastIndex.current) return;
        lastIndex.current = nextIndex;
        startTransition(() => setActive(modules[nextIndex].id));
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className="method-scene" id="method" ref={rootRef} aria-labelledby="method-title">
      <div className="method-sticky">
        <div className="method-heading method-heading--without-index" data-reveal="mask">
          <div>
            <h2 id="method-title">Från första fråga till färdig lösning.</h2>
            <p>Du är med från första samtalet till det fungerar i praktiken.</p>
          </div>
        </div>

        <div className="method-layout">
          <div className="method-artifact" data-state={active} aria-hidden="true">
            <div className="artifact-sheet">
              <div className="artifact-top"><span>K</span><i /><i /></div>
              <div className="artifact-message"><span /><span /><span /></div>
              <div className="artifact-proof"><i /><i /><i /></div>
              <div className="artifact-contact"><span>Förfrågan</span></div>
              <div className="artifact-mobile"><span /><span /><i /></div>
              <div className="artifact-seal">KLAR</div>
            </div>
            <svg className="artifact-routes" viewBox="0 0 620 540" fill="none">
              <path d="M72 106C188 108 175 236 310 238S416 382 554 386" />
              <path d="M92 438C185 438 224 338 306 338S438 236 540 236" />
            </svg>
            <div className="artifact-state-label"><span>{modules.find((item) => item.id === active)?.number}</span>{modules.find((item) => item.id === active)?.output}</div>
          </div>

          <div className="method-modules" data-reveal="line">
            {modules.map((module) => (
              <button
                type="button"
                className="method-module"
                key={module.id}
                aria-pressed={active === module.id}
                onPointerEnter={() => setActive(module.id)}
                onFocus={() => setActive(module.id)}
                onClick={() => setActive(module.id)}
              >
                <span>{module.number}</span>
                <div><h3>{module.title}</h3><p>{module.text}</p></div>
                <strong>{module.output}</strong>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

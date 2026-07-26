"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, registerMotion, ScrollTrigger } from "./motion";

const diagnostics = [
  {
    title: "Löftet kommer sent",
    text: "Besökaren måste leta efter vad företaget säljer och för vem.",
    signal: "Flytta löftet till första vyn",
  },
  {
    title: "Mobilen visar fel saker",
    text: "Menyn och bakgrundsbilden tar platsen från nästa steg.",
    signal: "Ge kontaktvägen plats direkt",
  },
  {
    title: "Beviset är bara ord",
    text: "Sidan påstår kvalitet utan att visa ett arbetssätt eller ett byggt exempel.",
    signal: "Visa något som går att prova",
  },
  {
    title: "Kontaktvägen frågar för lite",
    text: "Ett tomt meddelandefält skapar mer fram och tillbaka för båda parter.",
    signal: "Samla rätt underlag från start",
  },
] as const;

export default function DiagnosisWorkbench() {
  const rootRef = useRef<HTMLElement>(null);
  const lastIndex = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    registerMotion();
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !window.matchMedia("(min-width: 1024px)").matches) return;

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: ({ progress }) => {
        const next = Math.min(diagnostics.length - 1, Math.floor(progress * diagnostics.length));
        if (next === lastIndex.current) return;
        lastIndex.current = next;
        startTransition(() => setActive(next));
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className="diagnosis-scene" id="diagnosis" ref={rootRef} aria-labelledby="diagnosis-title">
      <div className="loom-handoff" aria-hidden="true">
        <span className="loom-handoff-line" />
        <i />
      </div>

      <div className="diagnosis-sticky">
        <header className="diagnosis-heading" data-reveal="mask">
          <div>
            <span aria-hidden="true">01</span>
            <h2 id="diagnosis-title">Fyra läckor. En tydlig ordning.</h2>
          </div>
          <p>Välj en rad. Den lerfärgade transparensen markerar vad som måste flyttas innan formen börjar.</p>
        </header>

        <div className="diagnosis-layout">
          <div className="diagnosis-board" data-active={active} aria-hidden="true">
            <span className="inspection-thread" />
            <div className="inspection-sheet">
              <div className="inspection-sheet-head">
                <span>Första vyn / före</span>
                <strong>Osorterat material</strong>
              </div>
              <p>Vad ska kunden förstå på fem sekunder?</p>
              <div className="inspection-strips">
                {diagnostics.map((item, index) => (
                  <span key={item.title} data-row={index}><i>0{index + 1}</i><b>{item.title}</b></span>
                ))}
              </div>
              <div className="inspection-note">
                <small>Flytta först</small>
                <strong>{diagnostics[active].signal}</strong>
              </div>
            </div>
            <div className="inspection-lens"><span>0{active + 1}</span></div>
            <i className="inspection-pin inspection-pin-a" />
            <i className="inspection-pin inspection-pin-b" />
          </div>

          <div className="diagnosis-list" data-reveal="line">
            {diagnostics.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
                onFocus={() => setActive(index)}
                onPointerEnter={() => setActive(index)}
              >
                <span>0{index + 1}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../lib/site";
import { gsap, registerMotion, usePrefersReducedMotion } from "./motion";
import { logoBricks } from "./logoBricks";
import styles from "./AgencyServices.module.css";

const wallBricks = Array.from({ length: 240 }, (_, index) => ({
  col: index % 16, row: Math.floor(index / 16),
}));
const transitionBricks = Array.from({ length: 64 }, (_, index) => ({ col: index % 16, row: Math.floor(index / 16) }));

export default function AgencyServices({ locale }: { locale: Locale }) {
  const swedish = locale === "sv";
  const root = useRef<HTMLElement>(null);
  const transitionWall = useRef<HTMLDivElement>(null);
  const [transitionHost, setTransitionHost] = useState<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => { setTransitionHost(document.querySelector<HTMLElement>("#signature-bridge [data-bridge-exit]")); }, []);
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    if (reduced) { section.dataset.build = "complete"; return () => { delete section.dataset.build; }; }
    registerMotion();
    let timeline: gsap.core.Timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline({ paused: true, onComplete: () => { section.dataset.build = "complete"; } });
      section.querySelectorAll<HTMLElement>("[data-background-brick]").forEach((brick, index) => {
        const block = wallBricks[index];
        const start = .2 + (14 - block.row) * .17 + ((block.col * 7) % 9) * .045;
        timeline.fromTo(brick,
          { y: -1500, rotation: (block.col % 3 - 1) * 5, autoAlpha: 0 },
          { y: 0, rotation: 0, autoAlpha: 1, duration: 1.1, ease: "power2.inOut" }, start);
      });
      section.querySelectorAll<HTMLElement>("[data-automation-brick]").forEach((brick, index) => {
        const block = logoBricks[index];
        const start = .15 + (29 - block.y) * .085 + ((block.x * 7) % 11) * .018;
        timeline.fromTo(brick,
          { y: -1050 - block.y * 13, x: ((index * 17) % 65) - 32, rotation: ((index * 13) % 47) - 23, autoAlpha: 0 },
          { y: 0, x: 0, rotation: 0, autoAlpha: 1, duration: .7, ease: "power2.in" }, start);
        timeline.to(brick, { y: -2.5, duration: .065, ease: "power1.out" }, start + .7);
        timeline.to(brick, { y: 0, duration: .12, ease: "power2.in" }, start + .765);
      });
      transitionWall.current?.querySelectorAll<HTMLElement>("[data-transition-brick]").forEach((brick, index) => {
        const block = transitionBricks[index];
        timeline.fromTo(brick,
          { y: -600, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .8, ease: "power2.inOut" },
          3 + (3 - block.row) * .15 + (block.col % 4) * .035);
      });
    }, section);
    const update = () => {
      if (timeline.progress() === 1) return;
      const { top, bottom } = section.getBoundingClientRect();
      if (!document.hidden && top < window.innerHeight && bottom > 0) {
        section.dataset.build = "playing";
        timeline.play();
      } else {
        timeline.pause();
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("visibilitychange", update);
      context.revert();
      delete section.dataset.build;
    };
  }, [reduced, transitionHost]);

  return (
    <>
    {transitionHost && createPortal(
      <div ref={transitionWall} className={styles.transitionWall} aria-hidden="true" data-lego-transition>
        {transitionBricks.map((block, index) => (
          <div key={index} className={`${styles.wallBrick} ${styles.transitionBrick}`} data-transition-brick style={{
            "--col": block.col, "--row": block.row,
            "--mobile-col": index % 8, "--mobile-row": Math.floor(index / 8),
          } as CSSProperties}><i /><i /><i /><i /></div>
        ))}
      </div>, transitionHost)}
    <section ref={root} id="services" className={styles.section} aria-labelledby="services-title" data-automation-scene>
      <div className={styles.sticky}>
        <div className={styles.wall} aria-hidden="true">
          {wallBricks.map((block, index) => (
            <div key={index} className={styles.wallBrick} data-background-brick style={{
              "--col": block.col, "--row": block.row,
              "--mobile-col": index % 8, "--mobile-row": Math.floor(index / 8),
            } as CSSProperties}>
              <i /><i /><i /><i />
            </div>
          ))}
        </div>
        <header className={`agency-services-head ${styles.heading}`}>
          <span className={styles.eyebrow}>{swedish ? "Automation" : "Business automation"}</span>
          <h2 id="services-title">
            {swedish ? <>Jag kopplar ihop<br />dina verktyg.</> : <>I connect<br />your tools.</>}
          </h2>
          <p>
            {swedish
              ? "Slipp kopiera uppgifter mellan system. Jag bygger flöden som sköter uppföljning, bokningar och rapporter automatiskt."
              : "Stop copying data between systems. I build workflows that handle follow-ups, bookings and reports automatically."}
          </p>
          <a href="#contact" className={styles.cta} data-micro>
            {swedish ? "Berätta vad som tar tid" : "Tell me what takes up your time"} <span aria-hidden="true">↗</span>
          </a>
        </header>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.logo} data-brick-logo>
            {logoBricks.map((block, index) => (
              <div key={index} className={styles.brick} data-automation-brick
                style={{ left: block.x * 13, top: block.y * 13, width: block.w * 13 - .65 }}>
                <div className={styles.studs} aria-hidden="true">
                  {Array.from({ length: block.w }, (_, stud) => <i key={stud} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

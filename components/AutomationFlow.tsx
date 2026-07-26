"use client";

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { usePrefersReducedMotion } from "./motion";
import styles from "./AutomationFlow.module.css";

export type AutomationFlowVariant = "full" | "compact";
export type AutomationFlowScenario = "lead" | "document" | "followup";

export type AutomationFlowProps = {
  className?: string;
  variant?: AutomationFlowVariant;
  initialScenario?: AutomationFlowScenario;
};

type Scenario = {
  id: AutomationFlowScenario;
  label: string;
  input: string;
  interpret: string;
  action: string;
  receipt: string;
  accent: string;
};

const SCENARIOS: readonly Scenario[] = [
  {
    id: "lead",
    label: "Lead",
    input: "Nytt formulär",
    interpret: "AI läser avsikt",
    action: "Fördela & följ upp",
    receipt: "Rätt person får rätt nästa steg",
    accent: "#d8b4fe",
  },
  {
    id: "document",
    label: "Dokument",
    input: "PDF / underlag",
    interpret: "AI hittar beslut",
    action: "Skapa ärende",
    receipt: "Information blir arbete utan dubbelregistrering",
    accent: "#a855f7",
  },
  {
    id: "followup",
    label: "Uppföljning",
    input: "Inaktiv affär",
    interpret: "Regler väljer signal",
    action: "Påminn rätt person",
    receipt: "Nästa kontakt sker när den faktiskt behövs",
    accent: "#e9d5ff",
  },
] as const;

const FLOW_PATH =
  "M54 395C154 387 181 216 313 220C428 224 415 357 550 347C690 337 673 158 835 164C989 170 981 352 1111 337C1259 319 1264 181 1450 164";

const BRANCH_PATHS = [
  "M270 220C245 125 325 79 418 97C493 111 500 179 493 236",
  "M795 164C748 80 812 38 908 63C991 84 1011 146 995 218",
  "M1091 337C1044 433 1133 471 1230 433C1294 407 1314 347 1290 292",
] as const;

function getScenarioIndex(initialScenario: AutomationFlowScenario) {
  const index = SCENARIOS.findIndex((scenario) => scenario.id === initialScenario);
  return index === -1 ? 0 : index;
}

export default function AutomationFlow({
  className = "",
  variant = "full",
  initialScenario = "lead",
}: AutomationFlowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const impulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descriptionId = useId();
  const [scenarioIndex, setScenarioIndex] = useState(() =>
    getScenarioIndex(initialScenario),
  );
  const [impulse, setImpulse] = useState(0);
  const [impulseActive, setImpulseActive] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const scenario = SCENARIOS[scenarioIndex];
  const running = inView && pageVisible && !reducedMotion;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "15% 0px", threshold: 0.01 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setPageVisible(document.visibilityState !== "hidden");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(
    () => () => {
      if (impulseTimerRef.current) clearTimeout(impulseTimerRef.current);
    },
    [],
  );

  const sendImpulse = useCallback(() => {
    if (impulseTimerRef.current) clearTimeout(impulseTimerRef.current);
    setImpulse((current) => current + 1);
    setImpulseActive(true);
    impulseTimerRef.current = setTimeout(
      () => setImpulseActive(false),
      reducedMotion ? 420 : 3300,
    );
  }, [reducedMotion]);

  const selectScenario = useCallback(
    (index: number) => {
      setScenarioIndex(index);
      window.requestAnimationFrame(sendImpulse);
    },
    [sendImpulse],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      const style = event.currentTarget.style;
      style.setProperty("--pointer-left", `${x * 100}%`);
      style.setProperty("--pointer-top", `${y * 100}%`);
      style.setProperty("--ring-x", `${(x - 0.5) * -7.5}px`);
      style.setProperty("--ring-y", `${(y - 0.5) * -6}px`);
      style.setProperty("--field-x", `${(x - 0.5) * 15}px`);
      style.setProperty("--field-y", `${(y - 0.5) * 8}px`);
    },
    [reducedMotion],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.currentTarget.focus({ preventScroll: true });
      sendImpulse();
    },
    [sendImpulse],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      sendImpulse();
    },
    [sendImpulse],
  );

  const moveControlFocus = useCallback(
    (index: number) => {
      selectScenario(index);
      window.requestAnimationFrame(() => {
        rootRef.current
          ?.querySelectorAll<HTMLButtonElement>("[data-automation-mode]")
          [index]?.focus();
      });
    },
    [selectScenario],
  );

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-running={running}
      data-reduced-motion={reducedMotion}
      data-impulse={impulseActive}
      data-scenario={scenario.id}
      role="group"
      tabIndex={0}
      aria-label="Interaktivt automationsflöde"
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ "--scenario-accent": scenario.accent } as CSSProperties}
    >
      <div className={styles.pointerWash} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.topline} aria-hidden="true">
        <span>AUTOMATION / 03</span>
        <span>REGLER + AI + API</span>
      </div>

      <div className={styles.words} aria-hidden="true">
        <span>SIGNAL</span>
        <span>TOLKA</span>
        <span>GÖR</span>
      </div>

      <svg
        className={styles.network}
        viewBox="0 0 1500 520"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={`${descriptionId}-soft`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <g className={styles.branchLayer}>
          {BRANCH_PATHS.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>

        <path className={styles.routeBed} d={FLOW_PATH} />
        <path className={styles.routeLive} d={FLOW_PATH} />
        <path
          className={styles.routeAccent}
          d={FLOW_PATH}
          key={`route-${scenario.id}-${impulse}`}
        />

        <g className={styles.inputNode}>
          <ellipse cx="313" cy="220" rx="64" ry="57" />
          <circle cx="313" cy="220" r="18" />
          <path d="M282 220H344M313 189V251" />
        </g>

        <g className={styles.interpretNode}>
          <ellipse cx="835" cy="164" rx="92" ry="72" />
          <ellipse cx="835" cy="164" rx="55" ry="42" />
          <ellipse cx="835" cy="164" rx="18" ry="14" />
        </g>

        <g className={styles.actionNode}>
          <path d="M1080 337C1080 291 1120 262 1167 271C1209 278 1234 321 1218 361C1202 399 1154 416 1118 393C1094 378 1080 360 1080 337Z" />
          <path d="M1122 337L1149 364L1192 313" />
        </g>

        <g className={styles.satellites}>
          <circle cx="418" cy="97" r="16" />
          <circle cx="908" cy="63" r="24" />
          <circle cx="1230" cy="433" r="18" />
          <circle cx="1370" cy="198" r="9" />
          <circle cx="151" cy="355" r="12" />
        </g>

        {running ? (
          <g className={styles.impulse} key={`impulse-${impulse}`}>
            <circle className={styles.impulseHalo} r="31" />
            <circle className={styles.impulseCore} r="13" />
            <animateMotion
              dur="3.1s"
              path={FLOW_PATH}
              begin="0s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.3 0.7 0.15 1"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.04;0.78;0.96;1"
              dur="3.1s"
              fill="freeze"
            />
          </g>
        ) : null}
      </svg>

      <div className={styles.stageCopy} aria-hidden="true">
        <div>
          <span>01 / IN</span>
          <strong>{scenario.input}</strong>
        </div>
        <div>
          <span>02 / BESLUT</span>
          <strong>{scenario.interpret}</strong>
        </div>
        <div>
          <span>03 / UT</span>
          <strong>{scenario.action}</strong>
        </div>
      </div>

      <div className={styles.receipt} aria-hidden="true">
        <span>RESULTAT</span>
        <p>{scenario.receipt}</p>
      </div>

      <div
        className={styles.controls}
        role="tablist"
        aria-label="Välj ett exempel på automationsflöde"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {SCENARIOS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-automation-mode
            aria-selected={scenarioIndex === index}
            tabIndex={scenarioIndex === index ? 0 : -1}
            onClick={() => selectScenario(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveControlFocus((index + 1) % SCENARIOS.length);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveControlFocus((index - 1 + SCENARIOS.length) % SCENARIOS.length);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveControlFocus(0);
              } else if (event.key === "End") {
                event.preventDefault();
                moveControlFocus(SCENARIOS.length - 1);
              }
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
      </div>

      <p className={styles.instruction} id={descriptionId}>
        {reducedMotion ? "Tryck för att skicka signalen." : "Dra i fältet. Tryck för att skicka signalen."}
      </p>

      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {scenario.label}: {scenario.input}. {scenario.interpret}. {scenario.action}.{" "}
        {impulse > 0 ? `Signal ${impulse} skickad. ${scenario.receipt}.` : "Ingen signal skickad ännu."}
      </p>
    </div>
  );
}

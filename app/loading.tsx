import styles from "../components/RouteTransition.module.css";

export default function Loading() {
  return null;

  return (
    <div className={styles.loadingShell} role="status" aria-label="Öppnar sidan">
      <img src="/karliq-logo-mark.png" alt="Karliq" />
      <svg viewBox="0 0 1200 420" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d="M-80 336C168 126 336 401 558 229C748 82 886 313 1280 40" />
      </svg>
    </div>
  );
}

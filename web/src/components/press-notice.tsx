import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_MS = 60 * 60 * 1000;
const VISIBILITY_DEBOUNCE_MS = 5 * 60 * 1000;

const SLIP_INITIAL = { opacity: 0, rotate: 0, y: 12 };
const SLIP_ANIMATE = { opacity: 1, rotate: -1.5, y: 0 };
const SLIP_EXIT = { opacity: 0, x: 24, transition: { duration: 0.25 } };
const SLIP_TRANSITION = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };
const SLIP_STYLE = { bottom: "max(1.5rem, env(safe-area-inset-bottom))" };

export function PressNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;
    let lastCheckedAt = 0;

    const checkForUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg === undefined) return;
      lastCheckedAt = Date.now();
      await reg.update();
    };

    const armInterval = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (cancelled || reg === undefined) return;
      intervalId = window.setInterval(() => void checkForUpdate(), UPDATE_CHECK_MS);
    };
    void armInterval();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckedAt < VISIBILITY_DEBOUNCE_MS) return;
      void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={SLIP_INITIAL}
          animate={SLIP_ANIMATE}
          exit={SLIP_EXIT}
          transition={SLIP_TRANSITION}
          className="fixed right-6 z-50 max-w-[28ch] bg-paper-2 border-t border-b border-rule px-5 py-3"
          style={SLIP_STYLE}
        >
          <button
            type="button"
            onClick={() => {
              setNeedRefresh(false);
            }}
            className="absolute -top-2 -right-2 font-mono text-xs text-ink-faint hover:text-accent outline-none cursor-pointer leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
          <div className="kicker text-accent tracking-[0.32em] mb-1">Stop Press</div>
          <div className="font-display italic text-base text-ink leading-snug">
            A revised edition is on the press.
          </div>
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="mt-2 kicker italic text-ink-quiet hover:text-accent underline decoration-accent underline-offset-4 decoration-1 cursor-pointer outline-none"
          >
            · set ·
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

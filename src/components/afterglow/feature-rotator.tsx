"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HOME_FEATURE_LINES } from "@/lib/constants";

const INTERVAL_MS = 7000;
const FADE_DURATION = 0.85;

export function FeatureRotator() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HOME_FEATURE_LINES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const line = HOME_FEATURE_LINES[index];

  if (reduceMotion) {
    return (
      <p className="mx-auto mt-4 max-w-sm text-sm text-muted">
        {HOME_FEATURE_LINES[0]}
      </p>
    );
  }

  return (
    <div
      className="feature-rotator relative mx-auto mt-4 h-12 max-w-md overflow-hidden"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={line}
          className="feature-rotator__line absolute inset-x-0 text-sm text-muted"
          initial={{ opacity: 0, y: 18, filter: "blur(6px)", letterSpacing: "0.08em" }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            letterSpacing: "0.02em",
          }}
          exit={{ opacity: 0, y: -14, filter: "blur(4px)", letterSpacing: "0.06em" }}
          transition={{ duration: FADE_DURATION, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="inline-block"
            animate={{ x: [0, 3, -2, 0] }}
            transition={{
              duration: INTERVAL_MS / 1000,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            {line}
          </motion.span>
        </motion.p>
      </AnimatePresence>

      <div className="feature-rotator__scanline pointer-events-none absolute inset-x-8 bottom-0 h-px" aria-hidden />
    </div>
  );
}

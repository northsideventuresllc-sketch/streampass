"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  AnimatePresence,
} from "motion/react";
import { cn } from "@/lib/utils";

export const SPARK_IN_KEY = "streampass-spark-in";

type LogoSize = "hero" | "nav" | "auth";

interface StreamPassLogoProps {
  size?: LogoSize;
  interactive?: boolean;
  /** Hero on home: text only, no boxed warp — page handles atmosphere */
  immersive?: boolean;
  sparkIn?: boolean;
  className?: string;
  onSparkComplete?: () => void;
}

const SIZE_MAP = {
  hero: {
    stream: "text-[2.85rem] md:text-[4.5rem]",
    pass: "text-[3.1rem] md:text-[5rem]",
  },
  auth: { stream: "text-2xl", pass: "text-[1.75rem]" },
  nav: { stream: "text-[0.8rem]", pass: "text-sm" },
} as const;

function SparkBurst({ active }: { active: boolean }) {
  if (!active) return null;

  const sparks = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    distance: 40 + (i % 3) * 18,
    delay: i * 0.025,
  }));

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden
    >
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute h-0.5 w-6 origin-left rounded-full bg-gradient-to-r from-cyan to-magenta"
          initial={{ opacity: 1, scaleX: 0, rotate: s.angle }}
          animate={{ opacity: 0, scaleX: 1.4, x: s.distance }}
          transition={{ duration: 0.55, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-cyan/30 blur-2xl"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.6, 2] }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.div
        className="absolute h-16 w-16 rounded-full bg-magenta/40 blur-xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 1.8] }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
      />
    </div>
  );
}

export function StreamPassLogo({
  size = "hero",
  interactive = false,
  immersive = false,
  sparkIn = false,
  className,
  onSparkComplete,
}: StreamPassLogoProps) {
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [sparkActive, setSparkActive] = useState(sparkIn);
  const [glitch, setGlitch] = useState(false);

  const tiltX = useSpring(0, { stiffness: 140, damping: 24 });
  const tiltY = useSpring(0, { stiffness: 140, damping: 24 });

  const isInteractive =
    interactive && !reduceMotion && size === "hero";
  const sizes = SIZE_MAP[size];

  useEffect(() => {
    if (!sparkIn || reduceMotion) {
      onSparkComplete?.();
      return;
    }
    setSparkActive(true);
    const timer = window.setTimeout(() => {
      setSparkActive(false);
      onSparkComplete?.();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [sparkIn, reduceMotion, onSparkComplete]);

  useEffect(() => {
    if (!isInteractive || !hovering) return;
    const interval = window.setInterval(() => {
      setGlitch(true);
      window.setTimeout(() => setGlitch(false), 100);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [isInteractive, hovering]);

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (!isInteractive) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      tiltX.set((0.5 - y) * (immersive ? 5 : 8));
      tiltY.set((x - 0.5) * (immersive ? 6 : 10));
    },
    [isInteractive, immersive, tiltX, tiltY]
  );

  useEffect(() => {
    if (!isInteractive) return;
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isInteractive, handleMove]);

  const handleLeave = useCallback(() => {
    setHovering(false);
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  return (
    <div
      className={cn(
        "streampass-logo relative inline-flex select-none flex-col items-center overflow-visible",
        size === "hero" && "streampass-logo--hero",
        immersive && "streampass-logo--immersive",
        className
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleLeave}
      aria-label="Stream Pass"
      role="img"
    >
      <SparkBurst active={sparkActive && !reduceMotion} />

      {/* Local warp only for non-immersive hero (auth pages etc.) */}
      {size === "hero" && !immersive && !reduceMotion && (
        <div className="streampass-logo__warp streampass-logo__warp--local" aria-hidden>
          <div className="streampass-logo__warp-core" />
          <div className="streampass-logo__warp-lines" />
          <div className="streampass-logo__warp-tunnel" />
        </div>
      )}

      <motion.div
        className="relative z-[2] flex flex-col items-center leading-none"
        initial={
          sparkIn && !reduceMotion
            ? { opacity: 0, scale: 0.82, filter: "blur(8px)" }
            : false
        }
        animate={
          sparkIn && !reduceMotion
            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
            : undefined
        }
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 22,
          delay: sparkIn ? 0.15 : 0,
        }}
        style={
          isInteractive
            ? { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }
            : undefined
        }
      >
        <span
          className={cn(
            "streampass-logo__stream font-logo font-bold uppercase tracking-[0.22em]",
            sizes.stream,
            glitch && "streampass-logo__glitch"
          )}
        >
          Stream
        </span>
        <span
          className={cn(
            "streampass-logo__pass -mt-1 font-logo font-black uppercase tracking-[0.32em]",
            sizes.pass,
            glitch && "streampass-logo__glitch streampass-logo__glitch--pass"
          )}
        >
          Pass
        </span>

        {size === "hero" && (
          <div
            className="streampass-logo__underline mt-4 h-px w-full min-w-[260px] md:min-w-[420px]"
            aria-hidden
          />
        )}
      </motion.div>

      <AnimatePresence>
        {hovering && isInteractive && immersive && (
          <motion.div
            className="pointer-events-none absolute -bottom-3 left-1/2 z-[3] -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.4em] text-cyan/60"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            aria-hidden
          >
            enter hyperspace
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Reads sessionStorage and triggers one-time spark-in after login */
export function useSparkInLogo() {
  const [spark, setSpark] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SPARK_IN_KEY) === "1") {
      sessionStorage.removeItem(SPARK_IN_KEY);
      setSpark(true);
    }
  }, []);

  const clearSpark = useCallback(() => setSpark(false), []);

  return { spark, clearSpark };
}

"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

export function AmbientBg() {
  const reduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const spotX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const spotY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  const spotLeft = useTransform(spotX, (v) => `${v * 100}%`);
  const spotTop = useTransform(spotY, (v) => `${v * 100}%`);

  const magentaX = useSpring(useMotionValue(0), { stiffness: 35, damping: 18 });
  const magentaY = useSpring(useMotionValue(0), { stiffness: 35, damping: 18 });

  const spotlight = useMotionTemplate`radial-gradient(640px circle at ${spotLeft} ${spotTop}, rgba(232,121,249,0.09) 0%, rgba(34,211,238,0.04) 35%, transparent 68%)`;

  useEffect(() => {
    if (reduceMotion) return;

    function onMove(e: MouseEvent) {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      mouseX.set(nx);
      mouseY.set(ny);
      magentaX.set((nx - 0.5) * 40);
      magentaY.set((ny - 0.5) * 30);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion, mouseX, mouseY, magentaX, magentaY]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="ambient-orb ambient-orb-magenta"
        style={reduceMotion ? undefined : { x: magentaX, y: magentaY }}
      />
      <div className="ambient-orb ambient-orb-cyan" />
      <div className="ambient-orb ambient-orb-violet" />

      <div className="ambient-aurora" />

      <div className="ambient-floor">
        <div className="ambient-floor-grid" />
      </div>

      <div className="ambient-grid" />
      <div className="ambient-noise" />
      <div className="ambient-vignette" />

      {!reduceMotion && (
        <motion.div className="ambient-spotlight" style={{ background: spotlight }} />
      )}
    </div>
  );
}

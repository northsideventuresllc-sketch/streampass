"use client";

import { useCallback, useEffect, type MouseEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

/** Full-viewport hyperspace layer — no bounding box, blends into the page */
export function ImmersiveWarp() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const tiltX = useSpring(0, { stiffness: 120, damping: 28 });
  const tiltY = useSpring(0, { stiffness: 120, damping: 28 });

  const spotlight = useMotionTemplate`radial-gradient(ellipse 45% 35% at ${pointerX}% ${pointerY}%, rgba(34,211,238,0.14) 0%, rgba(232,121,249,0.08) 40%, transparent 70%)`;

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      pointerX.set(x);
      pointerY.set(y);
      tiltX.set((0.5 - y / 100) * 4);
      tiltY.set((x / 100 - 0.5) * 5);
    },
    [pointerX, pointerY, tiltX, tiltY]
  );

  useEffect(() => {
    if (reduceMotion) return;
    const center = () => {
      pointerX.set(50);
      pointerY.set(50);
      tiltX.set(0);
      tiltY.set(0);
    };
    window.addEventListener("mouseleave", center);
    return () => window.removeEventListener("mouseleave", center);
  }, [reduceMotion, pointerX, pointerY, tiltX, tiltY]);

  if (reduceMotion) return null;

  return (
    <div
      className="immersive-warp fixed inset-0 z-[1]"
      onMouseMove={handleMove}
      aria-hidden
    >
      <motion.div
        className="immersive-warp__spotlight absolute inset-0"
        style={{ background: spotlight }}
      />
      <motion.div
        className="immersive-warp__lines absolute inset-[-20%]"
        style={{ rotateX: tiltX, rotateY: tiltY }}
      />
      <div className="immersive-warp__tunnel absolute inset-0" />
    </div>
  );
}

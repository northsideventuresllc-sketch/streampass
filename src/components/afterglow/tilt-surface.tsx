"use client";

import {
  useCallback,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

interface TiltSurfaceProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  disabled?: boolean;
}

export function TiltSurface({
  children,
  className,
  maxTilt = 10,
  glare = true,
  disabled = false,
}: TiltSurfaceProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useSpring(0, { stiffness: 280, damping: 28 });
  const rotateY = useSpring(0, { stiffness: 280, damping: 28 });
  const glareX = useSpring(50, { stiffness: 200, damping: 30 });
  const glareY = useSpring(50, { stiffness: 200, damping: 30 });
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.16) 0%, transparent 58%)`;

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (reduceMotion || disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      rotateY.set((x - 0.5) * maxTilt * 2);
      rotateX.set((0.5 - y) * maxTilt * 2);
      glareX.set(x * 100);
      glareY.set(y * 100);
      glareOpacity.set(1);
    },
    [
      reduceMotion,
      disabled,
      maxTilt,
      rotateX,
      rotateY,
      glareX,
      glareY,
      glareOpacity,
    ]
  );

  const handleLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
    glareOpacity.set(0);
  }, [rotateX, rotateY, glareX, glareY, glareOpacity]);

  const isInteractive = !reduceMotion && !disabled;

  return (
    <div
      ref={ref}
      className={cn("tilt-scene", className)}
      onMouseMove={isInteractive ? handleMove : undefined}
      onMouseLeave={isInteractive ? handleLeave : undefined}
    >
      <motion.div
        className="tilt-surface-inner"
        style={
          isInteractive
            ? {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
            : undefined
        }
      >
        {glare && isInteractive && (
          <motion.div
            className="tilt-glare pointer-events-none"
            aria-hidden
            style={{ background: glareBg, opacity: glareOpacity }}
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}

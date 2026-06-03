"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { bentoItem } from "@/lib/motion";
import { TiltSurface } from "./tilt-surface";

type BentoVariant = "default" | "hero" | "magenta" | "cyan" | "ai" | "live";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: BentoVariant;
  href?: string;
  /** Enable 3D cursor tilt (default: true for hero/ai) */
  tilt?: boolean;
}

const variantClass: Record<BentoVariant, string> = {
  default: "bento-card",
  hero: "bento-card bento-hero",
  magenta: "bento-card bento-magenta",
  cyan: "bento-card bento-cyan",
  ai: "bento-card bento-ai",
  live: "bento-card bento-live",
};

const tiltDefaults: Partial<Record<BentoVariant, boolean>> = {
  hero: true,
  ai: true,
};

export function BentoCard({
  children,
  className,
  variant = "default",
  href,
  tilt,
}: BentoCardProps) {
  const reduceMotion = useReducedMotion();
  const useTilt = tilt ?? tiltDefaults[variant] ?? false;
  const classes = cn(variantClass[variant], "bento-card-3d", className);
  const maxTilt = variant === "hero" ? 8 : 6;

  const inner = (
    <>
      <span className="bento-edge-glow" aria-hidden />
      <span className="bento-shine" aria-hidden />
      <div className="relative z-[2]">{children}</div>
    </>
  );

  const cardBody = useTilt && !reduceMotion ? (
    <TiltSurface maxTilt={maxTilt} className="h-full">
      <div className={classes}>{inner}</div>
    </TiltSurface>
  ) : (
    <div className={classes}>{inner}</div>
  );

  if (href) {
    return (
      <motion.div
        variants={reduceMotion ? undefined : bentoItem}
        initial={false}
        className="h-full"
      >
        <Link href={href} className="block h-full no-underline text-inherit">
          {cardBody}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={reduceMotion ? undefined : bentoItem}
      initial={false}
      className="h-full"
    >
      {cardBody}
    </motion.div>
  );
}

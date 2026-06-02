"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { bentoItem } from "@/lib/motion";

type BentoVariant = "default" | "hero" | "accent-magenta" | "accent-cyan" | "live";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: BentoVariant;
  href?: string;
}

const variantStyles: Record<BentoVariant, string> = {
  default: "border-white/[0.06] hover:border-white/[0.12]",
  hero: "border-magenta/40 hover:border-magenta/60 lg:col-span-2 lg:row-span-2",
  "accent-magenta": "border-magenta/25 hover:border-magenta/50",
  "accent-cyan": "border-cyan/25 hover:border-cyan/50",
  live: "border-live/30 hover:border-live/50",
};

export function BentoCard({
  children,
  className,
  variant = "default",
  href,
}: BentoCardProps) {
  const reduceMotion = useReducedMotion();

  const classes = cn("bento-card group block", variantStyles[variant], className);

  const inner = (
    <motion.div
      variants={reduceMotion ? undefined : bentoItem}
      className={href ? "h-full" : undefined}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return <motion.div className={classes} variants={reduceMotion ? undefined : bentoItem}>{children}</motion.div>;
}

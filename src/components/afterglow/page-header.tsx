"use client";

import { motion, useReducedMotion } from "motion/react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="page-header-3d mb-8">
      <div className="page-header-spotlight" aria-hidden />

      {badge && (
        <motion.p
          className="relative z-[1] mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a1a1aa]"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {badge}
        </motion.p>
      )}

      <motion.h1
        className="relative z-[1] font-display text-3xl font-bold tracking-tight md:text-4xl"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
      >
        <span className="text-gradient-hero">{title}</span>
      </motion.h1>

      {subtitle && (
        <motion.p
          className="relative z-[1] mt-2 max-w-xl text-sm text-[#a1a1aa]"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}

export const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const springSoft = {
  type: "spring" as const,
  stiffness: 200,
  damping: 26,
};

export const easeOut = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const easeOutSlow = {
  duration: 0.65,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

/** Pass-through group so stagger reaches nested bento cards */
export const bentoContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.03 },
  },
};

export const bentoItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97, rotateX: 6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: springSoft,
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

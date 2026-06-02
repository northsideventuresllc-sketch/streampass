export const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const easeOut = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const bentoContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

export const bentoItem = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring,
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

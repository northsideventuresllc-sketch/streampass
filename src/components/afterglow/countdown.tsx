"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function Countdown({ scheduledTime }: { scheduledTime: string }) {
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState("--:--:--");
  const [isLive, setIsLive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function update() {
      const diff = new Date(scheduledTime).getTime() - Date.now();
      if (diff <= 0) {
        setText("Press Play!");
        setIsLive(true);
        return;
      }
      setIsLive(false);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
      setTick((t) => t + 1);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [scheduledTime]);

  return (
    <motion.span
      key={tick}
      className={cn("countdown-display", isLive && "countdown-live")}
      initial={reduceMotion ? false : { scale: 0.96, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.span>
  );
}

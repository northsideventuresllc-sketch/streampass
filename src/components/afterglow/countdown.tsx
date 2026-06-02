"use client";

import { useEffect, useState } from "react";

export function Countdown({ scheduledTime }: { scheduledTime: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(scheduledTime).getTime() - Date.now();
      if (diff <= 0) {
        setText("Press Play!");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scheduledTime]);

  return (
    <span className="font-mono text-3xl font-bold tabular-nums text-cyan md:text-4xl">
      {text || "—"}
    </span>
  );
}

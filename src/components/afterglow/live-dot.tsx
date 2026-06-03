"use client";

import { cn } from "@/lib/utils";

interface LiveDotProps {
  pulse?: boolean;
  className?: string;
}

export function LiveDot({ pulse = true, className }: LiveDotProps) {
  return (
    <span className={cn("relative inline-flex h-3 w-3", className)}>
      {pulse && (
        <>
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-50 motion-reduce:hidden"
            aria-hidden
          />
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-30 blur-sm motion-reduce:hidden"
            aria-hidden
          />
        </>
      )}
      <span className="relative inline-flex h-3 w-3 rounded-full bg-[#4ade80] shadow-[0_0_16px_#4ade80,0_0_4px_#4ade80]" />
    </span>
  );
}

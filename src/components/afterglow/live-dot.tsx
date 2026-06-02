"use client";

import { cn } from "@/lib/utils";

interface LiveDotProps {
  pulse?: boolean;
  className?: string;
}

export function LiveDot({ pulse = true, className }: LiveDotProps) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      {pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60 motion-reduce:hidden" />
      )}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
    </span>
  );
}

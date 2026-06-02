"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListVideo,
  Sparkles,
  CreditCard,
  Bell,
  Users,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  LayoutDashboard,
  ListVideo,
  Sparkles,
  CreditCard,
  Bell,
  Users,
} as const;

interface MobileNavProps {
  alertCount?: number;
}

export function MobileNav({ alertCount = 0 }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mobile-dock" aria-label="Main navigation">
      <div className="flex items-center justify-around gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          const showBadge = item.href === "/passport" && alertCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] transition duration-300",
                active ? "text-magenta" : "text-muted"
              )}
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-xl transition",
                  active && "nav-pill-active"
                )}
              >
                <Icon className="h-4 w-4" />
                {showBadge && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

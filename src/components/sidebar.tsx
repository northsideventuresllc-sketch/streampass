"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListVideo,
  Sparkles,
  CreditCard,
  Bell,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

interface SidebarProps {
  username?: string;
  alertCount?: number;
}

export function Sidebar({ username, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navContent = (
    <>
      <div className="mb-10 px-2">
        <Link href="/dashboard" className="block group">
          <span className="font-display text-xl font-bold tracking-tight text-gradient">
            Stream Pass
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Afterglow · NI
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          const showBadge = item.href === "/passport" && alertCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "nav-pill-active"
                  : "text-muted hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="badge-danger">{alertCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/[0.06] pt-4">
        {username && (
          <p className="mb-3 truncate px-2 font-mono text-xs text-muted">
            {username}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/[0.04] hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-white/[0.08] bg-black/60 p-2.5 backdrop-blur-xl lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col p-5 lg:flex",
          mobileOpen && "!flex translate-x-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="hidden border-t border-white/[0.06] py-5 text-center lg:block">
      <span className="badge-magenta">A Northside Intelligence Project</span>
    </footer>
  );
}

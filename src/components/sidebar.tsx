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
      <div className="mb-10 px-1">
        <Link href="/dashboard" className="block">
          <span className="font-display text-xl font-bold text-gradient">
            Stream Pass
          </span>
          <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#71717a]">
            Afterglow
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "nav-pill-active"
                  : "text-[#a1a1aa] hover:bg-white/[0.05] hover:text-white"
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

      <div className="mt-auto border-t border-white/[0.08] pt-4">
        {username && (
          <p className="mb-3 truncate px-1 font-mono text-xs text-[#71717a]">
            {username}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#a1a1aa] transition hover:bg-white/[0.05] hover:text-white"
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
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col p-5 transition-transform duration-300 lg:z-40 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="hidden border-t border-white/[0.08] py-5 text-center lg:block">
      <span className="badge-magenta">A Northside Intelligence Project</span>
    </footer>
  );
}

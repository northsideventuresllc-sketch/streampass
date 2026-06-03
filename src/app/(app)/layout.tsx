import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, AppFooter } from "@/components/sidebar";
import { MobileNav } from "@/components/afterglow/mobile-nav";
import { AmbientBg } from "@/components/afterglow/ambient-bg";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { count: alertCount }] = await Promise.all([
    supabase
      .from("streampass_profiles")
      .select("username")
      .eq("id", user.id)
      .single(),
    supabase
      .from("streampass_tracked_titles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("alert_triggered", true),
  ]);

  return (
    <div className="relative flex min-h-screen">
      <AmbientBg />
      <Sidebar
        username={profile?.username ?? user.email ?? undefined}
        alertCount={alertCount ?? 0}
      />
      <MobileNav alertCount={alertCount ?? 0} />
      <div className="flex min-h-screen flex-1 flex-col bg-transparent lg:ml-[260px]">
        <main className="relative z-[1] flex-1 bg-transparent px-4 py-6 pt-16 pb-24 lg:px-8 lg:py-8 lg:pb-8 lg:pt-8">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

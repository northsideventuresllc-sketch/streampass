import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AmbientBg } from "@/components/afterglow/ambient-bg";
import { HomeHero, HomeFooter } from "@/components/afterglow/home-hero";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <AmbientBg />
      <HomeHero />
      <HomeFooter />
    </div>
  );
}

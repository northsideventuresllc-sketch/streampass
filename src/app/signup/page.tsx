import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AmbientBg } from "@/components/afterglow/ambient-bg";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="font-display text-3xl font-bold text-gradient">
            Stream Pass
          </Link>
          <p className="mt-3 text-sm text-muted">Create your command center</p>
        </div>
        <div className="card">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}

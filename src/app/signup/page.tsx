import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AmbientBg } from "@/components/afterglow/ambient-bg";
import { StreamPassLogo } from "@/components/afterglow/streampass-logo";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <StreamPassLogo size="auth" />
          </Link>
          <p className="mt-4 text-sm text-muted">Create your account</p>
        </div>
        <div className="card">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}

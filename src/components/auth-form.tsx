"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split("@")[0] },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="yourname"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">
          Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? "Processing..."
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

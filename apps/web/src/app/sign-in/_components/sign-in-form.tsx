"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, TriangleAlert } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → no need to show the form.
  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message ||
          "Sign in failed. Please check your email and password.",
      );
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-emerald-500/20 bg-card/90 p-6 shadow-soft-xl backdrop-blur-md sm:p-8"
    >
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reviewer Demo Quick-Fill */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/70 p-3.5 text-xs text-muted-foreground">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold text-emerald-950">Reviewer Credentials</span>
          <button
            type="button"
            onClick={() => {
              setEmail("reviewer@strategybyte.com.au");
              setPassword("StrategyByte2026!");
            }}
            className="rounded-md bg-emerald-600/15 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-600/25 transition-colors"
          >
            Auto-fill
          </button>
        </div>
        <div className="space-y-0.5 font-mono text-[11px] text-foreground/85">
          <p><span className="text-muted-foreground">User:</span> reviewer@strategybyte.com.au</p>
          <p><span className="text-muted-foreground">Pass:</span> StrategyByte2026!</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourclinic.com"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="gradient"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

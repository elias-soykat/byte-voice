"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → redirect directly to dashboard
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

  const handleAutofill = () => {
    setEmail("reviewer@strategybyte.com.au");
    setPassword("StrategyByte2026!");
    setError(null);
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive animate-in fade-in-50">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      {/* Reviewer Quick-Fill Banner */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/70 p-4 transition-colors hover:bg-emerald-50/90">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-950">
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>Reviewer Demo Account</span>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-xs text-white shadow-soft transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-95 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
          <p className="truncate">
            <span className="font-medium text-foreground/75">Email: </span>
            <code className="rounded bg-emerald-100/60 px-1 py-0.5 font-mono text-emerald-900">
              reviewer@strategybyte.com.au
            </code>
          </p>
          <p className="truncate">
            <span className="font-medium text-foreground/75">Pass: </span>
            <code className="rounded bg-emerald-100/60 px-1 py-0.5 font-mono text-emerald-900">
              StrategyByte2026!
            </code>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@dhakadentalcare.com"
            className="h-11 rounded-xl border-border/80 bg-background/50 pl-10 text-sm focus-visible:ring-emerald-500/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </Label>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="h-11 rounded-xl border-border/80 bg-background/50 pl-10 pr-10 text-sm focus-visible:ring-emerald-500/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="h-11.5 w-full rounded-xl text-sm font-semibold shadow-soft-md transition-all hover:scale-[1.01] hover:shadow-emerald-600/30 active:scale-[0.99] cursor-pointer"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Signing in to Portal…
          </>
        ) : (
          "Sign In to Portal"
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        <span>Protected by encrypted clinical session authentication</span>
      </div>
    </form>
  );
}

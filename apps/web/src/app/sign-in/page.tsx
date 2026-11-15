import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — ByteVoice",
  description: "Sign in to Dhaka Dental Care clinical portal.",
};

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Subtle ambient medical glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-64 rounded-full bg-teal-500/[0.04] blur-3xl" />
      </div>

      {/* Top back link */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-emerald-50/60 hover:text-emerald-800"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to website</span>
        </Link>
      </div>

      {/* Clean centered card container */}
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Logo className="mb-2" />
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Welcome back
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Sign in to Dhaka Dental Care clinical portal
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft-xl sm:p-7">
          <SignInForm />
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} StrategyByte · Dhaka Dental Care
        </p>
      </div>
    </main>
  );
}

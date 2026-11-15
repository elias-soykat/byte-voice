import type { Metadata } from "next";

import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — ByteVoice by StrategyByte",
};

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient emerald background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-[0.12] blur-3xl" />
        <div className="absolute bottom-0 -right-20 size-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-50/90 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-soft mb-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            StrategyByte Healthcare Demo
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Byte<span className="text-brand-gradient">Voice</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Dhaka Dental Care — Clinical Management Portal
          </p>
        </div>

        <SignInForm />
      </div>
    </main>
  );
}

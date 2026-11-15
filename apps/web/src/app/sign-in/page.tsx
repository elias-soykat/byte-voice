import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  HeartPulse,
  Languages,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — ByteVoice by StrategyByte",
  description: "Sign in to Dhaka Dental Care clinical portal powered by StrategyByte ByteVoice.",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full bg-background lg:grid lg:grid-cols-12">
      {/* ========================================================= */}
      {/* Left Column: Full-Height Healthcare Showcase (lg+)         */}
      {/* ========================================================= */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-12 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-16">
        {/* Ambient background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-28 -left-28 size-96 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="absolute top-1/2 -right-20 size-[500px] -translate-y-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 size-80 rounded-full bg-teal-400/10 blur-3xl" />
          {/* Subtle medical grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-900/60 px-4 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-soft transition-all hover:bg-emerald-900/90"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dhaka Dental Care · Clinical Management Portal</span>
          </Link>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 max-w-xl space-y-8 py-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="size-3.5 text-emerald-400" />
              <span>StrategyByte ByteVoice · Healthcare AI</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl xl:text-5xl leading-[1.15]">
              Intelligent Bangla Voice Receptionist for Modern Clinics
            </h1>

            <p className="text-base leading-relaxed text-emerald-100/80 sm:text-lg">
              Streamline patient calls, appointment schedules, and doctor coordination with authentic Bangla voice AI designed specifically for Bangladeshi healthcare practices.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/20 bg-emerald-900/40 p-3.5 backdrop-blur-md">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <Languages className="size-5" />
              </div>
              <div className="space-y-0.5 text-sm">
                <h2 className="font-semibold text-white">Natural Bengali & English Speech</h2>
                <p className="text-xs text-emerald-200/75 leading-relaxed">
                  Understands authentic colloquial Dhaka Bangla, English medical terminology, and patient code-switching seamlessly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/20 bg-emerald-900/40 p-3.5 backdrop-blur-md">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <CalendarCheck className="size-5" />
              </div>
              <div className="space-y-0.5 text-sm">
                <h2 className="font-semibold text-white">Real-Time Doctor Availability & Booking</h2>
                <p className="text-xs text-emerald-200/75 leading-relaxed">
                  Automated slot verification, booking confirmation, and SMS/email notifications without front-desk bottlenecks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/20 bg-emerald-900/40 p-3.5 backdrop-blur-md">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <HeartPulse className="size-5" />
              </div>
              <div className="space-y-0.5 text-sm">
                <h2 className="font-semibold text-white">Clinical Triage & Emergency Alerts</h2>
                <p className="text-xs text-emerald-200/75 leading-relaxed">
                  Automatically flags severe tooth pain, post-operative bleeding, and urgent triage situations directly to clinical staff.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Metrics */}
          <div className="grid grid-cols-3 gap-4 border-t border-emerald-800/60 pt-6">
            <div>
              <div className="text-2xl font-black text-emerald-400">99.4%</div>
              <div className="text-xs text-emerald-200/70">Call Triage Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">&lt; 1.2s</div>
              <div className="text-xs text-emerald-200/70">Bangla Voice Latency</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">24/7</div>
              <div className="text-xs text-emerald-200/70">Patient Care Access</div>
            </div>
          </div>
        </div>

        {/* Bottom Location Indicator */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-300/80">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>Demonstrated for Dhaka Dental Care · House 42, Road 11, Dhanmondi, Dhaka</span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Right Column: Full-Height Fluid Sign-In Form Canvas        */}
      {/* ========================================================= */}
      <section className="flex min-h-screen flex-col justify-between bg-surface p-6 sm:p-10 lg:col-span-6 lg:p-14 xl:col-span-5 xl:p-16">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-emerald-700"
          >
            <ArrowLeft className="size-4" />
            <span>Back to website</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Secure System</span>
          </div>
        </div>

        {/* Center Sign-In Container */}
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3">
              <Logo />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Clinical Portal Sign In
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your administrative or medical credentials to manage appointments, doctor schedules, and Bangla voice logs.
              </p>
            </div>
          </div>

          <SignInForm />
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-border/80 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} StrategyByte · All rights reserved</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="size-3.5" />
            <span>Dhaka Dental Care Portal</span>
          </div>
        </div>
      </section>
    </main>
  );
}

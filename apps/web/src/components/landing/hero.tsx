"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, Mic, Sparkles, CheckCircle2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useCall } from "@/hooks/useCall";
import { useLanguage } from "@/context/language-context";
import { Hero3D } from "./hero-3d";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

function Hero() {
  const { openForm } = useCall();
  const { data: session } = authClient.useSession();
  const { t } = useLanguage();

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const },
    },
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Ambient glow backgrounds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-[0.12] blur-3xl" />
        <div className="absolute top-44 -right-24 size-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-10 -left-20 size-72 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Left Column: Messaging & Primary Hero CTA */}
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-soft backdrop-blur-sm">
              <Sparkles className="size-3.5 text-emerald-600" />
              {t.hero.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl leading-[1.14] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {t.hero.titleStart}{" "}
            <span className="text-brand-gradient">{t.hero.titleGradient}</span>{" "}
            {t.hero.titleEnd}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Call to action buttons */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-3.5 sm:flex-row"
          >
            <Button
              variant="gradient"
              size="lg"
              onClick={openForm}
              className="h-12 px-6 text-base font-semibold shadow-soft-lg transition-all hover:scale-[1.03] hover:shadow-emerald-500/25"
            >
              <Mic className="size-5 mr-2 animate-pulse text-white" />
              {t.hero.ctaPrimary}
            </Button>

            {session ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-6 text-base border-emerald-600/20 hover:bg-emerald-50/60 hover:text-emerald-900 transition-transform hover:scale-[1.03]"
              >
                <Link href="/dashboard">
                  {t.hero.ctaSecondary}
                  <ArrowRight className="size-4 ml-2 text-emerald-600" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-6 text-base border-emerald-600/20 hover:bg-emerald-50/60 hover:text-emerald-900 transition-transform hover:scale-[1.03]"
              >
                <Link href="/sign-in">
                  <LogIn className="size-4 mr-2 text-emerald-600" />
                  {t.hero.ctaSecondary}
                </Link>
              </Button>
            )}
          </motion.div>

          {/* Value Badges */}
          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50/60 px-2 py-1 text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {t.hero.trust1}
            </span>
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50/60 px-2 py-1 text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {t.hero.trust2}
            </span>
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50/60 px-2 py-1 text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {t.hero.trust3}
            </span>
          </motion.div>
        </motion.div>

        {/* Right Column: 3D Interactive Hero Visualization */}
        <div className="lg:pl-4">
          <Hero3D />
        </div>
      </div>
    </section>
  );
}

export { Hero };

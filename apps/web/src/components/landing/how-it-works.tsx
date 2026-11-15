"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  Bot,
  Database,
  Mic,
  Volume2,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./section-heading";
import { useLanguage } from "@/context/language-context";

function HowItWorks() {
  const { t } = useLanguage();

  const steps: {
    title: string;
    detail: string;
    icon: LucideIcon;
  }[] = [
    { title: t.howItWorks.step1Title, detail: t.howItWorks.step1Desc, icon: Mic },
    { title: "Deepgram (Bangla STT)", detail: "Accurate transcription of colloquial Bangla speech", icon: AudioLines },
    { title: "LangGraph Supervisor", detail: "Routes turns between Booking, FAQ & Emergency", icon: Workflow },
    { title: t.howItWorks.step2Title, detail: t.howItWorks.step2Desc, icon: Bot },
    { title: "Sarvam AI (Bangla TTS)", detail: "Natural, polite receptionist Bengali audio", icon: Volume2 },
    { title: t.howItWorks.step3Title, detail: t.howItWorks.step3Desc, icon: Database },
  ];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-emerald-50/25 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.howItWorks.badge}
          title={t.howItWorks.title}
          description={t.howItWorks.subtitle}
        />

        <div className="relative mt-16">
          {/* Glowing connecting line (desktop) */}
          <div className="absolute top-9 right-0 left-0 hidden lg:block">
            <div className="mx-auto h-0.5 max-w-[88%] overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full bg-brand-gradient"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="flex flex-col items-center text-center"
                >
                  <span className="relative z-10 flex size-18 items-center justify-center rounded-2xl border border-emerald-500/20 bg-card shadow-soft-md transition-all hover:scale-105 hover:border-emerald-500/50 hover:shadow-emerald-500/10">
                    <Icon className="size-8 text-primary" strokeWidth={1.8} />
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white shadow-soft ring-2 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-5 text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export { HowItWorks };

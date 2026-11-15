"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  Languages,
  PhoneCall,
  HeartPulse,
  ClipboardList,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./section-heading";
import { useLanguage } from "@/context/language-context";

function Features() {
  const { t } = useLanguage();

  const features: {
    title: string;
    description: string;
    icon: LucideIcon;
  }[] = [
    {
      title: t.features.f1Title,
      description: t.features.f1Desc,
      icon: Languages,
    },
    {
      title: t.features.f2Title,
      description: t.features.f2Desc,
      icon: PhoneCall,
    },
    {
      title: t.features.f3Title,
      description: t.features.f3Desc,
      icon: CalendarCheck,
    },
    {
      title: t.features.f4Title,
      description: t.features.f4Desc,
      icon: HeartPulse,
    },
    {
      title: t.features.f5Title,
      description: t.features.f5Desc,
      icon: ClipboardList,
    },
    {
      title: t.features.f6Title,
      description: t.features.f6Desc,
      icon: Clock,
    },
  ];

  return (
    <section id="features" className="bg-emerald-50/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.features.badge}
          title={t.features.title}
          description={t.features.subtitle}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:border-emerald-500/40 hover:shadow-soft-lg hover:shadow-emerald-500/5"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-soft-md ring-1 ring-emerald-500/20 transition-transform group-hover:scale-105">
                  <Icon className="size-6" strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground group-hover:text-emerald-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { Features };

"use client";

import { motion } from "framer-motion";
import { Stethoscope, FlaskConical, Building2, BellRing } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { useLanguage } from "@/context/language-context";

export function UseCases() {
  const { t } = useLanguage();

  const useCases = [
    {
      title: t.useCases.uc1Title,
      description: t.useCases.uc1Desc,
      icon: Stethoscope,
      badge: "Dental Priority",
    },
    {
      title: t.useCases.uc2Title,
      description: t.useCases.uc2Desc,
      icon: FlaskConical,
      badge: "Diagnostic Labs",
    },
    {
      title: t.useCases.uc3Title,
      description: t.useCases.uc3Desc,
      icon: Building2,
      badge: "Hospital OPD",
    },
    {
      title: t.useCases.uc4Title,
      description: t.useCases.uc4Desc,
      icon: BellRing,
      badge: "Outbound & Reminders",
    },
  ];

  return (
    <section id="use-cases" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.useCases.badge}
          title={t.useCases.title}
          description={t.useCases.subtitle}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:border-emerald-500/40 hover:shadow-soft-lg hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20">
                      <Icon className="size-5" />
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {uc.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {uc.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {uc.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

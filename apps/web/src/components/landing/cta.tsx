"use client";

import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { useLanguage } from "@/context/language-context";
import { useCall } from "@/hooks/useCall";

function CTA() {
  const { t } = useLanguage();
  const { openForm } = useCall();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-16 text-center shadow-soft-xl sm:px-12 sm:py-20">
            {/* Ambient blur */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
            >
              <div className="absolute -top-16 -left-10 size-72 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -right-10 -bottom-16 size-72 rounded-full bg-white/20 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">
                {t.cta.subtitle}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={openForm}
                  className="h-12 bg-white text-base font-semibold text-primary shadow-soft-md transition-transform hover:scale-[1.03] hover:bg-white/95"
                >
                  <Mic className="size-5 mr-2 animate-pulse" />
                  {t.cta.button}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/50 bg-white/10 text-base text-white backdrop-blur transition-transform hover:scale-[1.03] hover:bg-white/20 hover:text-white"
                >
                  <Link href="/dashboard">
                    {t.nav.portal}
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { CTA };

import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { UseCases } from "@/components/landing/use-cases";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { CallProvider } from "@/context/call-provider";
import { LanguageProvider } from "@/context/language-context";
import { CallFab } from "@/components/call/call-fab";
import { CallOverlay } from "@/components/call/call-overlay";
import { PreCallDialog } from "@/components/call/pre-call-dialog";

export const metadata: Metadata = {
  title: "ByteVoice — AI Bangla Voice Receptionist for Healthcare | StrategyByte",
  description:
    "StrategyByte ByteVoice: 24/7 natural spoken Bangla voice receptionist for dental clinics and hospitals in Bangladesh. Live appointment booking, digit-by-digit phone confirmation, and clinical data portal.",
};

export default function LandingPage() {
  return (
    <LanguageProvider>
      <CallProvider>
        <div className="min-h-screen bg-background">
          <LandingNav />
          <main>
            <Hero />
            <Features />
            <UseCases />
            <HowItWorks />
            <Stats />
            <Testimonials />
            <CTA />
          </main>
          <Footer />
        </div>
        <PreCallDialog />
        <CallFab />
        <CallOverlay />
      </CallProvider>
    </LanguageProvider>
  );
}

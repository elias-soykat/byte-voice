"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionHeading } from "./section-heading";
import { useLanguage } from "@/context/language-context";

function Testimonials() {
  const { lang } = useLanguage();

  const testimonials = [
    {
      quote:
        lang === "bn"
          ? "ব্যস্ত সার্জারির সময় ফ্রন্ট ডেস্কে ফোন বেজেই চলত, রোগী মিস হত। বাইটভয়েস আসার পর থেকে প্রতিটি রোগীর কল ভদ্র বাংলায় রিসিভ হয় এবং স্লট বুক হয়।"
          : "During busy dental surgeries, front-desk calls used to go unanswered. ByteVoice answers every call in courteous Bangla and books patient slots reliably.",
      name: "Dr. Tanvir Ahmed",
      role: lang === "bn" ? "সিনিয়র ডেন্টাল সার্জন, ঢাকা" : "Senior Dental Surgeon & Orthodontist, Dhaka",
    },
    {
      quote:
        lang === "bn"
          ? "আমাদের রোগীরা সাধারণত বাংলা ও ইংরেজি মিশিয়ে কথা বলেন। বাইটভয়েস সেই কোড-সুইচিং এত চমৎকার বোঝে যে রোগীরা বুঝতেই পারেন না তারা এআই-এর সাথে কথা বলছেন।"
          : "Our patients frequently mix Bangla with medical terms like 'scaling' or 'appointment'. ByteVoice handles that code-switching seamlessly.",
      name: "Dr. Farzana Rahman",
      role: lang === "bn" ? "পেরিওডন্টিস্ট ও ক্লিনিক ইনচার্জ, বনানী" : "Periodontist & Clinic In-charge, Banani",
    },
    {
      quote:
        lang === "bn"
          ? "কল শেষ হওয়ার সাথে সাথে পোর্টালে রোগীর মোবাইল নম্বর, সমস্যার ধরন এবং পুরো ট্রান্সক্রিপ্ট চলে আসে। আমাদের রিসেপশনের কাজের চাপ অর্ধেকের বেশি কমে গেছে।"
          : "The portal organizes caller phone numbers, reasons for visit, and transcripts within a minute. It has cut our front-desk administrative workload in half.",
      name: "Dr. Shakil Hossain",
      role: lang === "bn" ? "চিফ কনসালট্যান্ট, ধানমন্ডি" : "Chief Dental Consultant, Dhanmondi",
    },
  ];

  return (
    <section id="testimonials" className="bg-emerald-50/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={lang === "bn" ? "ক্লিনিক ফিডব্যাক" : "Clinic Feedback"}
          title={lang === "bn" ? "ডাক্তার ও ক্লিনিক মালিকদের আস্থা" : "Trusted by Healthcare Leaders"}
          description={
            lang === "bn"
              ? "বাংলাদেশের শীর্ষস্থানীয় ডেন্টাল ক্লিনিক ও হাসপাতাল কীভাবে বাইটভয়েস ব্যবহার করছে।"
              : "How healthcare providers in Bangladesh are transforming their front desks with ByteVoice."
          }
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:border-emerald-500/40 hover:shadow-soft-lg hover:shadow-emerald-500/5"
            >
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="size-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-brand-gradient text-white text-xs font-bold ring-1 ring-emerald-500/20">
                    {t.name
                      .replace(/^Dr\.?\s+/, "")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export { Testimonials };

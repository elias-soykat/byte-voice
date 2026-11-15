"use client";

import { useForm } from "react-hook-form";
import { Phone, ArrowRight, Sparkles } from "lucide-react";

import { useCall } from "@/hooks/useCall";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PreCallValues = {
  name: string;
};

export function PreCallDialog() {
  const { formOpen, closeForm, startCall } = useCall();
  const { lang } = useLanguage();

  const { register, handleSubmit, reset } = useForm<PreCallValues>({
    defaultValues: { name: "" },
  });

  function onSubmit(values: PreCallValues) {
    startCall(values.name.trim() ? { name: values.name.trim() } : undefined);
    reset();
  }

  function handleDirectCall() {
    startCall();
    reset();
  }

  return (
    <Dialog
      open={formOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeForm();
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft-md">
            <Phone className="size-6" strokeWidth={2.25} />
          </span>
          <DialogTitle className="text-xl">
            {lang === "bn"
              ? "বাংলা ভয়েস রিসেপশনিস্টের সাথে কথা বলুন"
              : "Talk to our Bangla Voice Receptionist"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {lang === "bn"
              ? "ঢাকা ডেন্টাল কেয়ারের লাইভ এআই কলারের সাথে কথা বলতে মাইক অ্যাক্সেস দিন। আপনি চাইলে আপনার নাম আগেই দিতে পারেন, অথবা সরাসরি কলে বলতে পারেন।"
              : "Experience StrategyByte's live Dhaka Dental Care voice caller. You can speak freely in natural Bangla or mixed English."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 grid gap-4">
          <div>
            <Label htmlFor="precall-name" className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">
              {lang === "bn" ? "আপনার নাম (ঐচ্ছিক)" : "Your Name (Optional)"}
            </Label>
            <Input
              id="precall-name"
              placeholder={lang === "bn" ? "যেমন: রফিকুল ইসলাম" : "e.g. Rafiqul Islam"}
              autoComplete="name"
              {...register("name")}
            />
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button type="submit" variant="gradient" size="lg" className="w-full font-semibold">
              <Sparkles className="size-4 mr-2" />
              {lang === "bn" ? "কল শুরু করুন" : "Start Live Voice Call"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDirectCall}
              className="text-xs text-muted-foreground"
            >
              {lang === "bn" ? "নাম ছাড়া সরাসরি কল করুন" : "Call directly without name"}
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

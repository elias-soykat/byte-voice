"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MinusCircle,
  Phone,
  ShieldCheck,
  TriangleAlert,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CallSummaryPayload } from "@repo/shared";
import { useLanguage } from "@/context/language-context";

export type PostCallSummaryModalProps = {
  isOpen: boolean;
  summary: CallSummaryPayload | null;
  durationSec: number;
  onClose: () => void;
};

// Formats duration into MM:SS
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Outcome badge mapper
function OutcomeBadge({
  outcome,
}: {
  outcome?: CallSummaryPayload["outcome"];
}) {
  switch (outcome) {
    case "BOOKED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="size-3 text-emerald-400" />
          Booked
        </span>
      );
    case "ENQUIRY":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
          Enquiry
        </span>
      );
    case "FOLLOW_UP_NEEDED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
          Follow-up Needed
        </span>
      );
    case "INCOMPLETE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/40 bg-slate-800/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
          Incomplete
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/40 bg-slate-800/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
          Ended
        </span>
      );
  }
}

export function PostCallSummaryModal({
  isOpen,
  summary,
  durationSec,
  onClose,
}: PostCallSummaryModalProps) {
  const router = useRouter();
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const duration = summary?.durationSec ?? durationSec;
  const isBangla = lang === "bn";

  const handleViewInPortal = () => {
    onClose();
    router.push("/calls");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-5 sm:p-7 text-white shadow-2xl backdrop-blur-2xl max-h-[90vh] flex flex-col justify-between"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
        >
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-80 rounded-full bg-teal-500/15 blur-3xl"
          />

          {/* Close button top right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary modal"
            className="absolute top-4 right-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="size-4" />
          </button>

          <div className="space-y-5 overflow-y-auto pr-1">
            {/* Header: Call Completed & Duration */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-wider text-teal-400 uppercase">
                    Dhaka Dental Care
                  </span>
                </div>
                <h2
                  id="summary-modal-title"
                  className="mt-0.5 text-xl font-bold tracking-tight text-white flex items-center gap-2"
                >
                  {isBangla ? "কল সমাপ্ত হয়েছে" : "Call Completed"}
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                    Ended
                  </span>
                </h2>
              </div>

              {/* Call Duration Pill */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold tracking-wider text-white/50 uppercase">
                  {isBangla ? "কলের সময়সীমা" : "Call Duration"}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-teal-300">
                  <Clock className="size-4 text-teal-400" />
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            </div>

            {/* Optional Notification Banner if Partial or Error */}
            {summary?.status === "partial" && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <TriangleAlert className="size-4 shrink-0 text-amber-400" />
                <span>
                  {summary.errorMessage ??
                    (isBangla
                      ? "কল রেকর্ড সফলভাবে সংরক্ষিত হয়েছে। বিস্তারিত পোর্টাল থেকে দেখুন।"
                      : "Call record saved. Partial clinical extraction generated.")}
                </span>
              </div>
            )}

            {/* Patient Information Table */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                  <User className="size-3.5 text-teal-400" />
                  {isBangla ? "রোগীর তথ্য" : "Patient Information"}
                </h3>
                <span className="text-[10px] text-white/40">
                  {isBangla ? "এআই দ্বারা সংগৃহীত" : "Captured via Bangla AI"}
                </span>
              </div>

              <div className="divide-y divide-white/[0.06] text-xs">
                {/* Name */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/60 font-medium">
                    {isBangla ? "নাম" : "Name"}
                  </span>
                  <span className="font-semibold text-white">
                    {summary?.patientName || (
                      <span className="italic text-white/40">
                        {isBangla ? "উল্লেখ করা হয়নি" : "Not captured"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/60 font-medium flex items-center gap-1.5">
                    <Phone className="size-3 text-teal-400" />
                    {isBangla ? "ফোন নম্বর" : "Phone"}
                  </span>
                  <span className="font-mono font-semibold text-white">
                    {summary?.phone || (
                      <span className="italic text-white/40 font-sans">
                        {isBangla ? "উল্লেখ করা হয়নি" : "Not captured"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Reason */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/60 font-medium">
                    {isBangla ? "কারন / সেবা" : "Reason"}
                  </span>
                  <span className="font-semibold text-white text-right max-w-[65%] truncate">
                    {summary?.reasonForVisit || (
                      <span className="italic text-white/40">
                        {isBangla ? "সাধারণ অনুসন্ধান" : "General Dental Enquiry"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Appointment */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/60 font-medium flex items-center gap-1.5">
                    <Calendar className="size-3 text-teal-400" />
                    {isBangla ? "অ্যাপয়েন্টমেন্ট" : "Appointment"}
                  </span>
                  <div className="text-right max-w-[65%]">
                    {summary?.appointment ? (
                      <div>
                        <p className="font-semibold text-emerald-300">
                          {summary.appointment.doctorName ?? "Dental Specialist"}
                        </p>
                        <p className="text-[11px] text-white/70">
                          {summary.preferredDateTime ||
                            summary.appointment.startTime ||
                            "Confirmed"}
                        </p>
                      </div>
                    ) : summary?.preferredDateTime ? (
                      <span className="font-medium text-white/90">
                        {summary.preferredDateTime}
                      </span>
                    ) : (
                      <span className="italic text-white/40">
                        {isBangla
                          ? "অনুরোধ করা হয়নি"
                          : "No appointment requested"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Outcome */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/60 font-medium">
                    {isBangla ? "ফলাফল" : "Outcome"}
                  </span>
                  <OutcomeBadge outcome={summary?.outcome} />
                </div>
              </div>

              {/* Staff Summary Notes (if available) */}
              {summary?.notes && (
                <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-500/[0.06] p-2.5 text-xs text-teal-100/90">
                  <span className="font-semibold text-teal-300">
                    {isBangla ? "সংক্ষিপ্ত নোট: " : "Clinical Note: "}
                  </span>
                  {summary.notes}
                </div>
              )}
            </div>

            {/* Next Actions Checklist */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                <ShieldCheck className="size-3.5 text-teal-400" />
                {isBangla ? "পরবর্তী পদক্ষেপ" : "Next Actions"}
              </h3>

              <div className="space-y-2 text-xs">
                {/* 1. Appointment recorded */}
                <div className="flex items-center gap-2.5">
                  {summary?.nextActions.appointmentRecorded ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                    </span>
                  ) : (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/30">
                      <MinusCircle className="size-3.5" />
                    </span>
                  )}
                  <span
                    className={cn(
                      summary?.nextActions.appointmentRecorded
                        ? "text-white font-medium"
                        : "text-white/40 line-through decoration-white/20",
                    )}
                  >
                    {isBangla
                      ? "অ্যাপয়েন্টমেন্ট সফলভাবে রেকর্ড করা হয়েছে।"
                      : "Appointment recorded."}
                  </span>
                </div>

                {/* 2. Patient details saved */}
                <div className="flex items-center gap-2.5">
                  {summary?.nextActions.patientDetailsSaved ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                    </span>
                  ) : (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/30">
                      <MinusCircle className="size-3.5" />
                    </span>
                  )}
                  <span
                    className={cn(
                      summary?.nextActions.patientDetailsSaved
                        ? "text-white font-medium"
                        : "text-white/40",
                    )}
                  >
                    {isBangla
                      ? "রোগীর বিবরণ ডাটাবেসে সংরক্ষিত হয়েছে।"
                      : "Patient details saved."}
                  </span>
                </div>

                {/* 3. Call transcript available in portal */}
                <div className="flex items-center gap-2.5">
                  {summary?.nextActions.transcriptAvailable ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                    </span>
                  ) : (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/30">
                      <MinusCircle className="size-3.5" />
                    </span>
                  )}
                  <span className="text-white font-medium">
                    {isBangla
                      ? "কল ট্রান্সক্রিপ্ট এবং অডিও পোর্টালে উপলব্ধ।"
                      : "Call transcript available in portal."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-95 cursor-pointer"
            >
              {isBangla ? "সারাংশ বন্ধ করুন" : "Close summary"}
            </button>

            <button
              type="button"
              onClick={handleViewInPortal}
              className="flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-teal-500/20 transition-all hover:bg-teal-400 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{isBangla ? "পোর্টালে দেখুন" : "View in Portal"}</span>
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

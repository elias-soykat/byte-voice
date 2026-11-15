"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, PhoneOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCall } from "@/hooks/useCall";
import { useLanguage } from "@/context/language-context";
import { CallOrb, type OrbMode } from "./call-orb";

export function CallOverlay() {
  const {
    isOpen,
    status,
    userSpeaking,
    agentSpeaking,
    processing,
    micLevel,
    muted,
    transcript,
    endCall,
    toggleMute,
  } = useCall();

  const { lang } = useLanguage();

  const mode: OrbMode =
    status === "connecting"
      ? "connecting"
      : agentSpeaking
        ? "agentSpeaking"
        : processing
          ? "thinking"
          : userSpeaking && !muted
            ? "userSpeaking"
            : "idle";

  const getStatusText = () => {
    if (status === "connecting") {
      return lang === "bn" ? "সংযুক্ত হচ্ছে…" : "Connecting…";
    }
    if (agentSpeaking) {
      return lang === "bn" ? "ঢাকা ডেন্টাল কেয়ার কথা বলছে…" : "Receptionist speaking…";
    }
    if (processing) {
      return lang === "bn" ? "প্রসেসিং হচ্ছে…" : "Thinking…";
    }
    if (muted) {
      return lang === "bn" ? "মাইক্রোফোন মিউট করা" : "Microphone muted";
    }
    if (userSpeaking) {
      return lang === "bn" ? "আপনার কথা শুনছি…" : "Listening to you…";
    }
    return lang === "bn" ? "শুনছি, বলুন…" : "Listening…";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/80 backdrop-blur-md" />

          <motion.div
            className="relative flex flex-col items-center gap-8 px-6 text-center"
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="space-y-1.5">
              <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                Dhaka Dental Care • StrategyByte ByteVoice
              </p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {getStatusText()}
              </h2>
            </div>

            <CallOrb mode={mode} level={micLevel} size={200} />

            {/* Live Captions */}
            {transcript.length > 0 && (
              <div className="flex max-h-48 w-full max-w-lg flex-col gap-2 overflow-y-auto px-1 text-left">
                {transcript.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      "flex flex-col",
                      line.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <span className="mb-0.5 text-[10px] font-semibold tracking-wide text-white/50 uppercase">
                      {line.role === "user"
                        ? lang === "bn" ? "আপনি (Caller)" : "You (Caller)"
                        : lang === "bn" ? "রিসেপশনিস্ট (Receptionist)" : "Receptionist (AI)"}
                    </span>
                    <span
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
                        line.role === "user"
                          ? "bg-white/20 text-white"
                          : "bg-brand-gradient text-white font-medium",
                      )}
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Call Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "flex size-14 items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95",
                  muted
                    ? "border-destructive bg-destructive/20 text-destructive"
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20",
                )}
              >
                {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
              </button>

              <button
                type="button"
                onClick={endCall}
                aria-label="End call"
                className="flex size-14 items-center justify-center rounded-full bg-destructive text-white shadow-soft-lg transition-transform hover:scale-105 active:scale-95 hover:bg-destructive/90"
              >
                <PhoneOff className="size-6" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

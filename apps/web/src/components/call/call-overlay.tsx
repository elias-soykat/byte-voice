"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Shield,
  Volume2,
} from "lucide-react";

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
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(0);

  // Lock body & document scroll completely while call is open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Live call duration timer
  useEffect(() => {
    if (status === "live") {
      const timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    setDuration(0);
  }, [status]);

  // Auto-scroll transcript to bottom smoothly on every new caption
  useEffect(() => {
    if (transcript.length > 0) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

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
      return lang === "bn" ? "সংযুক্ত হচ্ছে…" : "Connecting to Clinic…";
    }
    if (agentSpeaking) {
      return lang === "bn" ? "রিসেপশনিস্ট কথা বলছেন…" : "Receptionist speaking…";
    }
    if (processing) {
      return lang === "bn" ? "তথ্য যাচাই হচ্ছে…" : "Thinking…";
    }
    if (muted) {
      return lang === "bn" ? "মাইক্রোফোন বন্ধ (Muted)" : "Microphone muted";
    }
    if (userSpeaking) {
      return lang === "bn" ? "আপনার কথা শোনা হচ্ছে…" : "Listening to you…";
    }
    return lang === "bn" ? "শুনছি, বলুন…" : "Listening…";
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex h-dvh w-screen flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950/95 via-emerald-950/90 to-slate-950/98 p-4 backdrop-blur-2xl sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Subtle ambient medical glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/2 size-[400px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
          </div>

          {/* ========================================================= */}
          {/* Top Bar: Clinic Branding & Call Duration                   */}
          {/* ========================================================= */}
          <div className="mx-auto flex w-full max-w-xl items-center justify-between border-b border-white/10 pb-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                  Dhaka Dental Care
                </p>
                <p className="text-[10px] text-white/50">
                  StrategyByte ByteVoice Receptionist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-medium text-emerald-200">
              <Radio className="size-3 text-emerald-400 animate-pulse" />
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Middle Stage: Dynamic Voice Orb & Status                   */}
          {/* ========================================================= */}
          <div className="my-auto flex flex-col items-center gap-5 py-2 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
                {agentSpeaking ? (
                  <Volume2 className="size-3.5 text-emerald-300 animate-pulse" />
                ) : userSpeaking ? (
                  <Mic className="size-3.5 text-teal-300 animate-pulse" />
                ) : (
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span>{getStatusText()}</span>
              </span>
            </div>

            <CallOrb mode={mode} level={micLevel} size={190} />

            {/* Live Transcript Frosted Glass Card */}
            <div className="w-full max-w-lg">
              <div
                className="max-h-44 w-full space-y-2.5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left backdrop-blur-xl shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {transcript.length === 0 ? (
                  <p className="py-4 text-center text-xs text-white/50 italic">
                    {lang === "bn"
                      ? "🎤 শুরু করতে বাংলায় বা ইংরেজিতে কথা বলুন..."
                      : "🎤 Speak naturally in Bangla or English to begin..."}
                  </p>
                ) : (
                  transcript.map((line) => (
                    <div
                      key={line.id}
                      className={cn(
                        "flex flex-col text-xs sm:text-sm",
                        line.role === "user" ? "items-end" : "items-start",
                      )}
                    >
                      <span className="mb-0.5 text-[10px] font-semibold tracking-wider text-white/50 uppercase">
                        {line.role === "user"
                          ? lang === "bn" ? "আপনি (Caller)" : "You"
                          : lang === "bn" ? "রিসেপশনিস্ট (Receptionist)" : "Receptionist (AI)"}
                      </span>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed shadow-sm",
                          line.role === "user"
                            ? "rounded-tr-xs bg-white/15 text-white border border-white/15"
                            : "rounded-tl-xs bg-emerald-600/35 text-emerald-50 border border-emerald-400/30 font-medium",
                        )}
                      >
                        {line.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Bottom Action Dock: Controls & Security                    */}
          {/* ========================================================= */}
          <div className="mx-auto flex flex-col items-center gap-2.5 pb-2">
            <div className="flex items-center gap-5 rounded-full border border-white/15 bg-white/[0.08] px-5 py-2.5 backdrop-blur-xl shadow-2xl">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                title={muted ? "Unmute" : "Mute"}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer",
                  muted
                    ? "border-destructive/60 bg-destructive/25 text-rose-300 hover:bg-destructive/35"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:scale-105",
                )}
              >
                {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>

              <button
                type="button"
                onClick={endCall}
                aria-label="End call"
                title="End Call"
                className="flex size-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/35 transition-all hover:bg-rose-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PhoneOff className="size-5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <Shield className="size-3 text-emerald-400/70" />
              <span>Encrypted live voice stream · StrategyByte</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

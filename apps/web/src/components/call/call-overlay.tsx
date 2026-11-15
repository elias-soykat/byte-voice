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
          className="fixed inset-0 z-50 flex h-dvh w-screen flex-col justify-between overflow-hidden bg-slate-950/98 p-4 backdrop-blur-3xl sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Subtle ambient medical glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.03] blur-3xl" />
          </div>

          {/* ========================================================= */}
          {/* Top Bar: Clinic Branding & Call Duration                   */}
          {/* ========================================================= */}
          <header className="mx-auto flex w-full max-w-2xl items-center justify-between border-b border-white/10 pb-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-teal-500" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wider text-teal-300 uppercase">
                  Dhaka Dental Care
                </p>
                <p className="text-[10px] text-white/50">
                  StrategyByte ByteVoice Receptionist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-teal-200">
              <Radio className="size-3 text-teal-400 animate-pulse" />
              <span>{formatDuration(duration)}</span>
            </div>
          </header>

          {/* ========================================================= */}
          {/* Middle Stage: Compact Voice Orb, Status & Transcript       */}
          {/* ========================================================= */}
          <main className="my-auto flex w-full flex-col items-center gap-4 py-2 text-center">
            {/* Status Pill */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">
                {agentSpeaking ? (
                  <Volume2 className="size-3.5 text-teal-300 animate-pulse" />
                ) : userSpeaking ? (
                  <Mic className="size-3.5 text-teal-300 animate-pulse" />
                ) : (
                  <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
                )}
                <span>{getStatusText()}</span>
              </span>
            </div>

            {/* Compact Voice Orb */}
            <CallOrb mode={mode} level={micLevel} size={84} />

            {/* Live Transcript Frosted Glass Card */}
            <div className="w-full max-w-xl sm:max-w-2xl">
              <div className="flex h-[320px] sm:h-[380px] max-h-[50vh] w-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left shadow-xl backdrop-blur-xl">
                {/* Transcript Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3 text-xs text-white/60">
                  <div className="flex items-center gap-1.5 font-medium text-white/80">
                    <Radio className="size-3 text-teal-400 animate-pulse" />
                    <span>Live Transcript</span>
                  </div>
                  <span className="text-[10px] text-white/40">Bangla &amp; English</span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {transcript.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-center text-xs text-white/50 italic">
                        {lang === "bn"
                          ? "🎤 শুরু করতে বাংলায় বা ইংরেজিতে কথা বলুন..."
                          : "🎤 Speak naturally in Bangla or English to begin..."}
                      </p>
                    </div>
                  ) : (
                    transcript.map((line) => (
                      <div
                        key={line.id}
                        className={cn(
                          "flex flex-col text-xs sm:text-sm",
                          line.role === "user" ? "items-end" : "items-start",
                        )}
                      >
                        <span className="mb-1 text-[10px] font-semibold tracking-wider text-white/50 uppercase">
                          {line.role === "user"
                            ? lang === "bn" ? "আপনি (Caller)" : "You"
                            : lang === "bn" ? "রিসেপশনিস্ট (Receptionist)" : "Receptionist (AI)"}
                        </span>
                        <div
                          className={cn(
                            "max-w-[88%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm",
                            line.role === "user"
                              ? "rounded-tr-xs bg-slate-800/80 text-slate-100 border border-slate-700/60"
                              : "rounded-tl-xs bg-slate-900/90 text-white border border-slate-700/70 border-l-3 border-l-teal-400 font-normal",
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
          </main>

          {/* ========================================================= */}
          {/* Bottom Action Dock: Controls & Security                    */}
          {/* ========================================================= */}
          <footer className="mx-auto flex flex-col items-center gap-2 pb-1">
            <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-xl shadow-xl">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                title={muted ? "Unmute" : "Mute"}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer",
                  muted
                    ? "border-destructive/60 bg-destructive/25 text-rose-300 hover:bg-destructive/35"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:scale-105",
                )}
              >
                {muted ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
              </button>

              <button
                type="button"
                onClick={endCall}
                aria-label="End call"
                title="End Call"
                className="flex size-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-600/30 transition-all hover:bg-rose-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PhoneOff className="size-4.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <Shield className="size-3 text-teal-400/70" />
              <span>Encrypted live voice stream · StrategyByte</span>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

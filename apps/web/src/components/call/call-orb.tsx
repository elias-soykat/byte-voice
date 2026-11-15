"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";

export type OrbMode =
  | "connecting"
  | "thinking"
  | "idle"
  | "userSpeaking"
  | "agentSpeaking";

export function CallOrb({
  mode,
  level = 0,
  size = 80,
}: {
  mode: OrbMode;
  level?: number;
  size?: number;
}) {
  const core = Math.round(size * 0.65);
  const userScale = 1 + Math.min(level, 1) * 0.2;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow - kept compact and subtle */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-lg transition-all duration-500 pointer-events-none",
          mode === "agentSpeaking"
            ? "bg-teal-400/25 scale-110"
            : mode === "userSpeaking"
              ? "bg-teal-400/20 scale-105"
              : mode === "thinking"
                ? "bg-teal-500/15 scale-100"
                : "bg-teal-500/10 scale-95",
        )}
      />

      {/* Subtle compact soundwave ripples during agent speech */}
      {mode === "agentSpeaking" &&
        [0, 1].map((ring) => (
          <motion.span
            key={ring}
            className="absolute rounded-full border border-teal-400/35 bg-teal-500/5 pointer-events-none"
            style={{ width: size, height: size }}
            initial={{ opacity: 0.4, scale: 0.85 }}
            animate={{ opacity: [0.4, 0], scale: [0.85, 1.25] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: ring * 0.5,
              ease: "easeOut",
            }}
          />
        ))}

      {/* User mic reactive ring */}
      {mode === "userSpeaking" && (
        <motion.span
          className="absolute rounded-full border border-teal-400/50 bg-teal-400/10 pointer-events-none"
          style={{ width: size, height: size }}
          animate={{ scale: userScale, opacity: [0.5, 0.15] }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        />
      )}

      {/* Orbiting halo during thinking */}
      {mode === "thinking" && (
        <motion.div
          className="absolute rounded-full border border-teal-400/30 border-t-teal-200 pointer-events-none"
          style={{ width: core + 16, height: core + 16 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Compact Glowing Sphere Core */}
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full shadow-lg transition-colors duration-300",
          mode === "userSpeaking"
            ? "bg-gradient-to-tr from-teal-700 via-teal-500 to-emerald-400 shadow-teal-500/25"
            : mode === "agentSpeaking"
              ? "bg-gradient-to-tr from-teal-800 via-teal-600 to-emerald-500 shadow-teal-500/30"
              : mode === "thinking"
                ? "bg-gradient-to-tr from-slate-800 via-teal-700 to-emerald-600 shadow-teal-500/20"
                : "bg-gradient-to-tr from-teal-800 via-teal-700 to-slate-700 shadow-teal-600/15",
        )}
        style={{ width: core, height: core }}
        animate={
          mode === "userSpeaking"
            ? { scale: userScale }
            : mode === "agentSpeaking"
              ? { scale: [1, 1.04, 1] }
              : mode === "thinking"
                ? { scale: [0.98, 1.02, 0.98] }
                : { scale: [1, 1.01, 1] }
        }
        transition={
          mode === "userSpeaking"
            ? { duration: 0.1, ease: "easeOut" }
            : {
                duration: mode === "agentSpeaking" ? 0.8 : mode === "thinking" ? 1.5 : 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {/* Visualizer content inside compact core */}
        {mode === "agentSpeaking" || mode === "userSpeaking" ? (
          /* Animated audio waveform equalizer bars */
          <div className="flex items-center gap-1 h-5">
            {[0.4, 0.9, 0.6, 1.0].map((scale, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-white/95"
                animate={{
                  height:
                    mode === "agentSpeaking"
                      ? ["5px", `${scale * 18}px`, "5px"]
                      : [
                          `${4 + level * 6}px`,
                          `${scale * (10 + level * 12)}px`,
                          `${4 + level * 6}px`,
                        ],
                }}
                transition={{
                  duration: 0.4 + i * 0.08,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : mode === "thinking" ? (
          /* 3 compact rhythmic pulsing dots */
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-white/95 shadow-sm"
                animate={{
                  scale: [0.75, 1.25, 0.75],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : mode === "connecting" ? (
          <span className="size-2 rounded-full bg-white animate-ping opacity-75" />
        ) : (
          <Mic className="size-4 text-white/90" strokeWidth={2.2} />
        )}
      </motion.div>
    </div>
  );
}

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
  size = 180,
}: {
  mode: OrbMode;
  level?: number;
  size?: number;
}) {
  const core = size * 0.58;
  const userScale = 1 + Math.min(level, 1) * 0.35;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-2xl transition-all duration-700",
          mode === "agentSpeaking"
            ? "bg-teal-400/20 scale-115"
            : mode === "userSpeaking"
              ? "bg-teal-400/20 scale-110"
              : mode === "thinking"
                ? "bg-teal-500/15 scale-105"
                : "bg-teal-500/10 scale-95",
        )}
      />

      {/* Concentric soundwave ripples during agent speech */}
      {mode === "agentSpeaking" &&
        [0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="absolute rounded-full border border-teal-400/40 bg-teal-500/5 pointer-events-none"
            style={{ width: size, height: size }}
            initial={{ opacity: 0.5, scale: 0.7 }}
            animate={{ opacity: [0.5, 0], scale: [0.7, 1.7] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: ring * 0.55,
              ease: "easeOut",
            }}
          />
        ))}

      {/* User mic reactive ring */}
      {mode === "userSpeaking" && (
        <motion.span
          className="absolute rounded-full border-2 border-teal-400/60 bg-teal-400/10 pointer-events-none"
          style={{ width: size, height: size }}
          animate={{ scale: userScale, opacity: [0.6, 0.2] }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      )}

      {/* Orbiting halo during thinking */}
      {mode === "thinking" && (
        <motion.div
          className="absolute rounded-full border border-teal-400/30 border-t-teal-200 pointer-events-none"
          style={{ width: core + 26, height: core + 26 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Glowing Sphere Core */}
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full shadow-xl transition-colors duration-500",
          mode === "userSpeaking"
            ? "bg-gradient-to-tr from-teal-700 via-teal-500 to-emerald-400 shadow-teal-500/30"
            : mode === "agentSpeaking"
              ? "bg-gradient-to-tr from-teal-800 via-teal-600 to-emerald-500 shadow-teal-500/30"
              : mode === "thinking"
                ? "bg-gradient-to-tr from-slate-800 via-teal-700 to-emerald-600 shadow-teal-500/25"
                : "bg-gradient-to-tr from-teal-800 via-teal-700 to-slate-700 shadow-teal-600/20",
        )}
        style={{ width: core, height: core }}
        animate={
          mode === "userSpeaking"
            ? { scale: userScale }
            : mode === "agentSpeaking"
              ? { scale: [1, 1.06, 1] }
              : mode === "thinking"
                ? { scale: [0.97, 1.03, 0.97] }
                : { scale: [1, 1.02, 1] }
        }
        transition={
          mode === "userSpeaking"
            ? { duration: 0.12, ease: "easeOut" }
            : {
                duration: mode === "agentSpeaking" ? 0.8 : mode === "thinking" ? 1.6 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {/* Visualizer content based on mode */}
        {mode === "agentSpeaking" || mode === "userSpeaking" ? (
          /* Animated audio waveform equalizer bars */
          <div className="flex items-center gap-1.5 h-10">
            {[0.4, 0.9, 0.65, 1.0, 0.55].map((scale, i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full bg-white shadow-sm"
                animate={{
                  height:
                    mode === "agentSpeaking"
                      ? ["10px", `${scale * 34}px`, "10px"]
                      : [
                          `${8 + level * 14}px`,
                          `${scale * (20 + level * 26)}px`,
                          `${8 + level * 14}px`,
                        ],
                }}
                transition={{
                  duration: 0.45 + i * 0.08,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : mode === "thinking" ? (
          /* 3 rhythmic glowing harmonic dots */
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-2.5 rounded-full bg-white shadow-md shadow-white/50"
                animate={{
                  scale: [0.75, 1.3, 0.75],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.0,
                  repeat: Infinity,
                  delay: i * 0.22,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : mode === "connecting" ? (
          /* Subtle pulsing ring during connection */
          <div className="flex items-center justify-center">
            <span className="size-3 rounded-full bg-white animate-ping opacity-75" />
          </div>
        ) : (
          /* Idle: listening state */
          <div className="flex items-center justify-center">
            <Mic className="size-7 text-white/95" strokeWidth={2.2} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

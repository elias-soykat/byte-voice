"use client";

import { useEffect, useRef } from "react";
import { Radio } from "lucide-react";

/**
 * Interactive 3D Canvas rendering a futuristic 3D Dental Tooth & Voice Waveform
 * with 3D isometric projection, rotating audio wave rings, particle glow,
 * and mouse-tracking parallax physics.
 */
export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 460);
    let height = (canvas.height = 420);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = Math.min(canvas.parentElement.clientWidth, 520);
      height = canvas.height = 420;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates for 3D parallax tilt
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      targetRotY = (x / (width / 2)) * 0.45;
      targetRotX = -(y / (height / 2)) * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 3D Tooth model vertices (stylized molar tooth geometry)
    // Crown top cusps, middle contour, and dual roots
    const toothVertices3D: [number, number, number][] = [
      // Top crown cusps
      [-28, -55, -28],
      [28, -55, -28],
      [32, -55, 28],
      [-32, -55, 28],
      [0, -62, 0], // Center groove cusp

      // Upper crown contour
      [-42, -30, -38],
      [42, -30, -38],
      [45, -30, 38],
      [-45, -30, 38],

      // Enamel waist / neck
      [-35, 0, -30],
      [35, 0, -30],
      [36, 0, 30],
      [-36, 0, 30],

      // Root bifurcation
      [-20, 25, 0],
      [20, 25, 0],

      // Root 1 (Left root tip)
      [-28, 48, -12],
      [-22, 68, -6],
      [-16, 85, 0],

      // Root 2 (Right root tip)
      [28, 48, 12],
      [22, 68, 6],
      [16, 85, 0],
    ];

    // Connective edges defining the 3D tooth structure
    const toothEdges: [number, number][] = [
      // Crown top
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 4], [1, 4], [2, 4], [3, 4],

      // Top to upper contour
      [0, 5], [1, 6], [2, 7], [3, 8],
      [5, 6], [6, 7], [7, 8], [8, 5],

      // Upper contour to waist
      [5, 9], [6, 10], [7, 11], [8, 12],
      [9, 10], [10, 11], [11, 12], [12, 9],

      // Waist to bifurcation
      [9, 13], [10, 14], [11, 14], [12, 13],
      [13, 14],

      // Root 1
      [13, 15], [15, 16], [16, 17],
      [9, 15],

      // Root 2
      [14, 18], [18, 19], [19, 20],
      [11, 18],
    ];

    // Ambient floating particles around the tooth
    const particles = Array.from({ length: 36 }, () => ({
      x: (Math.random() - 0.5) * 220,
      y: (Math.random() - 0.5) * 220,
      z: (Math.random() - 0.5) * 220,
      size: Math.random() * 2.2 + 0.8,
      speed: Math.random() * 0.015 + 0.005,
    }));

    let baseAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;
      baseAngle += 0.012;

      const rotY = baseAngle + currentRotY;
      const rotX = currentRotX + 0.15; // Isometric slight downward tilt

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const fov = 380;
      const centerX = width / 2;
      const centerY = height / 2 + 10;

      // Project 3D point to 2D screen coordinate
      const project = (x: number, y: number, z: number) => {
        // Rotate around Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const distance = fov / (fov + z2 + 200);
        return {
          px: centerX + x1 * distance * 1.5,
          py: centerY + y2 * distance * 1.5,
          scale: distance,
          depth: z2,
        };
      };

      // 1. Draw glowing orbital soundwave rings around the 3D model
      for (let r = 0; r < 2; r++) {
        const ringRadius = 115 + r * 30;
        const ringTilt = (r === 0 ? 0.35 : -0.4) + Math.sin(baseAngle * 0.8) * 0.1;
        const ringPoints = 36;
        ctx.beginPath();
        for (let i = 0; i <= ringPoints; i++) {
          const theta = (i / ringPoints) * Math.PI * 2;
          const rx = Math.cos(theta) * ringRadius;
          const ry = Math.sin(theta) * ringRadius * ringTilt;
          const rz = Math.sin(theta) * ringRadius;

          const p = project(rx, ry, rz);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.strokeStyle = r === 0 ? "rgba(5, 150, 105, 0.45)" : "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = r === 0 ? 1.8 : 1.2;
        ctx.stroke();
      }

      // 2. Draw 3D Tooth Wireframe Edges
      ctx.lineWidth = 1.6;
      toothEdges.forEach(([i1, i2]) => {
        const [x1, y1, z1] = toothVertices3D[i1]!;
        const [x2, y2, z2] = toothVertices3D[i2]!;

        const p1 = project(x1, y1, z1);
        const p2 = project(x2, y2, z2);

        const avgDepth = (p1.depth + p2.depth) / 2;
        const alpha = Math.max(0.2, Math.min(0.92, (avgDepth + 120) / 240));

        // Clinical gradient line from emerald to vibrant mint
        const grad = ctx.createLinearGradient(p1.px, p1.py, p2.px, p2.py);
        grad.addColorStop(0, `rgba(5, 150, 105, ${alpha})`);
        grad.addColorStop(1, `rgba(16, 185, 129, ${alpha})`);

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      // 3. Draw 3D Tooth Vertex Nodes (Glowing Mint & Emerald)
      toothVertices3D.forEach(([x, y, z]) => {
        const p = project(x, y, z);
        const nodeRadius = 3.2 * p.scale;

        ctx.beginPath();
        ctx.arc(p.px, p.py, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.shadowColor = "#059669";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Floating Ambient Particles
      particles.forEach((pt) => {
        pt.y -= pt.speed * 40;
        if (pt.y < -120) pt.y = 120;

        const p = project(pt.x, pt.y, pt.z);
        ctx.beginPath();
        ctx.arc(p.px, p.py, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52, 211, 153, 0.65)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-surface/95 via-emerald-50/30 to-surface/95 p-4 shadow-soft-xl backdrop-blur-xl">
      {/* Background glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-full bg-brand-gradient opacity-20 blur-3xl"
      />

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="h-[380px] w-full max-w-[480px] cursor-grab active:cursor-grabbing sm:h-[420px]"
      />

      {/* Floating Status Pills */}
      <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-surface/90 px-3 py-1 shadow-soft backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-medium text-foreground">
          3D Clinical Model • Interactive
        </span>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-surface/95 px-3 py-1.5 shadow-soft backdrop-blur">
        <Radio className="size-3.5 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-foreground">
          Dhaka Dental Care AI
        </span>
      </div>
    </div>
  );
}

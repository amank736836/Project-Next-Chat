"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import useReducedMotionSafe from "./useReducedMotionSafe";
import { seededRandom, SPRING_POINTER } from "./motionConfig";

/**
 * Ambient blobs. `depth` controls how far each blob parallaxes with the
 * pointer (bigger = closer to the viewer), which is what sells the 3D feel.
 */
const BLOBS = [
  {
    color: "rgba(255, 126, 95, 0.75)",
    size: 48,
    top: "-8%",
    left: "-6%",
    depth: 46,
    drift: { x: [0, 40, -20, 0], y: [0, 30, -25, 0] },
    duration: 26,
  },
  {
    color: "rgba(254, 180, 123, 0.8)",
    size: 42,
    top: "52%",
    left: "68%",
    depth: 34,
    drift: { x: [0, -45, 20, 0], y: [0, -30, 25, 0] },
    duration: 32,
  },
  {
    color: "rgba(255, 95, 109, 0.55)",
    size: 34,
    top: "68%",
    left: "-10%",
    depth: 58,
    drift: { x: [0, 55, -30, 0], y: [0, -40, 20, 0] },
    duration: 22,
  },
  {
    color: "rgba(79, 172, 254, 0.45)",
    size: 38,
    top: "4%",
    left: "72%",
    depth: 26,
    drift: { x: [0, -35, 25, 0], y: [0, 45, -20, 0] },
    duration: 36,
  },
  {
    color: "rgba(0, 242, 254, 0.35)",
    size: 26,
    top: "38%",
    left: "38%",
    depth: 70,
    drift: { x: [0, 30, -40, 0], y: [0, -35, 30, 0] },
    duration: 28,
  },
];

/** Single parallax blob (kept as its own component so hooks stay legal). */
function Blob({ config, pointerX, pointerY, reducedMotion }) {
  const { color, size, top, left, depth, drift, duration } = config;

  const x = useTransform(pointerX, (value) => value * depth);
  const y = useTransform(pointerY, (value) => value * depth);

  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        width: `${size}vmin`,
        height: `${size}vmin`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}, transparent 68%)`,
        filter: "blur(46px)",
        willChange: "transform",
        x,
        y,
      }}
      // translation only: scaling a blurred layer would re-rasterise it
      // on every frame and burn GPU time for no visible gain
      animate={reducedMotion ? {} : drift}
      transition={
        reducedMotion
          ? undefined
          : {
              duration,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    />
  );
}

/** Soft light that trails the cursor (adds a "the page sees me" feeling). */
function PointerGlow({ reducedMotion }) {
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);
  const x = useSpring(rawX, SPRING_POINTER);
  const y = useSpring(rawY, SPRING_POINTER);
  const opacity = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const handleMove = (event) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      opacity.set(1);
    };
    const handleLeave = () => opacity.set(0);

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerleave", handleLeave);
    window.addEventListener("blur", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
    };
  }, [rawX, rawY, opacity, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 520,
        height: 520,
        marginLeft: -260,
        marginTop: -260,
        borderRadius: "50%",
        pointerEvents: "none",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.14) 38%, rgba(255,255,255,0) 70%)",
        mixBlendMode: "soft-light",
        opacity,
        x,
        y,
      }}
    />
  );
}

/**
 * Constellation canvas: drifting dots that link up with lines and react to the
 * cursor (they lean away from it and tether to it while it is near).
 * Clicking sends a shockwave through the field.
 */
function PointerParticles({ reducedMotion }) {
  const canvasRef = useRef(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false, pulse: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const LINK_DISTANCE = 132;
    const POINTER_RADIUS = 168;
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles = [];

    const seed = () => {
      const count = Math.round(
        Math.min(84, Math.max(26, (width * height) / 17000))
      );
      particles = Array.from({ length: count }, (_, index) => ({
        x: seededRandom(index * 3 + 1) * width,
        y: seededRandom(index * 3 + 2) * height,
        vx: (seededRandom(index * 3 + 3) - 0.5) * 0.34,
        vy: (seededRandom(index * 5 + 7) - 0.5) * 0.34,
        r: 1 + seededRandom(index * 7 + 11) * 1.9,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { x: px, y: py, active, pulse } = pointer.current;

      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];

        // Tether + soft repulsion from the cursor.
        if (active) {
          const dx = a.x - px;
          const dy = a.y - py;
          const distance = Math.hypot(dx, dy) || 1;

          if (distance < POINTER_RADIUS) {
            const force = (1 - distance / POINTER_RADIUS) * (0.5 + pulse * 2.4);
            a.vx += (dx / distance) * force * 0.42;
            a.vy += (dy / distance) * force * 0.42;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${
              (1 - distance / POINTER_RADIUS) * (0.34 + pulse * 0.4)
            })`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(px, py);
            ctx.stroke();
          }
        }

        // Links between neighbours.
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);

          if (distance < LINK_DISTANCE) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${
              (1 - distance / LINK_DISTANCE) * 0.26
            })`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        a.x += a.vx;
        a.y += a.vy;
        // Friction keeps the field calm after a click shockwave.
        a.vx *= 0.985;
        a.vy *= 0.985;
        if (Math.abs(a.vx) < 0.05) a.vx += (seededRandom(i + frame % 7) - 0.5) * 0.03;
        if (Math.abs(a.vy) < 0.05) a.vy += (seededRandom(i + 40) - 0.5) * 0.03;

        if (a.x < -20) a.x = width + 20;
        if (a.x > width + 20) a.x = -20;
        if (a.y < -20) a.y = height + 20;
        if (a.y > height + 20) a.y = -20;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.66)";
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      pointer.current.pulse *= 0.93;
      draw();
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reducedMotion) draw();
    };

    const handlePointerMove = (event) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.active = true;
    };
    const handlePointerDown = () => {
      pointer.current.pulse = 1;
    };
    const handlePointerLeave = () => {
      pointer.current.active = false;
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    };
    const handleVisibility = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    if (!reducedMotion) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: reducedMotion ? 0.5 : 0.85,
      }}
    />
  );
}

/**
 * Layered, living background for the auth screens:
 * animated gradient wash + parallax blobs + cursor-reactive constellation +
 * a glow that trails the pointer. All pointer work is disabled when the user
 * prefers reduced motion.
 */
export default function AuthBackdrop() {
  const reducedMotion = useReducedMotionSafe();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, SPRING_POINTER);
  const pointerY = useSpring(rawY, SPRING_POINTER);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const handleMove = (event) => {
      const { innerWidth, innerHeight } = window;
      rawX.set((event.clientX / Math.max(innerWidth, 1) - 0.5) * 2);
      rawY.set((event.clientY / Math.max(innerHeight, 1) - 0.5) * 2);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [rawX, rawY, reducedMotion]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* animated gradient wash */}
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          backgroundImage:
            "linear-gradient(125deg, #ff7e5f 0%, #feb47b 22%, #ff9a76 40%, #ff6a88 58%, #c06c84 76%, #6c5b7b 100%)",
          backgroundSize: "260% 260%",
          animation: reducedMotion
            ? undefined
            : "authGradientDrift 24s ease-in-out infinite",
        }}
      />

      {/* parallax blobs */}
      {BLOBS.map((config) => (
        <Blob
          key={`${config.top}-${config.left}`}
          config={config}
          pointerX={pointerX}
          pointerY={pointerY}
          reducedMotion={reducedMotion}
        />
      ))}

      <PointerParticles reducedMotion={reducedMotion} />
      <PointerGlow reducedMotion={reducedMotion} />

      {/* vignette so the card always sits on a calm area */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(48, 16, 8, 0.38) 100%)",
        }}
      />
    </div>
  );
}

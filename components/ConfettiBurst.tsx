"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function useConfettiBurst(trigger: boolean) {
  useEffect(() => {
    if (!trigger) return;
    const colors = ["#34d399", "#a78bfa", "#fb7185", "#fbbf24", "#38bdf8"];
    const duration = 1200;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.8 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.8 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [trigger]);
}

export function fireConfetti() {
  const colors = ["#34d399", "#a78bfa", "#fb7185", "#fbbf24", "#38bdf8"];
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    colors,
    ticks: 200,
    scalar: 0.9,
  });
}

/**
 * Lightweight haptic feedback via Web Vibration API.
 * No-op gracefully on unsupported devices (desktop, iOS Safari).
 *
 * Patterns kept short — long vibrations annoy users.
 * iOS doesn't support Vibration API in Safari, but adding the calls
 * costs us nothing and shines on Android/Chrome on Android.
 */

type Pattern = "tap" | "select" | "success" | "error" | "warning";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [10, 30, 24],
  error: [30, 60, 30],
  warning: [16, 40, 16],
};

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function haptic(pattern: Pattern = "tap") {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // ignore: some browsers throw on calls without a user gesture
  }
}

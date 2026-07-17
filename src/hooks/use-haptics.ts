export function useHaptics() {
  const vibrate = (pattern: number | number[] = 10) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch { /* silent */ }
  };
  return {
    tap: () => vibrate(8),
    success: () => vibrate([12, 40, 24]),
    error: () => vibrate([60, 30, 60]),
    reward: () => vibrate([10, 20, 10, 20, 60]),
  };
}

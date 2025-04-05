import { useState, useEffect } from "react";

/**
 * Custom hook to handle fade-in effect after a specified delay.
 * @param delay - The delay in milliseconds before the fade-in starts.
 * @returns A boolean indicating whether the fade-in effect should be applied.
 */
export function useFadeIn(delay: number = 1000): boolean {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), delay);
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [delay]);

  return fadeIn;
}

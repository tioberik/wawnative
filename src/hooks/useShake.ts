import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

/**
 * Detektuje protresanje uređaja preko akcelerometra i poziva callback.
 *
 * U mirovanju ukupna sila ≈ 1g (gravitacija). Naglo protresanje podigne
 * magnitudu iznad praga. Debounce sprječava višestruko okidanje pri jednom tresu.
 *
 * @param onShake   poziva se kad se detektuje protresanje
 * @param threshold prag magnitude (default 1.8 — osjetljivost)
 * @param active    da li je detekcija uključena
 */
export function useShake(
  onShake: () => void,
  active: boolean = true,
  threshold: number = 1.8
): void {
  const callbackRef = useRef(onShake);
  callbackRef.current = onShake;
  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!active) return;
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > threshold) {
        const now = Date.now();
        // Debounce — najmanje 1.5s između dva okidanja
        if (now - lastShakeAt.current > 1500) {
          lastShakeAt.current = now;
          callbackRef.current();
        }
      }
    });
    return () => subscription.remove();
  }, [active, threshold]);
}

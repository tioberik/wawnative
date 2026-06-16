import { useEffect, useState } from "react";

export type SensorData = { x: number; y: number; z: number };

/** Minimalni interfejs koji dijele expo-sensors senzori (Accelerometer, Gyroscope, ...). */
type SensorLike = {
  setUpdateInterval: (intervalMs: number) => void;
  addListener: (listener: (data: SensorData) => void) => { remove: () => void };
};

/**
 * Pretplaćuje se na zadani senzor i vraća njegove trenutne x/y/z vrijednosti.
 *
 * @param sensor   expo-sensors senzor (npr. Accelerometer)
 * @param active   da li je pretplata aktivna (start/stop)
 * @param interval razmak osvježavanja u ms (default 100)
 */
export function useSensor(
  sensor: SensorLike,
  active: boolean,
  interval: number = 100
): SensorData {
  const [data, setData] = useState<SensorData>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!active) return;
    sensor.setUpdateInterval(interval);
    const subscription = sensor.addListener((value) => setData(value));
    return () => subscription.remove();
  }, [sensor, active, interval]);

  return data;
}

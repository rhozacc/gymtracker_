export type WeightUnit = "kg" | "lbs";

const STORAGE_KEY = "gym-unit";
const LBS_PER_KG = 2.20462;

export function getStoredUnit(): WeightUnit {
  if (typeof window === "undefined") return "kg";
  return (localStorage.getItem(STORAGE_KEY) as WeightUnit) || "kg";
}

export function setStoredUnit(unit: WeightUnit): void {
  localStorage.setItem(STORAGE_KEY, unit);
}

/** Convert kg (DB value) to display value in the user's preferred unit */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  if (unit === "kg") return kg;
  return roundToHalf(kg * LBS_PER_KG);
}

/** Convert display value back to kg for storage */
export function displayToKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return Math.round((value / LBS_PER_KG) * 100) / 100;
}

/** Round to nearest 0.5 */
function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Get increment buttons for the current unit */
export function getIncrements(unit: WeightUnit): number[] {
  if (unit === "kg") return [1.25, 2.5, 5, 10];
  return [2.5, 5, 10, 25];
}

/** Format a weight with unit label */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const val = kgToDisplay(kg, unit);
  return `${val} ${unit}`;
}

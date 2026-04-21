export function validateDays(days: unknown): string | null {
  if (typeof days !== "object" || days === null || Array.isArray(days)) {
    return "days must be a non-null object";
  }
  const dayMap = days as Record<string, unknown>;
  if (Object.keys(dayMap).length === 0) {
    return "days must have at least one entry";
  }
  for (const [key, day] of Object.entries(dayMap)) {
    if (typeof day !== "object" || day === null) {
      return `day "${key}" must be an object`;
    }
    const d = day as Record<string, unknown>;
    if (typeof d.label !== "string" || !d.label) {
      return `day "${key}" missing label`;
    }
    if (!Array.isArray(d.exercises) || d.exercises.length === 0) {
      return `day "${key}" must have at least one exercise`;
    }
    for (let i = 0; i < d.exercises.length; i++) {
      const ex = d.exercises[i];
      if (typeof ex !== "object" || ex === null) {
        return `exercise ${i} in day "${key}" must be an object`;
      }
      const e = ex as Record<string, unknown>;
      if (typeof e.id !== "string" || !e.id) {
        return `exercise ${i} in day "${key}" missing id`;
      }
      if (typeof e.name !== "string" || !e.name) {
        return `exercise ${i} in day "${key}" missing name`;
      }
      if (typeof e.sets !== "number" || e.sets < 1) {
        return `exercise ${i} in day "${key}" has invalid sets`;
      }
      if (
        !Array.isArray(e.repRange) ||
        e.repRange.length !== 2 ||
        typeof e.repRange[0] !== "number" ||
        typeof e.repRange[1] !== "number"
      ) {
        return `exercise ${i} in day "${key}" has invalid repRange`;
      }
      if (typeof e.rest !== "number") {
        return `exercise ${i} in day "${key}" missing rest`;
      }
    }
  }
  return null;
}

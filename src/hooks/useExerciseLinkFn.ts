import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { getExerciseLink } from "@/lib/exerciseLinks";

export function useExerciseLinkFn() {
  const { data } = useSWR<Record<string, string>>("/api/exercise-links", fetcher);

  return (name: string): string | null => {
    if (data) {
      const normalized = name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
      if (data[normalized]) return data[normalized];
    }
    return getExerciseLink(name);
  };
}

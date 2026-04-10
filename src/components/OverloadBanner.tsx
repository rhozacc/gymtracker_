export function OverloadBanner({
  suggestedWeight,
  unit = "kg",
  variant = "go_up",
}: {
  suggestedWeight: number;
  unit?: string;
  variant?: "go_up" | "almost_ready";
}) {
  if (variant === "almost_ready") {
    return (
      <div className="border border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400 text-xs px-4 py-2.5 rounded text-center leading-relaxed">
        Almost there — repeat{" "}
        <span className="font-bold">
          {suggestedWeight} {unit}
        </span>{" "}
        to lock it in
      </div>
    );
  }

  return (
    <div className="border border-green-500 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 text-xs px-4 py-2.5 rounded text-center leading-relaxed">
      Ready to go up —{" "}
      <span className="font-bold">
        {suggestedWeight} {unit}
      </span>{" "}
      loaded
    </div>
  );
}

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
      <div className="border border-amber-800 bg-amber-950/30 text-amber-400 text-xs px-4 py-2.5 rounded text-center leading-relaxed">
        Almost there — repeat{" "}
        <span className="font-bold">
          {suggestedWeight} {unit}
        </span>{" "}
        to lock it in
      </div>
    );
  }

  return (
    <div className="border border-green-800 bg-green-950/30 text-green-400 text-xs px-4 py-2.5 rounded text-center leading-relaxed">
      Ready to go up —{" "}
      <span className="font-bold">
        {suggestedWeight} {unit}
      </span>{" "}
      loaded
    </div>
  );
}

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
      <div className="border border-border text-muted text-xs px-4 py-2.5 rounded text-center leading-relaxed">
        Almost there — repeat{" "}
        <span className="font-bold text-text">
          {suggestedWeight} {unit}
        </span>{" "}
        to lock it in
      </div>
    );
  }

  return (
    <div className="border border-accent/40 bg-accent/5 text-text text-xs px-4 py-2.5 rounded text-center leading-relaxed">
      Load up —{" "}
      <span className="font-bold text-accent">
        {suggestedWeight} {unit}
      </span>
    </div>
  );
}

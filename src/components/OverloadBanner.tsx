export function OverloadBanner({
  suggestedWeight,
  unit = "kg",
}: {
  suggestedWeight: number;
  unit?: string;
}) {
  return (
    <div className="border border-green-800 bg-green-950/30 text-green-400 text-xs px-3 py-2 rounded mb-2">
      Ready to progress — try{" "}
      <span className="font-bold">
        {suggestedWeight} {unit}
      </span>
    </div>
  );
}

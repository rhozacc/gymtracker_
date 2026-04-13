const BASE = "https://www.muscleandstrength.com/exercises/";

// Slugs verified against muscleandstrength.com
const SLUG_MAP: Record<string, string> = {
  // Compound
  "bench press":                  "barbell-bench-press.html",
  "squat":                        "squat.html",
  "barbell squat":                "squat.html",
  "back squat":                   "squat.html",
  "deadlift":                     "deadlifts.html",
  "conventional deadlift":        "deadlifts.html",
  "romanian deadlift":            "romanian-deadlift",
  "barbell row":                  "bent-over-barbell-row.html",
  "overhead press":               "military-press.html",
  "barbell hip thrust":           "barbell-hip-thrust",
  "hip thrust":                   "barbell-hip-thrust",
  "single-leg hip thrust":        "barbell-hip-thrust",
  "bulgarian split squat":        "one-leg-barbell-squat.html",
  "incline db press":             "incline-dumbbell-bench-press.html",
  "incline dumbbell bench press": "incline-dumbbell-bench-press.html",
  "incline bench press":          "incline-bench-press.html",
  "db bench press":               "dumbbell-bench-press",
  "front squat":                  "front-squat.html",
  "sumo deadlift":                "sumo-deadlift",
  "leg press":                    "leg-press",
  "goblet squat":                 "dumbbell-goblet-squat",
  "walking lunge":                "dumbbell-walking-lunge.html",
  "push-up":                      "push-up.html",
  "push press":                   "push-press",

  // Back / Pull
  "lat pulldown":                 "lat-pull-down.html",
  "cable row":                    "seated-row.html",
  "seated cable row":             "seated-row.html",
  "weighted pull-up":             "weighted-pull-up",
  "pull-up":                      "pull-up",
  "straight-arm pulldown":        "straight-arm-lat-pull-down.html",
  "close-grip pulldown":          "close-grip-lat-pulldown",

  // Chest
  "cable fly":                    "cable-crossovers-(mid-chest).html",
  "pec deck":                     "pec-dec.html",
  "dips":                         "tricep-dip.html",
  "weighted dips":                "tricep-dip.html",
  "close-grip bench press":       "close-grip-bench-press.html",
  "close-grip bench":             "close-grip-bench-press.html",
  "incline db fly":               "incline-dumbbell-flyes",
  "chest fly":                    "cable-crossovers-(mid-chest).html",

  // Shoulders
  "lateral raise":                "dumbbell-lateral-raise.html",
  "cable lateral raise":          "cable-lateral-raise",
  "face pull":                    "cable-face-pull",
  "rear delt fly":                "bent-over-cable-rear-delt-fly",
  "db shoulder press":            "dumbbell-shoulder-press",
  "db overhead press":            "dumbbell-shoulder-press",
  "seated db press":              "seated-dumbbell-shoulder-press",

  // Arms
  "barbell curl":                 "standing-barbell-curl.html",
  "biceps curl":                  "standing-dumbbell-curl.html",
  "hammer curl":                  "standing-hammer-curl.html",
  "preacher curl":                "preacher-curl.html",
  "triceps pushdown":             "cable-tricep-pushdown",
  "overhead extension":           "overhead-tricep-extension.html",

  // Legs
  "leg curl":                     "leg-curl.html",
  "lying leg curl":               "leg-curl.html",
  "seated leg curl":              "seated-leg-curl",
  "leg extension":                "leg-extension.html",
  "calf raise":                   "standing-calf-raise.html",
  "seated calf raise":            "seated-calf-raise.html",
  "reverse lunge":                "dumbbell-reverse-lunge",
  "db reverse lunge":             "dumbbell-reverse-lunge",
  "glute bridge":                 "glute-bridge",
  "step-up":                      "dumbbell-step-ups",
  "single-arm db row":            "dumbbell-one-arm-row",
  "back extension":               "back-extension",
  "cable kickback":               "cable-glute-kickback",
  "renegade row":                 "renegade-row",
  "cable pull-through":           "cable-pull-through",
  "trap bar deadlift":            "trap-bar-deadlift",
  "shrugs":                       "barbell-shrug",
};

export function getExerciseLink(name: string): string | null {
  const normalized = name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
  const slug = SLUG_MAP[normalized];
  return slug ? BASE + slug : null;
}

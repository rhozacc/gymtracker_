"use client";

import { useState, useCallback } from "react";
import { WeightUnit, getStoredUnit, setStoredUnit } from "./units";

export function useUnit() {
  const [unit, setUnitState] = useState<WeightUnit>(getStoredUnit);

  const setUnit = useCallback((u: WeightUnit) => {
    setStoredUnit(u);
    setUnitState(u);
  }, []);

  return { unit, setUnit };
}

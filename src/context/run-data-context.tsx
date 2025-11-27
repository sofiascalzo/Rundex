// src/context/run-data-context.tsx
"use client";

import type { RawRunDataEntry } from "@/lib/types";
import { createContext, useContext, useState, ReactNode } from "react";

interface RunDataContextType {
  runData: RawRunDataEntry[] | null;
  setRunData: (data: RawRunDataEntry[] | null) => void;
}

const RunDataContext = createContext<RunDataContextType | undefined>(undefined);

export function RunDataProvider({ children }: { children: ReactNode }) {
  const [runData, setRunData] = useState<RawRunDataEntry[] | null>(null);

  return (
    <RunDataContext.Provider value={{ runData, setRunData }}>
      {children}
    </RunDataContext.Provider>
  );
}

export function useRunData() {
  const context = useContext(RunDataContext);
  if (context === undefined) {
    throw new Error("useRunData must be used within a RunDataProvider");
  }
  return context;
}

// src/context/run-data-context.tsx
"use client";

import type { RawRunDataEntry } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

const RUN_DATA_STORAGE_KEY = "rundex-run-data";

interface RunDataContextType {
  runData: RawRunDataEntry[] | null;
  setRunData: (data: RawRunDataEntry[] | null) => void;
  isLoading: boolean;
}

const RunDataContext = createContext<RunDataContextType | undefined>(undefined);

export function RunDataProvider({ children }: { children: ReactNode }) {
  const [runData, setRunData] = useState<RawRunDataEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On initial load, try to read from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(RUN_DATA_STORAGE_KEY);
      if (storedData) {
        setRunData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load run data from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetRunData = (data: RawRunDataEntry[] | null) => {
    setRunData(data);
    try {
      if (data) {
        localStorage.setItem(RUN_DATA_STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(RUN_DATA_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save run data to localStorage", error);
    }
  };

  return (
    <RunDataContext.Provider value={{ runData, setRunData: handleSetRunData, isLoading }}>
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

// src/app/coach/page.tsx
"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";
import { useToast } from "@/hooks/use-toast";
import type { RawRunDataEntry, StepMetrics } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, Info, Wand2, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { processIMUData } from "@/lib/imu-processor";
import PerformancePrediction from "@/components/dashboard/performance-prediction";
import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { Button } from "@/components/ui/button";

const RUN_DATA_STORAGE_KEY = "rundex-run-data";

export default function CoachPage() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [prediction, setPrediction] = useState<PerformancePredictionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRunData, setHasRunData] = useState(false);

  async function getCoachingReport() {
    setIsLoading(true);
    setPrediction(null); // Reset previous prediction

    let rawData: RawRunDataEntry[] | null = null;
    try {
      const storedData = localStorage.getItem(RUN_DATA_STORAGE_KEY);
      if (storedData) {
        rawData = JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Failed to read run data from localStorage", error);
      toast({
        title: "Error",
        description: "Could not read the saved run data.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    let results: StepMetrics[] | null = null;
    if (rawData && rawData.length > 0) {
      setHasRunData(true);
      try {
        results = processIMUData(rawData, profile.weight);
      } catch (error) {
        console.error("Failed to process run data for coach:", error);
        setHasRunData(false); // Mark as no valid data if processing fails
      }
    } else {
      setHasRunData(false);
    }

    if (results && results.length > 0) {
      try {
        const runAnalysisJson = JSON.stringify(results);
        const coachingReport = await performancePredictions({
          runAnalysisResults: runAnalysisJson,
          environmentalConditions: "Slightly windy, 15°C, flat asphalt road.",
        });
        setPrediction(coachingReport);
      } catch (error) {
        console.error("AI Coach Error:", error);
        toast({
          title: "AI Coach Error",
          description: "Failed to generate the coaching report.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary"/>
            AI Running Coach
        </h1>
        <p className="text-muted-foreground max-w-2xl">
            Get personalized feedback on your last run. The AI analyzes your step-by-step metrics to provide insights on your training type, performance, and technique.
        </p>

        <Button onClick={getCoachingReport} disabled={isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate AI Report
                </>
            )}
        </Button>

        {prediction ? (
             <div className="space-y-4 pt-6">
                <h2 className="text-2xl font-bold font-headline tracking-wide flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    Your Personalized Report
                </h2>
                <PerformancePrediction prediction={prediction} isLoading={false} />
            </div>
        ) : (
            !isLoading && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Ready for Analysis</AlertTitle>
                    <AlertDescription>
                        Upload a run session on the <a href="/connect" className="font-bold underline">Connect</a> page, then click "Generate AI Report" to get your personalized coaching.
                    </AlertDescription>
                </Alert>
            )
        )}
      </div>
    </AppLayout>
  );
}

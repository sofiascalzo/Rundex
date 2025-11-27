// src/app/coach/page.tsx
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { useToast } from "@/hooks/use-toast";
import type { RawRunDataEntry, StepMetrics } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, Info, Wand2 } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { processIMUData } from "@/lib/imu-processor";
import PerformancePrediction from "@/components/dashboard/performance-prediction";
import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { useRunData } from "@/context/run-data-context";

export default function CoachPage() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { runData } = useRunData();
  const [prediction, setPrediction] = useState<PerformancePredictionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRunData, setHasRunData] = useState(false);

  useEffect(() => {
    async function getCoachingReport() {
      setIsLoading(true);
      let results: StepMetrics[] | null = null;
      
      if (runData && runData.length > 0) {
        setHasRunData(true);
        try {
          results = processIMUData(runData, profile.weight);
        } catch (error) {
          console.error("Failed to process run data for coach:", error);
          setHasRunData(false);
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

    getCoachingReport();
  }, [toast, profile.weight, runData]);

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

        {!isLoading && !hasRunData && (
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Session Data Found</AlertTitle>
                <AlertDescription>
                    To get your AI coaching report, please upload a run session file on the <a href="/connect" className="font-bold underline">Connect</a> page first.
                </AlertDescription>
            </Alert>
        )}
        
        {hasRunData && (
             <div className="space-y-4 pt-6">
                <h2 className="text-2xl font-bold font-headline tracking-wide flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    Your Personalized Report
                </h2>
                <PerformancePrediction prediction={prediction} isLoading={isLoading} />
            </div>
        )}

      </div>
    </AppLayout>
  );
}

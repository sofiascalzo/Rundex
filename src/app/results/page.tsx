// src/app/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { useToast } from "@/hooks/use-toast";
import type { RawRunDataEntry, StepMetrics } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Wand2 } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { processIMUData } from "@/lib/imu-processor";
import { Skeleton } from "@/components/ui/skeleton";
import PerformancePrediction from "@/components/dashboard/performance-prediction";
import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";

export default function ResultsPage() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [analysisResults, setAnalysisResults] = useState<StepMetrics[] | null>(null);
  const [prediction, setPrediction] = useState<PerformancePredictionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  useEffect(() => {
    async function processAndAnalyze() {
      setIsLoading(true);
      setIsCoachLoading(true);
      let results: StepMetrics[] | null = null;
      try {
        const storedData = sessionStorage.getItem("uploadedRunData");
        if (storedData) {
          const runData: RawRunDataEntry[] = JSON.parse(storedData);
          if (runData && runData.length > 0) {
              results = processIMUData(runData, profile.weight);
              setAnalysisResults(results);
          } else {
              toast({
                  title: "No Data",
                  description: "No run data found to analyze.",
                  variant: "destructive",
              });
          }
        }
      } catch (error) {
        console.error("Failed to process run data:", error);
        toast({
          title: "Analysis Error",
          description: "Could not analyze the provided run data.",
          variant: "destructive",
        });
      } finally {
          setIsLoading(false);
      }

      if (results && results.length > 0) {
        try {
          const runAnalysisJson = JSON.stringify(results);
          const coachingReport = await performancePredictions({
            runAnalysisResults: runAnalysisJson,
            // Using a default value for environmental conditions for automation
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
        } finally {
            setIsCoachLoading(false);
        }
      } else {
        setIsCoachLoading(false);
      }
    }

    processAndAnalyze();
  }, [toast, profile.weight]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Run Analysis</h1>
        
        {isLoading && (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48"/>
                    <Skeleton className="h-4 w-64"/>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full"/>
                </CardContent>
            </Card>
        )}

        {!isLoading && (!analysisResults || analysisResults.length === 0) && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Results</AlertTitle>
                <AlertDescription>
                    We couldn't generate any step metrics from the provided data. Please try uploading a different session file on the <a href="/connect" className="font-bold underline">Connect</a> page.
                </AlertDescription>
            </Alert>
        )}

        {!isLoading && analysisResults && analysisResults.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Metrics</CardTitle>
                <CardDescription>
                  Detailed analysis of each step detected in your run session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>A detailed list of your run metrics per step.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Step</TableHead>
                        <TableHead>Contact (s)</TableHead>
                        <TableHead>Flight (s)</TableHead>
                        <TableHead>Duration (s)</TableHead>
                        <TableHead>Cadence (spm)</TableHead>
                        <TableHead>Length (m)</TableHead>
                        <TableHead>Speed (m/s)</TableHead>
                        <TableHead>Pitch (°)</TableHead>
                        <TableHead>Roll (°)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResults.map((step) => (
                        <TableRow key={step.index}>
                          <TableCell className="font-medium">{step.index}</TableCell>
                          <TableCell>{step.CT.toFixed(3)}</TableCell>
                          <TableCell>{step.FT.toFixed(3)}</TableCell>
                          <TableCell>{step.Tstep.toFixed(3)}</TableCell>
                          <TableCell>{step.cadencePmin.toFixed(1)}</TableCell>
                          <TableCell>{step.Li.toFixed(2)}</TableCell>
                          <TableCell>{step.vi.toFixed(2)}</TableCell>
                          <TableCell>{step.pitchDeg.toFixed(1)}</TableCell>
                          <TableCell>{step.rollDeg.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 pt-6">
                <h2 className="text-2xl font-bold font-headline tracking-wide flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    AI Coaching Report
                </h2>
                <PerformancePrediction prediction={prediction} isLoading={isCoachLoading} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

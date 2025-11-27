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
import { Info } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { processIMUData } from "@/lib/imu-processor";
import { Skeleton } from "@/components/ui/skeleton";

const RUN_DATA_STORAGE_KEY = "rundex-run-data";

export default function ResultsPage() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [analysisResults, setAnalysisResults] = useState<StepMetrics[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function processAndAnalyze() {
      setIsLoading(true);
      let rawData: RawRunDataEntry[] | null = null;
      try {
        const storedData = localStorage.getItem(RUN_DATA_STORAGE_KEY);
        if (storedData) {
          rawData = JSON.parse(storedData);
        }
      } catch (error) {
        console.error("Failed to parse run data from localStorage:", error);
        toast({
          title: "Error Reading Data",
          description: "Could not read the saved run data from your browser.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (rawData && rawData.length > 0) {
        try {
          const results = processIMUData(rawData, profile.weight);
          setAnalysisResults(results);
        } catch (error) {
          console.error("Failed to process run data:", error);
          toast({
            title: "Analysis Error",
            description: "Could not analyze the provided run data.",
            variant: "destructive",
          });
        }
      } else {
        setAnalysisResults(null);
      }
      setIsLoading(false);
    }

    // Ensure this runs on the client where localStorage is available
    if (typeof window !== "undefined") {
      processAndAnalyze();
    }
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
                    We couldn't find any session data. Please upload a run file on the <a href="/connect" className="font-bold underline">Connect</a> page.
                </AlertDescription>
            </Alert>
        )}

        {!isLoading && analysisResults && analysisResults.length > 0 && (
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
        )}
      </div>
    </AppLayout>
  );
}

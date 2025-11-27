"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { useToast } from "@/hooks/use-toast";
import type { StepMetrics, RawRunDataEntry } from "@/lib/types";
import { processIMUData } from "@/lib/imu-processor";
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

export default function ResultsPage() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [analysisResults, setAnalysisResults] = useState<StepMetrics[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("uploadedRunData");
      if (storedData) {
        const runData: RawRunDataEntry[] = JSON.parse(storedData);
        if (runData && runData.length > 0) {
            const results = processIMUData(runData, profile.weight);
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
  }, [toast, profile.weight]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Run Analysis Results</h1>
        
        {isLoading && <p>Loading analysis...</p>}

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
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Metrics</CardTitle>
              <CardDescription>
                Detailed analysis of each step detected in your run session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A detailed list of your run metrics.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Step</TableHead>
                    <TableHead>Contact (s)</TableHead>
                    <TableHead>Flight (s)</TableHead>
                    <TableHead>Duration (s)</TableHead>
                    <TableHead>Cadence (p/min)</TableHead>
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
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

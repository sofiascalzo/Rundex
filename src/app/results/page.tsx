// src/app/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeRunData, GaitMetrics } from "@/lib/gait-analysis";
import type { RunData } from "@/lib/types";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Loader2, Info, BarChart3 } from "lucide-react";
import { mockRunData } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the map component to avoid SSR issues with Leaflet
const RunMap = dynamic(() => import('@/components/results/run-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});


export default function ResultsPage() {
  const [metrics, setMetrics] = useState<GaitMetrics | null>(null);
  const [runData, setRunData] = useState<RunData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useUserProfile();

  useEffect(() => {
    // This effect runs only on the client side
    setIsLoading(true);
    const uploadedDataString = sessionStorage.getItem("uploadedRunData");
    
    let dataToAnalyze: RunData[] = [];
    if (uploadedDataString) {
      try {
        const parsedData = JSON.parse(uploadedDataString);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          dataToAnalyze = parsedData;
        }
      } catch (error) {
        console.error("Failed to parse run data from session storage:", error);
      }
    }

    if (dataToAnalyze.length === 0) {
        // Fallback to mock data if no valid data is in session storage
        dataToAnalyze = mockRunData;
    }
    
    setRunData(dataToAnalyze);

    // Simulate processing time for a better user experience
    setTimeout(() => {
      const analysisResults = analyzeRunData(dataToAnalyze, profile);
      setMetrics(analysisResults);
      setIsLoading(false);
    }, 500);

  }, [profile]);

  // 1. Loading State
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Analyzing run data...</p>
        </div>
      </AppLayout>
    );
  }

  // 2. No Data State (metrics could be null if analysis fails)
  if (!metrics) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Data to Analyze</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              Could not analyze run data. Please go to the "Connect" page to upload a valid session file.
            </p>
        </div>
      </AppLayout>
    );
  }

  // 3. Data Loaded State
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Analysis Results</h1>
        
        <RunMap runData={runData} />

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="text-primary"/>
                    Gait Metrics Summary
                </CardTitle>
                <CardDescription>
                    Here is a summary of the key metrics from your last run.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Metric</TableHead>

                            <TableHead>Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Total Steps</TableCell>
                            <TableCell>{metrics.totalSteps}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-medium">Total Distance</TableCell>
                            <TableCell>{metrics.totalDistance.toFixed(2)} m</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Average Speed</TableCell>
                            <TableCell>{metrics.averageSpeed.toFixed(2)} m/s</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Average Cadence</TableCell>
                            <TableCell>{metrics.averageCadence.toFixed(0)} steps/min</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Average Stride Length</TableCell>
                            <TableCell>{metrics.averageStrideLength.toFixed(2)} m</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


// src/app/results/page.tsx
"use client";

import { useState, useEffect, useId } from "react";
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeRunData } from "@/lib/gait-analysis";
import type { GaitAnalysisResult, RawRunDataEntry } from "@/lib/types";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Loader2, Info, BarChart3, Footprints, TrendingUp, LocateFixed, Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/dashboard/stat-card";
import Link from "next/link";

// Dynamically import the map component to avoid SSR issues with Leaflet
const RunMap = dynamic(() => import('@/components/results/run-map'), {
  ssr: false,
  loading: () => (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <MapIcon className="text-primary"/>
                  Run Path
              </CardTitle>
          </CardHeader>
          <CardContent>
              <Skeleton className="h-[400px] w-full" />
          </CardContent>
      </Card>
  ),
});

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<GaitAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useUserProfile();
  const runId = useId();

  useEffect(() => {
    document.title = "Rundex - Results";
    setIsLoading(true);
    const uploadedDataString = sessionStorage.getItem("uploadedRunData");
    
    let dataToAnalyze: RawRunDataEntry[] = [];
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
    
    // Simulate async analysis
    setTimeout(() => {
      if(dataToAnalyze.length > 0) {
        const analysisResults = analyzeRunData(dataToAnalyze, profile);
        setAnalysis(analysisResults);
      }
      setIsLoading(false);
    }, 500);

  }, [profile, runId]);

  // Prepare map data
  const positions = analysis?.dataWithPositions
    ?.map(d => d.position)
    .filter(p => p !== undefined && p.lat !== undefined && p.lng !== undefined) as { lat: number; lng: number }[] | undefined;

  let path: LatLngExpression[] | undefined;
  let center: LatLngExpression | null = null;
  let startPoint: LatLngExpression | undefined;
  let endPoint: LatLngExpression | undefined;

  if (positions && positions.length >= 2) {
    path = positions.map(p => [p.lat, p.lng]);
    center = path[Math.floor(path.length / 2)];
    startPoint = path[0];
    endPoint = path[path.length - 1];
  }

  const mapKey = `run-map-${runId}-${center ? (center as number[]).join('-') : 'no-center'}`;


  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Analyzing run data with advanced pipeline...</p>
        </div>
      </AppLayout>
    );
  }

  if (!analysis) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Data to Analyze</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              Could not find session data. Please go to the <Link href="/connect" className="text-primary underline">Connect</Link> page to upload a valid session file.
            </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Analysis Results</h1>
        
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Total Steps" value={analysis.summary.nSteps.toString()} icon={<Footprints className="h-5 w-5 text-muted-foreground" />} description="From IMU processing" />
            <StatCard title="Total Distance" value={`${analysis.summary.totalDistance.toFixed(2)} m`} icon={<LocateFixed className="h-5 w-5 text-muted-foreground" />} description="Calculated via ZUPT" />
            <StatCard title="Average Speed" value={`${analysis.summary.avgSpeed.toFixed(2)} m/s`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Across the session" />
        </div>

        {center ? (
            <RunMap 
                mapKey={mapKey}
                center={center as [number, number]}
                path={path as [number, number][]}
                startPoint={startPoint as [number, number]}
                endPoint={endPoint as [number, number]}
            />
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapIcon className="text-primary"/>
                        Run Path
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center bg-muted rounded-md">
                        <p className="text-muted-foreground">Not enough location data to display a map.</p>
                    </div>
                </CardContent>
            </Card>
        )}

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="text-primary"/>
                    Step-by-Step Metrics
                </CardTitle>
                <CardDescription>
                    Detailed metrics for each step detected during the run.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Step</TableHead>
                                <TableHead>CT (s)</TableHead>
                                <TableHead>FT (s)</TableHead>
                                <TableHead>Length (m)</TableHead>
                                <TableHead>Speed (m/s)</TableHead>
                                <TableHead>Peak Force (N)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analysis.steps.map((step) => (
                                <TableRow key={step.i}>
                                    <TableCell className="font-medium">{step.i + 1}</TableCell>
                                    <TableCell>{step.CT.toFixed(3)}</TableCell>
                                    <TableCell>{step.FT.toFixed(3)}</TableCell>
                                    <TableCell>{step.L.toFixed(2)}</TableCell>
                                    <TableCell>{step.vmean.toFixed(2)}</TableCell>
                                    <TableCell>{step.Fpeak.toFixed(0)}</TableCell>
                                </TableRow>
                            ))}
                            {analysis.steps.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No steps detected.</TableCell>

                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

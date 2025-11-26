
"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import PostureIndicator from "@/components/dashboard/posture-indicator";
import SpeedChart from "@/components/dashboard/speed-chart";
import StatCard from "@/components/dashboard/stat-card";
import { mockRunData as defaultMockRunData } from "@/lib/mock-data";
import { Activity, Footprints, Gauge, TrendingUp, Loader2, Info } from "lucide-react";
import type { RunData } from "@/lib/types";

export default function DashboardPage() {
  const [runData, setRunData] = useState<RunData[] | null>(null);

  useEffect(() => {
    const uploadedDataString = sessionStorage.getItem("uploadedRunData");
    if (uploadedDataString) {
      try {
        const parsedData = JSON.parse(uploadedDataString);
        // Ensure parsed data is an array before setting it
        if (Array.isArray(parsedData)) {
          setRunData(parsedData);
        } else {
          // If parsed data isn't an array, fall back to mock data
          console.warn("Parsed data from session storage is not an array. Using default data.");
          setRunData(defaultMockRunData);
        }
      } catch (error) {
        console.error("Failed to parse run data from session storage:", error);
        setRunData(defaultMockRunData);
      }
    } else {
      // If no data in session storage, use mock data
      setRunData(defaultMockRunData);
    }
  }, []);

  // 1. Loading State: runData is null
  if (!runData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </AppLayout>
    );
  }

  // 2. Empty State: runData is an empty array
  if (runData.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Run Data Available</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              The uploaded session file seems to be empty. Please connect a device or upload a valid session file to see your dashboard.
            </p>
        </div>
      </AppLayout>
    );
  }

  // 3. Data Loaded State: All calculations are safe now because we know runData is a non-empty array.
  const latestData = runData[runData.length - 1];
  const avgSpeed = (runData.reduce((acc, d) => acc + d.speed, 0) / runData.length).toFixed(2);
  const avgStride = (runData.reduce((acc, d) => acc + d.stride_length, 0) / runData.length).toFixed(2);
  const totalSteps = runData.reduce((maxSteps, d) => Math.max(maxSteps, d.step_count), 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Average Speed" value={`${avgSpeed} m/s`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Across your session" />
          <StatCard title="Total Steps" value={totalSteps.toString()} icon={<Footprints className="h-5 w-5 text-muted-foreground" />} description="From session data" />
          <StatCard title="Average Stride" value={`${avgStride} m`} icon={<Gauge className="h-5 w-5 text-muted-foreground" />} description="Consistent performance" />
          <StatCard title="Posture Score" value={latestData.posture_error.toFixed(1)} icon={<Activity className="h-5 w-5 text-muted-foreground" />} description="Lower is better" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpeedChart data={runData} />
          </div>
          <PostureIndicator value={latestData.posture_error} />
        </div>
      </div>
    </AppLayout>
  );
}

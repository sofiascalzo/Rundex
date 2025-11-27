
"use client";

import AppLayout from "@/components/app-layout";
import PostureIndicator from "@/components/dashboard/posture-indicator";
import SpeedChart from "@/components/dashboard/speed-chart";
import StatCard from "@/components/dashboard/stat-card";
import { mockRunData as defaultMockRunData } from "@/lib/mock-data";
import { Activity, Footprints, Gauge, TrendingUp } from "lucide-react";
import type { RunData } from "@/lib/types";

export default function DashboardPage() {
  // The dashboard will now consistently show mock data as a general overview.
  const runData: RunData[] = defaultMockRunData;

  const latestData = runData[runData.length - 1];
  const avgSpeed = (runData.reduce((acc, d) => acc + (d.speed || 0), 0) / runData.length).toFixed(2);
  const avgStride = (runData.reduce((acc, d) => acc + (d.stride_length || 0), 0) / runData.length).toFixed(2);
  const totalSteps = runData.reduce((maxSteps, d) => Math.max(maxSteps, d.step_count || 0), 0);
  const postureError = latestData.posture_error || 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Dashboard Overview</h1>
        <p className="text-muted-foreground">This is a general overview using sample data. For detailed analysis of your session, please upload your data on the <a href="/connect" className="text-primary underline">Connect</a> page.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Average Speed" value={`${avgSpeed} m/s`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Across your session" />
          <StatCard title="Total Steps" value={totalSteps.toString()} icon={<Footprints className="h-5 w-5 text-muted-foreground" />} description="From session data" />
          <StatCard title="Average Stride" value={`${avgStride} m`} icon={<Gauge className="h-5 w-5 text-muted-foreground" />} description="Consistent performance" />
          <StatCard title="Posture Score" value={postureError.toString()} icon={<Activity className="h-5 w-5 text-muted-foreground" />} description="Lower is better" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpeedChart data={runData} />
          </div>
          <PostureIndicator value={postureError} />
        </div>
      </div>
    </AppLayout>
  );
}

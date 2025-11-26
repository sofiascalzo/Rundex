
"use client";

import AppLayout from "@/components/app-layout";
import PostureIndicator from "@/components/dashboard/posture-indicator";
import SpeedChart from "@/components/dashboard/speed-chart";
import StatCard from "@/components/dashboard/stat-card";
import { mockRunData as defaultMockRunData } from "@/lib/mock-data";
import { Activity, Footprints, Gauge, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  // The dashboard will now consistently show mock data as a general overview.
  // The detailed analysis of uploaded data is moved to the new "Results" page.
  const runData = defaultMockRunData;

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
          <StatCard title="Posture Score" value={latestData.posture_error} icon={<Activity className="h-5 w-5 text-muted-foreground" />} description="Lower is better" />
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

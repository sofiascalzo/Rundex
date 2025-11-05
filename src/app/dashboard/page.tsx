import AppLayout from "@/components/app-layout";
import PostureIndicator from "@/components/dashboard/posture-indicator";
import SpeedChart from "@/components/dashboard/speed-chart";
import StatCard from "@/components/dashboard/stat-card";
import { mockRunData } from "@/lib/mock-data";
import { Activity, Footprints, Gauge, TrendingUp } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rundex - Dashboard",
};

export default function DashboardPage() {
  const latestData = mockRunData[mockRunData.length - 1];
  const avgSpeed = (mockRunData.reduce((acc, d) => acc + d.speed, 0) / mockRunData.length).toFixed(2);
  const avgStride = (mockRunData.reduce((acc, d) => acc + d.stride_length, 0) / mockRunData.length).toFixed(2);

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Average Speed" value={`${avgSpeed} m/s`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Across your session" />
          <StatCard title="Total Steps" value={latestData.step_count.toString()} icon={<Footprints className="h-5 w-5 text-muted-foreground" />} description="+23 from last run" />
          <StatCard title="Average Stride" value={`${avgStride} m`} icon={<Gauge className="h-5 w-5 text-muted-foreground" />} description="Consistent performance" />
          <StatCard title="Posture Score" value={latestData.posture_error.toFixed(1)} icon={<Activity className="h-5 w-5 text-muted-foreground" />} description="Lower is better" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpeedChart />
          </div>
          <PostureIndicator value={latestData.posture_error} />
        </div>
      </div>
    </AppLayout>
  );
}

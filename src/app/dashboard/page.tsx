// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import { Activity, Footprints, Gauge, TrendingUp, Map as MapIcon, BarChart3 } from "lucide-react";
import { useRunData } from "@/context/run-data-context";
import { processIMUData } from "@/lib/imu-processor";
import type { StepMetrics } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { LatLngExpression } from "leaflet";
import 'leaflet/dist/leaflet.css';


const RunMap = dynamic(() => import('@/components/results/run-map'), { ssr: false });

const speedChartConfig = {
  speed: {
    label: "Speed (m/s)",
    color: "hsl(var(--primary))",
  },
};

const cadenceChartConfig = {
    cadence: {
      label: "Cadence (spm)",
      color: "hsl(var(--accent))",
    },
};


export default function DashboardPage() {
  const { runData: rawData, isLoading: isRunDataLoading } = useRunData();
  const [analysisResults, setAnalysisResults] = useState<StepMetrics[] | null>(null);
  
  useEffect(() => {
    if (isRunDataLoading) return;

    if (rawData && rawData.length > 0) {
      try {
        const results = processIMUData(rawData);
        setAnalysisResults(results);
      } catch (error: any) {
        console.error("Failed to process run data for dashboard:", error);
        setAnalysisResults(null);
      }
    } else {
      setAnalysisResults(null);
    }
  }, [rawData, isRunDataLoading]);

  const isLoading = useMemo(() => isRunDataLoading || (rawData && rawData.length > 0 && !analysisResults), [isRunDataLoading, rawData, analysisResults]);

  const stats = useMemo(() => {
    if (!analysisResults || analysisResults.length === 0) {
      return {
        avgSpeed: "0.00",
        totalSteps: "0",
        avgStride: "0.00",
        avgContactTime: "0.000",
        path: [],
        center: [45.4642, 9.1900] as LatLngExpression,
      };
    }
    const avgSpeed = (analysisResults.reduce((acc, d) => acc + d.vi, 0) / analysisResults.length).toFixed(2);
    const totalSteps = analysisResults.length.toString();
    const avgStride = (analysisResults.reduce((acc, d) => acc + d.Li, 0) / analysisResults.length).toFixed(2);
    const avgContactTime = (analysisResults.reduce((acc, d) => acc + d.CT, 0) / analysisResults.length).toFixed(3);
    
    const validPositions = rawData?.filter(d => d.position).map(d => [d.position!.lat, d.position!.lng]) as LatLngExpression[] || [];
    const center = validPositions.length > 0 ? validPositions[Math.floor(validPositions.length / 2)] : [45.4642, 9.1900] as LatLngExpression;

    return {
      avgSpeed,
      totalSteps,
      avgStride,
      avgContactTime,
      path: validPositions,
      center,
    };
  }, [analysisResults, rawData]);

  if (isLoading) {
    return (
        <AppLayout>
            <div className="space-y-8">
                <Skeleton className="h-10 w-64"/>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32"/>
                    <Skeleton className="h-32"/>
                    <Skeleton className="h-32"/>
                    <Skeleton className="h-32"/>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-80"/>
                    <Skeleton className="h-80"/>
                </div>
            </div>
        </AppLayout>
    )
  }

  if (!analysisResults || analysisResults.length === 0) {
    return (
      <AppLayout>
         <h1 className="text-3xl font-bold font-headline tracking-wide">Dashboard</h1>
        <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertTitle>No Run Data Available</AlertTitle>
            <AlertDescription>
                To see your personalized dashboard, please upload a run session on the <a href="/connect" className="font-bold underline">Connect</a> page.
            </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline tracking-wide">My Last Run</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Average Speed" value={`${stats.avgSpeed} m/s`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Across your session" />
          <StatCard title="Total Steps" value={stats.totalSteps} icon={<Footprints className="h-5 w-5 text-muted-foreground" />} description="From your session" />
          <StatCard title="Average Stride" value={`${stats.avgStride} m`} icon={<Gauge className="h-5 w-5 text-muted-foreground" />} description="Your average step length" />
          <StatCard title="Avg. Contact Time" value={`${stats.avgContactTime} s`} icon={<Activity className="h-5 w-5 text-muted-foreground" />} description="Ground contact efficiency" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="text-primary"/>
                        Speed Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={speedChartConfig} className="h-[250px] w-full">
                        <AreaChart accessibilityLayer data={analysisResults} margin={{ left: 0, right: 20, top: 5, bottom: 5}}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}`} name="Step" />
                            <YAxis type="number" domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={(value) => `${value}`} unit=" m/s" />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                             <defs>
                                <linearGradient id="fillSpeed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-speed)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-speed)" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <Area dataKey="vi" type="natural" fill="url(#fillSpeed)" stroke="var(--color-speed)" name="Speed" unit=" m/s" />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="text-primary"/>
                        Cadence Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={cadenceChartConfig} className="h-[250px] w-full">
                        <AreaChart accessibilityLayer data={analysisResults} margin={{ left: 0, right: 20, top: 5, bottom: 5}}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}`} name="Step" />
                            <YAxis type="number" domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={(value) => `${value}`} unit=" spm"/>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                             <defs>
                                <linearGradient id="fillCadence" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-cadence)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-cadence)" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <Area dataKey="cadencePmin" type="natural" fill="url(#fillCadence)" stroke="var(--color-cadence)" name="Cadence" unit=" spm"/>
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        {stats.path.length > 0 && (
             <RunMap
                center={stats.center}
                path={stats.path}
                startPoint={stats.path[0]}
                endPoint={stats.path[stats.path.length - 1]}
                mapKey={rawData?.[0]?.timestamp}
             />
        )}
      </div>
    </AppLayout>
  );
}

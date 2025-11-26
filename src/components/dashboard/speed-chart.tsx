"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RunData } from "@/lib/types";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const chartConfig = {
    speed: {
        label: "Speed (m/s)",
        color: "hsl(var(--primary))",
    },
};

export default function SpeedChart({ data }: { data: RunData[] }) {
    const chartData = data.map(d => ({
        ...d,
        time: format(new Date(d.timestamp), "HH:mm:ss")
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Speed Over Time</CardTitle>
                <CardDescription>Visual representation of your speed during the run.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                         <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8}
                            tickFormatter={(value) => `${value}`}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        />
                         <defs>
                            <linearGradient id="fillSpeed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-speed)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-speed)" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" labelKey="time" />}
                        />
                        <Area
                            dataKey="speed"
                            type="natural"
                            fill="url(#fillSpeed)"
                            stroke="var(--color-speed)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

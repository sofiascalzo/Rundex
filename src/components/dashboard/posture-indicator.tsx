"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PostureIndicator({ value }: { value: number }) {
  // Assuming value is error from 0 to 10.
  const percentage = (value / 10) * 100;
  
  // Hue from 120 (green) to 0 (red)
  const hue = Math.max(0, 120 - (percentage * 1.2));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posture Quality</CardTitle>
        <CardDescription>Real-time analysis of your running form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <ProgressPrimitive.Root
            className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"
            value={100 - percentage}
        >
            <ProgressPrimitive.Indicator
                className="h-full w-full flex-1 transition-all"
                style={{ 
                    transform: `translateX(-${percentage}%)`,
                    backgroundColor: `hsl(${hue}, 80%, 50%)`
                }}
            />
        </ProgressPrimitive.Root>
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>High Risk</span>
          <span>Low Risk</span>
        </div>
        <p className="text-center text-3xl font-bold text-primary">{value}<span className="text-lg text-muted-foreground">/10 error score</span></p>
      </CardContent>
    </Card>
  );
}

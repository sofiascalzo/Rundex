"use client";

import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { mockRunData } from "@/lib/mock-data";
import { Skeleton } from "../ui/skeleton";

const formSchema = z.object({
  environmentalConditions: z.string().min(10, {
    message: "Please describe the conditions in more detail.",
  }),
});

export default function PerformancePrediction() {
  const [prediction, setPrediction] = useState<PerformancePredictionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      environmentalConditions: "Slightly windy, 15°C, flat asphalt road.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPrediction(null);
    try {
      const pastRunningData = JSON.stringify(mockRunData);
      const result = await performancePredictions({
        pastRunningData,
        environmentalConditions: values.environmentalConditions,
      });
      setPrediction(result);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            AI Performance Prediction
        </CardTitle>
        <CardDescription>
          Get AI-powered insights for your next run. Describe the environmental conditions and get your prediction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="environmentalConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environmental Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Sunny, 25°C, hilly terrain, trail path"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="font-semibold">
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : "Generate Prediction"}
            </Button>
          </form>
        </Form>
        {isLoading && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {prediction && (
          <div className="pt-6 grid gap-6 sm:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estimated Finish Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary font-bold text-3xl">{prediction.estimatedFinishTime}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optimal Pacing Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{prediction.optimalPacingStrategy}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-400">{prediction.riskAssessment}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

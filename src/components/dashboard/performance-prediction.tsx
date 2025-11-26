"use client";

import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2, Bot } from "lucide-react";
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
      // In a real implementation, this would call a Cloud Function
      // which then uses Genkit, calls the avatar API, and saves to Firestore.
      // For now, we'll just call the Genkit flow directly.
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
            <Bot className="text-primary" />
            AI Coach Feedback
        </CardTitle>
        <CardDescription>
          Describe the environmental conditions for your run to receive personalized feedback and predictions from your AI coach.
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
              {isLoading ? "Generating insights and preparing avatar..." : "Get Coach Feedback"}
            </Button>
          </form>
        </Form>
        {isLoading && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-16 w-full" />
            </div>
          </div>
        )}
        {prediction && (
          <div className="pt-6 grid gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-full sm:w-64 h-64 bg-card border rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <Bot size={48} className="mx-auto"/>
                        <p className="mt-2 text-sm">Avatar Player</p>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
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
                            <CardTitle className="text-lg">Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-amber-400">{prediction.riskAssessment}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coach's Advice: Optimal Pacing Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{prediction.optimalPacingStrategy}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

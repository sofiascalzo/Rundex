"use client";

import { performancePredictions, PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2, Bot, Target, CheckCircle, BarChart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Skeleton } from "../ui/skeleton";
import type { StepMetrics } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

const formSchema = z.object({
  environmentalConditions: z.string().min(10, {
    message: "Please describe the conditions in more detail.",
  }),
});

interface PerformancePredictionProps {
  runAnalysis: StepMetrics[];
}

export default function PerformancePrediction({ runAnalysis }: PerformancePredictionProps) {
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
      const runAnalysisResults = JSON.stringify(runAnalysis);
      const result = await performancePredictions({
        runAnalysisResults,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Coaching Report</CardTitle>
          <CardDescription>
            Describe the environmental conditions for your run to receive a personalized coaching report based on your session data.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {isLoading ? "Analyzing your run..." : "Get Coach Feedback"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {prediction && (
        <div className="pt-6 space-y-4">
            <h2 className="text-2xl font-headline font-bold">Your Coaching Report</h2>
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <BarChart className="text-primary"/>
                    <span className="font-semibold">Training Analysis</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2">
                  {prediction.trainingTypeAnalysis}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-primary"/>
                        <span className="font-semibold">Performance Summary</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2">
                  {prediction.performanceSummary}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <Target className="text-primary"/>
                        <span className="font-semibold">Gait & Technique Analysis</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 whitespace-pre-line">
                  {prediction.gaitAnalysis}
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="item-4">
                <AccordionTrigger>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-accent"/>
                        <span className="font-semibold">Coach's Suggestions</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="text-accent-foreground bg-accent/20 rounded-md p-4 text-base whitespace-pre-line">
                  {prediction.improvementSuggestions}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>
      )}
    </div>
  );
}

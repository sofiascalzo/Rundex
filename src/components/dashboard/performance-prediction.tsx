
"use client";

import type { PerformancePredictionsOutput } from "@/ai/flows/performance-predictions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Skeleton } from "../ui/skeleton";
import { BarChart, CheckCircle, Target, TrendingUp } from "lucide-react";

interface PerformancePredictionProps {
  prediction: PerformancePredictionsOutput | null;
  isLoading: boolean;
}

export default function PerformancePrediction({ prediction, isLoading }: PerformancePredictionProps) {

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!prediction) {
    return (
        <div className="text-muted-foreground p-4 border rounded-lg text-center">
            <p>Could not generate a coaching report for this session.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
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
  );
}

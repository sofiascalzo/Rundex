// src/app/coach/page.tsx
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import PerformancePrediction from "@/components/dashboard/performance-prediction";
import { useToast } from "@/hooks/use-toast";
import type { StepMetrics } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachPage() {
  const { toast } = useToast();
  const [runAnalysis, setRunAnalysis] = useState<StepMetrics[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Rundex - AI Coach";
    try {
      const storedData = sessionStorage.getItem("uploadedRunData");
      if (storedData) {
        const stepMetrics: StepMetrics[] = JSON.parse(storedData);
        setRunAnalysis(stepMetrics);
      }
    } catch (error) {
      console.error("Failed to process run data from session storage:", error);
      toast({
        title: "Analysis Error",
        description: "Could not load the run data for the AI coach.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">
          AI Coach
        </h1>
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : runAnalysis && runAnalysis.length > 0 ? (
          <>
            <p className="text-muted-foreground max-w-2xl">
              Ottieni un'analisi dettagliata e consigli personalizzati sulla tua
              ultima sessione di corsa.
            </p>
            <PerformancePrediction runAnalysis={runAnalysis} />
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nessun dato da analizzare</AlertTitle>
            <AlertDescription>
              Per usare l'AI Coach, devi prima caricare una sessione di corsa
              dalla pagina{" "}
              <a href="/connect" className="font-bold underline">
                Connect
              </a>
              . L'analisi si baserà sui dati di quella sessione.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}

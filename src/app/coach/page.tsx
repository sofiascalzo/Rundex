import AppLayout from "@/components/app-layout";
import PerformancePrediction from "@/components/dashboard/performance-prediction";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rundex - AI Coach",
};

export default function CoachPage() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold font-headline tracking-wide">AI Coach</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Get AI-powered insights and predictions for your next run. Describe the environmental conditions to get started.
                </p>
                <PerformancePrediction />
            </div>
        </AppLayout>
    );
}

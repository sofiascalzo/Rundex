// src/ai/flows/performance-predictions.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating running coaching analysis
 *   based on step-by-step metrics from a user's run session.
 *
 * - `performancePredictions` - The main function that triggers the flow.
 * - `PerformancePredictionsInput` - The input type for the `performancePredictions` function.
 * - `PerformancePredictionsOutput` - The output type for the `performancePredictions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformancePredictionsInputSchema = z.object({
  runAnalysisResults: z.string().describe('A JSON array of step-by-step metrics from the run analysis. Includes cadence, contact time, flight time, pitch, and roll.'),
  environmentalConditions: z.string().optional().describe('A description of environmental conditions, such as weather, temperature, and terrain.'),
});
export type PerformancePredictionsInput = z.infer<typeof PerformancePredictionsInputSchema>;

const PerformancePredictionsOutputSchema = z.object({
  trainingTypeAnalysis: z.string().describe("An analysis of the type of training performed (e.g., Interval Training, Long Slow Distance, Tempo Run) based on the data patterns."),
  performanceSummary: z.string().describe("A summary of the key performance metrics like average cadence, speed, and step length."),
  gaitAnalysis: z.string().describe("An analysis of the runner's gait, focusing on foot placement (using pitch/roll data), contact time, and identifying potential errors or areas for improvement."),
  improvementSuggestions: z.string().describe("Concrete, actionable suggestions for improvement based on the analysis, like a real personal trainer would provide."),
});
export type PerformancePredictionsOutput = z.infer<typeof PerformancePredictionsOutputSchema>;

export async function performancePredictions(input: PerformancePredictionsInput): Promise<PerformancePredictionsOutput> {
  return performancePredictionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performancePredictionsPrompt',
  input: {schema: PerformancePredictionsInputSchema},
  output: {schema: PerformancePredictionsOutputSchema},
  prompt: `You are an expert running coach and personal trainer. Your task is to analyze a runner's performance based on detailed, step-by-step metrics from their session.

Analyze the provided data to give a comprehensive coaching report.

**Input Data:**
- **Run Analysis Results:** A JSON object containing metrics for each step. Key metrics include:
  - \`CT\`: Contact Time (lower is often better)
  - \`FT\`: Flight Time (higher indicates more power)
  - \`cadencePmin\`: Steps per minute
  - \`vi\`: Step speed (m/s)
  - \`pitchDeg\`, \`rollDeg\`: Angles at foot strike, indicating foot placement. High negative pitch can suggest overstriding/heel-striking. High roll can suggest foot instability.
- **Environmental Conditions:** A description of the running environment.

**Your Analysis Must Include:**

1.  **Training Type Analysis**: Based on the patterns in speed (\`vi\`) and cadence (\`cadencePmin\`), determine the type of workout. For example, large, repeated fluctuations in speed suggest interval training. Consistent high speed suggests a tempo run. Consistent low speed suggests a recovery or long-slow-distance run.

2.  **Performance Summary**: Briefly summarize the key performance achievements of the session. Mention average cadence and speed.

3.  **Gait Analysis (Foot Placement and Efficiency)**: This is the most important part.
    - Analyze the \`pitchDeg\` and \`rollDeg\` values. Are they consistent? Do they suggest a specific foot strike pattern (e.g., heel-striking, overpronation)?
    - Analyze the Contact Time (\`CT\`). Is it low and efficient?
    - Analyze speed fluctuations (\`vi\`). Are they controlled or erratic? Identify any sudden drops or spikes that don't seem related to intentional interval training.
    - Conclude with a summary of the runner's form strengths and weaknesses.

4.  **Actionable Improvement Suggestions**: Provide 2-3 concrete, actionable tips for the runner to improve based on your gait analysis. For example, if you detect overstriding, suggest drills to increase cadence. If you see instability (high roll), suggest strength exercises. Be specific and encouraging, like a real coach.

---
**DATA TO ANALYZE:**

**Run Analysis Results:**
\`\`\`json
{{{runAnalysisResults}}}
\`\`\`

**Environmental Conditions:** {{environmentalConditions}}
---
`,
});

const performancePredictionsFlow = ai.defineFlow(
  {
    name: 'performancePredictionsFlow',
    inputSchema: PerformancePredictionsInputSchema,
    outputSchema: PerformancePredictionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

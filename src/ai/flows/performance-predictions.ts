// src/ai/flows/performance-predictions.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating performance predictions
 *   for runners based on their data, including estimated finish times and optimal
 *   pacing strategies.
 *
 * - `performancePredictions` - The main function that triggers the flow.
 * - `PerformancePredictionsInput` - The input type for the `performancePredictions` function.
 * - `PerformancePredictionsOutput` - The output type for the `performancePredictions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformancePredictionsInputSchema = z.object({
  pastRunningData: z.string().describe('A JSON array of past running data, including timestamp, speed, stride length, and posture error.'),
  environmentalConditions: z.string().optional().describe('A description of environmental conditions, such as weather, temperature, and terrain.'),
});
export type PerformancePredictionsInput = z.infer<typeof PerformancePredictionsInputSchema>;

const PerformancePredictionsOutputSchema = z.object({
  estimatedFinishTime: z.string().describe('The estimated finish time for a specified distance.'),
  optimalPacingStrategy: z.string().describe('The optimal pacing strategy based on the running data and environmental conditions.'),
  riskAssessment: z.string().describe('An assessment of potential risks based on the running data and environmental conditions.'),
});
export type PerformancePredictionsOutput = z.infer<typeof PerformancePredictionsOutputSchema>;

export async function performancePredictions(input: PerformancePredictionsInput): Promise<PerformancePredictionsOutput> {
  return performancePredictionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performancePredictionsPrompt',
  input: {schema: PerformancePredictionsInputSchema},
  output: {schema: PerformancePredictionsOutputSchema},
  prompt: `You are an expert running coach providing performance predictions for runners.

  Based on the runner's past running data and environmental conditions, provide the following:

  1.  Estimated finish time for a specified distance.
  2.  Optimal pacing strategy.
  3.  Any potential risks given the running data and environmental conditions.

  Past Running Data: {{{pastRunningData}}}
  Environmental Conditions: {{{environmentalConditions}}}
  \n`,
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

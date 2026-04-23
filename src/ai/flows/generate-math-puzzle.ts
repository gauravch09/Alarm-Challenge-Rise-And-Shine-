'use server';
/**
 * @fileOverview A Genkit flow for generating unique math problems in mathematical notation.
 *
 * - generateMathPuzzle - A function that handles the generation of a math problem.
 * - GenerateMathPuzzleInput - The input type for the generateMathPuzzle function.
 * - GenerateMathPuzzleOutput - The return type for the generateMathPuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMathPuzzleInputSchema = z.object({
  difficulty: z.string().optional().describe('Difficulty level: "easy", "medium", or "hard".')
});
export type GenerateMathPuzzleInput = z.infer<typeof GenerateMathPuzzleInputSchema>;

const GenerateMathPuzzleOutputSchema = z.object({
  question: z.string().describe('The math problem in mathematical notation, e.g., "23 * 7".'),
  answer: z.number().describe('The numerical solution to the math problem.')
});
export type GenerateMathPuzzleOutput = z.infer<typeof GenerateMathPuzzleOutputSchema>;

export async function generateMathPuzzle(input: GenerateMathPuzzleInput): Promise<GenerateMathPuzzleOutput> {
  return generateMathPuzzleFlow(input);
}

const mathPuzzlePrompt = ai.definePrompt({
  name: 'mathPuzzlePrompt',
  input: {schema: GenerateMathPuzzleInputSchema},
  output: {schema: GenerateMathPuzzleOutputSchema},
  prompt: `Generate a unique, single-step or multi-step mental math problem.
  
  CRITICAL: Provide the question ONLY in mathematical notation (e.g., "24 + 15", "7 * 8", "(5 * 6) + 12"). Do NOT use any words.

  Difficulty Guidelines:
  - easy: Basic addition/subtraction of two-digit numbers (e.g., 24 + 15).
  - medium: Simple multiplication (up to 12x12) or three-number addition (e.g., 7 * 8 or 12 + 5 + 8).
  - hard: Multiplication of a 2-digit by a 1-digit number, or multi-step PEMDAS (e.g., 14 * 4 or (5 * 6) + 12).

  Current Difficulty: {{#if difficulty}}{{{difficulty}}}{{else}}medium{{/if}}

  Provide the symbolic question and the exact numerical answer.`
});

const generateMathPuzzleFlow = ai.defineFlow(
  {
    name: 'generateMathPuzzleFlow',
    inputSchema: GenerateMathPuzzleInputSchema,
    outputSchema: GenerateMathPuzzleOutputSchema,
  },
  async (input) => {
    const {output} = await mathPuzzlePrompt(input);
    if (!output) {
      throw new Error('Failed to generate math puzzle.');
    }
    return output;
  }
);

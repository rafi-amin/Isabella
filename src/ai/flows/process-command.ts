// This file is machine-generated - DO NOT EDIT.

'use server';

/**
 * @fileOverview Processes spoken commands using natural language processing to understand user requests and trigger appropriate actions or provide information.
 *
 * - processSpokenCommand - A function that handles the processing of spoken commands.
 * - ProcessSpokenCommandInput - The input type for the processSpokenCommand function.
 * - ProcessSpokenCommandOutput - The return type for the processSpokenCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessSpokenCommandInputSchema = z.object({
  spokenCommand: z.string().describe('The spoken command from the user, transcribed to text.'),
});
export type ProcessSpokenCommandInput = z.infer<typeof ProcessSpokenCommandInputSchema>;

const ProcessSpokenCommandOutputSchema = z.object({
  action: z.string().describe('The action to take based on the spoken command.'),
  response: z.string().describe('The response to speak back to the user.'),
});
export type ProcessSpokenCommandOutput = z.infer<typeof ProcessSpokenCommandOutputSchema>;

export async function processSpokenCommand(input: ProcessSpokenCommandInput): Promise<ProcessSpokenCommandOutput> {
  return processSpokenCommandFlow(input);
}

const processSpokenCommandPrompt = ai.definePrompt({
  name: 'processSpokenCommandPrompt',
  input: {schema: ProcessSpokenCommandInputSchema},
  output: {schema: ProcessSpokenCommandOutputSchema},
  prompt: `You are Isabella, a helpful AI assistant. A user has given you the following spoken command:

{{spokenCommand}}

Determine the appropriate action to take and generate a response to the user.
Consider if you can or should satisfy the request or re-prompt for more information. If you can not complete the request, use the action property to signal the error to the client.
`,
});

const processSpokenCommandFlow = ai.defineFlow(
  {
    name: 'processSpokenCommandFlow',
    inputSchema: ProcessSpokenCommandInputSchema,
    outputSchema: ProcessSpokenCommandOutputSchema,
  },
  async input => {
    const {output} = await processSpokenCommandPrompt(input);
    return output!;
  }
);

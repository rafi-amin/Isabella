'use server';
/**
 * @fileOverview Converts speech audio data into text.
 *
 * - transcribeSpeech - A function that transcribes speech to text.
 * - TranscribeSpeechInput - The input type for the transcribeSpeech function.
 * - TranscribeSpeechOutput - The return type for the transcribeSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeSpeechInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeSpeechInput = z.infer<typeof TranscribeSpeechInputSchema>;

const TranscribeSpeechOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio data.'),
});
export type TranscribeSpeechOutput = z.infer<typeof TranscribeSpeechOutputSchema>;

export async function transcribeSpeech(input: TranscribeSpeechInput): Promise<TranscribeSpeechOutput> {
  return transcribeSpeechFlow(input);
}

const transcribeSpeechPrompt = ai.definePrompt({
  name: 'transcribeSpeechPrompt',
  input: {schema: TranscribeSpeechInputSchema},
  output: {schema: TranscribeSpeechOutputSchema},
  prompt: `Transcribe the following audio data to text.\n\nAudio: {{media url=audioDataUri}}`,
});

const transcribeSpeechFlow = ai.defineFlow(
  {
    name: 'transcribeSpeechFlow',
    inputSchema: TranscribeSpeechInputSchema,
    outputSchema: TranscribeSpeechOutputSchema,
  },
  async input => {
    const {output} = await transcribeSpeechPrompt(input);
    return output!;
  }
);

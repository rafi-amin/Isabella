import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-speech.ts';
import '@/ai/flows/process-command.ts';
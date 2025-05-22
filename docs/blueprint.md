# **App Name**: Isabella AI Assistant

## Core Features:

- Voice Input: Voice Command Recognition: Transcribe speech into text commands. Training a wake-word detection model (e.g., with Snowboy, Porcupine, or custom ML) with audio recordings of people saying “Hey Isabella”, including background noise and other similar phrases to reduce false positives.
- AI Command Processor: AI Command Execution: Process user commands using a natural language model to trigger appropriate actions or provide information. The LLM should decide, based on the input, whether it can or should satisfy the request or re-prompt for more information; consider implementing a tool for error detection and graceful exit, rather than hallucinating an answer. Text is converted from speech. Sample user commands/intents like: “Set an alarm for 7 AM.” “What’s the weather today?” “Play music.” Tool Examples: Rasa NLU, Dialogflow, or custom GPT-4 prompts.
- Voice Output: Text-to-Speech Output: Provide spoken responses and information to the user using the response text you want her to say, like: “Your alarm is set for 7 AM.” Tool Examples: ElevenLabs, Amazon Polly, Google TTS.
- Scheduling: Task Scheduling: Allow users to schedule reminders and tasks via voice commands.
- Info Lookup: Basic Information Retrieval: Answer simple questions about time, weather, and general knowledge.

## Style Guidelines:

- Primary color: A calm and intelligent light blue (#79BAF2), reflecting trustworthiness and clarity, inspired by the assistant's helpful role.
- Background color: A very light, almost white blue (#F0F8FF), ensuring a clean and unobtrusive backdrop for information display.
- Accent color: A soft, complementary lavender (#A98DFF) for interactive elements, adding a touch of sophistication without being overwhelming.
- Clean and modern typography for easy readability.
- Simple, clear icons that represent different commands and functions.
- Gentle animations to indicate processing and response, providing feedback without distraction.
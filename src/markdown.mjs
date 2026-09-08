import fs from "fs";
import path from "path";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const filename = process.argv[2];

if (!filename) {
  console.error("Please provide a transcript JSON filename.");
  process.exit(1);
}

const name = path.parse(filename).name;

const inputPath = `./transcripts/${filename}`;
const outputPath = `./markdowns/${name}.md`;

// Read transcript JSON
const transcript = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

// Native display labels
const languageLabels = {
  japanese: "日本語",
  korean: "한국어",
  chinese: "中文",
  cantonese: "粵語",
  french: "Français",
  spanish: "Español",
  german: "Deutsch",
  italian: "Italiano",
  portuguese: "Português",
};

// Fallback if language isn't in the map
const detectedLanguage = transcript.language.toLowerCase();

const language =
  languageLabels[detectedLanguage] ??
  transcript.language.charAt(0).toUpperCase() +
    transcript.language.slice(1);

// Convert seconds → MM:SS
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Prepare cleaner segment data for the model
const segments = transcript.segments.map((segment) => ({
  timestamp: formatTimestamp(segment.start),
  start: segment.start,
  end: segment.end,
  text: segment.text,
}));

const response = await openai.responses.create({
  model: "gpt-5.6",

  input: `
You are creating bilingual Obsidian notes from a lesson recording.

The detected source language is: ${transcript.language}
Use this display label for the source language: ${language}

The lesson itself can be about ANY subject.
This is NOT a language-learning exercise.

Your job is to:
1. Preserve the meaning of the lesson accurately.
2. Translate the source language directly and naturally into English.
3. Preserve useful timestamps.
4. Turn the lesson into clear, useful notes.

IMPORTANT:
- Do not add vocabulary sections.
- Do not explain grammar.
- Do not teach the source language.
- Do not invent information.
- Do not add facts that are not supported by the transcript.
- Keep the English translation faithful to the original.
- You may lightly clean obvious transcription spacing or punctuation.
- Transcription segments may split sentences unnaturally.
- Merge adjacent segments when they clearly belong to the same sentence or idea.
- When merging segments, use the timestamp of the first segment.
- Do not merge unrelated ideas just to make sections longer.

Create Markdown using this structure:

# [Create a concise title based on the lesson]

## Summary

Write a short English summary of the lesson.

## Key Takeaways

Use bullet points for the most important concepts or lessons.

## Transcript

For each meaningful section:

### [MM:SS]

**${language}**

Original transcript text.

**English**

Direct English translation.

Continue for the full transcript.

## Notes

Use this section to restructure the lesson into useful concepts.

Do NOT simply repeat the Summary or Key Takeaways.

Focus on things such as:
- frameworks or processes
- relationships between ideas
- cause-and-effect reasoning
- principles behind the speaker's advice
- practical applications
- grouped concepts
- useful mental models
- incomplete ideas or topics that continue beyond the recording

When helpful, use short bold labels such as:

- **Principle:** ...
- **Process:** ...
- **Application:** ...
- **Connection:** ...
- **Next topic:** ...

Only include notes supported by the transcript.

Output Markdown only.

Transcript metadata:

Language: ${transcript.language}
Duration: ${transcript.duration} seconds

Timestamped segments:

${JSON.stringify(segments, null, 2)}
`,
});

fs.writeFileSync(
  outputPath,
  response.output_text,
  "utf8"
);

console.log(`✓ Markdown saved to ${outputPath}`);
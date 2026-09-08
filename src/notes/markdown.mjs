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

// ─────────────────────────────────────
// Paths
// ─────────────────────────────────────

const name = path.parse(filename).name;

const inputPath = `./transcripts/${filename}`;
const outputDir = "./markdowns";
const outputPath = `${outputDir}/${name}.md`;

fs.mkdirSync(outputDir, {
  recursive: true,
});

// ─────────────────────────────────────
// Read transcript
// ─────────────────────────────────────

const transcript = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

// ─────────────────────────────────────
// Language
// ─────────────────────────────────────

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

const detectedLanguage =
  transcript.language.toLowerCase();

const language =
  languageLabels[detectedLanguage] ??
  transcript.language.charAt(0).toUpperCase() +
    transcript.language.slice(1);

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ─────────────────────────────────────
// Prepare transcript segments
// ─────────────────────────────────────

const segments = transcript.segments.map((segment) => ({
  start: segment.start,
  end: segment.end,
  timestamp: formatTimestamp(segment.start),
  text: segment.text,
}));

// ─────────────────────────────────────
// Generate Notes
// ─────────────────────────────────────

console.log("→ Creating notes...");

const response = await openai.responses.create({
  model: "gpt-5.6",

  input: `
You are creating bilingual Obsidian notes from a lesson recording.

The detected source language is:
${transcript.language}

Use this display label for the source language:
${language}

The lesson itself can be about ANY subject.

This is NOT a language-learning exercise.

Your goal is to create clear, useful lesson notes while preserving the meaning of the original recording.

--------------------------------

CORE RESPONSIBILITIES

1. Preserve the meaning of the lesson accurately.

2. Translate the source language directly and naturally into English.

3. Preserve useful timestamps.

4. Turn the lesson into clear, structured notes.

5. Keep the notes faithful to the recording.

--------------------------------

TRANSCRIPT GROUPING

Whisper transcript segments may split sentences unnaturally.

- Do NOT treat segment boundaries as sentence boundaries.
- Merge adjacent segments when they clearly belong to the same sentence, thought, or explanation.
- Do not merge unrelated ideas.
- When merging segments, use the timestamp of the first segment.
- Preserve unfinished material when the recording ends mid-sentence.
- Do not invent missing words or endings.

--------------------------------

SOURCE TEXT

You may lightly normalize the source transcript for readability.

You may:
- fix obvious spacing
- add natural punctuation
- normalize obvious transcription formatting

Do NOT:
- rewrite the speaker unnecessarily
- change the speaker's meaning
- invent missing content
- complete unfinished speech

--------------------------------

TRANSLATION

The English translation should:

- preserve the speaker's intended meaning
- sound natural in English
- remain faithful to the original
- preserve uncertainty when the source is unclear
- not add explanations that are absent from the recording

--------------------------------

NOT LANGUAGE LEARNING

Do NOT:

- add vocabulary sections
- explain grammar
- teach pronunciation
- add romanization
- teach the source language
- turn the transcript into a language-learning exercise

Study material is handled separately by Gloss Study.

--------------------------------

MARKDOWN STRUCTURE

Create Markdown using this structure:

# [Concise lesson title]

## Summary

Write a short English summary of the lesson.

The summary should explain the overall subject and direction of the recording without unnecessary detail.

## Key Takeaways

Use bullet points for the most important concepts, principles, or lessons.

Do not simply repeat the Summary.

## Transcript

For each meaningful passage:

### [MM:SS]

**${language}**

Source-language transcript.

**English**

Direct English translation.

Continue until the full recording has been covered.

## Notes

Restructure the lesson into useful conceptual notes.

Do NOT simply repeat the Summary, Key Takeaways, or Transcript.

Extract useful structure from the speaker's ideas.

Focus on things such as:

- frameworks
- processes
- relationships between ideas
- cause-and-effect reasoning
- principles behind the speaker's advice
- practical applications
- grouped concepts
- useful mental models
- sequences or numbered points
- unfinished ideas or topics that continue beyond the recording

When useful, use concise labels such as:

- **Principle:** ...
- **Process:** ...
- **Application:** ...
- **Connection:** ...
- **Example:** ...
- **Next topic:** ...

Only include notes supported by the recording.

--------------------------------

IMPORTANT

- Do not invent information.
- Do not add facts unsupported by the transcript.
- Do not complete unfinished speech.
- Preserve ambiguity where necessary.
- Keep the English translation faithful.
- Keep the Notes section useful rather than repetitive.
- Output Markdown only.
- Do not wrap the Markdown in code fences.

--------------------------------

TRANSCRIPT METADATA

Language:
${transcript.language}

Duration:
${transcript.duration} seconds

Timestamped transcript segments:

${JSON.stringify(segments, null, 2)}
`,
});

// ─────────────────────────────────────
// Save Markdown
// ─────────────────────────────────────

fs.writeFileSync(
  outputPath,
  response.output_text,
  "utf8"
);

console.log(`✓ Markdown saved to ${outputPath}`);
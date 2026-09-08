import fs from "fs";
import path from "path";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get filename from terminal
const filename = process.argv[2];

if (!filename) {
  console.error("Please provide a WAV file.");
  process.exit(1);
}

// Get filename without extension
const name = path.parse(filename).name;

// Paths
const inputPath = `./audio/${filename}`;
const txtPath = `./transcripts/${name}.txt`;
const jsonPath = `./transcripts/${name}.json`;

// Transcribe audio with timestamps
// Language is automatically detected
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(inputPath),
  model: "whisper-1",
  response_format: "verbose_json",
  timestamp_granularities: ["segment"],
});

// Save plain original-language transcript
fs.writeFileSync(
  txtPath,
  transcription.text,
  "utf8"
);

// Keep only the transcription data Gloss needs
const cleanTranscript = {
  language: transcription.language,
  duration: transcription.duration,
  text: transcription.text,
  segments: transcription.segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
  })),
};

// Save clean timestamped JSON
fs.writeFileSync(
  jsonPath,
  JSON.stringify(cleanTranscript, null, 2),
  "utf8"
);

console.log(`✓ Language detected: ${transcription.language}`);
console.log(`✓ Transcript saved to ${txtPath}`);
console.log(`✓ Timestamp data saved to ${jsonPath}`);
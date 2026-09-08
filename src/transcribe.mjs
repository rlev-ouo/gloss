import fs from "fs";
import path from "path";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const filename = process.argv[2];

if (!filename) {
  console.error("Please provide a WAV file.");
  process.exit(1);
}

// ─────────────────────────────────────
// Paths
// ─────────────────────────────────────

const name = path.parse(filename).name;

const inputPath = `./audio/${filename}`;

const outputDir = "./transcripts";
const txtPath = `${outputDir}/${name}.txt`;
const jsonPath = `${outputDir}/${name}.json`;

fs.mkdirSync(outputDir, {
  recursive: true,
});

// ─────────────────────────────────────
// Transcribe
// ─────────────────────────────────────

console.log("→ Transcribing audio...");

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(inputPath),

  model: "whisper-1",

  response_format: "verbose_json",

  timestamp_granularities: [
    "segment",
  ],
});

// ─────────────────────────────────────
// Normalize transcript data
// ─────────────────────────────────────

const cleanTranscript = {
  language: transcription.language,
  duration: transcription.duration,
  text: transcription.text,

  segments: transcription.segments.map(
    (segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
    })
  ),
};

// ─────────────────────────────────────
// Save transcript
// ─────────────────────────────────────

fs.writeFileSync(
  txtPath,
  transcription.text,
  "utf8"
);

fs.writeFileSync(
  jsonPath,
  JSON.stringify(cleanTranscript, null, 2),
  "utf8"
);

// ─────────────────────────────────────
// Complete
// ─────────────────────────────────────

console.log(
  `✓ Language detected: ${transcription.language}`
);

console.log(
  `✓ Transcript saved to ${txtPath}`
);

console.log(
  `✓ Timestamp data saved to ${jsonPath}`
);
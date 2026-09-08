import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide an input video file.");
  process.exit(1);
}

// ─────────────────────────────────────
// Paths
// ─────────────────────────────────────

const name = path.parse(inputFile).name;

const outputDir = "./audio";
const outputPath = `${outputDir}/${name}.wav`;

fs.mkdirSync(outputDir, {
  recursive: true,
});

// ─────────────────────────────────────
// Convert
// ─────────────────────────────────────

console.log("→ Converting video to audio...");

execFileSync(
  "ffmpeg",
  [
    "-i",
    inputFile,
    "-vn",
    "-acodec",
    "pcm_s16le",
    outputPath,
  ],
  {
    stdio: "inherit",
  }
);

// ─────────────────────────────────────
// Complete
// ─────────────────────────────────────

console.log(
  `✓ Audio saved to ${outputPath}`
);
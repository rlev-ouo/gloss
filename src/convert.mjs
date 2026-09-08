import { execFileSync } from "child_process";
import path from "path";

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide an input video file.");
  process.exit(1);
}

const name = path.parse(inputFile).name;
const outputFile = `./audio/${name}.wav`;

execFileSync("ffmpeg", [
  "-i",
  inputFile,
  "-vn",
  "-acodec",
  "pcm_s16le",
  outputFile,
], {
  stdio: "inherit",
});

console.log(`✓ WAV saved to ${outputFile}`);
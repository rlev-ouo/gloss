import { execFileSync } from "child_process";
import path from "path";

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide a recording file.");
  process.exit(1);
}

const name = path.parse(inputFile).name;

const wavFile = `${name}.wav`;
const jsonFile = `${name}.json`;

console.log("→ Converting video to audio...");

execFileSync(
  "node",
  ["src/convert.mjs", inputFile],
  {
    stdio: "inherit",
  }
);

console.log("→ Transcribing audio...");

execFileSync(
  "node",
  ["src/transcribe.mjs", wavFile],
  {
    stdio: "inherit",
  }
);

console.log("→ Generating bilingual notes...");

execFileSync(
  "node",
  ["src/markdown.mjs", jsonFile],
  {
    stdio: "inherit",
  }
);

console.log("");
console.log(`✓ Gloss complete`);
console.log(`✓ Markdown: ./markdowns/${name}.md`);
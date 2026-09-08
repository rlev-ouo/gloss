import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const inputFile = process.argv[2];
let mode = process.argv[3]?.toLowerCase();

if (!inputFile) {
  console.error("Please provide a recording file.");
  console.error("");
  console.error("Example:");
  console.error("node src/process.mjs recordings/lesson.mov");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Recording not found: ${inputFile}`);
  process.exit(1);
}

// ─────────────────────────────────────
// Paths
// ─────────────────────────────────────

const name = path.parse(inputFile).name;

const wavFile = `${name}.wav`;
const jsonFile = `${name}.json`;

const audioPath = `./audio/${wavFile}`;
const transcriptPath = `./transcripts/${jsonFile}`;

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function runNode(script, args = []) {
  execFileSync(
    "node",
    [script, ...args],
    {
      stdio: "inherit",
    }
  );
}

function isYes(answer) {
  return ["y", "yes"].includes(
    answer.trim().toLowerCase()
  );
}

// ─────────────────────────────────────
// Choose mode
// ─────────────────────────────────────

const validModes = [
  "notes",
  "study",
  "both",
];

const rl = readline.createInterface({
  input,
  output,
});

if (!mode) {
  console.log("");
  console.log("Gloss");
  console.log("");
  console.log("1. Notes");
  console.log("2. Study");
  console.log("3. Both");
  console.log("4. Exit");
  console.log("");

  const answer = await rl.question(
    "What would you like to create? "
  );

  const modes = {
    "1": "notes",
    notes: "notes",

    "2": "study",
    study: "study",

    "3": "both",
    both: "both",

    "4": "exit",
    exit: "exit",
  };

  mode = modes[answer.trim().toLowerCase()];
}

// ─────────────────────────────────────
// Exit
// ─────────────────────────────────────

if (mode === "exit") {
  rl.close();

  console.log("");
  console.log("Gloss closed.");
  console.log("");

  process.exit(0);
}

if (!validModes.includes(mode)) {
  rl.close();

  console.error("Invalid option.");
  console.error("Choose: notes, study, both, or exit.");

  process.exit(1);
}

// ─────────────────────────────────────
// Convert
// ─────────────────────────────────────

if (fs.existsSync(audioPath)) {
  console.log("");
  console.log(
    `✓ Using existing audio: ${audioPath}`
  );
} else {
  console.log("");

  runNode(
    "src/convert.mjs",
    [inputFile]
  );
}

// ─────────────────────────────────────
// Transcribe
// ─────────────────────────────────────

if (fs.existsSync(transcriptPath)) {
  console.log("");
  console.log(
    `✓ Using existing transcript: ${transcriptPath}`
  );
} else {
  console.log("");

  runNode(
    "src/transcribe.mjs",
    [wavFile]
  );
}

// ─────────────────────────────────────
// Generate
// ─────────────────────────────────────

let createdNotes = false;
let createdStudy = false;

// Notes
if (
  mode === "notes" ||
  mode === "both"
) {
  console.log("");

  runNode(
    "src/notes/markdown.mjs",
    [jsonFile]
  );

  createdNotes = true;
}

// Study
if (
  mode === "study" ||
  mode === "both"
) {
  console.log("");

  runNode(
    "src/study/annotate.mjs",
    [transcriptPath]
  );

  createdStudy = true;
}

// ─────────────────────────────────────
// Follow-up
// ─────────────────────────────────────

if (mode === "notes") {
  console.log("");

  const answer = await rl.question(
    "Create Study too? (y/N) "
  );

  if (isYes(answer)) {
    console.log("");

    runNode(
      "src/study/annotate.mjs",
      [transcriptPath]
    );

    createdStudy = true;
  }
}

if (mode === "study") {
  console.log("");

  const answer = await rl.question(
    "Create Notes too? (y/N) "
  );

  if (isYes(answer)) {
    console.log("");

    runNode(
      "src/notes/markdown.mjs",
      [jsonFile]
    );

    createdNotes = true;
  }
}

rl.close();

// ─────────────────────────────────────
// Complete
// ─────────────────────────────────────

console.log("");
console.log("─────────────────────────────────────");
console.log("✓ Gloss complete");
console.log("─────────────────────────────────────");

if (createdNotes) {
  console.log(
    `✓ Notes: ./markdowns/${name}.md`
  );
}

if (createdStudy) {
  console.log(
    `✓ Study: ./annotations/${name}.md`
  );

  console.log(
    `✓ Study data: ./annotations/${name}.json`
  );
}

console.log("");
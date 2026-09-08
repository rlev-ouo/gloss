import fs from "fs";
import path from "path";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Please provide a transcript JSON file.");
  process.exit(1);
}

// Read transcript JSON
const transcript = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

const name = path.parse(inputFile).name;

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

const detectedLanguage = transcript.language.toLowerCase();

const language =
  languageLabels[detectedLanguage] ??
  transcript.language.charAt(0).toUpperCase() +
    transcript.language.slice(1);

// Language-aware pronunciation label
function getRomanizationLabel(language) {
  switch (language) {
    case "japanese":
      return "Romaji";

    case "chinese":
      return "Pinyin";

    case "cantonese":
      return "Jyutping";

    case "korean":
      return "Romanization";

    default:
      return "Pronunciation";
  }
}

const romanizationLabel =
  getRomanizationLabel(detectedLanguage);

// Output folder
const outputDir = "./annotations";

const jsonOutputPath =
  `${outputDir}/${name}.json`;

const markdownOutputPath =
  `${outputDir}/${name}.md`;

fs.mkdirSync(outputDir, {
  recursive: true,
});

// Convert seconds → MM:SS
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Prepare timestamped Whisper segments
const segments = transcript.segments.map((segment) => ({
  start: segment.start,
  end: segment.end,
  timestamp: formatTimestamp(segment.start),
  text: segment.text,
}));

console.log("→ Creating study material...");

const response = await openai.responses.create({
  model: "gpt-5.6",

  input: `
You are creating high-quality language-learning material from a lesson recording.

The detected source language is:
${transcript.language}

Use this display label:
${language}

The learner wants to study the actual language used in the recording.

The lesson itself can be about ANY subject.

Your goal is to create useful, structured study material while staying faithful to the transcript.

--------------------------------

PASSAGE GROUPING

1. Group adjacent transcript segments into natural, meaningful passages.

2. Do NOT treat Whisper segment boundaries as sentence boundaries.

3. Merge segments when they clearly belong to the same sentence, thought, or explanation.

4. Do not merge unrelated ideas.

5. Preserve the start and end timestamps of every passage.

6. The final transcript segment may be incomplete.
Do not invent missing words or endings.

--------------------------------

PASSAGE TEXT

For each passage:

1. Produce ONE faithful transcript version in the "original" field.

2. You may:
   - fix obvious spacing
   - add natural punctuation
   - normalize obvious transcription formatting

3. Do NOT:
   - unnecessarily rewrite the speaker's wording
   - change the speaker's meaning
   - invent missing content
   - complete unfinished speech

There should NOT be separate raw and cleaned versions.

--------------------------------

PASSAGE CONTENT

For each passage:

1. Show the original source-language passage.

2. Provide a natural English translation.

3. Provide reading or pronunciation support appropriate to the language.

4. Add a short Focus section explaining what the learner should notice.

5. Break the passage into understandable phrases or sentence structures.

6. Extract useful vocabulary.

7. Explain useful grammar.

8. Extract natural expressions, collocations, idioms, and reusable sentence patterns.

9. Add concise notes about nuance, register, business usage, ambiguity, or context where helpful.

--------------------------------

LANGUAGE-SPECIFIC READING RULES

For Japanese:

- ALWAYS provide the full passage reading in kana.
- ALWAYS provide the full passage in standard Hepburn romaji.

- For EVERY breakdown item:
  - provide kana reading
  - provide Hepburn romaji

- For EVERY vocabulary item:
  - provide kana reading
  - provide Hepburn romaji

- For EVERY grammar example:
  provide:
  - Japanese text
  - kana reading
  - Hepburn romaji
  - English translation

- For EVERY Japanese expression:
  - provide kana reading
  - provide Hepburn romaji

- Use English for explanations, notes, focus items, grammar explanations, meanings, and learning guidance.

For Mandarin:
- Provide full pinyin with tone marks.
- Include pinyin for useful examples when applicable.

For Cantonese:
- Provide full Jyutping with tone numbers.
- Include Jyutping for useful examples when applicable.

For Korean:
- Provide Revised Romanization when useful.

For languages written primarily in the Latin alphabet:
- romanization should usually be null.
- pronunciation guidance should only be included when genuinely useful.

The romanization field must correspond to the full passage when provided.

--------------------------------

LEARNING QUALITY

Avoid unnecessary duplication.

Use each section for a distinct purpose:

- breakdown:
  phrase-by-phrase explanation of the actual passage.

- vocabulary:
  useful standalone words or terms.

- grammar:
  useful grammatical patterns or sentence structures.

- expressions:
  natural reusable phrases, collocations, idioms, or presentation patterns.

- notes:
  nuance, register, business usage, ambiguity, or context.

A word or phrase should not appear in several sections unless each section adds clearly different value.

Prefer useful, reusable material.

Keep explanations clear and learner-friendly.

--------------------------------

TIMESTAMPS

Every extracted breakdown item, vocabulary item, grammar item, and expression must include the timestamp of the passage where it appears.

Use the passage's starting timestamp.

--------------------------------

LESSON-WIDE REVIEW

After analyzing all passages, create a review section.

Include only the most useful material from the lesson.

Include:

- keyVocabulary
- keyGrammar
- keyExpressions
- keyTakeaways

Do not simply copy every extracted item.

Choose the strongest learning points.

--------------------------------

IMPORTANT

- Do NOT assume the language is Japanese.
- Adapt naturally to the detected language.
- Preserve the original script.
- Do not invent content.
- Do not add unsupported facts.
- Do not complete unfinished speech.
- Keep explanations concise but useful.
- Prefer English explanations for learning guidance.
- Return valid JSON only.
- Do not wrap the JSON in Markdown code fences.

Use this structure:

{
  "language": {
    "detected": "",
    "display": ""
  },

  "duration": 0,

  "passages": [
    {
      "start": 0,
      "end": 0,

      "timestamp": "00:00",
      "timestampRange": "00:00–00:00",

      "original": "",

      "reading": null,

      "romanization": null,

      "translation": "",

      "focus": [],

      "breakdown": [
        {
          "text": "",
          "reading": null,
          "romanization": null,
          "meaning": "",
          "note": null,
          "timestamp": ""
        }
      ],

      "vocabulary": [
        {
          "term": "",
          "reading": null,
          "romanization": null,
          "meaning": "",
          "partOfSpeech": null,
          "note": null,
          "timestamp": ""
        }
      ],

      "grammar": [
        {
          "pattern": "",
          "meaning": "",
          "explanation": "",

          "example": {
            "text": "",
            "reading": null,
            "romanization": null,
            "translation": ""
          },

          "timestamp": ""
        }
      ],

      "expressions": [
        {
          "text": "",
          "reading": null,
          "romanization": null,
          "meaning": "",
          "note": null,
          "timestamp": ""
        }
      ],

      "notes": []
    }
  ],

  "review": {
    "keyVocabulary": [
      {
        "term": "",
        "meaning": "",
        "timestamp": ""
      }
    ],

    "keyGrammar": [
      {
        "pattern": "",
        "meaning": "",
        "timestamp": ""
      }
    ],

    "keyExpressions": [
      {
        "text": "",
        "meaning": "",
        "timestamp": ""
      }
    ],

    "keyTakeaways": []
  }
}

Set:

language.detected =
"${transcript.language}"

language.display =
"${language}"

duration =
${transcript.duration}

Use null when a field does not apply.

Transcript metadata:

Language:
${transcript.language}

Duration:
${transcript.duration} seconds

Timestamped transcript segments:

${JSON.stringify(segments, null, 2)}
`,
});

// Parse structured Study result
const study = JSON.parse(response.output_text);

// ─────────────────────────────────────
// Save JSON
// ─────────────────────────────────────

fs.writeFileSync(
  jsonOutputPath,
  JSON.stringify(study, null, 2),
  "utf8"
);

// ─────────────────────────────────────
// Generate Markdown
// ─────────────────────────────────────

let markdown = `# Study\n\n`;

markdown += `**Language:** ${study.language.display}\n\n`;
markdown += `**Duration:** ${formatTimestamp(study.duration)}\n\n`;

markdown += `---\n\n`;

for (const passage of study.passages) {
  markdown += `## ${passage.timestampRange}\n\n`;

  // Original
  markdown += `### Original\n\n`;
  markdown += `${passage.original}\n\n`;

  // Reading
  if (passage.reading) {
    markdown += `### Reading\n\n`;
    markdown += `${passage.reading}\n\n`;
  }

  // Romaji / Pinyin / Jyutping / etc.
  if (passage.romanization) {
    markdown += `### ${romanizationLabel}\n\n`;
    markdown += `${passage.romanization}\n\n`;
  }

  // English
  markdown += `### English\n\n`;
  markdown += `${passage.translation}\n\n`;

  // Focus
  if (passage.focus?.length) {
    markdown += `### Focus\n\n`;

    for (const item of passage.focus) {
      markdown += `- ${item}\n`;
    }

    markdown += `\n`;
  }

  // Breakdown
  if (passage.breakdown?.length) {
    markdown += `### Breakdown\n\n`;

    for (const item of passage.breakdown) {
      markdown += `- **${item.text}**`;

      if (item.reading) {
        markdown += ` (${item.reading})`;
      }

      if (item.romanization) {
        markdown += ` — ${item.romanization}`;
      }

      markdown += ` — ${item.meaning}`;

      if (item.note) {
        markdown += ` — ${item.note}`;
      }

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Vocabulary
  if (passage.vocabulary?.length) {
    markdown += `### Vocabulary\n\n`;

    for (const item of passage.vocabulary) {
      markdown += `- **${item.term}**`;

      if (item.reading) {
        markdown += ` (${item.reading})`;
      }

      if (item.romanization) {
        markdown += ` — ${item.romanization}`;
      }

      markdown += ` — ${item.meaning}`;

      if (item.partOfSpeech) {
        markdown += ` · _${item.partOfSpeech}_`;
      }

      if (item.note) {
        markdown += ` — ${item.note}`;
      }

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Grammar
  if (passage.grammar?.length) {
    markdown += `### Grammar\n\n`;

    for (const item of passage.grammar) {
      markdown += `#### ${item.pattern}\n\n`;

      markdown += `**Meaning:** ${item.meaning}\n\n`;

      markdown += `${item.explanation}\n\n`;

      if (item.example?.text) {
        markdown += `**Example**\n\n`;

        markdown += `${item.example.text}\n\n`;

        if (item.example.reading) {
          markdown += `${item.example.reading}\n\n`;
        }

        if (item.example.romanization) {
          markdown += `${item.example.romanization}\n\n`;
        }

        if (item.example.translation) {
          markdown += `_${item.example.translation}_\n\n`;
        }
      }

      if (item.timestamp) {
        markdown += `_${item.timestamp}_\n\n`;
      }
    }
  }

  // Expressions
  if (passage.expressions?.length) {
    markdown += `### Expressions\n\n`;

    for (const item of passage.expressions) {
      markdown += `- **${item.text}**`;

      if (item.reading) {
        markdown += ` (${item.reading})`;
      }

      if (item.romanization) {
        markdown += ` — ${item.romanization}`;
      }

      markdown += ` — ${item.meaning}`;

      if (item.note) {
        markdown += ` — ${item.note}`;
      }

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Notes
  if (passage.notes?.length) {
    markdown += `### Notes\n\n`;

    for (const note of passage.notes) {
      markdown += `- ${note}\n`;
    }

    markdown += `\n`;
  }

  markdown += `---\n\n`;
}

// ─────────────────────────────────────
// Review
// ─────────────────────────────────────

if (study.review) {
  markdown += `# Review\n\n`;

  // Key Vocabulary
  if (study.review.keyVocabulary?.length) {
    markdown += `## Key Vocabulary\n\n`;

    for (const item of study.review.keyVocabulary) {
      markdown += `- **${item.term}** — ${item.meaning}`;

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Key Grammar
  if (study.review.keyGrammar?.length) {
    markdown += `## Key Grammar\n\n`;

    for (const item of study.review.keyGrammar) {
      markdown += `- **${item.pattern}** — ${item.meaning}`;

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Key Expressions
  if (study.review.keyExpressions?.length) {
    markdown += `## Key Expressions\n\n`;

    for (const item of study.review.keyExpressions) {
      markdown += `- **${item.text}** — ${item.meaning}`;

      if (item.timestamp) {
        markdown += ` · ${item.timestamp}`;
      }

      markdown += `\n`;
    }

    markdown += `\n`;
  }

  // Key Takeaways
  if (study.review.keyTakeaways?.length) {
    markdown += `## What to Remember\n\n`;

    for (const item of study.review.keyTakeaways) {
      markdown += `- ${item}\n`;
    }

    markdown += `\n`;
  }
}

// ─────────────────────────────────────
// Save Markdown
// ─────────────────────────────────────

fs.writeFileSync(
  markdownOutputPath,
  markdown,
  "utf8"
);

console.log("");
console.log(`✓ Study JSON saved to ${jsonOutputPath}`);
console.log(`✓ Study Markdown saved to ${markdownOutputPath}`);
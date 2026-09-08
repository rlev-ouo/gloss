# Gloss.md

Turn lesson recordings into Obsidian Markdown.

Drop a recorded lesson in `recordings/` and run `src/process.mjs`. Gloss.md extracts the audio, transcribes the speech, then builds one or both of:

- **Notes** — bilingual lesson notes (source language + English). Not a language-learning worksheet.
- **Study** — language-learning material from the same recording: readings, vocabulary, grammar, expressions, and a review.

The lesson can be about any subject.

## Pipeline

```
recordings/*.mov
        ↓  ffmpeg
   audio/*.wav
        ↓  OpenAI Whisper
transcripts/*.txt + *.json
        ↓
   notes  →  markdowns/*.md
   study  →  annotations/*.md + *.json
```

`src/process.mjs` is the entry point. It asks whether you want Notes, Study, or both, then:

1. **Convert** (`src/convert.mjs`) — `ffmpeg` writes a WAV to `audio/`. Skipped if that WAV already exists.
2. **Transcribe** (`src/transcribe.mjs`) — Whisper (`whisper-1`) detects the language and writes a plain transcript plus timestamped JSON. Skipped if that JSON already exists.
3. **Generate**
   - **Notes** (`src/notes/markdown.mjs`) — GPT writes bilingual lesson notes.
   - **Study** (`src/study/annotate.mjs`) — GPT writes structured study JSON, then a study Markdown file.

If you pick only Notes or only Study, Gloss asks whether to create the other one too.

## Project layout

```
Gloss.md/
├── recordings/          # Source lesson videos
├── audio/               # Extracted WAV files
├── transcripts/         # Plain text + timestamped JSON
├── markdowns/           # Notes (.md)
├── annotations/         # Study (.md + .json)
├── src/
│   ├── process.mjs      # Entry point
│   ├── convert.mjs      # Video → WAV
│   ├── transcribe.mjs   # WAV → transcript
│   ├── notes/
│   │   └── markdown.mjs # Transcript → lesson notes
│   └── study/
│       └── annotate.mjs # Transcript → study material
└── package.json
```

Recordings, audio, transcripts, notes, and study files are gitignored. Only `.gitkeep` files stay in those folders.

## Requirements

- [Node.js](https://nodejs.org/) 22+
- [ffmpeg](https://ffmpeg.org/) on your `PATH`
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

```bash
npm install
```

Create a `.env` in the project root:

```
OPENAI_API_KEY=your_key_here
```

## Usage

Put a lesson recording in `recordings/`, then run:

```bash
node src/process.mjs recordings/2026-09-08-07-17-10.mov
```

Gloss prompts:

```
1. Notes
2. Study
3. Both
4. Exit
```

Skip the prompt by passing a mode:

```bash
node src/process.mjs recordings/2026-09-08-07-17-10.mov notes
node src/process.mjs recordings/2026-09-08-07-17-10.mov study
node src/process.mjs recordings/2026-09-08-07-17-10.mov both
```

`process.mjs` takes the recording path, reuses existing audio and transcripts when present, then calls:

```
convert.mjs  →  transcribe.mjs  →  notes/markdown.mjs and/or study/annotate.mjs
```

That writes:

| Output | Path |
|--------|------|
| Audio | `audio/<name>.wav` |
| Plain transcript | `transcripts/<name>.txt` |
| Timestamped transcript | `transcripts/<name>.json` |
| Notes | `markdowns/<name>.md` |
| Study notes | `annotations/<name>.md` |
| Study data | `annotations/<name>.json` |

### Individual steps

Use these when you only need one stage. `process.mjs` already runs them as needed.

```bash
node src/convert.mjs recordings/2026-09-08-07-17-10.mov
node src/transcribe.mjs 2026-09-08-07-17-10.wav
node src/notes/markdown.mjs 2026-09-08-07-17-10.json
node src/study/annotate.mjs transcripts/2026-09-08-07-17-10.json
```

`process.mjs` and `convert.mjs` take a recording path. `transcribe.mjs` and `notes/markdown.mjs` take a filename and look in `audio/` and `transcripts/`. `study/annotate.mjs` takes a transcript JSON path.

## Notes

Each Notes file is meant to drop into Obsidian as-is:

- **Title** inferred from the lesson
- **Summary** — short English overview
- **Key Takeaways** — main points as bullets
- **Transcript** — timestamped sections with the original language and a direct English translation
- **Notes** — frameworks, principles, and connections supported by the transcript

Notes do not add vocabulary, grammar, romanization, or language-teaching sections. Study handles that.

## Study

Each Study file is language-learning material from the same transcript:

- **Passages** grouped into natural units (not raw Whisper cuts)
- **Original** source text, plus reading and romanization when the language needs it (kana/romaji, pinyin, Jyutping, Korean romanization)
- **English** translation
- **Focus**, **Breakdown**, **Vocabulary**, **Grammar**, **Expressions**, and **Notes**
- **Review** — key vocabulary, grammar, expressions, and what to remember

Whisper detects the source language. Display labels exist for Japanese, Korean, Chinese, Cantonese, French, Spanish, German, Italian, and Portuguese; other languages use a capitalized language name.

Adjacent transcript segments that belong to the same sentence are merged. The model does not invent facts or finish unfinished speech.

## License

ISC

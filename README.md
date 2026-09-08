# Gloss.md

Turn lesson recordings into bilingual Obsidian Markdown notes.

Drop a recorded lesson in `recordings/`. Gloss.md extracts the audio, transcribes the speech, translates it into English, and writes a structured `.md` note you can file in an Obsidian vault.

The lesson can be about any subject. Gloss.md preserves the content; it does not teach the source language or add vocabulary drills.

## Pipeline

```
recordings/*.mov
        ↓  ffmpeg
   audio/*.wav
        ↓  OpenAI Whisper
transcripts/*.txt + *.json
        ↓  GPT
 markdowns/*.md
```

`src/process.mjs` is the entry point. It runs the three steps in order:

1. **Convert** (`src/convert.mjs`) — `ffmpeg` strips video and writes a WAV to `audio/`.
2. **Transcribe** (`src/transcribe.mjs`) — Whisper (`whisper-1`) detects the language and produces a plain transcript plus timestamped JSON.
3. **Markdown** (`src/markdown.mjs`) — GPT turns that JSON into bilingual Obsidian notes (source language + English).

## Project layout

```
Gloss.md/
├── recordings/     # Source lesson videos
├── audio/          # Extracted WAV files
├── transcripts/    # Plain text + timestamped JSON
├── markdowns/      # Generated Obsidian notes
├── src/
│   ├── process.mjs     # Full pipeline
│   ├── convert.mjs     # Video → WAV
│   ├── transcribe.mjs  # WAV → transcript
│   └── markdown.mjs    # Transcript → bilingual .md
└── package.json
```

Recordings, audio, transcripts, and generated notes are gitignored. Only `.gitkeep` files stay in those folders.

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

Put a lesson recording in `recordings/`, then run `process.mjs`:

```bash
node src/process.mjs recordings/2026-09-08-07-17-10.mov
```

`process.mjs` takes the recording path, then calls:

```
convert.mjs  →  transcribe.mjs  →  markdown.mjs
```

That writes:

| Output | Path |
|--------|------|
| Audio | `audio/<name>.wav` |
| Plain transcript | `transcripts/<name>.txt` |
| Timestamped transcript | `transcripts/<name>.json` |
| Obsidian note | `markdowns/<name>.md` |

### Individual steps

Use these when you only need one stage. `process.mjs` already runs them in this order.

```bash
node src/convert.mjs recordings/2026-09-08-07-17-10.mov
node src/transcribe.mjs 2026-09-08-07-17-10.wav
node src/markdown.mjs 2026-09-08-07-17-10.json
```

`process.mjs` and `convert.mjs` take a path. `transcribe.mjs` and `markdown.mjs` take a filename and look in `audio/` and `transcripts/` respectively.

## Generated notes

Each Markdown file is meant to drop into Obsidian as-is:

- **Title** inferred from the lesson
- **Summary** — short English overview
- **Key Takeaways** — main points as bullets
- **Transcript** — timestamped sections with the original language and a direct English translation
- **Notes** — frameworks, principles, and connections supported by the transcript (not a repeat of the summary)

Whisper detects the source language. Display labels exist for Japanese, Korean, Chinese, Cantonese, French, Spanish, German, Italian, and Portuguese; other languages use a capitalized language name.

Adjacent transcript segments that belong to the same sentence are merged. The model does not invent facts, add grammar lessons, or add a vocabulary section.

## License

ISC

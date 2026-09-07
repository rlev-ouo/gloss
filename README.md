# Gloss.md

Turn lesson recordings into Obsidian-ready Markdown notes.

Gloss.md is a translation and transcription pipeline. You drop a recorded lesson in, and it produces a structured `.md` file you can file in an Obsidian vault — transcript, translation, and notes in one place.

## What it does

1. **Ingest** a lesson recording (video or audio).
2. **Extract** speech audio suitable for transcription.
3. **Transcribe** the spoken lesson.
4. **Translate** the transcript into the language you study in.
5. **Write** an Obsidian Markdown note with frontmatter, headings, and links you can search later.

## Project layout

```
Gloss.md/
├── input/          # Source lesson recordings
├── output/         # Extracted audio and generated notes
├── src/            # Pipeline code
└── package.json
```

| Folder   | Role |
|----------|------|
| `input/` | Place lesson recordings here. Example: `2026-09-08-07-17-10.mov` (QuickTime). |
| `output/` | Intermediate audio and the final `.md` notes. Example: `test.wav` (16-bit PCM, mono, 16 kHz). |
| `src/` | Application source. Empty while the pipeline is being built. |

The 16 kHz mono WAV in `output/` is the usual format for speech-to-text. That conversion is the first step toward a Markdown note.

## Intended pipeline

```
lesson recording (.mov / audio)
        ↓
   extract audio
        ↓
  16 kHz mono WAV
        ↓
   transcribe
        ↓
   translate
        ↓
  Obsidian .md
```

A generated note should be usable in Obsidian without extra cleanup: YAML frontmatter (title, date, source file, language), a transcript section, a translation section, and optional vocabulary or timestamps.

## Current status

Early setup. Node.js project (`gloss.md` v1.0.0, CommonJS). Folders and a sample recording are in place; the pipeline in `src/` is not implemented yet.

## Requirements (planned)

- [Node.js](https://nodejs.org/)
- `ffmpeg` for audio extraction from video
- A speech-to-text / translation backend (to be chosen)

## Usage (planned)

```bash
npm install
# then a command such as:
# npm run gloss.md -- input/2026-09-08-07-17-10.mov
```

Output will land in `output/` as Markdown, ready to move or sync into an Obsidian vault.

## License

ISC

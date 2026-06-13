# SonicNote Sync

[中文说明](README.zh-CN.md)

Sync recordings, transcripts, AI summaries, and study reports from [SonicNote](https://ainote.easylinkin.com) to Obsidian as Markdown files. Each recording becomes a self-contained note with full metadata and content.

## Features

- **Recording Sync** — One-click fetch all recordings, auto-generate Markdown files
- **AI Transcription** — Verbatim transcription with speaker identification and timestamps
- **Smart Summary** — AI-generated summaries with key points, action items, etc.
- **Study Report** — Knowledge panorama, core gains, and consolidation (when available)
- **Notes Sync** — Your handwritten notes from the App
- **Auto Sync** — Sync on startup + periodic resync (1/3/6/24 hours)
- **File Properties** — Configurable Frontmatter metadata fields + custom properties

## Prerequisites

- Obsidian desktop v0.15.0 or above
- SonicNote account

## Installation

### Manual Install

1. Download the latest `sonicnote-sync-vX.X.X.zip` from the [Releases](../../releases) page
2. Unzip to get `main.js`, `manifest.json`, and `styles.css`
3. Open your Obsidian Vault folder, navigate to `.obsidian/plugins/`
4. Create a `sonicnote-sync` folder and place the 3 files inside:

```
.obsidian/plugins/sonicnote-sync/
├── main.js
├── manifest.json
└── styles.css
```

5. Restart Obsidian, go to **Settings → Community plugins**, find **SonicNote Sync** and enable it

## Usage

### Login

1. Go to **Settings → SonicNote Sync**
2. Click the "Login" button
3. Enter your API Key (created in SonicNote App → My → API Key Management, format: `sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Sync Recordings

After logging in, trigger a sync via:

- Click the **headphones icon** in the left ribbon
- Command palette (`Ctrl/Cmd + P`) → **"SonicNote: Sync Recordings"**

After syncing, a `SonicNoteSync/` folder is created in your Vault with one Markdown file per recording.

### Synced Content

Each recording file includes:

| Content | Description |
|---------|-------------|
| Frontmatter | Recording metadata (ID, time, duration, device name, tags, etc.) |
| Notes | Your handwritten notes from the App |
| AI Summary | Smart summary content (key points, action items, etc.) |
| Study Report | Knowledge panorama, core gains, consolidation (when available) |
| Transcript | AI-transcribed text with speaker labels and timestamps |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Sync Folder | `SonicNoteSync` | Directory for Markdown files |
| Include Transcript | On | Turn off to exclude verbatim transcript |
| Auto Sync on Open | Off | Automatically sync when Obsidian opens |
| Periodic Resync | Off | Auto resync at 1/3/6/24 hour intervals |
| File Properties | All On | Toggle built-in Frontmatter fields |
| Custom Properties | None | Add custom key-value pairs to all synced files |

## Sync Rules

- Synced recordings are not overwritten by default
- If the recording title changes after summary generation, the file is automatically updated and renamed on next sync
- Delete the local file and re-sync to get the latest content

## Updating

Download the new version zip, unzip and overwrite the 3 files under `.obsidian/plugins/sonicnote-sync/`, then restart Obsidian.

## Uninstall

1. Go to **Settings → Community plugins**, find SonicNote Sync, disable and uninstall
2. Manually delete the `.obsidian/plugins/sonicnote-sync/` folder

## Development

```bash
npm install
npm run dev     # Watch mode
npm run build   # Production build
```

## License

[MIT](LICENSE)

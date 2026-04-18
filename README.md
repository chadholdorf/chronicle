# Chronicle

**Chronicle is an open source Google Reader revival with AI-powered summaries and daily digests.**

> RSS, restored.

---

<!-- Add a screenshot here: ![Chronicle screenshot](./screenshot.png) -->

## Why

Google killed Reader in 2013 to push Google+. Google+ is dead. RSS is not.

RSS is still the cleanest, most privacy-respecting way to follow the web — no algorithm, no ads, no engagement bait. You pick the sources. You read everything. Chronicle brings that back with a clean interface and one genuinely useful new thing: AI that helps you keep up when your feeds get ahead of you.

---

## Features

- **Three-panel layout** — Feed list, item list, and reading pane, just like you remember
- **Full RSS/Atom support** — Powered by `rss-parser`, handles most feeds in the wild
- **AI summaries** — One click gets a 3-sentence summary (what happened, why it matters, what to watch) via Claude
- **Daily Digest** — Analyzes your 20 most recent unread items and writes a sharp editorial briefing
- **Auto-refresh** — Stale feeds (30+ minutes old) refresh automatically on load
- **Star items** — Save articles to read later
- **Mark all read** — Per-feed or global
- **Unread counts** — Live badges everywhere you need them
- **Persistent storage** — SQLite via Drizzle ORM; your data stays local
- **Vercel-ready** — Deploy anywhere Next.js runs

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/chronicle.git
cd chronicle
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com). AI features (Summarize, Daily Digest) require this. The rest of the app works without it.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database (`chronicle.db`) is created automatically on first run.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, Vercel-native, TypeScript-first |
| Database | SQLite via Drizzle ORM | Zero-dependency local storage, perfect for a personal tool |
| Styling | Tailwind CSS | Utility-first, consistent, fast to iterate |
| RSS parsing | `rss-parser` | Battle-tested, handles RSS 1.0/2.0 and Atom |
| AI | Claude (claude-sonnet-4-20250514) | Best-in-class reasoning for editorial tasks |

---

## Starter Feeds

The Add Feed modal suggests these, but here they are for reference:

- **Hacker News** — `https://news.ycombinator.com/rss`
- **The Verge** — `https://www.theverge.com/rss/index.xml`
- **Daring Fireball** — `https://daringfireball.net/feeds/main`
- **Paul Graham Essays** — `http://www.paulgraham.com/rss.html`
- **Benedict Evans** — `https://www.ben-evans.com/benedictevans/rss.atom`

---

## What's Next

- [ ] OPML import/export (subscribe from your old reader's export)
- [ ] Keyboard shortcuts (`j/k` to navigate, `r` to read, `s` to star)
- [ ] Mobile responsive layout
- [ ] Starred items export
- [ ] Feed categories / folders
- [ ] Full-text search across items

---

## Contributing

Pull requests welcome. Chronicle is intentionally simple — please resist the urge to add features that belong in a different app. Keep it fast, keep it readable, keep it local-first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/opml-import`)
3. Commit your changes
4. Open a PR with a clear description

---

## License

MIT — do whatever you want with it. Attribution appreciated.

# Atlas — Smart Tabletop Toy

Atlas is a concept smart toy for children ages 5–12: a friendly globe-holding
robot that sits on a table and talks, teaches, and plays in **Khmer and
English**. Designed with DG Academy.

![Atlas concept prototype](docs/atlas-prototype.png)

## What's in this repository

| Path | Contents |
|---|---|
| [`docs/atlas-toy-design.md`](docs/atlas-toy-design.md) | Full product design: character, hardware "smart brain", AI architecture, learning Play Packs, safety & privacy, prototype roadmap and BOM |
| [`docs/atlas-prototype.svg`](docs/atlas-prototype.svg) / `.png` | Annotated concept render (editable SVG source) |
| [`index.html`](index.html) | **Standalone live demo** — talk to the Atlas brain by voice or text, English or Khmer |
| [`nextjs-integration/`](nextjs-integration/) | The same demo as a Next.js page + API route, for embedding in a website |

## Try the live demo

The demo is a single HTML file with no build step and no server.

**Option A — GitHub Pages (recommended):**
1. In this repository go to **Settings → Pages**.
2. Under *Build and deployment*, set Source to **Deploy from a branch**,
   choose branch **main** and folder **/ (root)**, then Save.
3. After about a minute the demo is live at
   `https://hinsopheap.github.io/toydesign/` — open it in **Chrome or Edge**,
   allow the microphone, pick English or ខ្មែរ, and talk to Atlas.

**Option B — run locally:** download `index.html` and double-click it.
(Voice input needs Chrome/Edge; everything else works in any browser.)

### Three ways to play

- **🎮 Companion play (works with no key, no mic):** Atlas behaves like a
  living friend on its table. Tap the game buttons — or just tell it — to make
  it **walk**, **run**, **dance** (with music and a rainbow globe), **sing**,
  tell **jokes**, or put on a **light show**. Click/tap its head to pat it (it
  giggles with heart eyes). It blinks and sways on its own when idle. All
  commands work by voice too, in both languages: "Atlas, dance!" /
  «អាត់ឡាស រាំ!».
- **💬 Talk** — push-to-talk conversation: tap the mic, speak, Atlas answers
  and speaks back.
- **👁 Observe (Atlas Sense)** — Atlas becomes environment-aware: it listens
  continuously to you *and people around you*, watches the room through the
  camera (one glance every 30 seconds plus "Look now"), answers whenever
  someone says its name ("Atlas, what time is dinner?"), and when you tap
  **💡 Advise me** it combines everything it heard and saw into practical
  advice for your situation. A red **OBSERVING** indicator is always shown
  while the mic and camera are live, and stopping observe mode releases both
  immediately.

### Two brains

- **Offline brain (built in, works instantly):** greetings, introductions, and
  math games in both languages — including Khmer numerals, e.g.
  «៥ បូក ៣ ស្មើប៉ុន្មាន?» → «៥ បូក ៣ ស្មើ ៨!»
- **Cloud brain (optional):** open the ⚙️ section at the bottom of the demo and
  paste an [OpenRouter](https://openrouter.ai) API key for full open-ended AI
  conversation with the child-safe Atlas persona. The key never leaves your
  browser. **Vision and smart advice require the cloud brain** — without a
  key, Observe mode still logs what it hears but cannot interpret the camera
  or reason about your situation.

### Notes on speech

- Voice **input** (speech recognition) works in Chrome and Edge, including
  Khmer (`km-KH`).
- Voice **output** in Khmer depends on your device having a Khmer
  text-to-speech voice; if it doesn't, Khmer replies appear as text and the
  demo shows a note. The real toy ships with its own Khmer voice.

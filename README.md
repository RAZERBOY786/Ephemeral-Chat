# TempRoom- — Ephemeral Chat

A zero-persistence chat app built with **React 19 + Vite 8 + Tailwind CSS v4**. Rooms, messages, files and passwords live **only in browser memory** — nothing chat-related is ever written to disk. Every conversation auto-destroys when the last person leaves.

> **Zero persistence by design.** No servers, no database, no localStorage for chat data. Close every tab and the conversation is gone forever.

---

## Screenshots

| Desktop | 
| :---: |
| ![Ephemeral Chat — Desktop](/screenshots/home-desktop.png) | 

---

## Features

### 🔐 Zero-persistence rooms
- Rooms live in RAM only and sync across your own open tabs over a `BroadcastChannel` — never a server.
- Room IDs are 6-char (e.g. `9DDQLE`) and password-protected.
- Rooms are never listed publicly; only people with the ID + password can join.
- The room auto-destroys the moment the last member leaves, wiping every message and file.

### 💬 Real chat-app experience
- **Grouped bubbles** — consecutive messages from the same sender merge, with one avatar and timestamps inside the last bubble.
- **Day dividers** — "Today / Yesterday / date" markers between messages.
- **Typing indicator** — live "Alice is typing…" with pulsing dots, synced across tabs.
- **Multiline composer** — auto-growing textarea, `Enter` to send, `Shift+Enter` for a new line.
- **Emoji picker** — 44 emoji grid (smileys, hearts, food, gestures…) with click-to-insert.
- **Delete for everyone** — messages and shared photos/files can be removed by their sender (replaced by a tombstone).
- **File & image sharing** — share images (inline preview + click-to-zoom + download) or other files (file chip), capped at 800 KB.
- **Audio feedback** — send chirp and incoming-message reply tone (toggleable in Settings).

### 🧑💻 Guest accounts, no sign-up
- One click to continue as a random guest (`Guest-XXXX`), or pick your own display name.
- Name is sanitized, live-synced across tabs, and stored locally only (it is non-chat data).
- Duplicate names in a room are auto-suffixed (`Bob` → `Bob-2`) so you can join from multiple tabs.

### 🎨 Polished UI
- Dark aurora + animated dot-field background.
- Landing page with feature cards, "how it works", privacy & security guide and a full footer.
- In-app shell with rail navigation (Chat / Teams / Settings), responsive down to mobile.
- Secure production build: injected CSP, `noindex`/`nofollow` robots meta, no source maps.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | [React 19](https://react.dev) |
| Build tool | [Vite 8](https://vite.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Linting | [Oxlint](https://oxc.rs/docs/guide/usage/lint.html) |
| Cross-tab sync | BroadcastChannel API (structured clone) |
| Persistence | None for chat — localStorage only for non-chat settings/activity/name |

---

## Getting Started

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

The build output in `dist/` is hardened with an injected Content-Security-Policy and robots `noindex`/`nofollow` meta tags.

### Lint

```bash
npm run lint
```

---

## How it works

1. **Continue as Guest** (or type a name) on the sign-up screen.
2. **Create a room** — you get a 6-character ID and set a password. Share both with the people you want.
3. **Join a room** from the Lobby using someone else's ID + password.
4. Chat, share photos/files, delete messages… and when the last person leaves, the room is permanently erased.

### Sync model

All your open tabs talk to each other over the `e-chat:sync` BroadcastChannel:

- A `sync-request` handshake lets late-opening tabs pull current room state immediately.
- A 1-second heartbeat keeps every tab current.
- Nothing is written to disk — chat data is transported by structured clone and held in RAM.

---

## Privacy & Security

- **Peer to peer only** — nothing ever goes to a server.
- **Nothing is stored** — no message, file or room is written to localStorage.
- **Hidden rooms** — no public room list; only the exact ID + password grants access.
- **Password protected** — every room requires its password to join.
- **Auto-destroy** — leaving last / pressing Destroy permanently erases the room.
- **Passwords never stored** — room passwords exist in memory only for the session.

---

## Project Structure

```
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── screenshots/              # README screenshots
├── src/
│   ├── App.jsx               # Stage machine: home → signup → app
│   ├── main.jsx
│   ├── store.js              # In-memory store + BroadcastChannel sync
│   ├── index.css             # Tailwind, keyframes, scrollbars
│   ├── components/
│   │   ├── AppRail.jsx       # Left navigation rail
│   │   ├── Aurora.jsx        # Background aurora effect
│   │   ├── Chat.jsx          # Chat thread, composer, emoji, files
│   │   ├── DestroyConfirm.jsx
│   │   ├── DotField.jsx / .css
│   │   ├── Lobby.jsx         # Create / join rooms
│   │   ├── Shell.jsx         # App shell
│   │   └── SiteFooter.jsx    # Landing + sign-up footer
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Signup.jsx        # Guest account entry
│   │   ├── Settings.jsx      # Profile, appearance, privacy, about
│   │   └── Teams.jsx         # Room directory
│   ├── hooks/
│   │   └── useUserName.js    # Live guest-name hook
│   └── utils/
│       ├── mask.js           # Room-ID masking helpers
│       └── sound.js          # Web-Audio send/reply sounds
└── vite.config.js            # Build hardening (CSP, no sourcemaps)
```

---

## License

Private project — for demonstration purposes.

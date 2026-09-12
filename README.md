# TempRoom- — Ephemeral Chat

An ephemeral chat app built with a **React 19 + Vite 8 + Tailwind CSS v4** client and a **Node.js + Express + Socket.IO relay server**. Rooms, messages, files and passwords live **only in server RAM** — nothing chat-related is ever written to disk or a database. Every conversation auto-destroys shortly after the last person leaves.

> **Zero persistence by design.** No database. The relay keeps everything in memory and forgets it the moment the room dies. Close every tab and the conversation is gone forever.

---

## Screenshots

| Desktop | 
| :---: |
| ![Ephemeral Chat — Desktop](/screenshots/home-desktop.png) | 

---

## Features

### 🔐 Zero-persistence rooms
- Rooms live **in server RAM only** and are relayed to every connected client in real time — never a database.
- Room IDs are 6-char (e.g. `9DDQLE`) and password-protected.
- Rooms are never listed publicly; only people with the ID + password can join.
- The room auto-destroys ~30 s after the last member leaves (with a ~20 s disconnect-reconnect grace), wiping every message and file.

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
- Duplicate names in a room are auto-suffixed by the server (`Bob` → `Bob-2`) so you can join from multiple tabs.

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
| Relay server | Node.js + [Express 5](https://expressjs.com) + [Socket.IO](https://socket.io) |
| Linting | [Oxlint](https://oxc.rs/docs/guide/usage/lint.html) |
| Persistence | None for chat — RAM-only relay; localStorage only for non-chat settings/activity/name |

---

## Getting Started

```bash
npm install
```

Run the **relay server** (serves the production build from `dist/` too):

```bash
npm run server        # node server/server.js  → http://localhost:5000
```

In a second terminal, run the Vite dev client (proxies `/socket.io` to the server):

```bash
npm run dev           # http://localhost:5173
```

> The relay never needs a database — it boots empty and lives entirely in RAM.

### Remote relay

To point the app at a relay that isn't `http://localhost:5000`, set a URL before running the dev server:

```bash
# PowerShell:
$env:VITE_SERVER_URL = "https://your-relay.example.com"; npm run dev
```

### Production build

```bash
npm run build
npm start             # same as npm run server — serves dist/ + relay on :5000
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

All clients talk to the relay over Socket.IO:

- A **relay server** holds every live room in a `Map` (RAM only) and broadcasts a full room snapshot to all members on every change.
- The client keeps an in-memory mirror per tab; on reconnect it automatically re-joins every room it was in.
- The server assigns message/file ids and timestamps, and generates joined / left / created / shared system messages.
- Nothing is written to disk — chat data is transported over the socket and held in RAM server-side and per-tab.

---

## Privacy & Security

- **No database** — the relay keeps rooms in RAM and forgets them; restarting the server wipes everything.
- **Nothing is stored** — no message, file or room is written to disk or localStorage.
- **Hidden rooms** — no public room list; only the exact ID + password grants access.
- **Password protected** — every room requires its password to join, and room passwords are never sent back to clients.
- **Auto-destroy** — leaving last / pressing Destroy permanently erases the room (~30 s grace).
- **Rate limited** — per-socket message throttling and join-attempt lockouts limit abuse.
- **Passwords never stored** — room passwords exist in memory only for the room's lifetime.

---

## Project Structure

```
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── screenshots/              # README screenshots
├── server/                   # RAM-only relay (Express 5 + Socket.IO)
│   ├── server.js             # HTTP + SPA fallback + Socket.IO wiring + sweeper
│   ├── config/security.js    # ports, limits, room timings, rate limits
│   ├── rooms/roomManager.js  # in-memory room lifecycle logic
│   ├── sockets/roomSocket.js # event handlers (create/join/leave/message/file)
│   └── utils/                # roomId, validation, cleanup
├── src/
│   ├── App.jsx               # Stage machine: home → signup → app
│   ├── main.jsx
│   ├── store.js              # Per-tab mirror of server rooms + socket wiring
│   ├── services/socket.js    # Lazy Socket.IO client + request helper
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
├── .env.example              # PORT / ORIGIN / STATIC_DIR for the relay
└── vite.config.js            # Build hardening + /socket.io dev proxy
```

---

## License

Private project — for demonstration purposes.

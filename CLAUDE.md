# Meeting Availability App — Project Context

## What this is
A lightweight meeting availability app. Vanilla JS + CSS frontend, Node.js + Express + SQLite backend, packaged as a single Docker container for Coolify deployment.

## Folder structure
```
Attendance App/
├── app/                  ← Docker build context — deploy this
│   ├── server.js         ← Express + SQLite backend
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── public/
│       └── index.html    ← Current live frontend (always up to date)
├── versions/             ← Version history — never deployed
│   ├── meeting-V01.html
│   └── ... V02–V08
├── CLAUDE.md             ← This file
└── DEPLOY.md             ← Coolify deployment instructions
```

## Version history
| Version | File | Notes |
|---------|------|-------|
| V01 | versions/meeting-V01.html | Initial build — name prompt, host toggle, availability grid |
| V02 | versions/meeting-V02.html | Fix: `#app display:none` blank-screen bug on Enter key |
| V03 | versions/meeting-V03.html | Fix: Add yourself creates new participant; bold day/month; Me button host-only |
| V04 | versions/meeting-V04.html | Remove name dialog; inline join input; double-click to rename; UI polish |
| V05 | versions/meeting-V05.html | Multi-date calendar picker; names show without dates; legend at top |
| V06 | versions/meeting-V06.html | Legend under title; black grid borders; date headers white |
| V07 | versions/meeting-V07.html | Design polish: soft warm-gray borders, wider name col, cleaner hierarchy, blue dot indicator |
| V08 | versions/meeting-V08.html | Backend version: fetch() replaces localStorage; 10s polling; saving indicator; reset button |
| V09 | versions/meeting-V09.html | Calendar: buffered pendingDates (no API per click), commit on close; 3 action buttons (Accept/Reset dates/Reset board); removed chips; join is optimistic (instant render); new entries default to grey dash unset state |

**When making UI/behaviour changes:**
1. Save the new version to `versions/meeting-VXX.html`
2. Copy it to `app/public/index.html` (this is what gets served)
3. Update the table above

Next version → `meeting-V10.html`

## Design decisions (locked unless user says otherwise)
- Light theme only
- Max 5 date columns — no horizontal scroll
- All-day only (no time slots)
- No per-cell notes
- Single shared board (no rooms/URL hashing)
- "≈" squiggle icon for "if needed", yellow palette
- Own row: subtle blue tint + bold name + blue dot indicator
- Host mode: client-side toggle only (open access, no password)

## Host mode unlocks
- Edit event title (contenteditable)
- Add / remove / change dates (max 5)
- Delete other participants
- Reset board (clears all participants + dates)

## Backend (deployed)
- Node.js + Express, single container
- SQLite via `better-sqlite3`, stored at `/data/board.db` (persistent volume)
- API: `GET /api/board`, `POST /api/board/join`, `POST /api/board/respond`, `PATCH /api/board/title`, `PATCH /api/board/dates`, `PATCH /api/board/rename`, `DELETE /api/board/participant/:id`, `POST /api/board/reset`
- Frontend polls every 10s for live updates

## Backlog
- [ ] Participant rename in host mode (UI not wired yet)
- [ ] Password-protect host mode (optional)

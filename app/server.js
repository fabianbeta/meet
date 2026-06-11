'use strict';
const express  = require('express');
const Database = require('better-sqlite3');
const crypto   = require('crypto');
const path     = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Database setup ──────────────────────────────────────────────────────────
const dbPath = process.env.DB_PATH || '/data/board.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS board (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS participants (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS availability (
    participant_id TEXT NOT NULL,
    date           TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'yes',
    PRIMARY KEY (participant_id, date),
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );
`);

// ── Helpers ─────────────────────────────────────────────────────────────────
const getSetting = db.prepare("SELECT value FROM board WHERE key = ?");
const setSetting = db.prepare("INSERT OR REPLACE INTO board (key, value) VALUES (?, ?)");

function getTitle()  { return getSetting.get('title')?.value  ?? 'When can we meet?'; }
function getDates()  { return JSON.parse(getSetting.get('dates')?.value  ?? '[]'); }

function getBoard() {
  const title  = getTitle();
  const dates  = getDates();
  const people = db.prepare('SELECT id, name FROM participants ORDER BY created_at').all();
  const rows   = db.prepare('SELECT participant_id, date, status FROM availability').all();

  const map = {};
  rows.forEach(r => {
    (map[r.participant_id] ??= {})[r.date] = r.status;
  });

  return {
    title,
    dates,
    participants: people.map(p => ({ id: p.id, name: p.name, avail: map[p.id] ?? {} }))
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/board  →  full board state
app.get('/api/board', (_req, res) => {
  res.json(getBoard());
});

// POST /api/board/join  { name }  →  { id }
app.post('/api/board/join', (req, res) => {
  const name = req.body?.name?.trim();
  if (!name) return res.status(400).json({ error: 'name required' });

  const id = crypto.randomBytes(8).toString('hex');
  db.prepare('INSERT INTO participants (id, name) VALUES (?, ?)').run(id, name);
  // No pre-fill: new participants start with no availability rows (shown as grey dash on frontend)
  res.json({ id, name });
});

// POST /api/board/respond  { id, date, status }
app.post('/api/board/respond', (req, res) => {
  const { id, date, status } = req.body ?? {};
  if (!id || !date || !['yes', 'no', 'maybe'].includes(status))
    return res.status(400).json({ error: 'invalid payload' });

  db.prepare('INSERT OR REPLACE INTO availability (participant_id, date, status) VALUES (?, ?, ?)')
    .run(id, date, status);
  res.json({ ok: true });
});

// PATCH /api/board/title  { title }
app.patch('/api/board/title', (req, res) => {
  const title = req.body?.title?.trim();
  if (!title) return res.status(400).json({ error: 'title required' });
  setSetting.run('title', title);
  res.json({ ok: true });
});

// PATCH /api/board/dates  { dates: string[] }
app.patch('/api/board/dates', (req, res) => {
  const dates = req.body?.dates;
  if (!Array.isArray(dates) || dates.length > 6)
    return res.status(400).json({ error: 'dates must be array of ≤5' });

  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  if (!dates.every(d => validDate.test(d)))
    return res.status(400).json({ error: 'invalid date format' });

  const sorted = [...dates].sort();
  setSetting.run('dates', JSON.stringify(sorted));

  // Remove availability rows for dates no longer in use
  if (sorted.length > 0) {
    const ph = sorted.map(() => '?').join(',');
    db.prepare(`DELETE FROM availability WHERE date NOT IN (${ph})`).run(...sorted);
  } else {
    db.prepare('DELETE FROM availability').run();
  }

  // No pre-fill: existing participants keep their current responses; new date columns start grey
  res.json({ ok: true, dates: sorted });
});

// PATCH /api/board/rename  { id, name }
app.patch('/api/board/rename', (req, res) => {
  const { id, name } = req.body ?? {};
  if (!id || !name?.trim()) return res.status(400).json({ error: 'id and name required' });
  db.prepare('UPDATE participants SET name = ? WHERE id = ?').run(name.trim(), id);
  res.json({ ok: true });
});

// DELETE /api/board/participant/:id
app.delete('/api/board/participant/:id', (req, res) => {
  db.prepare('DELETE FROM participants WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/board/reset  (host-only, open access — same as client toggle)
app.post('/api/board/reset', (_req, res) => {
  db.prepare('DELETE FROM participants').run();
  db.prepare('DELETE FROM availability').run();
  db.prepare("DELETE FROM board WHERE key = 'dates'").run();
  res.json({ ok: true });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Board running on port ${PORT}`));

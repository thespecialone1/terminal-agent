import { Database } from 'bun:sqlite';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.terminal-agent');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'history.sqlite');

const db = new Database(DB_PATH);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function saveMessage(sessionId: string, role: string, content: any) {
  const insert = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
  insert.run(sessionId, role, JSON.stringify(content));
}

export function loadSession(sessionId: string): any[] {
  const query = db.query('SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC');
  const results = query.all() as { role: string, content: string }[];
  
  return results.map(row => ({
    role: row.role,
    content: JSON.parse(row.content)
  }));
}

export function clearSession(sessionId: string) {
  const del = db.prepare('DELETE FROM messages WHERE session_id = ?');
  del.run(sessionId);
}

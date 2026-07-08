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
  
  const messages: any[] = [];
  
  for (const row of results) {
    try {
      const content = JSON.parse(row.content);
      
      // Sanitize broken tool messages from old terminal mode bug to prevent Vercel AI SDK Zod crashes
      if (row.role === 'tool') {
        const lastMsg = messages[messages.length - 1];
        const hasMatchingCall = lastMsg?.role === 'assistant' && 
                                Array.isArray(lastMsg.content) && 
                                lastMsg.content.some((c: any) => c.type === 'tool-call');
                                
        if (!hasMatchingCall) {
           // Convert broken tool result to a generic assistant message
           const textResult = Array.isArray(content) ? content.map(c => c.result || '').join('\n') : String(content);
           messages.push({ role: 'assistant', content: `> Legacy Terminal Command\n${textResult}` });
           continue;
        }
      }
      
      messages.push({ role: row.role, content });
    } catch (e) {
      console.error('Failed to parse message content', e);
    }
  }
  
  return messages;
}

export function clearSession(sessionId: string) {
  const del = db.prepare('DELETE FROM messages WHERE session_id = ?');
  del.run(sessionId);
}

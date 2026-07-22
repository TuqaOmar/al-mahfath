import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Helper to read DB from disk
export function getDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { users: [], quranPages: [], communityPosts: [], aiChatHistory: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], quranPages: [], communityPosts: [], aiChatHistory: [] };
  }
}

// Helper to save DB to disk
export function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving database to disk:', error);
    return false;
  }
}

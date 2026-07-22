import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'ma7fath.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initializeTables();
  }
});

// Helper to run query as a promise
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper to get single row
export function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to get all rows
export function allRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Password hashing helper using crypto PBKDF2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

function initializeTables() {
  db.serialize(async () => {
    // 1. Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        photoURL TEXT,
        hasCompletedWizard INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user',
        streak INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 100,
        level INTEGER DEFAULT 1,
        memorizedPagesCount INTEGER DEFAULT 0,
        memoryScore INTEGER DEFAULT 100,
        totalJuz REAL DEFAULT 0,
        salt TEXT,
        passwordHash TEXT,
        preferences TEXT
      )
    `);

    // 2. Create Quran Pages Table
    db.run(`
      CREATE TABLE IF NOT EXISTS quran_pages (
        pageNumber INTEGER PRIMARY KEY,
        status TEXT DEFAULT 'unmemorized',
        score INTEGER DEFAULT 0,
        surahName TEXT,
        juz INTEGER,
        lastReviewed TEXT DEFAULT 'لم يراجع بعد',
        errorsCount INTEGER DEFAULT 0
      )
    `);

    // 3. Create Community Posts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT,
        avatar TEXT,
        isAnonymous INTEGER DEFAULT 0,
        category TEXT,
        timeAgo TEXT,
        content TEXT,
        likes INTEGER DEFAULT 0,
        answers TEXT DEFAULT '[]'
      )
    `);

    // 4. Create AI Chat History Table
    db.run(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        text TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Seed Default Admin User
    const adminExists = await getRow("SELECT * FROM users WHERE role = 'admin' OR email = 'admin@ma7fath.ai'");
    if (!adminExists) {
      const { salt, hash } = hashPassword('admin123'); // Default password for admin
      await runQuery(`
        INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'admin_123',
        'مدير النظام (أدمن)',
        'admin@ma7fath.ai',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
        1,
        'admin',
        15,
        9999,
        99,
        604,
        100,
        30.0,
        salt,
        hash,
        JSON.stringify({
          level: 'حافظ كامل المصحف',
          dailyTarget: 'مراجعة جزئين يومياً',
          learningStyle: 'مختلط (شامل)',
          motivation: 'إدارة وتوجيه مجتمع حفاظ القرآن الكريم',
          reminder: 'على مدار اليوم'
        })
      ]);
      console.log('Seeded default admin user successfully.');
    }

    // Seed Default Demo User
    const demoExists = await getRow("SELECT * FROM users WHERE uid = 'demo_user_123'");
    if (!demoExists) {
      const { salt, hash } = hashPassword('demo123');
      await runQuery(`
        INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'demo_user_123',
        'أحمد محمد',
        'demo@ma7fath-ai',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
        1,
        'user',
        1,
        100,
        1,
        1,
        90,
        0.05,
        salt,
        hash,
        JSON.stringify({
          level: 'مبتدئ (أبدأ من الصفر)',
          dailyTarget: 'صفحة واحدة يومياً',
          learningStyle: 'سمعي بصري (مختلط)',
          motivation: 'البدء بحفظ سورة البقرة وآل عمران والتقرب إلى الله',
          reminder: 'بعد صلاة الفجر'
        })
      ]);
      console.log('Seeded default demo user successfully.');
    }

    // Seed Default Quran Pages status if empty
    const pageCount = await getRow("SELECT COUNT(*) as count FROM quran_pages");
    if (pageCount.count === 0) {
      // Seed pages 1 and 2 to match previous default db.json
      await runQuery(`
        INSERT INTO quran_pages (pageNumber, status, score, surahName, juz, lastReviewed, errorsCount)
        VALUES (1, 'excellent', 98, 'الفاتحة', 1, 'منذ يومين', 0)
      `);
      await runQuery(`
        INSERT INTO quran_pages (pageNumber, status, score, surahName, juz, lastReviewed, errorsCount)
        VALUES (2, 'review', 72, 'البقرة', 1, 'منذ 3 أيام', 2)
      `);
      console.log('Seeded default Quran pages.');
    }

    // Seed Default Community Posts if empty
    const postsCount = await getRow("SELECT COUNT(*) as count FROM community_posts");
    if (postsCount.count === 0) {
      await runQuery(`
        INSERT INTO community_posts (author, avatar, isAnonymous, category, content, likes, answers)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'أحمد محمد',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
        0,
        'تدبر',
        'اليوم تدبرت آية «يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ».. شعرت بالطمأنينة ورباطة الجأش في رحلتي مع كتاب الله.',
        5,
        JSON.stringify([
          { id: 1, author: 'صالح علي', text: 'بارك الله فيك يا أخي ونفعنا الله بذكرك الطيب' }
        ])
      ]);
      console.log('Seeded default community posts.');
    }
  });
}

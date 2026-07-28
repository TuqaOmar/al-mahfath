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
    const adminExists = await getRow("SELECT * FROM users WHERE uid = 'admin_123'");
    if (!adminExists) {
      const { salt, hash } = hashPassword('admin123');
      await runQuery(`
        INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'admin_123',
        'مدير النظام (أدمن)',
        'admin@ma7fath.ai',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
        1, 'admin', 15, 9999, 99, 604, 100, 30.0, salt, hash,
        JSON.stringify({
          level: 'حافظ كامل المصحف',
          dailyTarget: 'مراجعة جزئين يومياً',
          learningStyle: 'مختلط (شامل)',
          motivation: 'إدارة وتوجيه مجتمع حفاظ القرآن الكريم',
          reminder: 'على مدار اليوم'
        })
      ]);
      console.log('✅ Seeded admin user.');
    }

    // Seed Demo User (realistic data for full feature testing)
    const demoExists = await getRow("SELECT * FROM users WHERE uid = 'demo_user_123'");
    if (!demoExists) {
      const { salt, hash } = hashPassword('demo123');
      await runQuery(`
        INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'demo_user_123',
        'أحمد محمد',
        'demo@ma7fath.ai',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
        1, 'user', 23, 2450, 12, 49, 87, 2.5, salt, hash,
        JSON.stringify({
          level: 'متوسط (أحفظ بعض الأجزاء)',
          dailyTarget: 'صفحة واحدة يومياً',
          learningStyle: 'سمعي بصري (مختلط)',
          motivation: 'تثبيت حفظ سورة البقرة وآل عمران والتقرب إلى الله',
          reminder: 'بعد صلاة الفجر'
        })
      ]);
      console.log('✅ Seeded demo user (23-day streak, 49 pages).');
    }

    // Seed comprehensive Quran Pages for demo
    const pageCount = await getRow("SELECT COUNT(*) as count FROM quran_pages");
    if (pageCount.count < 20) {
      const pagesData = [
        [1,  'excellent', 98, 'الفاتحة',     1, 'اليوم',        0],
        [2,  'excellent', 95, 'البقرة',       1, 'اليوم',        0],
        [3,  'excellent', 92, 'البقرة',       1, 'أمس',          1],
        [4,  'review',    78, 'البقرة',       1, 'منذ يومين',    2],
        [5,  'review',    81, 'البقرة',       1, 'منذ يومين',    1],
        [6,  'review',    75, 'البقرة',       1, 'منذ 3 أيام',   3],
        [7,  'weak',      65, 'البقرة',       1, 'منذ أسبوع',    5],
        [8,  'weak',      60, 'البقرة',       1, 'منذ أسبوع',    4],
        [9,  'review',    80, 'البقرة',       1, 'منذ 4 أيام',   2],
        [10, 'excellent', 96, 'البقرة',       1, 'أمس',          0],
        [11, 'excellent', 94, 'البقرة',       1, 'اليوم',        0],
        [12, 'review',    82, 'البقرة',       1, 'منذ 3 أيام',   1],
        [13, 'review',    77, 'البقرة',       1, 'منذ 5 أيام',   3],
        [14, 'excellent', 97, 'البقرة',       1, 'أمس',          0],
        [15, 'review',    73, 'البقرة',       1, 'منذ أسبوع',    4],
        [16, 'excellent', 99, 'البقرة',       2, 'اليوم',        0],
        [17, 'excellent', 93, 'البقرة',       2, 'أمس',          0],
        [18, 'review',    76, 'البقرة',       2, 'منذ 3 أيام',   2],
        [19, 'weak',      58, 'البقرة',       2, 'منذ أسبوعين',  6],
        [20, 'review',    85, 'البقرة',       2, 'منذ يومين',    1],
        [21, 'excellent', 91, 'البقرة',       2, 'أمس',          0],
        [22, 'excellent', 95, 'البقرة',       2, 'اليوم',        0],
        [23, 'review',    79, 'البقرة',       2, 'منذ 4 أيام',   2],
        [24, 'weak',      63, 'البقرة',       2, 'منذ أسبوع',    5],
        [25, 'review',    83, 'البقرة',       2, 'منذ يومين',    1],
        [26, 'excellent', 94, 'البقرة',       2, 'أمس',          0],
        [27, 'excellent', 97, 'البقرة',       2, 'اليوم',        0],
        [28, 'review',    74, 'البقرة',       2, 'منذ 5 أيام',   3],
        [29, 'review',    80, 'البقرة',       2, 'منذ 3 أيام',   2],
        [30, 'excellent', 96, 'البقرة',       2, 'أمس',          0],
        [31, 'excellent', 93, 'البقرة',       3, 'اليوم',        0],
        [32, 'review',    77, 'البقرة',       3, 'منذ 4 أيام',   3],
        [33, 'weak',      61, 'البقرة',       3, 'منذ أسبوع',    5],
        [34, 'excellent', 98, 'البقرة',       3, 'أمس',          0],
        [35, 'excellent', 95, 'البقرة',       3, 'اليوم',        0],
        [36, 'review',    76, 'البقرة',       3, 'منذ 3 أيام',   2],
        [37, 'review',    82, 'البقرة',       3, 'منذ يومين',    1],
        [38, 'excellent', 94, 'البقرة',       3, 'أمس',          0],
        [39, 'review',    71, 'البقرة',       3, 'منذ 5 أيام',   4],
        [40, 'review',    84, 'البقرة',       3, 'منذ يومين',    1],
        [41, 'excellent', 96, 'البقرة',       3, 'اليوم',        0],
        [42, 'excellent', 92, 'البقرة',       3, 'أمس',          0],
        [43, 'review',    78, 'البقرة',       3, 'منذ 4 أيام',   2],
        [44, 'weak',      62, 'البقرة',       3, 'منذ أسبوع',    5],
        [45, 'excellent', 97, 'البقرة',       3, 'أمس',          0],
        [46, 'excellent', 95, 'البقرة',       3, 'اليوم',        0],
        [47, 'review',    75, 'البقرة',       3, 'منذ 3 أيام',   3],
        [48, 'review',    80, 'البقرة',       3, 'منذ يومين',    2],
        [49, 'excellent', 93, 'البقرة',       3, 'أمس',          0],
      ];
      for (const row of pagesData) {
        await runQuery(`
          INSERT OR IGNORE INTO quran_pages (pageNumber, status, score, surahName, juz, lastReviewed, errorsCount)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, row);
      }
      console.log('✅ Seeded 49 Quran pages with realistic review data.');
    }

    // Seed Community Posts
    const postsCount = await getRow("SELECT COUNT(*) as count FROM community_posts");
    if (postsCount.count < 3) {
      const posts = [
        ['أحمد محمد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad', 0, 'تدبر',
         'اليوم تدبرت آية ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾ شعرت بالطمأنينة في رحلتي مع كتاب الله.',
         12, JSON.stringify([{id:1, author:'صالح علي', text:'بارك الله فيك أخي'},{id:2,author:'فاطمة خالد',text:'آمين، نفعنا الله بهذا الذكر'}])],
        ['هوية مخفية', null, 1, 'استفسار',
         'كيف أتغلب على نسيان سورة البقرة كثيراً؟ حفظتها 3 مرات ولا تثبت معي، هل هذا طبيعي؟',
         8, JSON.stringify([{id:3, author:'محمد علي', text:'هذا طبيعي جداً! النبي ﷺ قال: تعاهدوا القرآن. استمر في المراجعة اليومية ولو 5 دقائق'},{id:4,author:'أم عبدالله',text:'جربي التسميع لشخص آخر، يثبت أكثر من القراءة وحدك بكثير'}])],
        ['سارة خالد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', 0, 'تحفيز',
         'الحمد لله أنهيت حفظ الجزء الأول من القرآن اليوم! 23 صفحة في شهر واحد. لا تيأسوا، المداومة هي السر.',
         25, JSON.stringify([{id:5,author:'أحمد محمد',text:'ما شاء الله! بارك الله فيك وجعلك من أهل القرآن'},{id:6,author:'خالد عمر',text:'تبارك الرحمن، هذا إنجاز رائع، استمري!'}])],
      ];
      for (const p of posts) {
        await runQuery(`
          INSERT OR IGNORE INTO community_posts (author, avatar, isAnonymous, category, content, likes, answers)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, p);
      }
      console.log('✅ Seeded 3 realistic community posts.');
    }
  });
}

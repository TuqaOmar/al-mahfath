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
    if (postsCount.count < 8) {
      await runQuery("DELETE FROM community_posts");
      const posts = [
        ['أحمد محمد (حساب تجريبي)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad', 0, 'تدبر',
         'من أجمل اللطائف البلاغية في سورة البقرة: ﴿لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا﴾.. الله تعالى خفّف التكليف ليتناسب مع قدرة الإنسان، ولم يقل "طاقتها" لأن الطاقة أقصى ما يتحمله المرء، أما الوسع فهو السعة والراحة! سبحان الرحيم الكريم.',
         34, JSON.stringify([
           { id: 101, author: 'د. عبدالرحمن السالم', text: 'تبارك الله، لفتة تدبرية رائعة! الرحمة الإلهية متجلية في كل أحكام الشريعة.' },
           { id: 102, author: 'فاطمة الزهراء', text: 'جزاك الله خيراً، زرعت في قلبي الطمأنينة وأنا أراجع الورد اليوم.' }
         ])],
        ['الشيخ محمد علي (مقرئ)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sheikh', 0, 'متشابهات',
         '💡 فائدة لتثبيت المتشابهات بين البقرة وآل عمران:\nفي البقرة: ﴿سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِائَةُ حَبَّةٍ﴾، وفي آل عمران جاءت صيغة الجمع المكسر ﴿سُنْبُلَاتٍ﴾.\nالضابط: البقرة تفرد وتزيد في التفصيل، وآل عمران تجمع وتجمل!',
         52, JSON.stringify([
           { id: 103, author: 'يوسف العتيبي', text: 'ضابط ذهبي يا شيخنا، كنت أتلعثم فيها دائماً في الصلاة!' },
           { id: 104, author: 'أم ريان', text: 'كتب الله أجرك، حفظتها الآن بفضل هذا الضابط المحكم.' }
         ])],
        ['سارة خالد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', 0, 'نصيحة',
         'تجربتي مع نظام الحصون الخمسة بعد 3 أشهر:\nقبل الحصون كنت أحفظ 3 صفحات وأنسى صفحتين! بعد تطبيق "التحضير القريب (15 دقيقة)" وقراءة الورد في صلاة الليل، أصبحت الصفحة تثبت كالفاتحة 🌿.',
         41, JSON.stringify([
           { id: 105, author: 'عمر الفاروق', text: 'هل تطبقين التكرار الصوتي 20 مرة أم أكثر؟' },
           { id: 106, author: 'سارة خالد', text: 'التكرار 15 مرة مع استحضار موقع الآية في المصحف، ثم قراءتها في النوافل.' }
         ])],
        ['د. إبراهيم الحسيني', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim', 0, 'تجويد',
         'تنبيه تجويدي مهم في سورة الكهف عند قوله تعالى: ﴿مَالِ هَٰذَا الْكِتَابِ﴾:\nالرسم العثماني فصل كلمة (مَالِ) عن (هَٰذَا). ويجوز الوقف على (مَالِ) اضطراراً أو اختباراً بدون إثبات الياء، ثم الابتداء بـ (هَٰذَا).',
         29, JSON.stringify([
           { id: 107, author: 'مريم الغامدي', text: 'سبحان الله! فائدة تجويدية دقيقة ونادرة، شكراً دكتور إبراهيم.' }
         ])],
        ['هوية مخفية', null, 1, 'متشابهات',
         'كيف أجمع بين حفظ وجه جديد يومياً ومراجعة 5 أجزاء قديمة دون الشعور بالإرهاق والشتات؟ أحتاج جدول زمني مجرب.',
         19, JSON.stringify([
           { id: 108, author: 'أحمد محمد', text: 'قسم المراجعة على الصلوات الخمس: نصف جزء بعد كل صلاة مفروضة، ولن تشعر بأي ثقل بإذن الله!' },
           { id: 109, author: 'خالد بن سلطان', text: 'ركز على الرباط البعيد في النوافل، المراجعة في الصلاة أسرع طريقة للتثبيت.' }
         ])],
        ['عبدالرحمن السالم', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdelrahman', 0, 'تدبر',
         'في قصة الخضر مع موسى عليه السلام: ﴿وَأَمَّا الْغُلَامُ فَكَانَ أَبَوَاهُ مُؤْمِنَيْنِ﴾.. قد يبتليك الله بأمر ظاهره الألم وفي باطنه رحمة ولطف بك وبأهلك لا يعلمه إلا الله!',
         63, JSON.stringify([
           { id: 110, author: 'عائشة النجار', text: 'ونعم بالله، الحمد لله على كل أقدار الله وتدبيره الرفيع.' }
         ])],
        ['بلال الإبراهيمي', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Belal', 0, 'نصيحة',
         'بفضل الله ثم هذا التطبيق التفاعلي، أكملت اليوم حفظ الجزء الثلاثين (عمّ) مع ضبط التجويد! القادم سورة البقرة بإذن الله 💪.',
         48, JSON.stringify([
           { id: 111, author: 'أحمد محمد', text: 'مبارك يا بطل! اللهم بارك فيه واجعله حجة لك لا عليك.' },
           { id: 112, author: 'خالد عمر', text: 'ما شاء الله تبارك الرحمن، إنجاز يبعث بالأمل!' }
         ])],
        ['الشيخ محمد علي (مقرئ)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sheikh', 0, 'متشابهات',
         '﴿قُلْ لا أَجِدُ فِي مَا أُوحِيَ إِلَيَّ مُحَرَّماً﴾ (الأنعام)، قارنها مع: ﴿قُلْ إِنَّمَا حَرَّمَ رَبِّيَ الْفَوَاحِشَ﴾ (الأعراف).\nفائدة: الأنعام تناقش الأطعمة والمأكولات، والأعراف تناقش السلوكيات والكبائر!',
         37, JSON.stringify([
           { id: 113, author: 'زياد الشمري', text: 'الله أكبر! ربط تدبر موضوعي رائع جداً يسهل استذكار السورتين.' }
         ])]
      ];
      for (const p of posts) {
        await runQuery(`
          INSERT INTO community_posts (author, avatar, isAnonymous, category, content, likes, answers)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, p);
      }
      console.log('✅ Seeded 8 realistic community posts for test account & community.');
    }
  });
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Password hashing helper using crypto PBKDF2
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (!salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// In-Memory Database State
let dbState = {
  users: [],
  quran_pages: [],
  community_posts: [],
  ai_chat_history: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (Array.isArray(data.users)) dbState.users = data.users;
      if (Array.isArray(data.quranPages)) dbState.quran_pages = data.quranPages;
      if (Array.isArray(data.quran_pages)) dbState.quran_pages = data.quran_pages;
      if (Array.isArray(data.communityPosts)) dbState.community_posts = data.communityPosts;
      if (Array.isArray(data.community_posts)) dbState.community_posts = data.community_posts;
      if (Array.isArray(data.aiChatHistory)) dbState.ai_chat_history = data.aiChatHistory;
      if (Array.isArray(data.ai_chat_history)) dbState.ai_chat_history = data.ai_chat_history;
    }
  } catch (e) {
    console.error('Error loading db.json:', e);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: dbState.users,
      quranPages: dbState.quran_pages,
      communityPosts: dbState.community_posts,
      aiChatHistory: dbState.ai_chat_history
    }, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db.json:', e);
  }
}

// Seed Initial Data if empty
function seedDb() {
  loadDb();

  // Admin User Seed
  if (!dbState.users.some(u => u.uid === 'admin_123')) {
    const { salt, hash } = hashPassword('admin123');
    dbState.users.push({
      uid: 'admin_123',
      name: 'مدير النظام (أدمن)',
      email: 'admin@ma7fath.ai',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
      hasCompletedWizard: 1,
      role: 'admin',
      streak: 15,
      xp: 9999,
      level: 99,
      memorizedPagesCount: 604,
      memoryScore: 100,
      totalJuz: 30.0,
      salt,
      passwordHash: hash,
      preferences: JSON.stringify({
        level: 'حافظ كامل المصحف',
        dailyTarget: 'مراجعة جزئين يومياً',
        learningStyle: 'مختلط (شامل)',
        motivation: 'إدارة وتوجيه مجتمع حفاظ القرآن الكريم',
        reminder: 'على مدار اليوم'
      })
    });
  }

  // Demo User Seed
  if (!dbState.users.some(u => u.uid === 'demo_user_123')) {
    const { salt, hash } = hashPassword('demo123');
    dbState.users.push({
      uid: 'demo_user_123',
      name: 'أحمد محمد',
      email: 'demo@ma7fath.ai',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
      hasCompletedWizard: 1,
      role: 'user',
      streak: 23,
      xp: 2450,
      level: 12,
      memorizedPagesCount: 49,
      memoryScore: 87,
      totalJuz: 2.5,
      salt,
      passwordHash: hash,
      preferences: JSON.stringify({
        level: 'متوسط (أحفظ بعض الأجزاء)',
        dailyTarget: 'صفحة واحدة يومياً',
        learningStyle: 'سمعي بصري (مختلط)',
        motivation: 'تثبيت حفظ سورة البقرة وآل عمران والتقرب إلى الله',
        reminder: 'بعد صلاة الفجر'
      })
    });
  }

  // Quran Pages Seed
  if (dbState.quran_pages.length < 20) {
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
      [49, 'excellent', 93, 'البقرة',       3, 'أمس',          0]
    ];
    for (const p of pagesData) {
      if (!dbState.quran_pages.some(qp => qp.pageNumber === p[0])) {
        dbState.quran_pages.push({
          pageNumber: p[0],
          status: p[1],
          score: p[2],
          surahName: p[3],
          juz: p[4],
          lastReviewed: p[5],
          errorsCount: p[6]
        });
      }
    }
  }

  // Community Posts Seed
  if (dbState.community_posts.length < 3) {
    dbState.community_posts = [
      {
        id: 1,
        author: 'أحمد محمد (حساب تجريبي)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
        isAnonymous: 0,
        category: 'تدبر',
        timeAgo: 'منذ ساعتين',
        content: 'من أجمل اللطائف البلاغية في سورة البقرة: ﴿لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا﴾.. الله تعالى خفّف التكليف ليتناسب مع قدرة الإنسان، ولم يقل "طاقتها" لأن الطاقة أقصى ما يتحمله المرء، أما الوسع فهو السعة والراحة! سبحان الرحيم الكريم.',
        likes: 34,
        answers: JSON.stringify([
          { id: 101, author: 'د. عبدالرحمن السالم', text: 'تبارك الله، لفتة تدبرية رائعة! الرحمة الإلهية متجلية في كل أحكام الشريعة.' },
          { id: 102, author: 'فاطمة الزهراء', text: 'جزاك الله خيراً، زرعت في قلبي الطمأنينة وأنا أراجع الورد اليوم.' }
        ])
      },
      {
        id: 2,
        author: 'الشيخ محمد علي (مقرئ)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sheikh',
        isAnonymous: 0,
        category: 'متشابهات',
        timeAgo: 'منذ 4 ساعات',
        content: '💡 فائدة لتثبيت المتشابهات بين البقرة وآل عمران:\nفي البقرة: ﴿سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِائَةُ حَبَّةٍ﴾، وفي آل عمران جاءت صيغة الجمع المكسر ﴿سُنْبُلَاتٍ﴾.\nالضابط: البقرة تفرد وتزيد في التفصيل، وآل عمران تجمع وتجمل!',
        likes: 52,
        answers: JSON.stringify([
          { id: 103, author: 'يوسف العتيبي', text: 'ضابط ذهبي يا شيخنا، كنت أتلعثم فيها دائماً في الصلاة!' },
          { id: 104, author: 'أم ريان', text: 'كتب الله أجرك، حفظتها الآن بفضل هذا الضابط المحكم.' }
        ])
      },
      {
        id: 3,
        author: 'سارة خالد',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
        isAnonymous: 0,
        category: 'نصيحة',
        timeAgo: 'منذ يوم',
        content: 'تجربتي مع نظام الحصون الخمسة بعد 3 أشهر:\nقبل الحصون كنت أحفظ 3 صفحات وأنسى صفحتين! بعد تطبيق "التحضير القريب (15 دقيقة)" وقراءة الورد في صلاة الليل، أصبحت الصفحة تثبت كالفاتحة 🌿.',
        likes: 41,
        answers: JSON.stringify([
          { id: 105, author: 'عمر الفاروق', text: 'هل تطبقين التكرار الصوتي 20 مرة أم أكثر؟' }
        ])
      }
    ];
  }

  saveDb();
}

seedDb();

// Query Dispatcher
export async function runQuery(sql, params = []) {
  const sqlTrim = sql.trim();
  const upper = sqlTrim.toUpperCase();

  if (upper.startsWith('INSERT INTO USERS')) {
    const userObj = {
      uid: params[0],
      name: params[1],
      email: params[2],
      photoURL: params[3],
      hasCompletedWizard: params[4],
      role: params[5],
      streak: params[6],
      xp: params[7],
      level: params[8],
      memorizedPagesCount: params[9],
      memoryScore: params[10],
      totalJuz: params[11],
      salt: params[12],
      passwordHash: params[13],
      preferences: params[14]
    };
    dbState.users = dbState.users.filter(u => u.uid !== userObj.uid);
    dbState.users.push(userObj);
    saveDb();
    return { lastID: userObj.uid, changes: 1 };
  }

  if (upper.startsWith('UPDATE USERS SET NAME = ?, HASCOMPLETEDWIZARD = ?')) {
    const [name, hasCompletedWizard, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, preferences, uid] = params;
    const user = dbState.users.find(u => u.uid === uid);
    if (user) {
      user.name = name;
      user.hasCompletedWizard = hasCompletedWizard;
      user.streak = streak;
      user.xp = xp;
      user.level = level;
      user.memorizedPagesCount = memorizedPagesCount;
      user.memoryScore = memoryScore;
      user.totalJuz = totalJuz;
      user.preferences = preferences;
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('UPDATE USERS SET NAME = ?, LEVEL = ?')) {
    const [name, level, xp, memorizedPagesCount, totalJuz, uid] = params;
    const user = dbState.users.find(u => u.uid === uid);
    if (user) {
      user.name = name;
      user.level = level;
      user.xp = xp;
      user.memorizedPagesCount = memorizedPagesCount;
      user.totalJuz = totalJuz;
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('DELETE FROM USERS WHERE UID = ?')) {
    const uid = params[0];
    const lenBefore = dbState.users.length;
    dbState.users = dbState.users.filter(u => u.uid !== uid);
    saveDb();
    return { changes: lenBefore - dbState.users.length };
  }

  if (upper.includes('UPDATE QURAN_PAGES') && upper.includes("SET STATUS = 'EXCELLENT'")) {
    const pageNum = Number(params[0]);
    let count = 0;
    dbState.quran_pages.forEach(p => {
      if (p.pageNumber <= pageNum) {
        p.status = 'excellent';
        p.score = 98;
        count++;
      }
    });
    saveDb();
    return { changes: count };
  }

  if (upper.startsWith('UPDATE QURAN_PAGES SET STATUS = ?, SCORE = ?')) {
    const [status, score, pageNumber] = params;
    const p = dbState.quran_pages.find(qp => qp.pageNumber === Number(pageNumber));
    if (p) {
      p.status = status;
      p.score = score;
      p.lastReviewed = 'اليوم';
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('INSERT INTO QURAN_PAGES') || upper.startsWith('INSERT OR IGNORE INTO QURAN_PAGES')) {
    const [pageNumber, status, score, surahName, juz, lastReviewed, errorsCount] = params;
    const existing = dbState.quran_pages.find(qp => qp.pageNumber === Number(pageNumber));
    if (!existing) {
      dbState.quran_pages.push({
        pageNumber: Number(pageNumber),
        status: status || 'excellent',
        score: score || 95,
        surahName: surahName || `صفحة ${pageNumber}`,
        juz: juz || Math.ceil(Number(pageNumber) / 20),
        lastReviewed: lastReviewed || 'اليوم',
        errorsCount: errorsCount || 0
      });
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('INSERT INTO COMMUNITY_POSTS')) {
    const author = params[0];
    const avatar = params[1];
    const isAnonymous = params[2];
    const category = params[3];
    const timeAgo = params.length > 6 ? params[4] : 'الآن';
    const content = params.length > 6 ? params[5] : params[4];
    const likes = params.length > 6 ? params[6] : 0;
    const answers = params.length > 7 ? params[7] : '[]';

    const newId = (dbState.community_posts.reduce((max, p) => Math.max(max, p.id || 0), 0)) + 1;
    const post = {
      id: newId,
      author,
      avatar,
      isAnonymous,
      category,
      timeAgo: timeAgo || 'الآن',
      content,
      likes: likes || 0,
      answers: typeof answers === 'string' ? answers : JSON.stringify(answers || [])
    };
    dbState.community_posts.unshift(post);
    saveDb();
    return { lastID: newId, changes: 1 };
  }

  if (upper.startsWith('UPDATE COMMUNITY_POSTS SET LIKES = ?')) {
    const [likes, id] = params;
    const post = dbState.community_posts.find(p => p.id === Number(id));
    if (post) {
      post.likes = likes;
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('UPDATE COMMUNITY_POSTS SET ANSWERS = ?')) {
    const [answers, id] = params;
    const post = dbState.community_posts.find(p => p.id === Number(id));
    if (post) {
      post.answers = typeof answers === 'string' ? answers : JSON.stringify(answers);
      saveDb();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (upper.startsWith('DELETE FROM COMMUNITY_POSTS')) {
    dbState.community_posts = [];
    saveDb();
    return { changes: 1 };
  }

  if (upper.startsWith('INSERT INTO AI_CHAT_HISTORY')) {
    const [sender, text] = params;
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    dbState.ai_chat_history.push({ id: newId, sender, text, timestamp: Math.floor(Date.now() / 1000) });
    saveDb();
    return { lastID: newId, changes: 1 };
  }

  if (upper.startsWith('DELETE FROM AI_CHAT_HISTORY')) {
    dbState.ai_chat_history = [];
    saveDb();
    return { changes: 1 };
  }

  saveDb();
  return { changes: 0 };
}

export async function getRow(sql, params = []) {
  const sqlTrim = sql.trim();
  const upper = sqlTrim.toUpperCase();

  if (upper.includes('FROM USERS WHERE EMAIL = ?')) {
    const email = (params[0] || '').trim().toLowerCase();
    const user = dbState.users.find(u => (u.email || '').trim().toLowerCase() === email);
    return user ? { ...user } : null;
  }

  if (upper.includes('FROM USERS WHERE UID = ?')) {
    const uid = params[0];
    const user = dbState.users.find(u => u.uid === uid);
    return user ? { ...user } : null;
  }

  if (upper.includes('FROM QURAN_PAGES WHERE PAGENUMBER = ?')) {
    const pageNum = Number(params[0]);
    const p = dbState.quran_pages.find(qp => qp.pageNumber === pageNum);
    return p ? { ...p } : null;
  }

  if (upper.includes('FROM COMMUNITY_POSTS WHERE ID = ?')) {
    const id = Number(params[0]);
    const post = dbState.community_posts.find(p => p.id === id);
    return post ? { ...post } : null;
  }

  if (upper.includes('COUNT(*) AS COUNT FROM QURAN_PAGES')) {
    return { count: dbState.quran_pages.length };
  }

  if (upper.includes('COUNT(*) AS COUNT FROM COMMUNITY_POSTS')) {
    return { count: dbState.community_posts.length };
  }

  return null;
}

export async function allRows(sql, params = []) {
  const sqlTrim = sql.trim();
  const upper = sqlTrim.toUpperCase();

  if (upper.includes('FROM USERS')) {
    return dbState.users.map(u => ({ ...u }));
  }

  if (upper.includes('FROM QURAN_PAGES')) {
    return dbState.quran_pages.map(p => ({ ...p }));
  }

  if (upper.includes('FROM COMMUNITY_POSTS')) {
    const posts = dbState.community_posts.map(p => ({ ...p }));
    if (upper.includes('ORDER BY ID DESC')) {
      posts.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    return posts;
  }

  if (upper.includes('FROM AI_CHAT_HISTORY')) {
    const history = dbState.ai_chat_history.map(h => ({ ...h }));
    if (upper.includes('ORDER BY ID ASC')) {
      history.sort((a, b) => (a.id || 0) - (b.id || 0));
    }
    return history.slice(0, 100);
  }

  return [];
}

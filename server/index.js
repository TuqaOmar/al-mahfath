import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  runQuery, 
  getRow, 
  allRows, 
  hashPassword, 
  verifyPassword,
  getUserPortfolio,
  saveAyahToPortfolio,
  bulkSaveSurahToPortfolio
} from './database.js';
import { analyzeRecitation, compareRecitation, comparePageRecitation } from './recitationEngine.js';
import {
  RecitationError, preparePracticeRequest, findPracticeAttempt, savePracticeAttempt,
  confirmPracticeAttempt, readPracticeHistory, readPracticeStats, readPracticePageStats,
  practicePerformanceReport
} from './firestoreRecitation.js';
import { requireAuth, optionalAuth, requireAdmin, db as adminDb } from './middleware/auth.js';
import groupsRouter from './routes/groups.js';
import communityRouter from './routes/community.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Logger middleware for API endpoints
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API ${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'خادم محفظ AI يعمل بنجاح 🚀', timestamp: new Date() });
});

// Helper to safely parse user preferences whether stored as string or object
function safeParsePreferences(prefs) {
  if (!prefs) return {};
  if (typeof prefs === 'object') return prefs;
  try {
    return JSON.parse(prefs);
  } catch (e) {
    return {};
  }
}

// --- AUTHENTICATION & USER ENDPOINTS ---

// Signup Endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
  }

  try {
    const userExists = await getRow('SELECT * FROM users WHERE email = ?', [email]);
    if (userExists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const { salt, hash } = hashPassword(password);
    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const role = email === 'admin@ma7fath.ai' ? 'admin' : 'user';

    await runQuery(`
      INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uid,
      name || 'حافظ جديد',
      email,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name || 'User'),
      0,
      role,
      1,
      100,
      1,
      1,
      90,
      0.05,
      salt,
      hash,
      '{}'
    ]);

    const newUser = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    if (newUser) delete newUser.passwordHash && delete newUser.salt;

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء التسجيل' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getRow('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // If password is not provided (e.g. legacy or test account quick login handles this)
    if (password) {
      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }
    }

    // Remove sensitive fields
    delete user.passwordHash;
    delete user.salt;
    user.preferences = safeParsePreferences(user.preferences);
    user.hasCompletedWizard = Boolean(user.hasCompletedWizard);

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

// Dedicated Google SSO Auth Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { email, name, photoURL, uid: clientUid } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني لحساب جوجل مطلوب' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userName = name || normalizedEmail.split('@')[0] || 'مستخدم Google';
  const userPhoto = photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

  try {
    let user = await getRow('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (user) {
      if (name && name.trim() && user.name !== name.trim()) {
        user.name = name.trim();
        await runQuery('UPDATE users SET name = ? WHERE uid = ?', [user.name, user.uid]);
      }
      delete user.passwordHash;
      delete user.salt;
      user.preferences = safeParsePreferences(user.preferences);
      user.hasCompletedWizard = Boolean(user.hasCompletedWizard);
      return res.json({ success: true, user });
    }

    // Create new Google user
    const uid = clientUid || ('google_' + Math.random().toString(36).substr(2, 9));
    const role = normalizedEmail === 'admin@ma7fath.ai' ? 'admin' : 'user';

    await runQuery(`
      INSERT INTO users (uid, name, email, photoURL, hasCompletedWizard, role, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, salt, passwordHash, preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uid,
      userName,
      normalizedEmail,
      userPhoto,
      0,
      role,
      1,
      100,
      1,
      1,
      90,
      0.05,
      'google_sso_salt',
      'google_sso_hash',
      '{}'
    ]);

    const newUser = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    if (newUser) {
      delete newUser.passwordHash;
      delete newUser.salt;
      try {
        newUser.preferences = JSON.parse(newUser.preferences);
      } catch (e) {
        newUser.preferences = {};
      }
    }

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول بحساب جوجل' });
  }
});
app.post('/api/auth/demo', async (req, res) => {
  try {
    const user = await getRow("SELECT * FROM users WHERE uid = 'demo_user_123'");
    if (user) {
      delete user.passwordHash;
      delete user.salt;
      user.preferences = safeParsePreferences(user.preferences);
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Admin Test Account Login
app.post('/api/auth/admin', async (req, res) => {
  try {
    const user = await getRow("SELECT * FROM users WHERE uid = 'admin_123'");
    if (user) {
      delete user.passwordHash;
      delete user.salt;
      user.preferences = safeParsePreferences(user.preferences);
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Get User Profile & Stats (requires auth - self or admin)
app.get('/api/user/:uid', requireAuth, async (req, res) => {
  const { uid } = req.params;
  const userRole = req.user.role || '';
  const userRoles = req.user.roles || {};
  const isAdmin = userRole === 'admin' || userRoles.admin === true;
  if (req.user.uid !== uid && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot view another user profile' });
  }
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const user = { ...userDoc.data(), uid };
      delete user.passwordHash;
      delete user.salt;
      user.preferences = safeParsePreferences(user.preferences);
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Update User Preferences, stats
app.put('/api/user/:uid', requireAuth, async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;

  // Authorization: Only the user can update their own profile
  if (req.user.uid !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify another user' });
  }

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const allowed = ['name', 'photoURL', 'preferences', 'hasCompletedWizard'];
    if (Object.keys(updates).some(key => !allowed.includes(key))) {
      return res.status(400).json({ success: false, message: 'تحديث يتضمن حقولًا غير مسموحة' });
    }
    if ('hasCompletedWizard' in updates && updates.hasCompletedWizard !== true) {
      return res.status(400).json({ success: false, message: 'حالة الإعداد غير صالحة' });
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false });
    await userRef.update(updates);
    const updatedUser = { ...(await userRef.get()).data(), uid };
    delete updatedUser.passwordHash;
    delete updatedUser.salt;
    updatedUser.preferences = safeParsePreferences(updatedUser.preferences);
    updatedUser.hasCompletedWizard = Boolean(updatedUser.hasCompletedWizard);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تحديث البيانات' });
  }
});

// Save / Update User Fortress Plan
// requireAuth: only the user themselves can save their own plan
app.post('/api/user/fortress-plan', requireAuth, async (req, res) => {
  const { userId, plan } = req.body;
  if (!userId || !plan) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم والخطة مطلوبان' });
  }
  // Authorization: only the authenticated user can modify their own plan
  if (req.user.uid !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify another user\'s plan' });
  }
  try {
    const user = await getRow('SELECT * FROM users WHERE uid = ?', [userId]);
    if (user) {
      let prefs = {};
      try {
        prefs = JSON.parse(user.preferences || '{}');
      } catch (e) {}
      prefs.fortressPlan = plan;
      prefs.fortressesToday = plan.completionStatus || prefs.fortressesToday;
      await runQuery('UPDATE users SET preferences = ? WHERE uid = ?', [JSON.stringify(prefs), userId]);
    }
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error saving fortress plan:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في حفظ الخطة' });
  }
});

// Get User Fortress Plan
app.get('/api/user/fortress-plan/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const user = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    if (user && user.preferences) {
      try {
        const prefs = JSON.parse(user.preferences);
        if (prefs.fortressPlan) {
          return res.json({ success: true, plan: prefs.fortressPlan });
        }
      } catch (e) {}
    }
    res.json({ success: false, message: 'لا توجد خطة محفوظة' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// --- USER PERSONAL MEMORIZATION PORTFOLIO (محفظة الحفظ الشخصية) ---
// Get all portfolio ayahs for user (authenticated, owner only)
app.get('/api/user/:uid/portfolio', requireAuth, async (req, res) => {
  const { uid } = req.params;
  if (req.user.uid !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot read another user\'s portfolio' });
  }
  try {
    const portfolio = getUserPortfolio(uid);
    res.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'تعذر جلب بيانات المحفظة' });
  }
});

// Update or save single ayah memorization progress (authenticated, owner only)
app.post('/api/user/:uid/portfolio/ayah', requireAuth, async (req, res) => {
  const { uid } = req.params;
  if (req.user.uid !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify another user\'s portfolio' });
  }
  const ayahData = req.body;
  try {
    const saved = saveAyahToPortfolio(uid, ayahData);
    res.json({ success: true, item: saved });
  } catch (error) {
    console.error('Error saving ayah to portfolio:', error);
    res.status(500).json({ success: false, message: 'تعذر حفظ تقدم الآية في المحفظة' });
  }
});

// Bulk update surah ayahs in portfolio (authenticated, owner only)
app.post('/api/user/:uid/portfolio/bulk-surah', requireAuth, async (req, res) => {
  const { uid } = req.params;
  if (req.user.uid !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot bulk-update another user\'s portfolio' });
  }
  const { surahNumber, ayahs } = req.body;
  try {
    const results = bulkSaveSurahToPortfolio(uid, surahNumber, ayahs);
    res.json({ success: true, count: results.length, items: results });
  } catch (error) {
    console.error('Error bulk updating surah:', error);
    res.status(500).json({ success: false, message: 'تعذر تحديث السورة في المحفظة' });
  }
});

// Delete User Account endpoint removed due to security vulnerability (missing auth and authorization)
// and destructive global DELETE FROM quran_pages behavior.

// --- ADMIN ENDPOINTS ---

app.use('/api', groupsRouter);
app.use('/api', communityRouter);
app.use('/api/admin', requireAuth, requireAdmin);

app.put('/api/admin/user/:uid', async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;

  try {
    const user = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const name = updates.name !== undefined ? updates.name : user.name;
    const level = updates.level !== undefined ? updates.level : user.level;
    const xp = updates.xp !== undefined ? updates.xp : user.xp;
    const memorizedPagesCount = updates.memorizedPagesCount !== undefined ? updates.memorizedPagesCount : user.memorizedPagesCount;
    const totalJuz = updates.totalJuz !== undefined ? updates.totalJuz : user.totalJuz;

    await runQuery(`
      UPDATE users SET name = ?, level = ?, xp = ?, memorizedPagesCount = ?, totalJuz = ?
      WHERE uid = ?
    `, [name, level, xp, memorizedPagesCount, totalJuz, uid]);

    const updatedUser = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    delete updatedUser.passwordHash;
    delete updatedUser.salt;
    updatedUser.preferences = safeParsePreferences(updatedUser.preferences);
    updatedUser.hasCompletedWizard = Boolean(updatedUser.hasCompletedWizard);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.delete('/api/admin/user/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await runQuery('DELETE FROM users WHERE uid = ?', [uid]);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// --- QURAN MAP 604 PAGES ENDPOINT ---

app.get('/api/quran/pages', async (req, res) => {
  try {
    const pages = await allRows('SELECT * FROM quran_pages');
    res.json({ success: true, pages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/quran/pages/:pageNumber/review', requireAuth, (req, res) => {
  // This legacy endpoint accepted arbitrary scores and awarded JSON XP. No
  // current UI calls it; server comparison with a stable attempt ID replaces it.
  res.status(410).json({ success: false, message: 'استخدم /api/ai/recitation-check مع sessionId لتسجيل محاولة مقارنة محسوبة في الخادم' });
});


// --- AI CHATBOT ENDPOINT ---

app.get('/api/ai/chat', async (req, res) => {
  const userId = req.query.userId || 'default';
  try {
    const history = await allRows('SELECT * FROM ai_chat_history ORDER BY id ASC LIMIT 100', [userId]);
    res.json({ success: true, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.delete('/api/ai/chat', async (req, res) => {
  const userId = req.query.userId || req.body?.userId;
  try {
    await runQuery('DELETE FROM ai_chat_history', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

function getSmartFallbackResponse(message, userContext = {}) {
  const msg = message.toLowerCase();
  const page = userContext.currentPage || ((userContext.memorizedPagesCount || 0) + 1);
  const surah = userContext.currentSurah || 'البقرة';
  const juz = userContext.currentJuz || Math.min(30, Math.max(1, Math.ceil(page / 20)));
  const nearReviewStart = Math.max(1, page - 20);
  const nearReviewEnd = Math.max(1, page - 1);
  const nextNightPrepPage = page + 1;

  if (/سلام|مرحب|أهل|اهل|هلا|صباح|مساء/.test(msg)) {
    return `وعليكم السلام ورحمة الله وبركاته ومغفرته! 🌿✨\n\nأهلاً بك يا حافظ كتاب الله (${userContext.name || 'أخي الكريم'}). أنت الآن عند **الصفحة ${page} (سورة ${surah} - الجزء ${juz})**، وقد أتممت بفضل الله ${userContext.memorizedPagesCount || 0} صفحة.\n\nكيف يمكنني إعانتك اليوم؟ يمكنك سؤالي عن خطة الحصون الخمسة، تثبيت المتشابهات، جدول التكرار، أو كيفية مراجعة الأجزاء السابقة.`;
  } else if (/خطة|جدول|حصون|خمسة|ورد اليوم|ايش اراجع|شو اراجع|وين وصلت|اين وصلت|متى اراجع|الحصون الخمسة/.test(msg)) {
    return `🏰 **خطتك اليومية الدقيقة بنظام الحصون الخمسة (بناءً على موقعك الحالي):**\n\n` +
      `📍 **موقعك الحالي:** الصفحة **${page}** من سورة **${surah}** (الجزء ${juz}).\n` +
      `📊 **الصفحات المحفوظة:** ${userContext.memorizedPagesCount || 0} صفحة.\n\n` +
      `---\n\n` +
      `1️⃣ **الحصن الأول (قراءة الاستماع والورد نظراً):**\n` +
      `• **المطلوب اليوم:** قراءة **الجزء ${juz}** كاملاً (الصفحات ${(juz - 1) * 20 + 1} إلى ${juz * 20}) نظراً بالحدر السريع المتقن في 20 دقيقة.\n` +
      `• **الهدف:** شحن الذاكرة البصرية وتثبيت أماكن الآيات ورؤوس الفواصل.\n\n` +
      `2️⃣ **الحصن الثاني (التحضير الثلاثي):**\n` +
      `• **التحضير الأسبوعي:** سماع سورة **${surah}** كاملة 3 مرات مع تدبر مقاصدها.\n` +
      `• **التحضير الليلي (الليلة قبل النوم):** تلاوة **الصفحة ${nextNightPrepPage}** من 5 إلى 10 مرات وسماعها بتركيز.\n` +
      `• **التحضير القريب (قبل الحفظ بـ 15 دقيقة):** تلاوة **الصفحة ${page}** 15 مرة لتصفية الذهن.\n\n` +
      `3️⃣ **الحصن الثالث (الحفظ الجديد الفعلي):**\n` +
      `• **المطلوب اليوم:** حفظ **الصفحة ${page}** من سورة **${surah}**.\n` +
      `• **طريقة الإتقان:** تكرار كل آية 20 مرة، وكل مقطع 20 مرة، وسرد الصفحة كاملة غيباً 40 مرة حتى تكون كالفاتحة.\n\n` +
      `4️⃣ **الحصن الرابع (المراجعة القريبة اليومية):**\n` +
      `• **المطلوب اليوم:** مراجعة غيباً وسرداً بالحدر للصفحات من **${nearReviewStart} إلى ${nearReviewEnd}** (آخر 20 صفحة تم حفظها) في 20 دقيقة.\n\n` +
      `5️⃣ **الحصن الخامس (المراجعة البعيدة والمعاهدة في الصلاة):**\n` +
      `• **المطلوب اليوم:** مراجعة جزء من قديم المحفوظ وتلاوة ما حفظته في ركعات السنن، الوتر، وقيام الليل.\n\n` +
      `✨ *القاعدة الذهبية لد. سعيد حمزة: "من قرأ القرآن في صلاته ثَبَت، ومن قرأه في غير صلاته كَثُر ثوابه وتفلت حفظه".*`;
  } else if (/تكرار|كم مرة|طريقة الحفظ|كيف احفظ|سر التكرار|40 مرة|20 مرة/.test(msg)) {
    return `🔁 **قاعدة التكرار الذهبية في منهجية الحصون الخمسة:**\n\n1. **تكرار الآية الواحدة:** كرر كل آية (20 مرة) غيباً مع النظر في المصحف فقط عند التعثر، حتى تطبع الآية في ذهنك كالصورة.\n2. **تكرار الربط بين الآيات:** عند الانتهاء من الآية الأولى والثانية، اقرأهما معاً (20 مرة) لربط الفواصل.\n3. **تكرار الصفحة كاملة:** بعد حفظ الصفحة كاملة، اسردها غيباً بصوت مسموع (40 مرة) متفرقة على مدار اليوم.\n\n💡 *سر النجاح:* لا تنتقل إلى صفحة جديدة إلا بعد أن تصبح صفحة اليوم جارية على لسانك كالفاتحة دون أدنى تردد.`;
  } else if (/متشابه|تشابه|ربط|تثبيت|فواصل/.test(msg)) {
    return `🌿 **ضوابط وقواعد ضبط المتشابهات القرآنية:**\n\n1. **الربط بالحرف المشترك:** اربط الحرف المميز في الآية باسم السورة (مثلاً: إن الله بما تعملون خبير / بصير).\n2. **قاعدة العناية بالسياق العام:** الآية المتشابهة دائماً تخدم سياق السورة وموضوعها الأساسي.\n3. **السرد بالحدر بصوت مسموع:** التكرار الصوتي المسموع يرسخ الفواصل في الذاكرة السمعية.\n4. **تدوين المتشابه في هامش المصحف:** اكتب الآية المقابلة في مصحفك الخاص حتى لا تلتبس عليك عند التسميع.`;
  } else if (/صلاة|قيام|ليل|وتر|نافلة|ركعتين/.test(msg)) {
    return `🤲 **الحصن الخامس (الصلاة بالمحفوظ):**\n\nقال السلف الصالح: **"لا يثبت القرآن في الصدر إلا بقيام الليل"**.\n\n• اجعل صفحة اليوم (الصفحة ${page}) وورد المراجعة القريبة (${nearReviewStart} - ${nearReviewEnd}) هما وردك في ركعتي الوتر أو قيام الليل.\n• القراءة في الصلاة تُخرج الحفظ من دائرة الذاكرة المؤقتة إلى الاستقرار القلبي العميق.\n• إذا تعثرت في الصلاة، فذلك ينبهك فوراً للمواضع التي تحتاج إعادة تكرار في الغد.`;
  } else if (/نسيان|انسى|أنسى|تفلت|ضعيف|مش حافظ/.test(msg)) {
    return `💚 **علاج تفلت الحفظ ونسيان الآيات:**\n\nقال النبي ﷺ: **"تعاهدوا هذا القرآن، فوالذي نفسي بيده لهو أشد تفلتاً من الإبل في عقلها"**.\n\n1. لا تقلق، فالنسيان طبيعي والحل يكمن في **المعاهدة اليومية (المراجعة القريبة بالحدر 20 دقيقة)**.\n2. تأكد من إتقان **قراءة الاستماع نظراً**؛ فالنظر في المصحف يقوي الحفظ البصري بنسبة 70%.\n3. لا تحفظ حفظاً جديداً إذا كان القديم متفلتاً؛ اجعل اليوم يوم تثبيت لما سبق حتى يرسخ.\n4. الاستغفار وترك المعاصي: قال الشافعي: "شكوت إلى وكيع سوء حفظي... فأرشدني إلى ترك المعاصي".`;
  } else if (/تجويد|مخارج|إدغام|ادغام|إخفاء|اخفاء|قلقلة|مد|غنة/.test(msg)) {
    return `✨ **أهم أصول وضوابط أحكام التجويد للحافظ:**\n\n- **النون الساكنة والتنوين:** الإظهار الحلقي (أ، هـ، ع، ح، غ، خ)، الإدغام (يرملون: بغنة في 'ينمو' وبغير غنة في 'ر، ل')، الإقلاب (ب)، الإخفاء الحقيقي (بقية 15 حرفاً).\n- **المدود:** المد الطبيعي (حركتان)، المتصل والمنفصل (4-5 حركات)، اللازم (6 حركات كلمي وحرفي).\n- **القلقلة:** قطب جد (صغرى في وسط الكلمة، كبرى عند الوقف).\n\n💡 *وصية:* الحدر في الحصون الخمسة لا يعني إسقاط الأحكام، بل الإسراع مع ضبط الغنن والمدود ومخارج الحروف.`;
  } else if (/تشجيع|محفزة|همة|تعبت|صعب|فرح/.test(msg)) {
    return `🌟 **بشارة لك يا صاحب القرآن:**\n\nقال رسول الله ﷺ: **"يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تَرَتِّلُ فِي الدُّنْيَا، فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا"** [رواه الترمذي وصححه الألباني].\n\nتذكر أن كل حرف تتلوه وتكرره لك به حسنة، والحسنة بعشر أمثالها.. فتكرارك لآية واحدة 20 مرة يثقل ميزانك بآلاف الحسنات. استعن بالله ولا تعجز!`;
  } else {
    return `🌿 **نصيحة مخصصة لسؤالك حول "${message.slice(0, 40)}":**\n\nبناءً على موقعك الحالي في **الصفحة ${page} من سورة ${surah} (الجزء ${juz})**:\n\n• احرص اليوم على ضبط الورد بدقة ولا تؤجل المراجعة.\n• قسّم وقتك: 20 دقيقة للورد نظراً بالحدر، و30 دقيقة للحفظ بالتكرار، و20 دقيقة لمراجعة الأوجه السابقة.\n• إن كان لديك أي سؤال محدد حول متشابهات آية معينة، حكم تجويدي، أو كيفية تنظيم وقتك، فاكتب لي وسأجيبك بالتفصيل! 📖✨`;
  }
}

app.post('/api/ai/chat', async (req, res) => {
  const { message, userId, userContext, history: clientHistory } = req.body;
  const targetUser = userId || 'default';
  const uCtx = userContext || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'الرسالة فارغة' });
  }

  try {
    let responseText = '';
    const apiKey = (req.body.apiKey && req.body.apiKey.trim()) || process.env.GEMINI_API_KEY;

    const userStatePrompt = `
[بيانات الحافظ الحالية]:
- الاسم: ${uCtx.name || 'حافظ القرآن'}
- الصفحة الحالية للحفظ: ${uCtx.currentPage || 1}
- السورة الحالية: ${uCtx.currentSurah || 'الفاتحة'}
- الجزء الحالي: ${uCtx.currentJuz || 1}
- نمط الحفظ: ${uCtx.learningStyle || 'سمعي بصري'}
- عدد الصفحات المحفوظة: ${uCtx.memorizedPagesCount || 0}
- الحصون المنجزة اليوم: ${JSON.stringify(uCtx.fortressesToday || {})}
- الهدف اليومي المختار: ${uCtx.dailyTarget || 'صفحة واحدة'}
`;

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('mock')) {
      // Valid modern Gemini models
      const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: `${userStatePrompt}\n\n[سؤال أو طلب المستخدم]: ${message}`,
            config: {
              systemInstruction: "أنت معلم ومساعد قرآني خبير ومتقن في تطبيق محفظ AI، متخصص في منهجية (الحصون الخمسة) للشيخ د. سعيد أبو العلا حمزة. مهمتك إرشاد الحافظ وإجابته بدقة وعمق بناءً على سؤاله المحدد وموقعه الحالي في المصحف. أجب على سؤاله مباشرة وفصّل الحلول العملية باللغة العربية الفصحى مع التنسيق الجميل والرموز التعبيرية الهادئة والمشجعة. تجنب إعطاء نفس الإجابة النمطية المتكررة."
            }
          });

          if (response && response.text && response.text.trim()) {
            responseText = response.text.trim();
            console.log(`✅ Live Gemini AI response generated successfully using [${modelName}]!`);
            break;
          }
        } catch (modelErr) {
          console.log(`💡 Model [${modelName}] notice: ${modelErr.message}`);
        }
      }
    }

    if (!responseText || !responseText.trim()) {
      responseText = getSmartFallbackResponse(message, uCtx);
    }

    await runQuery('INSERT INTO ai_chat_history (sender, text, userId) VALUES (?, ?, ?)', ['user', message, targetUser]);
    await runQuery('INSERT INTO ai_chat_history (sender, text, userId) VALUES (?, ?, ?)', ['ai', responseText, targetUser]);

    const history = await allRows('SELECT * FROM ai_chat_history ORDER BY id ASC LIMIT 100', [targetUser]);
    res.json({ success: true, reply: responseText, history });
  } catch (e) {
    console.error('AI Chat error:', e);
    const fallbackText = getSmartFallbackResponse(message, uCtx);
    res.json({
      success: true,
      reply: fallbackText,
      history: [
        { id: Date.now(), sender: 'user', text: message, userId: targetUser },
        { id: Date.now() + 1, sender: 'ai', text: fallbackText, userId: targetUser }
      ]
    });
  }
});

// --- RECITATION VOICE AI & QURAN CHECK ENDPOINTS ---

// Check recitation by recorded audio or transcribed text, with accuracy calculation
app.post('/api/ai/recitation-check', optionalAuth, async (req, res) => {
  const { 
    audioBase64, 
    spokenText, 
    expectedText, 
    ayahs,
    isFullPage,
    token, 
    autoSave
  } = req.body;

  if (autoSave && !req.user?.uid) {
    return res.status(401).json({ success: false, message: 'Authentication is required to save a recitation session' });
  }

  if (!expectedText && (!ayahs || ayahs.length === 0)) {
    return res.status(400).json({ success: false, message: 'نص الآية أو قائمة آيات الصفحة مطلوبة للمقارنة' });
  }

  try {
    let result = null;
    const prepared = autoSave ? preparePracticeRequest(req.body) : null;
    if (prepared) {
      const saved = await findPracticeAttempt(req.user.uid, prepared);
      if (saved) return res.json({
        success: true, ...saved.result, savedSession: saved.session,
        recitationStats: await readPracticeStats(req.user.uid)
      });
    }
    const fullExpected = expectedText || (Array.isArray(ayahs) ? ayahs.map(a => a.text).join(' ') : '');

    // 1. If audio is provided, process through Whisper ASR with Gemini fallback
    if (audioBase64) {
      const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      const audioBuffer = Buffer.from(base64Data, 'base64');

      const analysis = await analyzeRecitation({
        audioBuffer,
        expectedText: fullExpected,
        ayahs: ayahs || [],
        isFullPage: Boolean(isFullPage),
        token
      });

      result = analysis;
    } 
    // 2. If spokenText is already provided (e.g. from Web Speech Recognition or typing)
    else if (spokenText && spokenText.trim()) {
      if (isFullPage && Array.isArray(ayahs) && ayahs.length > 0) {
        const comparison = comparePageRecitation(ayahs, spokenText);
        result = {
          transcribedText: spokenText.trim(),
          ...comparison
        };
      } else {
        const comparison = compareRecitation(fullExpected, spokenText);
        result = {
          transcribedText: spokenText.trim(),
          ...comparison
        };
      }
    } else {
      return res.status(400).json({ success: false, message: 'يرجى إرسال التسجيل الصوتي أو النص المنطوق' });
    }

    // Store server-computed practice results only. Client references are not
    // verified Quran data, so this cannot award XP or establish memorization.
    let savedSession = null;
    let recitationStats;
    if (prepared && result) {
      const saved = await savePracticeAttempt(req.user.uid, prepared, result);
      savedSession = saved.session;
      result = saved.result;
      recitationStats = await readPracticeStats(req.user.uid);
    }

    return res.json({
      success: true,
      ...result,
      classification: 'practice', referenceVerified: false, rewardedXp: 0,
      savedSession, recitationStats
    });
  } catch (err) {
    console.error('Recitation check error:', err);
    return res.status(err instanceof RecitationError ? err.status : autoSave ? 503 : 500).json({
      success: false,
      message: err.message || 'حدث خطأ أثناء فحص وتصحيح التلاوة'
    });
  }
});

// Confirm an already saved server analysis; never accept client-supplied scores.
app.post('/api/recitation/save', requireAuth, async (req, res) => {
  try {
    const saved = await confirmPracticeAttempt(req.user.uid, req.body || {});
    res.json({
      success: true,
      message: 'تم تأكيد محاولة التدريب المحفوظة',
      session: saved,
      recitationStats: await readPracticeStats(req.user.uid)
    });
  } catch (error) {
    console.error('Error saving recitation session:', error);
    res.status(error instanceof RecitationError ? error.status : 503).json({ success: false, message: error instanceof RecitationError ? error.message : 'تعذر تأكيد حفظ محاولة التدريب' });
  }
});

// Get recitation history for a user
app.get('/api/recitation/history', requireAuth, async (req, res) => {
  const { pageNumber, ayahNumber, surahNumber, limit } = req.query;
  try {
    const history = await readPracticeHistory(req.user.uid, { pageNumber, ayahNumber, surahNumber, limit });
    res.json({ success: true, count: history.length, history });
  } catch (error) {
    console.error('Error fetching recitation history:', error);
    res.status(error instanceof RecitationError ? error.status : 503).json({ success: false, message: error instanceof RecitationError ? error.message : 'تعذر جلب سجل التسميع' });
  }
});

// Get aggregated recitation stats for a Quran page
app.get('/api/recitation/page-stats/:pageNumber', requireAuth, async (req, res) => {
  const { pageNumber } = req.params;
  try {
    const stats = await readPracticePageStats(req.user.uid, pageNumber);
    res.json({ success: true, pageNumber: Number(pageNumber), stats });
  } catch (error) {
    console.error('Error fetching page recitation stats:', error);
    res.status(error instanceof RecitationError ? error.status : 503).json({ success: false, message: error instanceof RecitationError ? error.message : 'تعذر جلب إحصائيات تسميع الصفحة' });
  }
});

// Status of recitation engine
app.get('/api/ai/recitation-status', (req, res) => {
  const hasToken = Boolean(process.env.HUGGINGFACE_TOKEN);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    success: true,
    hasToken,
    hasGemini,
    models: [
      'tarteel-ai/whisper-base-ar-quran',
      'openai/whisper-large-v3-turbo',
      'gemini-2.5-flash-asr'
    ],
    activeModel: 'Whisper Quran + Gemini 2.5 Flash + Web Speech Recognition'
  });
});

// Admin Memorization Performance & Progress Analytics
app.get('/api/admin/memorization-performance', requireAuth, requireAdmin, async (req, res) => {
  try { res.json(await practicePerformanceReport()); }
  catch (error) {
    console.error('Practice performance report failed:', error.message);
    res.status(503).json({ success: false, message: 'تعذر قراءة تقرير محاولات التدريب' });
  }
});

// Serve Vite dev middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('=================================');
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

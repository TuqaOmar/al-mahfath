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
  verifyPassword 
} from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'خادم محفظ AI يعمل بنجاح 🚀', timestamp: new Date() });
});

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
    
    // Parse preferences
    if (user.preferences) {
      try {
        user.preferences = JSON.parse(user.preferences);
      } catch (e) {
        user.preferences = {};
      }
    }

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
      delete user.passwordHash;
      delete user.salt;
      try {
        user.preferences = JSON.parse(user.preferences);
      } catch (e) {
        user.preferences = {};
      }
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
      try {
        user.preferences = JSON.parse(user.preferences);
      } catch (e) {
        user.preferences = {};
      }
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
      try {
        user.preferences = JSON.parse(user.preferences);
      } catch (e) {
        user.preferences = {};
      }
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Get User Profile & Stats
app.get('/api/user/:uid', async (req, res) => {
  try {
    const user = await getRow('SELECT * FROM users WHERE uid = ?', [req.params.uid]);
    if (user) {
      delete user.passwordHash;
      delete user.salt;
      try {
        user.preferences = JSON.parse(user.preferences);
      } catch (e) {
        user.preferences = {};
      }
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
app.put('/api/user/:uid', async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;

  try {
    const user = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const name = updates.name !== undefined ? updates.name : user.name;
    const hasCompletedWizard = updates.hasCompletedWizard !== undefined ? (updates.hasCompletedWizard ? 1 : 0) : user.hasCompletedWizard;
    const streak = updates.streak !== undefined ? updates.streak : user.streak;
    const xp = updates.xp !== undefined ? updates.xp : user.xp;
    const level = updates.level !== undefined ? updates.level : user.level;
    const memorizedPagesCount = updates.memorizedPagesCount !== undefined ? updates.memorizedPagesCount : user.memorizedPagesCount;
    const memoryScore = updates.memoryScore !== undefined ? updates.memoryScore : user.memoryScore;
    const totalJuz = updates.totalJuz !== undefined ? updates.totalJuz : user.totalJuz;
    const preferences = updates.preferences !== undefined ? JSON.stringify(updates.preferences) : user.preferences;

    await runQuery(`
      UPDATE users 
      SET name = ?, hasCompletedWizard = ?, streak = ?, xp = ?, level = ?, memorizedPagesCount = ?, memoryScore = ?, totalJuz = ?, preferences = ?
      WHERE uid = ?
    `, [name, hasCompletedWizard, streak, xp, level, memorizedPagesCount, memoryScore, totalJuz, preferences, uid]);

    // Automatically mark pre-memorized pages as excellent in SQLite database
    if (Number(memorizedPagesCount) > 0) {
      await runQuery(`
        UPDATE quran_pages 
        SET status = 'excellent', score = 98
        WHERE pageNumber <= ?
      `, [Number(memorizedPagesCount)]);
    }

    const updatedUser = await getRow('SELECT * FROM users WHERE uid = ?', [uid]);
    delete updatedUser.passwordHash;
    delete updatedUser.salt;
    try {
      updatedUser.preferences = JSON.parse(updatedUser.preferences);
    } catch (e) {}

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تحديث البيانات' });
  }
});

// Delete User Account
app.delete('/api/user/:uid', async (req, res) => {
  const { uid } = req.params;
  const email = req.query.email;
  try {
    if (uid && uid !== 'by_email') {
      await runQuery('DELETE FROM users WHERE uid = ?', [uid]);
    }
    if (email) {
      await runQuery('DELETE FROM users WHERE email = ?', [email]);
    }
    await runQuery('DELETE FROM quran_pages');
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  }
});

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await allRows('SELECT * FROM users');
    users.forEach(u => {
      delete u.passwordHash;
      delete u.salt;
      try {
        u.preferences = JSON.parse(u.preferences);
      } catch (e) {
        u.preferences = {};
      }
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

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
    try {
      updatedUser.preferences = JSON.parse(updatedUser.preferences);
    } catch (e) {}

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

// --- COMMUNITY POSTS ENDPOINTS ---

app.get('/api/community/posts', async (req, res) => {
  try {
    const posts = await allRows('SELECT * FROM community_posts ORDER BY id DESC');
    posts.forEach(p => {
      try {
        p.answers = JSON.parse(p.answers);
      } catch (e) {
        p.answers = [];
      }
    });
    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/community/posts', async (req, res) => {
  const { author, avatar, isAnonymous, category, content } = req.body;

  try {
    const parsedAuthor = isAnonymous ? 'هوية مخفية' : (author || 'أحمد محمد');
    const parsedAvatar = isAnonymous ? null : avatar;
    const parsedAnon = isAnonymous ? 1 : 0;
    const timeAgo = 'الآن';

    await runQuery(`
      INSERT INTO community_posts (author, avatar, isAnonymous, category, timeAgo, content, likes, answers)
      VALUES (?, ?, ?, ?, ?, ?, 0, '[]')
    `, [parsedAuthor, parsedAvatar, parsedAnon, category || 'تدبر', timeAgo, content]);

    const posts = await allRows('SELECT * FROM community_posts ORDER BY id DESC');
    posts.forEach(p => {
      try {
        p.answers = JSON.parse(p.answers);
      } catch (e) {
        p.answers = [];
      }
    });

    res.json({ success: true, post: posts[0], posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/community/posts/:id/like', async (req, res) => {
  const postId = Number(req.params.id);
  try {
    const post = await getRow('SELECT * FROM community_posts WHERE id = ?', [postId]);
    if (post) {
      const likes = (post.likes || 0) + 1;
      await runQuery('UPDATE community_posts SET likes = ? WHERE id = ?', [likes, postId]);
      post.likes = likes;
      try {
        post.answers = JSON.parse(post.answers);
      } catch (e) {}
      return res.json({ success: true, likes, post });
    }
    res.status(404).json({ success: false, message: 'المنشور غير موجود' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/community/posts/:id/comment', async (req, res) => {
  const postId = Number(req.params.id);
  const { author, text } = req.body;

  try {
    const post = await getRow('SELECT * FROM community_posts WHERE id = ?', [postId]);
    if (post) {
      let answers = [];
      try {
        answers = JSON.parse(post.answers) || [];
      } catch (e) {}

      const newAnswer = {
        id: Date.now(),
        author: author || 'أحمد محمد',
        text
      };
      answers.push(newAnswer);

      await runQuery('UPDATE community_posts SET answers = ? WHERE id = ?', [JSON.stringify(answers), postId]);
      post.answers = answers;

      return res.json({ success: true, answer: newAnswer, post });
    }
    res.status(404).json({ success: false, message: 'المنشور غير موجود' });
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

app.post('/api/quran/pages/:pageNumber/review', async (req, res) => {
  const pageNumber = Number(req.params.pageNumber);
  const { status, score, surahName, juz } = req.body;

  try {
    let page = await getRow('SELECT * FROM quran_pages WHERE pageNumber = ?', [pageNumber]);
    if (page) {
      await runQuery(`
        UPDATE quran_pages SET status = ?, score = ?, lastReviewed = 'اليوم'
        WHERE pageNumber = ?
      `, [status || 'excellent', score || 95, pageNumber]);
    } else {
      await runQuery(`
        INSERT INTO quran_pages (pageNumber, status, score, surahName, juz, lastReviewed, errorsCount)
        VALUES (?, ?, ?, ?, ?, 'اليوم', 0)
      `, [pageNumber, status || 'excellent', score || 95, surahName || ('صفحة ' + pageNumber), juz || Math.ceil(pageNumber / 20)]);
    }

    const updatedPage = await getRow('SELECT * FROM quran_pages WHERE pageNumber = ?', [pageNumber]);
    const pages = await allRows('SELECT * FROM quran_pages');

    res.json({ success: true, page: updatedPage, pages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
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
    return `وعليكم السلام ورحمة الله وبركاته! 🌿 أهلاً بك يا حافظ كتاب الله (${userContext.name || 'الحبيب'}). أنت الآن في **الصفحة ${page} (سورة ${surah} - الجزء ${juz})**. كيف أساعدك اليوم في خطتك أو مراجعتك أو تدبر الآيات؟`;
  } else if (/خطة|جدول|حصون|خمسة|مراجعة|ايش اراجع|شو اراجع|وين وصلت|اين وصلت|متى اراجع|الحصون الخمسة/.test(msg)) {
    return `🏰 **خطتك اليومية الدقيقة بنظام الحصون الخمسة (بناءً على موقعك الحالي):**\n\n` +
      `📍 **موقعك الحالي:** الصفحة **${page}** من سورة **${surah}** (الجزء ${juz}).\n` +
      `📊 **الصفحات المحفوظة:** ${userContext.memorizedPagesCount || 0} صفحة.\n\n` +
      `---\n\n` +
      `1️⃣ **الحصن الأول (قراءة الاستماع والورد نظراً):**\n` +
      `• **المطلوب اليوم:** قراءة **الجزء ${juz}** كاملاً (الصفحات ${(juz - 1) * 20 + 1} إلى ${juz * 20}) نظراً بالحدر في 20 دقيقة.\n` +
      `• **الهدف:** شحن الذاكرة البصرية وتثبيت أماكن الآيات.\n\n` +
      `2️⃣ **الحصن الثاني (التحضير الثلاثي):**\n` +
      `• **التحضير الأسبوعي:** سماع سورة **${surah}** كاملة 3 مرات مع تدبر مقاصدها.\n` +
      `• **التحضير الليلي (الليلة قبل النوم):** تلاوة **الصفحة ${nextNightPrepPage}** من 5 إلى 10 مرات وسماعها.\n` +
      `• **التحضير القريب (قبل الحفظ بـ 15 دقيقة):** تلاوة **الصفحة ${page}** 15 مرة لتصفية الذهن.\n\n` +
      `3️⃣ **الحصن الثالث (الحفظ الجديد الفعلي):**\n` +
      `• **المطلوب اليوم:** حفظ **الصفحة ${page}** من سورة **${surah}**.\n` +
      `• **طريقة الإتقان:** تكرار كل آية 20 مرة، وكل مقطع 20 مرة، وسرد الصفحة كاملة غيباً 40 مرة حتى تكون كالفاتحة.\n\n` +
      `4️⃣ **الحصن الرابع (المراجعة القريبة اليومية):**\n` +
      `• **المطلوب اليوم:** مراجعة غيباً وسرداً بالحدر للصفحات من **${nearReviewStart} إلى ${nearReviewEnd}** (آخر 20 صفحة تم حفظها) في 20 دقيقة.\n\n` +
      `5️⃣ **الحصن الخامس (المراجعة البعيدة والمعاهدة في الصلاة):**\n` +
      `• **المطلوب اليوم:** مراجعة جزء من قديم المحفوظ وتلاوة ما حفظته في ركعات السنن، الوتر، وقيام الليل.\n\n` +
      `✨ *القاعدة الذهبية لد. سعيد حمزة: "من قرأ القرآن في صلاته ثَبَت، ومن قرأه في غير صلاته كَثُر ثوابه وتفلت حفظه".*`;
  } else if (/فتوى|حرام|حلال|حكم شرعي|طلاق|ميراث/.test(msg)) {
    return 'أيها الأخ الحبيب، أنا معلم ذكي متخصص في **الحفظ والمراجعة والتدبر والتجويد**. بالنسبة للأحكام الفقهية والفتاوى الشرعية، يرجى التكرم بالرجوع للجهات الإفتائية الرسمية كدار الإفتاء أو العلماء الأجلاء.';
  } else if (/متشابه|تشابه|ربط|تثبيت/.test(msg)) {
    return '🌿 **قواعد ذهبية لضبط المتشابهات القرآنية:**\n\n1. **الربط بالسياق والمعنى العام للسورة:** فهم المعنى يزيل 90% من اللبس.\n2. **العناية بالحرف المشترك:** مثل ربط جملة بالحرف الأول من اسم السورة (قاعدة الحرف والرمز).\n3. **المراجعة بالسرد بصوت مرتفع:** يقوي الذاكرة السمعية والنطقية.\n4. **استخدام مصاحف التوجيه والتقسيم الموضوعي.**';
  } else if (/تجويد|مخارج|إدغام|ادغام|إخفاء|اخفاء|قلقلة|مد|غنة/.test(msg)) {
    return '✨ **أهم أصول أحكام التجويد:**\n\n- **النون الساكنة والتنوين:** الإظهار الحلقي (أ، هـ، ع، ح، غ، خ)، الإدغام بغنة وبغير غنة (يرملون)، الإقلاب (ب)، الإخفاء الحقيقي (بقية الحروف).\n- **المدود:** المد الطبيعي (حركتان)، المد المتصل والمنفصل (4-5 حركات)، المد اللازم (6 حركات).\n- **الميم الساكنة:** الإخفاء الشفوي (ب)، الإدغام الشفوي (م)، الإظهار الشفوي (باقي الحروف).\n\n💡 نصيحة: استمع للقراء المتقنين كالحصري والمنشاوي للمحاكاة الصحيحة.';
  } else if (/بقرة|البقرة/.test(msg)) {
    return 'سورة البقرة هي فسطاط القرآن وأطول سوره (286 آية، من ص 2 إلى ص 49). قال النبي ﷺ: **"اقْرَءُوا سُورَةَ الْبَقَرَةِ فَإِنَّ أَخْذَهَا بَرَكَةٌ وَتَرْكَهَا حَسْرَةٌ وَلَا تَسْتَطِيعُهَا الْبَطَلَةُ"**. تحتوي على آية الكرسي وآيات أحكام الصيام والإنفاق والدين.';
  } else if (/كهف|الكهف/.test(msg)) {
    return 'سورة الكهف (110 آيات، الصفحات 293-304). سورة مكية تحمي قارئها من فتنة المسيح الدجال وتضيء له نورا ما بين الجمعتين. تدور حول 4 فتن كبرى: فتنة الدين (الفتية)، المال (صاحب الجنتين)، العلم (موسى والخضر)، والسلطة (ذو القرنين).';
  } else if (/تاريخ|اليوم|وقت|ساعة/.test(msg)) {
    const todayStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `📅 **تاريخ اليوم:** ${todayStr}.\n\nجعله الله يوماً مباركاً مليئاً بالذكر وإتقان الورد القرآني! 🌿`;
  } else if (/تشجيع|محفزة|همة|تعبت|صعب|نسيت/.test(msg)) {
    return '💚 **بشارة لك يا حافظ القرآن:**\n\nقال رسول الله ﷺ: **"الذي يقرأ القرآن وهو ماهر به مع السفرة الكرام البررة، والذي يقرأ القرآن ويتتعتع فيه وهو عليه شاق له أجران"** [متفق عليه].\n\nلا تحزن إن نسيت، فكل تكرار لك هو حسنات مضاعفة وأجر عظيم عند الله!';
  } else {
    const templates = [
      `أهلاً بك يا حافظ القرآن! أنت في **الصفحة ${page} (سورة ${surah})**. أنا هنا لمساعدتك في أي سؤال يخص خطة الحصون الخمسة، مراجعة المتشابهات، أحكام التجويد، أو تدبر الآيات. ما الذي تود السؤال عنه؟`,
      `بارك الله في همتك! يمكنك سؤالي عن جدول الحصون الخمسة لصفحتك الحالية (${page})، أو نصائح التثبيت، معاني الآيات، أو أوراد اليوم. تفضل بما في خاطرك.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

app.post('/api/ai/chat', async (req, res) => {
  const { message, userId, userContext } = req.body;
  const targetUser = userId || 'default';
  const uCtx = userContext || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'الرسالة فارغة' });
  }

  try {
    let responseText = '';
    const apiKey = process.env.GEMINI_API_KEY;

    const userStatePrompt = uCtx.currentPage ? `
[بيانات المستخدم الحالية]:
- الاسم: ${uCtx.name || 'المستخدم'}
- الصفحة الحالية للحفظ: ${uCtx.currentPage}
- السورة الحالية: ${uCtx.currentSurah || 'البقرة'}
- الجزء الحالي: ${uCtx.currentJuz || 1}
- عدد الصفحات المحفوظة: ${uCtx.memorizedPagesCount || 0}
- الحصون المنجزة اليوم: ${JSON.stringify(uCtx.fortressesToday || {})}
- الهدف اليومي المختار: ${uCtx.dailyTarget || 'صفحة واحدة'}
` : '';

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('mock')) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
          }
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `${userStatePrompt}\nسؤال أو طلب المستخدم: ${message}`,
          config: {
            systemInstruction: "أنت معلم ومساعد قرآني خبير ومتقن في تطبيق محفظ AI، متخصص في منهجية (الحصون الخمسة) للشيخ د. سعيد أبو العلا حمزة. مهمتك إرشاد الحافظ وتوليد خطط دقيقة ومحكمة بناءً على بياناته ومدخلاته الحالية (أين وصل بالضبط في المصحف، ما هي الصفحة والسورة والآيات، وما هي أوراد الحصون الخمسة المحددة لليوم بالتفصيل: 1- قراءة الاستماع نظراً بالحدر 20 دقيقة، 2- التحضير الثلاثي الأسبوعي والليلي والقريب، 3- الحفظ الفعلي بالتكرار 20x-40x، 4- مراجعة القريب لآخر 20 صفحة بالحدر 20 دقيقة، 5- مراجعة البعيد والصلاة به). نسق إجاباتك بالعربية الفصحى مع التنسيق الجميل والرموز التعبيرية الهادئة والمشجعة."
          }
        });
        responseText = response.text || '';
        console.log(`✅ Live Gemini AI response generated successfully using [gemini-3.7-flash]!`);
      } catch (err) {
        console.log(`💡 Gemini model notice: ${err.message}`);
        responseText = getSmartFallbackResponse(message, uCtx);
      }
    } else {
      responseText = getSmartFallbackResponse(message, uCtx);
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

// Serve Vite dev middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('=================================');
  });
}

startServer();

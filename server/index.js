import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  runQuery, 
  getRow, 
  allRows, 
  hashPassword, 
  verifyPassword 
} from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Demo Test Account Login
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
  try {
    const result = await runQuery('DELETE FROM users WHERE uid = ?', [uid]);
    if (result.changes > 0) {
      res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
    } else {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
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
  try {
    const history = await allRows('SELECT * FROM ai_chat_history ORDER BY id ASC LIMIT 100');
    res.json({ success: true, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.delete('/api/ai/chat', async (req, res) => {
  try {
    await runQuery('DELETE FROM ai_chat_history');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

function getSmartFallbackResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('سلام') || msg.includes('مرحبا') || msg.includes('اهلاً') || msg.includes('اهلا')) {
    return 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك يا حافظ كتاب الله في تطبيق محفظ AI. كيف يمكنني مساعدتك اليوم في مراجعة وتثبيت حفظك؟';
  } else if (msg.includes('فتوى') || msg.includes('حرام') || msg.includes('حلال') || msg.includes('حكم')) {
    return 'أيها الأخ الحبيب، أنا معلم ذكي هنا لمساعدتك في الحفظ والتدبر. بالنسبة للأحكام الفقهية والفتاوى الشرعية، يرجى التكرم بالرجوع لدار الإفتاء أو العلماء الأجلاء.';
  } else if (msg.includes('متشابه') || msg.includes('تشابه') || msg.includes('ربط')) {
    return 'لتثبيت المتشابهات اللفظية: 1. اربط الآية بمعنى السورة العام، 2. اعتمد على مصاحف التوجيه والكتب المخصصة، 3. ضع علامة مميزة في مصحفك عند موضع التشابه.';
  } else if (msg.includes('خطة') || msg.includes('جدول') || msg.includes('كيف') || msg.includes('طريقة')) {
    return 'أفضل خطة هي نظام الحصون الخمسة:\n1. الورد اليومي (قراءة جزء نظرًا).\n2. التحضير الأسبوعي.\n3. التحضير القريب (قبل الحفظ بـ 15 دقيقة).\n4. الحفظ الجديد (صفحة أو وجه يومياً).\n5. المراجعة القريبة والبعيدة.';
  } else if (msg.includes('تجويد') || msg.includes('مخارج') || msg.includes('إدغام') || msg.includes('مد')) {
    return 'أحكام التجويد تُتعلم بالمشافهة على يد شيخ متقن. أبرز الأحكام: الإظهار، الإدغام، الإخفاء، الإقلاب. قال ابن الجزري: والأخذ بالتجويد حتمٌ لازم من لم يجوّد القرآن آثم.';
  } else if (msg.includes('بقرة')) {
    return 'سورة البقرة هي أطول سورة في القرآن الكريم (286 آية). تبدأ من الصفحة 2 وتنتهي عند الصفحة 49. تحتوي على آية الكرسي (255) - أعظم آية في القرآن.';
  } else if (msg.includes('تاريخ') || msg.includes('اليوم') || msg.includes('وقت') || msg.includes('ساعة')) {
    const todayStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `تاريخ اليوم هو: ${todayStr}. 🌿 وفقك الله في وردك ومراجعتك لهذا اليوم!`;
  } else if (msg.includes('تشجيع') || msg.includes('محفزة') || msg.includes('همة')) {
    return 'بارك الله فيك! استمر في مسيرتك مع كتاب الله. قال ﷺ: خيركم من تعلّم القرآن وعلّمه. أنت تسير في طريق النور!';
  } else {
    const templates = [
      'بارك الله فيك! كيف يمكنني مساعدتك في رحلة الحفظ؟ سواء أردت خطة أو مساعدة في المراجعة أو التدبر.',
      'أهلاً! تفضل. يمكنني مساعدتك في المتشابهات والمراجعة والخطط المخصصة.',
      'وفقك الله في رحلة حفظ القرآن. ما الذي تحتاج مساعدة فيه؟'
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'الرسالة فارغة' });
  }

  try {
    let responseText = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('mock')) {
      const candidateModels = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ];
      let liveSuccess = false;

      for (const modelName of candidateModels) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: "أنت معلم قرآني تفاعلي متخصص في تطبيق محفظ AI. مهمتك مساعدة الحفاظ في الحفظ والمراجعة والتدبر والتجويد وربط المتشابهات. استشهد بالقرآن والسنة مع ذكر المصدر. أسلوبك إيماني وودود ومحفز. إذا سئلت فتوى اعتذر ووجه لدار الإفتاء. اجعل ردودك بالعربية ومختصرة ومباشرة."
          });

          const result = await model.generateContent(message);
          const response = await result.response;
          responseText = response.text();
          console.log(`✅ Live Gemini AI response generated successfully using [${modelName}]!`);
          liveSuccess = true;
          break;
        } catch (err) {
          console.log(`💡 Model [${modelName}] notice: ${err.message}`);
        }
      }

      if (!liveSuccess) {
        console.log('💡 Using smart Islamic fallback engine for response');
        responseText = getSmartFallbackResponse(message);
      }
    } else {
      console.log('💡 Note: GEMINI_API_KEY is not set. Add your key from https://aistudio.google.com for live AI.');
      responseText = getSmartFallbackResponse(message);
    }

    await runQuery('INSERT INTO ai_chat_history (sender, text) VALUES (?, ?)', ['user', message]);
    await runQuery('INSERT INTO ai_chat_history (sender, text) VALUES (?, ?)', ['ai', responseText]);

    const history = await allRows('SELECT * FROM ai_chat_history ORDER BY id ASC LIMIT 100');
    res.json({ success: true, reply: responseText, history });
  } catch (e) {
    console.error('AI Chat error:', e);
    const fallbackText = getSmartFallbackResponse(message);
    res.json({
      success: true,
      reply: fallbackText,
      history: [
        { id: Date.now(), sender: 'user', text: message },
        { id: Date.now() + 1, sender: 'ai', text: fallbackText }
      ]
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('Server running on port ' + PORT);
  console.log('=================================');
});

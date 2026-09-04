import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  MessageSquare, 
  EyeOff, 
  Send, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  UserCheck, 
  Flame, 
  Tag, 
  ShieldCheck,
  CheckCircle2,
  Compass,
  Shield,
  BookOpen,
  Share2,
  ArrowRight,
  Pin,
  Cloud,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';

export const Community = ({ setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState('posts'); // 'posts' | 'leaderboard'
  const { user } = useAuth();

  const currentPage = (user?.memorizedPagesCount || 0) + 1;
  const currentSurah = getSurahNameForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);
  const fortressesToday = user?.preferences?.fortressesToday || {};
  const doneFortressesCount = Object.values(fortressesToday).filter(Boolean).length;

  // New Post Form State
  const [postText, setPostText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('تثبيت وتدبر');
  const [dbStatus, setDbStatus] = useState('connected'); // 'connected' | 'syncing'
  const [postFeedback, setPostFeedback] = useState(null);

  // Comment input state per post
  const [commentInputs, setCommentInputs] = useState({});

  // The ONE Inspiring Single Post (Default Seed)
  const singleInspiringPost = {
    id: 1,
    firestoreId: 'pinned_quran_community_1',
    author: 'مشرف مجتمع المحفظ القرآني',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuranCommunity',
    isAnonymous: 0,
    isPinned: true,
    category: 'تثبيت وتدبر',
    timeAgo: 'منشور مثبت 📌',
    content: 'قال رسول الله ﷺ: «تَعَاهَدُوا هَذَا الْقُرْآنَ، فَوَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَهُوَ أَشَدُّ تَفَلُّتًا مِنَ الْإِبِلِ فِي عُقُلِهَا».\n\n🌿 إلى كل صاحب همّة يمر من هنا:\nكم من صفحة حفظتها ثم شعرت بثقل في مراجعتها؟ وكم من آية بكى قلبك عند تدبرها؟\nاعلم أن القرآن عزيز.. لا يُنال بفضول الأوقات، بل يُنال بصدق النيات، وصبر المجاهدة، ولذة المناجاة في صلاة الليل.\n\n💬 شاركونا في هذا المنشور الموحّد:\n1️⃣ ما هو أكبر تحدٍ يواجهك حالياً في تثبيت حفظك؟\n2️⃣ وما هي الآية أو القاعدة التي إذا تذكرتها هان عليك التعب وشحذت همتك؟\n\n🕊️ اكتب تجربتك أو سؤالك، ولنتعاهد كتاب الله معاً وندعو لبعضنا بالثبات 🤍🤲',
    likes: 128,
    answers: [
      { 
        id: 101, 
        author: 'د. عبد الرحمن (معلم قرآن)', 
        text: 'نصيحة من تجربة: أعظم ما يثبت الحفظ في صدرك هو (الحصن الخامس: الصلاة بالمحفوظ في ركعتي الليل). الصفحة التي لا تقرأ بها في صلاتك تفلت سريعاً!' 
      },
      { 
        id: 102, 
        author: 'أحمد محمد', 
        text: 'كنت أعاني من تفلت الأوجه الأخيرة حتى طبقت قاعدة التكرار 20 مرة للآية و40 للربط.. نسأل الله أن يجعلنا وإياكم من أهل القرآن الذين هم أهل الله وخاصته.' 
      }
    ]
  };

  // Real Posts State
  const [posts, setPosts] = useState([singleInspiringPost]);

  // Sync with Firestore & Server API
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    // 1. Fetch from Express Backend API
    const loadFromApi = async () => {
      try {
        const res = await fetch('/api/community/posts');
        const data = await res.json();
        if (data.success && Array.isArray(data.posts) && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts([singleInspiringPost]);
        }
      } catch (err) {
        console.warn('Could not fetch from Express API, relying on Firestore / default:', err);
      }
    };

    loadFromApi();

    // 2. Real-time Firestore Listener
    try {
      const postsRef = collection(db, 'community_posts');
      unsubscribeFirestore = onSnapshot(postsRef, (snapshot) => {
        if (!snapshot.empty) {
          const loadedPosts = [];
          snapshot.forEach(docSnap => {
            const docData = docSnap.data();
            let parsedAnswers = [];
            if (Array.isArray(docData.answers)) {
              parsedAnswers = docData.answers;
            } else if (typeof docData.answers === 'string') {
              try { parsedAnswers = JSON.parse(docData.answers); } catch (e) { parsedAnswers = []; }
            }
            loadedPosts.push({
              id: docSnap.id,
              firestoreId: docSnap.id,
              ...docData,
              answers: parsedAnswers
            });
          });

          // Merge without losing freshly added local posts
          setPosts(prev => {
            const map = new Map();
            prev.forEach(p => map.set(p.content || p.id, p));
            loadedPosts.forEach(p => map.set(p.content || p.id, { ...map.get(p.content || p.id), ...p }));
            const merged = Array.from(map.values());
            merged.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore live subscription error:', error);
      });
    } catch (e) {
      console.warn('Firestore connection fallback:', e);
    }

    return () => unsubscribeFirestore();
  }, []);

  // Handle Post Submission to Database
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    setDbStatus('syncing');
    const authorName = isAnonymous ? 'هوية مخفية' : (user?.name || 'أحمد محمد');
    const authorAvatar = isAnonymous ? null : (user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(authorName));

    const postPayload = {
      author: authorName,
      avatar: authorAvatar,
      isAnonymous: isAnonymous ? 1 : 0,
      category: selectedCategory,
      content: postText.trim(),
      likes: 0,
      answers: [],
      timeAgo: 'الآن',
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update: insert immediately at the top
    const tempId = Date.now();
    const optimisticPost = { ...postPayload, id: tempId };
    setPosts(prev => [optimisticPost, ...prev.filter(p => p.id !== tempId)]);
    setPostText('');
    setPostFeedback('تم نشر مشاركتك وحفظها بنجاح في قاعدة البيانات! 🌿✨');
    setTimeout(() => setPostFeedback(null), 5000);

    // 1. Save to Backend SQLite Database
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Save to Firestore
    try {
      const docRef = await addDoc(collection(db, 'community_posts'), {
        ...postPayload,
        answers: JSON.stringify([])
      });
      if (docRef?.id) {
        setPosts(prev => prev.map(p => p.id === tempId ? { ...p, firestoreId: docRef.id } : p));
      }
    } catch (fsErr) {
      console.warn('Firestore addDoc note:', fsErr);
    }

    setIsAnonymous(false);
    setTimeout(() => setDbStatus('connected'), 600);
  };

  const handleDeletePost = async (post) => {
    const targetId = post.id;
    const fsId = post.firestoreId;
    setPosts(prev => prev.filter(p => p.id !== targetId && p.firestoreId !== fsId));

    if (typeof targetId === 'number') {
      try {
        await fetch(`/api/community/posts/${targetId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Delete error:', e);
      }
    }
  };

  // Toggle Like API & Firestore
  const handleToggleLike = async (post) => {
    const postId = post.id;
    const currentLikes = (post.likes || 0) + 1;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: currentLikes, isLiked: true } : p));

    // Backend API
    try {
      await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
    } catch (e) {
      console.log(e);
    }

    // Firestore
    try {
      if (post.firestoreId) {
        const postRef = doc(db, 'community_posts', String(post.firestoreId));
        await updateDoc(postRef, { likes: currentLikes });
      }
    } catch (e) {}
  };

  // Add Comment/Answer API & Firestore
  const handleAddAnswer = async (post) => {
    const postId = post.id;
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setDbStatus('syncing');
    const newAnswer = {
      id: Date.now(),
      author: user?.name || 'أحمد محمد',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const currentAnswers = Array.isArray(post.answers) ? [...post.answers, newAnswer] : [newAnswer];

    // Optimistic UI update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, answers: currentAnswers } : p));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    // 1. Backend API
    try {
      const res = await fetch(`/api/community/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: newAnswer.author, text: newAnswer.text })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
      }
    } catch (e) {
      console.log(e);
    }

    // 2. Firestore Sync
    try {
      if (post.firestoreId) {
        const postRef = doc(db, 'community_posts', String(post.firestoreId));
        await updateDoc(postRef, {
          answers: JSON.stringify(currentAnswers)
        });
      }
    } catch (e) {}

    setTimeout(() => setDbStatus('connected'), 600);
  };

  const handleShareMilestone = async () => {
    setDbStatus('syncing');
    const defaultShareText = `🌿 بفضل الله وتوفيقه، وصلت في خطة الحفظ إلى الصفحة ${currentPage} من سورة ${currentSurah} (الجزء ${currentJuz}).\n🏰 أنجزت اليوم ${doneFortressesCount} من أصل 5 حصون في نظام الحصون الخمسة! نسأل الله العظيم الثبات والبركة لجميع الإخوة الحفاظ 🤲✨`;
    
    const postPayload = {
      author: user?.name || 'أحمد محمد',
      avatar: user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
      isAnonymous: 0,
      category: 'إنجاز الحصون',
      content: defaultShareText,
      likes: 0,
      answers: [],
      timeAgo: 'الآن',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      await addDoc(collection(db, 'community_posts'), {
        ...postPayload,
        answers: JSON.stringify([])
      });
    } catch (e) {}

    setTimeout(() => setDbStatus('connected'), 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 🌟 User Milestone & Five-Fortresses Status Banner */}
      <div style={{
        padding: '24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
        color: 'white',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  مجتمع حفاظ القرآن الكريم 👥
                </h2>
                <span style={{ fontSize: '11px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cloud size={13} />
                  مربوط بقاعدة البيانات و Firestore
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#94A3B8' }}>
                أنت الآن عند: <strong style={{ color: '#34D399' }}>الصفحة {currentPage}</strong> من <strong style={{ color: '#34D399' }}>سورة {currentSurah}</strong> (الجزء {currentJuz}) — أتممت {user?.memorizedPagesCount || 0} صفحة حفظاً متقناً.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleShareMilestone}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Share2 size={16} />
              مشاركة إنجازي في المجتمع 🚀
            </button>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('five-fortresses')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Shield size={16} />
                خطة الحصون الخمسة
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Mini 3-point Fortress Progress Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} color="#38BDF8" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>ورد قراءة اليوم (نظراً):</span>
              <strong style={{ color: 'white' }}>الجزء {currentJuz} بالحدر</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="#34D399" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>إنجاز الحصون الخمسة اليوم:</span>
              <strong style={{ color: '#34D399' }}>{doneFortressesCount} من أصل 5 مكتملة</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={18} color="#FBBF24" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>المراجعة القريبة اليومية:</span>
              <strong style={{ color: 'white' }}>ص {Math.max(1, currentPage - 20)} إلى {Math.max(1, currentPage - 1)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        background: 'var(--bg-surface)', 
        padding: '6px', 
        borderRadius: '16px', 
        border: '1px solid var(--glass-border)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveSubTab('posts')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: activeSubTab === 'posts' ? 'var(--primary)' : 'transparent',
            color: activeSubTab === 'posts' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquare size={18} />
          حوارات وتدبر الحفاظ 💬
        </button>

        <button
          onClick={() => setActiveSubTab('leaderboard')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: activeSubTab === 'leaderboard' ? 'var(--primary)' : 'transparent',
            color: activeSubTab === 'leaderboard' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Trophy size={18} />
          قسم الالتزام والتنافس
        </button>
      </div>

      {/* Sub Tab Content: 1. POSTS & REFLECTIONS */}
      {activeSubTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Post Card */}
          <div style={{ 
            padding: '24px', 
            borderRadius: '20px', 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--primary)" />
              شارِك تدبراً، فائدة، أو استفساراً في تثبيت القرآن
            </h3>

            {postFeedback && (
              <div style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#047857',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={20} color="#10B981" />
                <span>{postFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost}>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="اكتب تجربتك في الحفظ، سؤالاً عن المتشابهات، أو تدبراً يشد الهمم..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Categories & Anonymous Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Category Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['تثبيت وتدبر', 'متشابهات', 'تجويد', 'نصيحة للحفاظ'].map((cat) => (
                      <span
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          background: selectedCategory === cat ? 'var(--primary-light)' : 'var(--bg-color)',
                          color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                          border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--glass-border)'}`
                        }}
                      >
                        #{cat}
                      </span>
                    ))}
                  </div>

                  {/* Anonymous Switch Toggle */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer', 
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isAnonymous ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)',
                    border: `1px solid ${isAnonymous ? '#EF4444' : 'var(--glass-border)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isAnonymous} 
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <EyeOff size={16} color={isAnonymous ? '#EF4444' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: isAnonymous ? '#EF4444' : 'var(--text-secondary)' }}>
                      {isAnonymous ? 'نشر بهوية مخفية 🎭' : 'إظهار الهوية'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!postText.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: postText.trim() ? 'var(--primary)' : 'var(--glass-border)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: postText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={16} style={{ transform: 'rotate(180deg)' }} />
                  نشر المشاركة
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post) => (
              <div 
                key={post.id || post.firestoreId}
                style={{
                  padding: '26px',
                  borderRadius: '20px',
                  background: post.isPinned ? 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(16, 185, 129, 0.04) 100%)' : 'var(--bg-surface)',
                  border: post.isPinned ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                  boxShadow: post.isPinned ? '0 8px 24px rgba(16, 185, 129, 0.12)' : 'var(--shadow-soft)',
                  position: 'relative'
                }}
              >
                {/* Pinned Tag */}
                {post.isPinned && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '14px',
                    border: '1px solid var(--primary)'
                  }}>
                    <Pin size={14} />
                    منشور تفاعلي موحّد — شاركنا رحلتك وتحدياتك القرآنية
                  </div>
                )}

                {/* Author Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {post.isAnonymous ? (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#334155',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        🎭
                      </div>
                    ) : post.avatar ? (
                      <img 
                        src={post.avatar} 
                        alt={post.author}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          border: '2px solid var(--primary)',
                          background: 'var(--bg-color)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        border: '1px solid var(--primary)'
                      }}>
                        {post.author ? post.author.charAt(0) : 'ح'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          {post.author}
                        </h4>
                        {post.isAnonymous && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 'bold' }}>
                            مخفي
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.timeAgo}</span>
                    </div>
                  </div>

                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>
                    #{post.category}
                  </span>
                </div>

                {/* Content */}
                <div style={{ 
                  fontSize: '15.5px', 
                  color: 'var(--text-primary)', 
                  lineHeight: 1.8, 
                  margin: '0 0 16px 0', 
                  whiteSpace: 'pre-line' 
                }}>
                  {post.content}
                </div>

                {/* Action Buttons (Likes & Answers) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => handleToggleLike(post)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: post.isLiked ? '#EF4444' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} color={post.isLiked ? '#EF4444' : 'currentColor'} />
                    <span>{post.likes || 0} إعجاب وتأييد</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px' }}>
                    <MessageCircle size={18} />
                    <span>{(post.answers || []).length} مشاركة ورد</span>
                  </div>
                </div>

                {/* Answers / Comments Section */}
                {(post.answers || []).length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      مشاركات وتجارب الإخوة الحفاظ:
                    </h5>
                    {post.answers.map((ans) => (
                      <div key={ans.id} style={{ padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', fontSize: '14.5px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                          {ans.author}:
                        </span>
                        <span style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {ans.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Answer Input */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAnswer(post)}
                    placeholder="اكتب تجربتك، إجابتك، أو دعاءك..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => handleAddAnswer(post)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={14} style={{ transform: 'rotate(180deg)' }} />
                    إرسال
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Sub Tab Content: 2. LEADERBOARD & COMMITMENT */}
      {activeSubTab === 'leaderboard' && (
        <div style={{ 
          padding: '32px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>🏆 قسم الالتزام وتنافس الحفاظ</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>تدرج الحفاظ حسب الأيام المتتالية (Streak) ومؤشر الإتقان اليومي.</p>

          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { rank: 1, name: 'عبد الرحمن السالم', points: '14,250 XP', streak: '120 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdelrahman' },
              { rank: 2, name: 'فاطمة الزهراء', points: '12,800 XP', streak: '95 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima' },
              { rank: 3, name: 'عمر الفاروق', points: '11,400 XP', streak: '80 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar' },
              { rank: 4, name: user?.name || 'أحمد محمد', points: '2,450 XP', streak: '14 يوم', avatar: user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad', isUser: true },
            ].map((member) => (
              <div 
                key={member.rank} 
                style={{ 
                  padding: '16px 24px', 
                  borderRadius: '16px', 
                  background: member.isUser ? 'var(--primary-light)' : 'var(--bg-color)', 
                  border: `1px solid ${member.isUser ? 'var(--primary)' : 'var(--glass-border)'}`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', width: '28px', color: member.rank <= 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>#{member.rank}</span>
                  <img src={member.avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{member.name} {member.isUser && '(أنت)'}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>الاستمرار: {member.streak} 🔥</span>
                  </div>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{member.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Community;

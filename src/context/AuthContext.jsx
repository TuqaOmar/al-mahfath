import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check stored user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ma7fath_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Real REST API: Test Account Login
  const loginWithTestAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('ma7fath_user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (e) {
      console.log('Using local fallback:', e);
      // Fallback demo account
      const fallbackUser = {
        uid: 'demo_user_123',
        name: 'أحمد محمد',
        email: 'demo@ma7fath.ai',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
        hasCompletedWizard: true,
        streak: 23,
        xp: 2450,
        level: 12,
        preferences: {
          level: 'متوسط (أحفظ بعض الأجزاء)',
          dailyTarget: 'صفحة واحدة يومياً',
          learningStyle: 'سمعي بصري (مختلط)',
          motivation: 'تثبيت حفظ سورة البقرة وآل عمران والتقرب إلى الله',
          reminder: 'بعد صلاة الفجر'
        }
      };
      localStorage.setItem('ma7fath_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
    }
    setLoading(false);
  };

  // Real REST API: Email/Password Login, with local fallback
  const login = async (rawEmail, password) => {
    setLoading(true);
    const email = (rawEmail || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password ? password.trim() : '' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const userObj = {
          ...data.user,
          hasCompletedWizard: Boolean(data.user.hasCompletedWizard)
        };
        localStorage.setItem('ma7fath_user', JSON.stringify(userObj));
        setUser(userObj);
        setLoading(false);
        return { success: true, user: userObj };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'فشل تسجيل الدخول' };
      }
    } catch (e) {
      // Local fallback: check stored users in localStorage
      console.log('Backend unavailable, trying local auth...', e);
      const localUsers = JSON.parse(localStorage.getItem('ma7fath_local_users') || '{}');
      const storedEntry = localUsers[email];
      if (storedEntry && storedEntry.password === password) {
        const userData = {
          ...storedEntry.user,
          hasCompletedWizard: Boolean(storedEntry.user.hasCompletedWizard)
        };
        localStorage.setItem('ma7fath_user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        return { success: true, user: userData };
      }
      setLoading(false);
      return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }
  };

  // Real REST API: Email/Password Signup, with local fallback
  const signup = async (name, rawEmail, password) => {
    setLoading(true);
    const email = (rawEmail || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: (name || '').trim(), email, password: password ? password.trim() : '' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const userObj = {
          ...data.user,
          hasCompletedWizard: Boolean(data.user.hasCompletedWizard)
        };
        localStorage.setItem('ma7fath_user', JSON.stringify(userObj));
        setUser(userObj);
        setLoading(false);
        return { success: true, user: userObj };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'فشل إنشاء الحساب' };
      }
    } catch (e) {
      // Local fallback: store user locally
      console.log('Backend unavailable, creating local account...', e);
      const localUsers = JSON.parse(localStorage.getItem('ma7fath_local_users') || '{}');
      if (localUsers[email]) {
        setLoading(false);
        return { success: false, message: 'البريد الإلكتروني مسجل بالفعل' };
      }
      const newUser = {
        uid: 'local_' + Date.now(),
        name: (name || '').trim() || 'حافظ جديد',
        email,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`,
        hasCompletedWizard: false,
        role: 'user',
        streak: 1,
        xp: 100,
        level: 1,
        memorizedPagesCount: 0,
        memoryScore: 100,
        totalJuz: 0,
        preferences: {}
      };
      localUsers[email] = { password, user: newUser };
      localStorage.setItem('ma7fath_local_users', JSON.stringify(localUsers));
      localStorage.setItem('ma7fath_user', JSON.stringify(newUser));
      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    }
  };

  // Google Login helper
  const loginWithGoogle = async (providedEmail = null, providedName = null) => {
    setLoading(true);
    const googleEmail = providedEmail || 'google_user@ma7fath.ai';
    const googleName = providedName || (providedEmail ? providedEmail.split('@')[0] : 'مستخدم جوجل المحترَم');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const normalizedUser = {
          ...data.user,
          hasCompletedWizard: Boolean(data.user.hasCompletedWizard)
        };
        localStorage.setItem('ma7fath_user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        setLoading(false);
        return { success: true, user: normalizedUser };
      } else {
        // Create google account if not exists
        const signRes = await signup(googleName, googleEmail, 'google_sso_pass_123');
        if (signRes.success && signRes.user) {
          const updatedGoogleUser = {
            ...signRes.user,
            hasCompletedWizard: false
          };
          localStorage.setItem('ma7fath_user', JSON.stringify(updatedGoogleUser));
          setUser(updatedGoogleUser);
          setLoading(false);
          return { success: true, user: updatedGoogleUser };
        }
        setLoading(false);
        return signRes;
      }
    } catch (e) {
      console.log('Backend Google login failed, using local Google auth fallback:', e);
      const googleUser = {
        uid: providedEmail ? `google_${Date.now()}` : `google_user_${Date.now()}`,
        name: googleName,
        email: googleEmail,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleName}`,
        hasCompletedWizard: false,
        role: 'user',
        streak: 1,
        xp: 100,
        level: 1,
        memorizedPagesCount: 0,
        memoryScore: 100,
        totalJuz: 0,
        preferences: {}
      };
      localStorage.setItem('ma7fath_user', JSON.stringify(googleUser));
      setUser(googleUser);
      setLoading(false);
      return { success: true, user: googleUser };
    }
  };


  const logout = () => {
    localStorage.removeItem('ma7fath_user');
    setUser(null);
  };

  const deleteAccount = async () => {
    const targetUid = user?.uid;
    const targetEmail = user?.email;

    // Remove stored user session and remove from saved local users list
    localStorage.removeItem('ma7fath_user');
    localStorage.removeItem('ma7fath_quran_pages');
    localStorage.removeItem('ma7fath_community_posts');

    if (targetEmail) {
      try {
        const localUsers = JSON.parse(localStorage.getItem('ma7fath_local_users') || '{}');
        delete localUsers[targetEmail];
        localStorage.setItem('ma7fath_local_users', JSON.stringify(localUsers));
      } catch (e) {
        console.error('Error cleaning localUsers:', e);
      }
    }
    
    // Reset React user state immediately
    setUser(null);

    // Send delete request to backend database
    if (targetUid || targetEmail) {
      try {
        await fetch(`/api/user/${targetUid || 'by_email'}?email=${encodeURIComponent(targetEmail || '')}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.log('Failed to delete account on backend:', e);
      }
    }

    return { success: true };
  };

  // Real REST API: Admin Test Account Login
  const loginWithAdminAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('ma7fath_user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (e) {
      console.log('Using local admin fallback:', e);
      const fallbackAdmin = {
        uid: 'admin_123',
        name: 'مدير النظام (أدمن)',
        email: 'admin@ma7fath.ai',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
        hasCompletedWizard: true,
        role: 'admin',
        streak: 15,
        xp: 9999,
        level: 99,
        memorizedPagesCount: 604,
        memoryScore: 100,
        totalJuz: 30,
        preferences: {
          level: 'حافظ كامل المصحف',
          dailyTarget: 'مراجعة جزئين يومياً',
          learningStyle: 'مختلط (شامل)',
          motivation: 'إدارة وتوجيه مجتمع حفاظ القرآن الكريم',
          reminder: 'على مدار اليوم'
        }
      };
      localStorage.setItem('ma7fath_user', JSON.stringify(fallbackAdmin));
      setUser(fallbackAdmin);
    }
    setLoading(false);
  };

  // Real REST API: Update User Data & Preferences in DB
  const updateUserData = async (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('ma7fath_user', JSON.stringify(updatedUser));

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (e) {
        console.log('Failed DB sync:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, loginWithTestAccount, loginWithAdminAccount, logout, deleteAccount, updateUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

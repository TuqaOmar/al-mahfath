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

  // Real REST API: Email/Password Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('ma7fath_user', JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'فشل تسجيل الدخول' };
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      return { success: false, message: 'تعذر الاتصال بالخادم' };
    }
  };

  // Real REST API: Email/Password Signup
  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('ma7fath_user', JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'فشل إنشاء الحساب' };
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      return { success: false, message: 'تعذر الاتصال بالخادم' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ma7fath_user');
    setUser(null);
  };

  const deleteAccount = async () => {
    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.log('Failed to delete account on backend:', e);
      }
    }
    localStorage.removeItem('ma7fath_user');
    setUser(null);
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
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithTestAccount, loginWithAdminAccount, logout, deleteAccount, updateUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

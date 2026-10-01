import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          if (userDocSnap.exists()) {
            userData = { ...userData, ...userDocSnap.data() };
            
            // --- STREAK LOGIC ---
            const today = new Date();
            const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            const lastActiveString = userData.lastActiveDate;
            
            if (lastActiveString !== todayString) {
              let newStreak = userData.streak || 1;
              if (lastActiveString) {
                const [lYear, lMonth, lDay] = lastActiveString.split('-').map(Number);
                const lastDate = new Date(lYear, lMonth - 1, lDay);
                const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                
                const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                  newStreak += 1;
                } else if (diffDays > 1) {
                  newStreak = 1; // reset streak if missed a day
                }
              }
              
              userData.streak = newStreak;
              userData.lastActiveDate = todayString;
              
              updateDoc(userDocRef, { streak: newStreak, lastActiveDate: todayString }).catch(e => console.error(e));
            }
            // --------------------

          } else if (!firebaseUser.isAnonymous) {
            // If doc doesn't exist but user logged in (e.g. Google), create it
            userData = {
              ...userData,
              hasCompletedWizard: false,
              role: 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userData);
          }

          localStorage.setItem('ma7fath_user', JSON.stringify(userData));
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          // Fallback to basic info if Firestore fails
          const basicInfo = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
          };
          setUser(basicInfo);
        }
      } else {
        localStorage.removeItem('ma7fath_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Signup
  const signup = async (name, rawEmail, password) => {
    setLoading(true);
    const email = (rawEmail || '').trim().toLowerCase();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { 
        displayName: name,
        photoURL: ''
      });
      
      const newUser = {
        uid: userCredential.user.uid,
        name: (name || '').trim() || 'حافظ جديد',
        email,
        photoURL: userCredential.user.photoURL,
        hasCompletedWizard: false,
        role: 'user',
        streak: 1,
        xp: 100,
        level: 1,
        memorizedPagesCount: 0,
        memoryScore: 100,
        totalJuz: 0,
        preferences: {},
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      setUser(newUser);
      
      setLoading(false);
      return { success: true, user: newUser };
    } catch (error) {
      setLoading(false);
      let message = 'فشل إنشاء الحساب';
      if (error.code === 'auth/email-already-in-use') message = 'البريد الإلكتروني مسجل بالفعل';
      if (error.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة جداً';
      return { success: false, message };
    }
  };

  // Email/Password Login
  const login = async (rawEmail, password) => {
    setLoading(true);
    const email = (rawEmail || '').trim().toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let message = 'فشل تسجيل الدخول';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      return { success: false, message };
    }
  };

  // Google Login helper (Called from AuthModal after signInWithPopup)
  const loginWithGoogle = async (providedEmail, providedName, providedPhoto) => {
    // onAuthStateChanged will catch the user automatically, but we can ensure Firestore is synced
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        const newUser = {
          uid: auth.currentUser.uid,
          name: providedName || auth.currentUser.displayName,
          email: providedEmail || auth.currentUser.email,
          photoURL: providedPhoto || auth.currentUser.photoURL,
          hasCompletedWizard: false,
          role: 'user',
          streak: 1,
          xp: 100,
          level: 1,
          memorizedPagesCount: 0,
          memoryScore: 100,
          totalJuz: 0,
          preferences: {},
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUser);
      }
      return { success: true, user: auth.currentUser };
    }
    return { success: false, message: 'Google Auth Failed' };
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('ma7fath_user');
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const deleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete();
        setUser(null);
        localStorage.removeItem('ma7fath_user');
        return { success: true };
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      return { success: false, message: error.message };
    }
  };

  const updateUserData = async (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('ma7fath_user', JSON.stringify(updatedUser));

    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, updates);
      } catch (e) {
        console.error('Failed DB sync:', e);
      }
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const freshData = { uid: auth.currentUser.uid, ...userDocSnap.data() };
          setUser(freshData);
          localStorage.setItem('ma7fath_user', JSON.stringify(freshData));
          return { success: true, user: freshData };
        }
      } catch (e) {
        console.error("Refresh error:", e);
      }
    }
    return { success: true, user };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, deleteAccount, updateUserData, refreshUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

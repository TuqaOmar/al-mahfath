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
import { doc, getDoc, getDocFromServer, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const roleOrder = ['user', 'teacher', 'admin'];
const grantedRoles = (profile) => roleOrder.filter(role =>
  profile?.role === role || profile?.roles?.[role] === true
);
const initialActiveRole = (profile) => {
  const available = grantedRoles(profile);
  if (!available.length) return 'user';
  const saved = localStorage.getItem(`ma7fath_active_role_${profile.uid}`);
  if (available.includes(saved)) return saved;
  return available.includes(profile?.role) ? profile.role : available[0];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRoleState] = useState('user');
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
            
          } else if (!firebaseUser.isAnonymous) {
            // If doc doesn't exist but user logged in (e.g. Google), create it
            userData = {
              ...userData,
              hasCompletedWizard: false,
              role: 'user',
              roles: { user: true },
              streak: 0,
              xp: 100,
              level: 1,
              memorizedPagesCount: 0,
              memoryScore: 100,
              totalJuz: 0,
              preferences: {},
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userData);
          }

          localStorage.setItem('ma7fath_user', JSON.stringify(userData));
          setUser(userData);
          setActiveRoleState(initialActiveRole(userData));
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
        setActiveRoleState('user');
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
        // Multi-role support: roles map allows a single account to be student+teacher+admin
        roles: { user: true },
        streak: 0,
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
          // Multi-role support
          roles: { user: true },
          streak: 0,
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

  const applyConfirmedUser = (result) => {
    const uid = auth.currentUser?.uid;
    if (!uid || result?.success !== true || result?.persisted !== true || result.user?.uid !== uid) {
      return { success: false, message: 'Profile persistence was not confirmed for the authenticated user' };
    }
    const freshUser = { ...result.user, uid };
    setUser(freshUser);
    if (!grantedRoles(freshUser).includes(activeRole)) {
      setActiveRoleState(initialActiveRole(freshUser));
    }
    let cacheWarning;
    try {
      localStorage.setItem('ma7fath_user', JSON.stringify(freshUser));
    } catch (error) {
      cacheWarning = 'Profile was saved, but the local cache could not be updated';
      console.warn(cacheWarning, error);
    }
    return { success: true, persisted: true, user: freshUser, ...(cacheWarning ? { cacheWarning } : {}) };
  };

  const updateUserData = async (updates) => {
    if (['memorizedPages', 'memorizedPagesCount', 'totalJuz', 'memoryScore'].some(key =>
      Object.hasOwn(updates || {}, key))) {
      return { success: false, message: 'Approved memorization fields cannot be changed by the client' };
    }
    const editableFields = new Set([
      'name', 'photoURL', 'preferences', 'favorites', 'fortressPlan',
      'hasCompletedWizard'
    ]);
    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(([key]) => editableFields.has(key))
    );

    if (Object.keys(safeUpdates).length === 0) {
      return { success: false, message: 'No editable profile fields were provided' };
    }

    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, safeUpdates);
        const updatedUser = { ...user, ...safeUpdates };
        return applyConfirmedUser({ success: true, persisted: true, user: updatedUser });
      } catch (e) {
        console.error('Failed DB sync:', e);
        return { success: false, message: e.message };
      }
    }
    return { success: false, message: 'Not authenticated' };
  };

  /**
   * Check if the current user has a specific role.
   * Supports both single role string and roles map for multi-role accounts.
   * e.g., hasRole('admin'), hasRole('teacher'), hasRole('user')
   */
  const hasRole = (roleName) => {
    if (!user) return false;
    // Check single role field
    if (user.role === roleName) return true;
    // Check roles map (multi-role support)
    if (user.roles && user.roles[roleName] === true) return true;
    // Admin always has all permissions
    if (roleName !== 'admin' && (user.role === 'admin' || (user.roles && user.roles.admin === true))) return true;
    return false;
  };

  const setActiveRole = (roleName) => {
    if (!user || !grantedRoles(user).includes(roleName)) {
      return { success: false, message: 'Role is not granted to this account' };
    }
    localStorage.setItem(`ma7fath_active_role_${user.uid}`, roleName);
    setActiveRoleState(roleName);
    return { success: true, role: roleName };
  };

  const refreshUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Not authenticated' };
    try {
      // A cached snapshot cannot confirm that a refresh reached Firestore.
      const userDocSnap = await getDocFromServer(doc(db, 'users', uid));
      if (auth.currentUser?.uid !== uid) {
        return { success: false, message: 'Authentication changed during refresh' };
      }
      if (!userDocSnap.exists()) {
        return { success: false, message: 'User profile was not found' };
      }
      if (userDocSnap.metadata.hasPendingWrites) {
        return { success: false, message: 'Profile changes have not been confirmed by Firestore' };
      }
      const freshData = { ...userDocSnap.data(), uid };
      setUser(freshData);
      if (!grantedRoles(freshData).includes(activeRole)) {
        setActiveRoleState(initialActiveRole(freshData));
      }
      let cacheWarning;
      try {
        localStorage.setItem('ma7fath_user', JSON.stringify(freshData));
      } catch (error) {
        cacheWarning = 'The fresh profile was read, but the local cache could not be updated';
        console.warn(cacheWarning, error);
      }
      return { success: true, user: freshData, source: 'firestore-server-profile', ...(cacheWarning ? { cacheWarning } : {}) };
    } catch (e) {
      console.error('Refresh error:', e);
      // Leave the last confirmed profile and cache unchanged on failure.
      return { success: false, message: e.message || 'Profile refresh failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, availableRoles: grantedRoles(user), setActiveRole, loading, login, signup, loginWithGoogle, logout, deleteAccount, updateUserData, applyConfirmedUser, refreshUserData, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

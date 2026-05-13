import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../utils/firebase';
import { setCurrentUserId, deleteUserData, queryFirst, execute, generateUUID } from '../database/db';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthContextType {
  user: User | null;
  userRole: 'shopkeeper' | 'personal' | null;
  isGuest: boolean;
  isLoading: boolean;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reauthenticateAndDelete: (password?: string) => Promise<void>;
  signInWithGoogle: (idToken: string, selectedRole?: 'shopkeeper' | 'personal') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'shopkeeper' | 'personal' | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    } catch (e) {
      console.error('Failed to fetch user role', e);
    }
  };

  const loadGuestStatus = async () => {
    try {
      const guestStatus = await AsyncStorage.getItem('isGuest');
      if (guestStatus === 'true') {
        setIsGuest(true);
        setCurrentUserId('guest');
      }
    } catch (e) {
      console.error('Failed to load guest status', e);
    }
  };

  useEffect(() => {
    loadGuestStatus();

    if (!auth) {
      setIsLoading(false);
      return;
    }

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCurrentUserId(firebaseUser?.uid ?? (isGuest ? 'guest' : null));
      
      if (firebaseUser) {
        setIsGuest(false);
        AsyncStorage.removeItem('isGuest');
        if (db) fetchUserRole(firebaseUser.uid);
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const continueAsGuest = async () => {
    setIsGuest(true);
    setCurrentUserId('guest');
    await AsyncStorage.setItem('isGuest', 'true');
  };

  const signOut = async () => {
    setIsGuest(false);
    await AsyncStorage.removeItem('isGuest');
    await firebaseSignOut(auth);
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed in via Google
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const userId = currentUser.uid;
    try {
      // 1. Delete user data from Firestore
      if (db) {
        const tables = ['user_profile', 'shops', 'customers', 'products', 'transactions', 'payments'];
        for (const table of tables) {
          const q = query(collection(db, table), where('user_id', '==', userId));
          const querySnapshot = await getDocs(q);
          const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
          await Promise.all(deletePromises);
        }
        await deleteDoc(doc(db, 'users', userId));
      }

      // 2. Delete user from Firebase Auth
      await currentUser.delete();
      
      // 3. Clear local data
      await deleteUserData(userId);
      
      // 4. Reset state
      setIsGuest(false);
      await AsyncStorage.removeItem('isGuest');
      try {
        await GoogleSignin.signOut();
      } catch (e) {}
      
      console.log('Account deleted from Firebase and locally');
    } catch (e) {
      console.error('Error during account deletion:', e);
      throw e;
    }
  };

  const reauthenticateAndDelete = async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Check if the user signed in with password
    const isPasswordProvider = currentUser.providerData.some((p: any) => p.providerId === 'password');
    const isGoogleProvider = currentUser.providerData.some((p: any) => p.providerId === 'google.com');
    
    if (isPasswordProvider) {
      if (!password) throw new Error('Password required for reauthentication');
      const credential = EmailAuthProvider.credential(currentUser.email!, password);
      await reauthenticateWithCredential(currentUser, credential);
    } else if (isGoogleProvider) {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Optional: Call signOut first to force account picker
        try { await GoogleSignin.signOut(); } catch (e) {}
        const userInfo = await GoogleSignin.signIn();
        const idToken = userInfo.data?.idToken;
        if (!idToken) throw new Error('No Google token');
        const credential = GoogleAuthProvider.credential(idToken);
        await reauthenticateWithCredential(currentUser, credential);
      } catch (e: any) {
        throw new Error('Google reauthentication failed');
      }
    }
    
    await deleteAccount();
  };

  const signInWithGoogle = async (idToken: string, selectedRole?: 'shopkeeper' | 'personal') => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      setCurrentUserId(firebaseUser.uid);
      // If it's a new user and we have a role, save it to Firestore
      if (selectedRole) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            role: selectedRole,
            email: firebaseUser.email,
            createdAt: new Date().toISOString()
          });
          setUserRole(selectedRole);
          
          // Auto-create local SQLite profile from Google account info (only for TRULY new users)
          const { uid, displayName, photoURL } = firebaseUser;
          if (uid) {
            const existingProfile = await queryFirst('SELECT id FROM user_profile WHERE user_id = ?', [uid]);
            if (!existingProfile && displayName) {
              const profileId = generateUUID();
              await execute(
                'INSERT INTO user_profile (id, user_id, name, image_uri, has_seen_tutorial, is_dirty) VALUES (?, ?, ?, ?, 1, 1)',
                [profileId, uid, displayName, photoURL || '']
              );
            }
          }
        } else {
          setUserRole(userDoc.data().role);
        }
      } else {
        // Just login, fetch role
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    } catch (e) {
      console.error('Google Sign-In failed', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, isGuest, isLoading, continueAsGuest, signOut, deleteAccount, reauthenticateAndDelete, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

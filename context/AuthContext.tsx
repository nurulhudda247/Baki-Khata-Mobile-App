import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential, EmailAuthProvider, reauthenticateWithCredential, UserCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../utils/firebase';
import { setCurrentUserId, deleteUserData, queryFirst, execute, generateUUID } from '../database/db';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthContextType {
  user: User | null;
  userRole: 'shopkeeper' | 'personal' | null;
  userRoles: string[];
  hasBothRoles: boolean;
  activeProfile: 'shopkeeper' | 'personal' | null;
  isGuest: boolean;
  isLoading: boolean;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reauthenticateAndDelete: (password?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ userCredential: UserCredential; roles: string[] }>;
  signInWithGoogle: (idToken: string, selectedRole?: 'shopkeeper' | 'personal') => Promise<{ roles: string[] }>;
  setActiveProfile: (profile: 'shopkeeper' | 'personal') => void;
  deleteActiveProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'shopkeeper' | 'personal' | null>(null);
  const [activeProfile, setActiveProfileState] = useState<'shopkeeper' | 'personal' | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveProfile = async (profile: 'shopkeeper' | 'personal') => {
    setActiveProfileState(profile);
    AsyncStorage.setItem('activeProfile', profile);
    
    // For registered users with no roles yet, save this as their first role
    if (user && userRoles.length === 0) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
          roles: [profile],
          role: profile // Setting as primary role too
        }, { merge: true });
        setUserRoles([profile]);
        setUserRole(profile);
      } catch (e) {
        console.error('Failed to save initial role selection:', e);
      }
    }
  };

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const hasBothRoles = userRoles.includes('shopkeeper') && userRoles.includes('personal');

  const fetchUserRoles = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      let roles: string[] = [];
      let primaryRole: string | null = null;

      if (userDoc.exists()) {
        const data = userDoc.data();
        roles = data.roles || (data.role ? [data.role] : []);
        primaryRole = data.role || null;
      }

      // Auto-Discovery: ONLY run when Firestore has NO roles (first-time migration).
      // If Firestore already has roles, trust them completely.
      // Running this unconditionally causes false positives — SQLite may have
      // shop data that doesn't match the user's actual registered roles.
      if (roles.length === 0) {
        try {
          const hasBusiness = await queryFirst('SELECT id FROM shops WHERE user_id = ? AND type = "business" AND is_deleted = 0 LIMIT 1', [uid]);
          if (hasBusiness) roles.push('shopkeeper');

          const hasPersonal = await queryFirst('SELECT id FROM shops WHERE user_id = ? AND type = "personal" AND is_deleted = 0 LIMIT 1', [uid]);
          if (hasPersonal && !roles.includes('personal')) roles.push('personal');

          // Sync discovered roles back to Firestore
          if (roles.length > 0 && userDoc.exists()) {
            await setDoc(userRef, { roles }, { merge: true });
          }
        } catch (dbError) {
          console.error('Local DB role discovery failed', dbError);
        }
      }

      setUserRoles(roles);
      if (primaryRole) setUserRole(primaryRole as any);
      else if (roles.length > 0) setUserRole(roles[0] as any);

      return roles;
    } catch (e) {
      console.error('Failed to fetch user roles', e);
      return [];
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
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
      await loadGuestStatus();
      
      const savedProfile = await AsyncStorage.getItem('activeProfile');
      
      // Listen for auth changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        // Mark loading=true so index.tsx waits for roles before routing.
        // This prevents the race condition where index.tsx renders before
        // fetchUserRoles completes and incorrectly routes based on empty state.
        setIsLoading(true);
        setUser(firebaseUser);
        setCurrentUserId(firebaseUser?.uid ?? (isGuest ? 'guest' : null));
        
        if (firebaseUser) {
          setIsGuest(false);
          await AsyncStorage.removeItem('isGuest');
          
          const roles = await fetchUserRoles(firebaseUser.uid);
          setUserRoles(roles);
          if (roles.length === 1) {
            setUserRole(roles[0] as any);
          }
          
          if (roles.length > 1) {
            if (savedProfile && roles.includes(savedProfile as any)) {
              setActiveProfileState(savedProfile as any);
            } else {
              setActiveProfileState(null);
            }
          } else {
            if (roles.length === 1) {
              setUserRole(roles[0] as any);
              setActiveProfileState(roles[0] as any);
            }
          }
        } else {
          // Check if guest profile exists
          const guestStatus = await AsyncStorage.getItem('isGuest');
          if (guestStatus === 'true') {
            setIsGuest(true);
            if (savedProfile && (savedProfile === 'shopkeeper' || savedProfile === 'personal')) {
              setActiveProfileState(savedProfile as any);
            } else {
              setActiveProfileState(null);
            }
          } else {
            setUserRole(null);
            setUserRoles([]);
            setActiveProfileState(null);
            await AsyncStorage.removeItem('activeProfile');
          }
        }
        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubPromise = initAuth();

    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const continueAsGuest = async () => {
    setIsGuest(true);
    setCurrentUserId('guest');
    await AsyncStorage.setItem('isGuest', 'true');
    
    // Check if there's already a chosen profile
    const savedProfile = await AsyncStorage.getItem('activeProfile');
    if (savedProfile === 'shopkeeper' || savedProfile === 'personal') {
      setActiveProfileState(savedProfile as any);
    } else {
      setActiveProfileState(null); // Truly first time, let them choose
      await AsyncStorage.removeItem('activeProfile');
    }
  };

  const signOut = async () => {
    setIsGuest(false);
    setActiveProfileState(null);
    setUserRoles([]);
    await AsyncStorage.removeItem('isGuest');
    await AsyncStorage.removeItem('activeProfile');
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
    console.log('Starting account deletion for:', userId);

    // 1. Attempt to delete user data from Firestore (best effort)
    // (Implementation of Firestore cleanup if needed)

    // 2. Clear local data and reset state (Delete locally first to ensure user can't see it)
    try {
      await deleteUserData(userId);
      
      // 3. Reset state
      setIsGuest(false);
      setActiveProfileState(null);
      setUserRoles([]);
      await AsyncStorage.removeItem('isGuest');
      await AsyncStorage.removeItem('activeProfile');
      try {
        await GoogleSignin.signOut();
      } catch (e) {}
    } catch (e) {
      console.error('Error during local account deletion:', e);
    }

    // 3. Delete user from Firebase Auth (CRITICAL STEP)
    try {
      await currentUser.delete();
      console.log('Account deleted from Firebase and locally');
    } catch (e: any) {
      console.error('Firebase Auth deletion failed:', e);
      throw e; 
    }
  };

  // Delete only the currently active profile/role.
  // If user has both roles → delete this role's data only, switch to other role.
  // If user has only one role → falls back to full account deletion.
  const deleteActiveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const uid = currentUser.uid;
    const currentRole = activeProfile; // 'shopkeeper' | 'personal' | null
    if (!currentRole) throw new Error('No active profile to delete');

    const remainingRoles = userRoles.filter(r => r !== currentRole);

    if (remainingRoles.length === 0) {
      // Only one role — do a full account delete
      return deleteAccount();
    }

    try {
      // 1. Delete SQLite data for this role only
      const database = await (await import('../database/db')).getDb();
      if (database) {
        const shopType = currentRole === 'shopkeeper' ? 'business' : 'personal';
        // Get all shop IDs for this role type
        const shops = await database.getAllAsync<{ id: string }>(
          `SELECT id FROM shops WHERE user_id = ? AND type = ? AND is_deleted = 0`,
          [uid, shopType]
        );
        for (const shop of shops) {
          // Cascade soft-delete: mark as deleted AND dirty for sync
          await database.runAsync(`UPDATE payments SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)`, [shop.id]);
          await database.runAsync(`UPDATE transactions SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)`, [shop.id]);
          await database.runAsync(`UPDATE customers SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ?`, [shop.id]);
          await database.runAsync(`UPDATE products SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ?`, [shop.id]);
          await database.runAsync(`UPDATE shops SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [shop.id]);
        }
        // Delete user_profile for this role — profile is small and role-specific, safe to delete physically
        await database.runAsync(`DELETE FROM user_profile WHERE user_id = ? AND role = ?`, [uid, currentRole]);
      }

      // 2. Delete from Firestore — remove this role from roles array & matching shops/profile
      if (db) {
        const shopType = currentRole === 'shopkeeper' ? 'business' : 'personal';
        // Remove role from Firestore user document
        await setDoc(doc(db, 'users', uid), { roles: remainingRoles }, { merge: true });
        // Soft-delete shops in Firestore for this type
        const shopsQ = query(collection(db, 'shops'), where('user_id', '==', uid), where('type', '==', shopType));
        const shopsSnap = await getDocs(shopsQ);
        await Promise.all(shopsSnap.docs.map(d => setDoc(d.ref, { is_deleted: 1 }, { merge: true })));
        // Delete user_profile for this role from Firestore
        const profileQ = query(collection(db, 'user_profile'), where('user_id', '==', uid), where('role', '==', currentRole));
        const profileSnap = await getDocs(profileQ);
        await Promise.all(profileSnap.docs.map(d => deleteDoc(d.ref)));
      }

      // 3. Switch to the remaining role
      const newRole = remainingRoles[0] as 'shopkeeper' | 'personal';
      setUserRoles(remainingRoles);
      setUserRole(newRole);
      setActiveProfileState(newRole);
      await AsyncStorage.setItem('activeProfile', newRole);

    } catch (e) {
      console.error('Error deleting active profile:', e);
      throw e;
    }
  };

  const reauthenticateAndDelete = async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Check providers
    const providers = currentUser.providerData.map(p => p.providerId);
    const isPasswordProvider = providers.includes('password');
    const isGoogleProvider = providers.includes('google.com');
    
    try {
      if (isPasswordProvider) {
        if (!password) throw new Error('PASSWORD_REQUIRED');
        const credential = EmailAuthProvider.credential(currentUser.email!, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (isGoogleProvider) {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Force account picker to ensure a fresh token
        await GoogleSignin.signOut();
        const { data } = await GoogleSignin.signIn();
        if (!data?.idToken) throw new Error('GOOGLE_TOKEN_MISSING');
        const credential = GoogleAuthProvider.credential(data.idToken);
        await reauthenticateWithCredential(currentUser, credential);
      } else {
        // Fallback for other providers or if provider data is missing (rare)
        console.warn('Unknown provider, attempting direct delete');
      }
      
      await deleteAccount();
    } catch (e: any) {
      console.error('Reauthentication or deletion failed:', e);
      if (e.message === 'PASSWORD_REQUIRED') throw new Error('PASSWORD_REQUIRED');
      if (e.message === 'GOOGLE_TOKEN_MISSING') throw new Error('GOOGLE_TOKEN_MISSING');
      if (e.code === 'auth/wrong-password') throw e;
      if (e.code === 'auth/requires-recent-login') throw e;
      
      // If it's a specific Firebase error, throw it. Otherwise throw a general failed error.
      if (e.code || e.message) throw e;
      throw new Error('REAUTH_FAILED');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Fetch roles and check if we need to force profile selection
    const roles = await fetchUserRoles(firebaseUser.uid);
    if (roles.length > 1) {
      setActiveProfileState(null);
      await AsyncStorage.removeItem('activeProfile');
    }
    
    return { userCredential, roles };
  };

  const signInWithGoogle = async (idToken: string, selectedRole?: 'shopkeeper' | 'personal') => {
    try {
      if (selectedRole) {
        await AsyncStorage.setItem('activeProfile', selectedRole);
        setActiveProfileState(selectedRole);
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      setCurrentUserId(firebaseUser.uid);
      // If it's a new user and we have a role, save it to Firestore
      if (selectedRole) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        let finalRoles: string[] = [];

        if (!userDoc.exists()) {
          finalRoles = [selectedRole];
          await setDoc(userRef, {
            role: selectedRole,
            roles: finalRoles,
            email: firebaseUser.email,
            createdAt: new Date().toISOString()
          });
          setUserRole(selectedRole);
          setUserRoles(finalRoles);
        } else {
          // If user exists, we add the new role to their list if not already there
          const data = userDoc.data();
          const existingRoles = data.roles || (data.role ? [data.role] : []);
          if (!existingRoles.includes(selectedRole)) {
            finalRoles = [...existingRoles, selectedRole];
            await setDoc(userRef, { 
              roles: finalRoles,
              role: selectedRole // Update last used role
            }, { merge: true });
            setUserRoles(finalRoles);
            setUserRole(selectedRole);
          } else {
            finalRoles = existingRoles;
            setUserRoles(existingRoles);
            setUserRole(selectedRole);
          }
        }

        // Auto-create local SQLite profile (Merchant for shopkeepers, Google name for personal)
        const { uid, displayName, photoURL } = firebaseUser;
        if (uid) {
          const existingProfile = await queryFirst('SELECT id FROM user_profile WHERE user_id = ? AND role = ?', [uid, selectedRole]);
          if (!existingProfile) {
            const profileId = generateUUID();
            const initialName = displayName || (selectedRole === 'shopkeeper' ? 'Merchant' : 'User');
            await execute(
              'INSERT INTO user_profile (id, user_id, role, name, image_uri, has_seen_tutorial, is_dirty) VALUES (?, ?, ?, ?, ?, 1, 1)',
              [profileId, uid, selectedRole, initialName, photoURL || '']
            );
          }
        }
        return { roles: finalRoles };
      } else {
        // Just login, fetch roles
        const roles = await fetchUserRoles(firebaseUser.uid);
        
        // If user has multiple roles, clear activeProfile 
        // to force them to select which profile they want to use this time.
        if (roles.length > 1) {
          setActiveProfileState(null);
          await AsyncStorage.removeItem('activeProfile');
        }
        return { roles };
      }
    } catch (e) {
      console.error('Google Sign-In failed', e);
      throw e;
    }
    return { roles: [] };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      userRoles,
      hasBothRoles,
      activeProfile, 
      isGuest, 
      isLoading, 
      continueAsGuest, 
      signOut, 
      deleteAccount, 
      deleteActiveProfile,
      reauthenticateAndDelete, 
      signInWithEmail,
      signInWithGoogle,
      setActiveProfile
    }}>
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

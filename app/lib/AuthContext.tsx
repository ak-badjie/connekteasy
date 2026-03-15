"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { getUserProfile, createUserProfile, updateUserProfile } from "./firestore";
import type { UserProfile } from "./types";

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Firestore
  const fetchProfile = useCallback(async (uid: string) => {
    const profile = await getUserProfile(uid);
    setUserProfile(profile);
    return profile;
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  // Email/password sign in
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Email/password sign up
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  };

  // Google sign in
  const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    // Check if user profile exists, if not a new user who needs onboarding
    const existing = await getUserProfile(result.user.uid);
    if (!existing) {
      // Create a skeleton profile so the user doc exists
      await createUserProfile(result.user.uid, {
        email: result.user.email || "",
        displayName: result.user.displayName || "",
        firstName: result.user.displayName?.split(" ")[0] || "",
        lastName: result.user.displayName?.split(" ").slice(1).join(" ") || "",
        profilePhotoUrl: result.user.photoURL || "",
        onboardingComplete: false,
        role: "va",
        title: "",
        bio: "",
        skills: [],
        hourlyRate: 0,
        coverPhotoUrl: "",
        certificates: [],
        portfolioImages: [],
        introVideoUrl: "",
        website: "",
        linkedin: "",
        location: "",
      });
    }
    await fetchProfile(result.user.uid);
    return result.user;
  };

  // Sign out
  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOutUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

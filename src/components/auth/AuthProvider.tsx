"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

// ─── Context shape ────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  userDoc: any | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Upsert user profile (moved out of rooms/page.tsx) ───────
async function upsertUserDoc(u: User) {
  const userRef = doc(db, "users", u.uid);
  await setDoc(
    userRef,
    {
      uid: u.uid,
      name: u.displayName || u.email?.split("@")[0] || null,
      email: u.email?.toLowerCase() || null,
      photoURL: u.photoURL || null,
    },
    { merge: true }
  );
}

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Listen to auth changes; upsert profile on every login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserDoc(null);
        setLoading(false);
        return;
      }

      try {
        await upsertUserDoc(currentUser);
      } catch (err) {
        console.error("[AuthProvider] Failed to upsert user doc:", err);
      }
    });
    return () => unsub();
  }, []);

  // 2) Subscribe to userDoc once we have a user
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setUserDoc(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error("[AuthProvider] userDoc snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 3) Manual refresh — used right after updateProfile() on signup
  const refreshUser = async () => {
    const u = auth.currentUser;
    if (!u) return;
    setUser({ ...u });
    try {
      await upsertUserDoc(u);
    } catch (err) {
      console.error("[AuthProvider] refreshUser upsert failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
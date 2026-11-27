import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, reload, type User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/firebase";
import { isOfficialSorsuEmail } from "../firebase/teacherAccess";
import type { UserProfile } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  emailVerified: boolean;
  loading: boolean;
  error: string;
  refreshEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshEmailVerification = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    await reload(currentUser);
    await currentUser.getIdToken(true);
    setEmailVerified(currentUser.emailVerified);
    return currentUser.emailVerified;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setError("Firebase is not configured. Add your project values to the .env file.");
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setEmailVerified(Boolean(currentUser?.emailVerified));
      setProfile(null);
      setError("");
      setLoading(Boolean(currentUser));
      if (!currentUser) {
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
            setError("");
          } else {
            setProfile(null);
            setError("Your account profile was not found. Complete registration again or contact campus support.");
          }
          setLoading(false);
        },
        () => {
          setError("Unable to load your account profile. Check your connection and Firestore rules.");
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (
      !user ||
      !profile ||
      !emailVerified ||
      !isOfficialSorsuEmail(user.email) ||
      profile.email.trim().toLowerCase() !== user.email?.trim().toLowerCase()
    ) return;

    const activation: Partial<Pick<UserProfile, "role" | "status">> = {};
    if (profile.role === "pendingTeacher") activation.role = "teacher";
    if (profile.role === "teacher" || activation.role === "teacher") {
      if (profile.status !== "active") activation.status = "active";
    }
    if (!Object.keys(activation).length) return;

    let active = true;
    updateDoc(doc(db, "users", user.uid), activation).then(() => {
      if (active) setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to activate your teacher account.");
    });
    return () => { active = false; };
  }, [emailVerified, profile, user]);

  const value = useMemo(
    () => ({ user, profile, emailVerified, loading, error, refreshEmailVerification }),
    [user, profile, emailVerified, loading, error, refreshEmailVerification],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

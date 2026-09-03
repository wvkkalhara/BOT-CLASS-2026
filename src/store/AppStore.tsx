import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import type { Session } from "../types";
import { opCount } from "../lib/idb";
import { syncPendingOps } from "../lib/helpers";

export type ToastKind = "success" | "error" | "info" | "offline";
export interface ToastMsg {
  id: number;
  kind: ToastKind;
  msg: string;
}

interface AppCtxShape {
  theme: "light" | "dark";
  toggleTheme: () => void;
  session: Session;
  authReady: boolean;
  adminUser: User | null;
  loginStudent: (id: string, name: string) => void;
  logout: () => void;
  toasts: ToastMsg[];
  toast: (msg: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
  online: boolean;
  pending: number;
  syncing: boolean;
  refreshPending: () => void;
}

const AppCtx = createContext<AppCtxShape | null>(null);

const STUDENT_KEY = "bc_student_session";
let toastSeq = 1;

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" ? "light" : "dark";
  });
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [studentSession, setStudentSession] = useState<{
    id: string;
    name: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(STUDENT_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { id?: string; name?: string };
        if (p && p.id) return { id: p.id, name: p.name || "Student" };
      }
    } catch {
      /* corrupted storage */
    }
    return null;
  });
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  /* ----- toasts ----- */
  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((msg: string, kind: ToastKind = "info") => {
    const id = toastSeq++;
    setToasts((ts) => [...ts.slice(-3), { id, kind, msg }]);
    window.setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
    }, kind === "error" ? 5200 : 3600);
  }, []);

  /* ----- theme ----- */
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("bc_theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* ----- auth listeners ----- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAdminUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const session: Session = adminUser
    ? { kind: "admin", email: adminUser.email || "admin" }
    : studentSession
    ? { kind: "student", id: studentSession.id, name: studentSession.name }
    : null;

  const loginStudent = useCallback((id: string, name: string) => {
    try {
      localStorage.setItem(STUDENT_KEY, JSON.stringify({ id, name }));
    } catch {
      /* storage unavailable */
    }
    setStudentSession({ id, name });
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STUDENT_KEY);
    } catch {
      /* ignore */
    }
    setStudentSession(null);
    if (auth.currentUser) signOut(auth).catch(() => {});
  }, []);

  /* ----- offline queue ----- */
  const refreshPending = useCallback(() => {
    opCount()
      .then(setPending)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      const count = await opCount().catch(() => 0);
      if (count > 0) {
        setSyncing(true);
        const { synced } = await syncPendingOps();
        setSyncing(false);
        refreshPending();
        if (synced > 0)
          toast(
            `Back online — synced ${synced} saved action${synced > 1 ? "s" : ""} to the cloud.`,
            "success"
          );
      }
    };
    const goOffline = () => {
      setOnline(false);
      toast("You are offline. Actions will be saved on this device.", "offline");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    /* attempt any leftover sync on startup */
    goOnline();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [toast, refreshPending]);

  const value: AppCtxShape = {
    theme,
    toggleTheme,
    session,
    authReady,
    adminUser,
    loginStudent,
    logout,
    toasts,
    toast,
    dismissToast,
    online,
    pending,
    syncing,
    refreshPending,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppCtxShape {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

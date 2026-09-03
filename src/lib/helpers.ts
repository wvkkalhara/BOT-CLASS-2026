import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { queueOp, allOps, removeOp } from "./idb";
import type { QueuedOp } from "../types";

/* ---------- dates ---------- */
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const monthKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const niceDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]} ${y}`;
};

/* ---------- QR payload ---------- */
export const qrPayloadFor = (studentId: string): string => `BOTC|${studentId}`;

export function parseQr(text: string): string | null {
  const t = (text || "").trim();
  if (!t) return null;
  if (t.startsWith("BOTC|")) {
    const id = t.slice(5).trim();
    return id || null;
  }
  try {
    const obj = JSON.parse(t) as { id?: string; studentId?: string };
    const id = obj.studentId || obj.id;
    if (id) return String(id).trim();
  } catch {
    /* not json */
  }
  // bare id like BC-001
  if (/^[A-Za-z]{1,6}-?\d{1,5}$/.test(t)) return t.toUpperCase();
  return null;
}

/* ---------- students ---------- */
export function nextStudentId(ids: string[]): string {
  let max = 0;
  ids.forEach((id) => {
    const m = id.match(/(\d+)\s*$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `BC-${String(max + 1).padStart(3, "0")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/* ---------- grades (SL-style letters) ---------- */
export function gradeFor(score: number, max: number): { letter: string; tone: "ok" | "teal" | "gold" | "warn" } {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 75) return { letter: "A", tone: "ok" };
  if (pct >= 65) return { letter: "B", tone: "teal" };
  if (pct >= 50) return { letter: "C", tone: "gold" };
  if (pct >= 35) return { letter: "S", tone: "warn" };
  return { letter: "W", tone: "warn" };
}

/* ---------- offline-aware writes ---------- */
export async function writeWithQueue(
  path: string,
  value: unknown,
  label: string
): Promise<"synced" | "queued"> {
  if (navigator.onLine) {
    try {
      await set(ref(db, path), value);
      return "synced";
    } catch {
      /* fall through to queue */
    }
  }
  await queueOp({ path, value, label, ts: Date.now() });
  return "queued";
}

export async function syncPendingOps(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };
  let ops: QueuedOp[] = [];
  try {
    ops = await allOps();
  } catch {
    return { synced: 0, failed: 0 };
  }
  let synced = 0;
  let failed = 0;
  for (const op of ops) {
    try {
      await set(ref(db, op.path), op.value);
      if (typeof op.key === "number") await removeOp(op.key);
      synced++;
    } catch {
      failed++;
      break; // keep order, retry later
    }
  }
  return { synced, failed };
}

/* ---------- auth errors ---------- */
export function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and retry.";
    case "auth/network-request-failed":
      return "No internet connection. Admin login requires internet.";
    default:
      return "Could not sign in. Please try again.";
  }
}

/* ---------- camera errors ---------- */
export function friendlyCameraError(err: unknown): string {
  const msg = String((err as { message?: string })?.message || err || "");
  if (/NotAllowedError|Permission denied|not allowed/i.test(msg))
    return "Camera permission denied. Please allow camera access in your browser, then tap Retry.";
  if (/NotFoundError|no camera|video input/i.test(msg))
    return "No camera was found on this device. Enter the Student ID manually instead.";
  if (/NotReadableError|Could not start|in use/i.test(msg))
    return "The camera is busy in another app. Close it and tap Retry.";
  if (/https|secure/i.test(msg))
    return "Camera needs a secure (HTTPS) connection. Open this page from its https link.";
  return "Camera could not start. If you are inside an in-app browser, open this page in Safari or Chrome.";
}

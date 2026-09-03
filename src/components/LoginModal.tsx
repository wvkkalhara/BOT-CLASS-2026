import { useEffect, useState, type FormEvent } from "react";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  GraduationCap,
  ShieldCheck,
  X,
  QrCode,
  Keyboard,
  Loader2,
  Lock,
  Mail,
  Delete,
  Eraser,
  ArrowLeft,
  WifiOff,
} from "lucide-react";
import { auth, db } from "../firebase";
import { useApp } from "../store/AppStore";
import QrScanner from "./QrScanner";
import { friendlyAuthError, parseQr, initials } from "../lib/helpers";
import type { Student } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "student" | "admin";
type Step = "choose" | "scan" | "pin";

export default function LoginModal({ open, onClose }: Props) {
  const { toast, loginStudent, online } = useApp();
  const [tab, setTab] = useState<Tab>("student");

  /* student flow */
  const [step, setStep] = useState<Step>("choose");
  const [manualId, setManualId] = useState("");
  const [found, setFound] = useState<Student | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);

  /* admin flow */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  /* reset when reopened */
  useEffect(() => {
    if (open) {
      setStep("choose");
      setFound(null);
      setPin("");
      setPinError(false);
      setManualId("");
      setAdminError(null);
    }
  }, [open]);

  if (!open) return null;

  const resolveStudent = async (raw: string) => {
    const id = parseQr(raw);
    if (!id) {
      toast("That QR code is not a bot class student card.", "error");
      return;
    }
    if (!navigator.onLine) {
      toast("No internet. A student's first sign-in needs a connection once.", "offline");
      return;
    }
    setLookupBusy(true);
    try {
      const snap = await get(ref(db, `students/${id}`));
      if (!snap.exists()) {
        toast(`No student found with ID "${id}".`, "error");
        return;
      }
      const v = snap.val() as { name?: string; passcode?: string; createdAt?: number };
      setFound({ id, name: v.name || "Student", passcode: v.passcode || "", createdAt: v.createdAt || 0 });
      setPin("");
      setPinError(false);
      setStep("pin");
    } catch {
      toast("Could not reach the server. Check your connection.", "error");
    } finally {
      setLookupBusy(false);
    }
  };

  const pressKey = (k: string) => {
    if (verifying) return;
    if (k === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (k === "clear") {
      setPin("");
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4 && found) {
      setVerifying(true);
      window.setTimeout(() => {
        if (next === found.passcode) {
          loginStudent(found.id, found.name);
          toast(`Welcome back, ${found.name.split(" ")[0]}!`, "success");
          onClose();
        } else {
          setPin("");
          setPinError(true);
          try {
            navigator.vibrate?.([60, 40, 60]);
          } catch {
            /* ignore */
          }
        }
        setVerifying(false);
      }, 320);
    }
  };

  const adminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (adminBusy) return;
    setAdminError(null);
    setAdminBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast("Admin signed in. Welcome back!", "success");
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setAdminError(friendlyAuthError(code));
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div
        className="modal-overlay absolute inset-0 bg-[#05070f]/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="modal-card glass relative w-full sm:max-w-[430px] rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 max-h-[94vh] overflow-y-auto no-scrollbar">
        <button
          className="icon-btn absolute right-4 top-4 !w-9 !h-9"
          onClick={onClose}
          aria-label="Close login"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="brand-tile flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <QrCode size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold leading-tight">Portal Login</h2>
            <p className="text-[0.78rem] text-[var(--muted)]">bot class student &amp; admin access</p>
          </div>
        </div>

        <div className="seg mb-6">
          <button
            type="button"
            className={tab === "student" ? "active" : ""}
            onClick={() => setTab("student")}
          >
            <GraduationCap size={15} /> Student
          </button>
          <button
            type="button"
            className={tab === "admin" ? "active" : ""}
            onClick={() => setTab("admin")}
          >
            <ShieldCheck size={15} /> Admin
          </button>
        </div>

        {!online && tab === "student" && step !== "pin" && (
          <div className="chip chip-gold w-full justify-center mb-4 !py-2">
            <WifiOff size={13} /> You're offline — returning students open automatically.
          </div>
        )}

        {/* ================= STUDENT ================= */}
        {tab === "student" && (
          <>
            {step === "choose" && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep("scan")}
                  className="group relative flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-6 py-8 transition-all hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]"
                >
                  <span className="brand-tile flex h-16 w-16 items-center justify-center rounded-3xl text-white transition-transform group-hover:scale-105">
                    <QrCode size={30} />
                  </span>
                  <span className="font-display text-base font-bold">Login via QR</span>
                  <span className="text-[0.78rem] text-[var(--muted)]">
                    Scan the QR code on your student ID card
                  </span>
                </button>

                <div className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--muted)]">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  or enter ID
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualId.trim()) resolveStudent(manualId);
                  }}
                >
                  <input
                    className="input flex-1"
                    placeholder="Student ID — e.g. BC-001"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                  />
                  <button className="btn btn-teal" type="submit" disabled={lookupBusy || !manualId.trim()}>
                    {lookupBusy ? <Loader2 size={16} className="animate-spin" /> : <Keyboard size={16} />}
                    Go
                  </button>
                </form>
              </div>
            )}

            {step === "scan" && (
              <div className="space-y-4">
                <QrScanner
                  onScan={(text) => resolveStudent(text)}
                  hint="Align the QR code inside the frame"
                />
                {lookupBusy && (
                  <p className="flex items-center justify-center gap-2 text-[0.82rem] text-[var(--muted)]">
                    <Loader2 size={14} className="animate-spin" /> Verifying student…
                  </p>
                )}
                <button type="button" className="btn btn-ghost btn-sm mx-auto" onClick={() => setStep("choose")}>
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            )}

            {step === "pin" && found && (
              <div className="flex flex-col items-center">
                <div className="brand-tile mb-3 flex h-14 w-14 items-center justify-center rounded-2xl font-display text-lg font-bold text-white">
                  {initials(found.name)}
                </div>
                <p className="font-display text-base font-bold">{found.name}</p>
                <p className="mb-5 text-[0.78rem] text-[var(--muted)]">
                  {found.id} — enter your 4-digit passcode
                </p>

                <div
                  className={`mb-6 flex items-center gap-3.5 ${pinError ? "shake" : ""}`}
                  onAnimationEnd={() => setPinError(false)}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`pin-dot ${i < pin.length ? "filled" : ""}`} />
                  ))}
                  {verifying && <Loader2 size={15} className="animate-spin text-[var(--teal)]" />}
                </div>

                <div className="grid w-full max-w-[250px] grid-cols-3 gap-2.5">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                    <button key={k} type="button" className="key" onClick={() => pressKey(k)}>
                      {k}
                    </button>
                  ))}
                  <button type="button" className="key flex items-center justify-center" onClick={() => pressKey("clear")} aria-label="Clear">
                    <Eraser size={18} />
                  </button>
                  <button type="button" className="key" onClick={() => pressKey("0")}>
                    0
                  </button>
                  <button type="button" className="key flex items-center justify-center" onClick={() => pressKey("back")} aria-label="Backspace">
                    <Delete size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-5"
                  onClick={() => {
                    setStep("choose");
                    setFound(null);
                  }}
                >
                  <ArrowLeft size={14} /> Not you? Scan again
                </button>
              </div>
            )}
          </>
        )}

        {/* ================= ADMIN ================= */}
        {tab === "admin" && (
          <form className="space-y-4" onSubmit={adminSubmit}>
            <div>
              <label className="label" htmlFor="adm-email">Email</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="adm-email"
                  className="input !pl-10"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@botclass.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="adm-pass">Password</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="adm-pass"
                  className="input !pl-10"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {adminError && (
              <p className="rounded-xl bg-[var(--danger-soft)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--danger)]">
                {adminError}
              </p>
            )}

            <button className="btn btn-primary w-full" type="submit" disabled={adminBusy}>
              {adminBusy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {adminBusy ? "Signing in…" : "Sign in as Admin"}
            </button>
            <p className="text-center text-[0.72rem] leading-relaxed text-[var(--muted)]">
              Admin access is restricted. Your session stays signed in on this device.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

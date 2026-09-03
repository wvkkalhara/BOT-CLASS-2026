import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import {
  Bot,
  LogOut,
  Users,
  CalendarCheck2,
  CloudUpload,
  Loader2,
  Wifi,
  WifiOff,
  ScanLine,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppStore";
import ThemeToggle from "./ThemeToggle";
import StudentsPanel from "./StudentsPanel";
import ActionsPanel from "./ActionsPanel";
import { syncPendingOps, todayISO } from "../lib/helpers";
import type { AttendanceEntry, Student } from "../types";

type RawStudents = Record<string, { name?: string; passcode?: string; createdAt?: number }>;
type RawAttendance = Record<string, Record<string, AttendanceEntry>>;

export default function AdminDashboard() {
  const { session, logout, toast, pending, refreshPending, online, syncing } = useApp();
  const [studentsRaw, setStudentsRaw] = useState<RawStudents>({});
  const [attendanceRaw, setAttendanceRaw] = useState<RawAttendance>({});
  const [tab, setTab] = useState<"students" | "actions">("students");
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    const u1 = onValue(ref(db, "students"), (s) => setStudentsRaw((s.val() || {}) as RawStudents));
    const u2 = onValue(ref(db, "attendance"), (s) => setAttendanceRaw((s.val() || {}) as RawAttendance));
    return () => {
      u1();
      u2();
    };
  }, []);

  const students = useMemo<Student[]>(
    () =>
      Object.entries(studentsRaw).map(([id, v]) => ({
        id,
        name: v.name || "Unnamed",
        passcode: v.passcode || "",
        createdAt: v.createdAt || 0,
      })),
    [studentsRaw]
  );

  const today = todayISO();
  const presentToday = useMemo(
    () =>
      Object.values(attendanceRaw).reduce(
        (acc, rec) => acc + (rec && rec[today] && rec[today].present ? 1 : 0),
        0
      ),
    [attendanceRaw, today]
  );

  const manualSync = async () => {
    if (!online || pending === 0 || syncBusy) return;
    setSyncBusy(true);
    const { synced, failed } = await syncPendingOps();
    setSyncBusy(false);
    refreshPending();
    if (synced > 0 && failed === 0) toast(`Synced ${synced} action${synced > 1 ? "s" : ""}.`, "success");
    else if (synced > 0) toast(`Synced ${synced}, ${failed} still pending.`, "info");
    else toast("Sync failed — will retry automatically.", "error");
  };

  const stats = [
    {
      icon: Users,
      label: "Students",
      value: String(students.length),
      color: "var(--primary-2)",
      soft: "var(--primary-soft)",
    },
    {
      icon: CalendarCheck2,
      label: "Present today",
      value: `${presentToday}/${students.length}`,
      color: "var(--teal)",
      soft: "var(--teal-soft)",
    },
    {
      icon: CloudUpload,
      label: "Pending sync",
      value: String(pending),
      color: "var(--gold)",
      soft: "var(--gold-soft)",
    },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 sm:px-6">
      {/* top bar */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2.5">
          <span className="brand-tile flex h-9 w-9 items-center justify-center rounded-xl text-white">
            <Bot size={18} />
          </span>
          <span className="font-display text-[1.02rem] font-bold">
            bot <span className="grad-brand">class</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              logout();
              toast("Admin signed out.", "info");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* console strip */}
      <section className="glass relative mb-5 overflow-hidden rounded-3xl p-6 sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary-2), transparent 60%)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Admin Console
            </p>
            <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight">
              Class Command Center
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="chip chip-primary">
                <ShieldCheck size={12} /> {session?.kind === "admin" ? session.email : ""}
              </span>
              {online ? (
                <span className="chip chip-ok">
                  <Wifi size={12} /> Online
                </span>
              ) : (
                <span className="chip chip-gold">
                  <WifiOff size={12} /> Offline — actions saved locally
                </span>
              )}
              {(syncing || syncBusy) && (
                <span className="chip chip-primary">
                  <Loader2 size={12} className="animate-spin" /> Syncing…
                </span>
              )}
            </div>
          </div>
          {pending > 0 && online && (
            <button type="button" className="btn btn-teal" onClick={manualSync} disabled={syncBusy}>
              {syncBusy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sync {pending} now
            </button>
          )}
        </div>
      </section>

      {/* stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass card-hover flex flex-col gap-2.5 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-3.5 sm:p-5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: s.soft, color: s.color }}
            >
              <s.icon size={18} />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold leading-none sm:text-xl">{s.value}</p>
              <p className="mt-1 text-[0.66rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="seg mb-5 sm:max-w-md">
        <button type="button" className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>
          <Users size={15} /> Students
        </button>
        <button type="button" className={tab === "actions" ? "active" : ""} onClick={() => setTab("actions")}>
          <ScanLine size={15} /> Scan &amp; Record
        </button>
      </div>

      {tab === "students" ? (
        <StudentsPanel students={students} />
      ) : (
        <ActionsPanel students={students} />
      )}
    </div>
  );
}

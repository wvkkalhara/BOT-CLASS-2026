import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import {
  Bot,
  LogOut,
  Wallet,
  CalendarCheck2,
  GraduationCap,
  CheckCircle2,
  Clock3,
  Minus,
  WifiOff,
  BadgeCheck,
} from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppStore";
import ThemeToggle from "./ThemeToggle";
import {
  MONTHS_SHORT,
  monthKeyOf,
  niceDate,
  gradeFor,
  initials,
} from "../lib/helpers";
import type {
  AttendanceEntry,
  MarkEntry,
  PaymentStatus,
  Student,
} from "../types";

interface CacheShape {
  student: Student | null;
  attendance: Record<string, AttendanceEntry>;
  payments: Record<string, PaymentStatus>;
  marks: Record<string, MarkEntry>;
}

export default function StudentDashboard() {
  const { session, logout, toast } = useApp();
  const sid = session?.kind === "student" ? session.id : "";

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry>>({});
  const [payments, setPayments] = useState<Record<string, PaymentStatus>>({});
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const received = useRef<CacheShape>({ student: null, attendance: {}, payments: {}, marks: {} });
  const gotLive = useRef(false);

  /* live subscriptions + offline cache */
  useEffect(() => {
    if (!sid) return;
    let cacheKey = `bc_cache_${sid}`;

    /* 1) show cached data instantly */
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const c = JSON.parse(raw) as CacheShape;
        setStudent(c.student);
        setAttendance(c.attendance || {});
        setPayments(c.payments || {});
        setMarks(c.marks || {});
        setFromCache(true);
        setLoading(false);
      }
    } catch {
      /* corrupted cache */
    }

    const commit = () => {
      if (!gotLive.current) return;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(received.current));
      } catch {
        /* storage full/unavailable */
      }
    };

    const unsubs = [
      onValue(
        ref(db, `students/${sid}`),
        (snap) => {
          gotLive.current = true;
          const v = snap.val() as { name?: string; passcode?: string; createdAt?: number } | null;
          const st: Student | null = v
            ? { id: sid, name: v.name || "Student", passcode: v.passcode || "", createdAt: v.createdAt || 0 }
            : null;
          received.current.student = st;
          setStudent(st);
          setFromCache(false);
          setLoading(false);
          commit();
        },
        () => setLoading(false)
      ),
      onValue(ref(db, `attendance/${sid}`), (snap) => {
        const v = (snap.val() || {}) as Record<string, AttendanceEntry>;
        received.current.attendance = v;
        setAttendance(v);
        setFromCache(false);
        commit();
      }),
      onValue(ref(db, `payments/${sid}`), (snap) => {
        const v = (snap.val() || {}) as Record<string, PaymentStatus>;
        received.current.payments = v;
        setPayments(v);
        setFromCache(false);
        commit();
      }),
      onValue(ref(db, `marks/${sid}`), (snap) => {
        const v = (snap.val() || {}) as Record<string, MarkEntry>;
        received.current.marks = v;
        setMarks(v);
        setFromCache(false);
        commit();
      }),
    ];

    const fallback = window.setTimeout(() => setLoading(false), 4500);
    return () => {
      unsubs.forEach((u) => u());
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const attStats = useMemo(() => {
    const entries = Object.entries(attendance);
    const present = entries.filter(([, v]) => v && v.present).length;
    const absent = entries.filter(([, v]) => v && !v.present).length;
    const total = present + absent;
    const pct = total ? Math.round((present / total) * 100) : 0;
    const recent = entries
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 8);
    return { present, absent, total, pct, recent };
  }, [attendance]);

  const marksArr = useMemo(
    () =>
      Object.entries(marks)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0)),
    [marks]
  );

  const now = new Date();
  const year = now.getFullYear();
  const curMonthIdx = now.getMonth();
  const monthCells = MONTHS_SHORT.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const status = payments[key] as PaymentStatus | undefined;
    return {
      label,
      key,
      status: status ?? (i <= curMonthIdx ? "pending" : "na"),
      current: key === monthKeyOf(now),
    };
  });
  const paidCount = monthCells.filter((c) => c.status === "paid").length;
  const pendCount = monthCells.filter((c) => c.status === "pending").length;

  const displayName =
    student?.name || (session?.kind === "student" ? session.name : "Student");

  /* attendance ring geometry */
  const R = 58;
  const CIRC = 2 * Math.PI * R;

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
              toast("Signed out. See you in class!", "info");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* greeting card */}
      <section className="glass relative mb-6 overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--teal), transparent 60%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="brand-tile flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white sm:h-20 sm:w-20">
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Student Dashboard
            </p>
            <h1 className="font-display mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {loading && !student ? "Loading…" : student?.name || "Student"}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="chip chip-primary">
                <BadgeCheck size={12} /> {sid}
              </span>
              <span className="chip">Grades 6 &amp; 7 Robotics</span>
              {fromCache && (
                <span className="chip chip-gold">
                  <WifiOff size={12} /> Offline data
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {loading && !student ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
          <div className="skeleton h-56 lg:col-span-2" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {/* ============ PAYMENTS ============ */}
            <section className="glass rounded-3xl p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display flex items-center gap-2.5 text-base font-bold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
                    <Wallet size={17} />
                  </span>
                  Monthly Payments
                </h2>
                <div className="flex gap-1.5">
                  <span className="chip chip-teal">{paidCount} paid</span>
                  <span className="chip chip-gold">{pendCount} pending</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {monthCells.map((m) => (
                  <div
                    key={m.key}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center transition-transform ${
                      m.current ? "ring-2 ring-[var(--ring)]" : ""
                    }`}
                    style={{
                      borderColor: "var(--border)",
                      background:
                        m.status === "paid"
                          ? "var(--teal-soft)"
                          : m.status === "pending"
                          ? "var(--gold-soft)"
                          : "var(--surface-soft)",
                    }}
                    title={`${m.label} ${year} — ${m.status === "na" ? "upcoming" : m.status}`}
                  >
                    <span className="text-[0.68rem] font-bold uppercase tracking-wide">
                      {m.label}
                    </span>
                    {m.status === "paid" ? (
                      <CheckCircle2 size={15} className="text-[var(--teal)]" />
                    ) : m.status === "pending" ? (
                      <Clock3 size={15} className="text-[var(--gold)]" />
                    ) : (
                      <Minus size={15} className="text-[var(--muted)]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3.5 text-[0.72rem] font-medium text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[var(--teal)]" /> Paid
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} className="text-[var(--gold)]" /> Pending
                </span>
                <span className="flex items-center gap-1.5">
                  <Minus size={13} /> Upcoming month
                </span>
                <span className="flex items-center gap-1.5">● ring = this month</span>
              </div>
            </section>

            {/* ============ ATTENDANCE ============ */}
            <section className="glass rounded-3xl p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="font-display flex items-center gap-2.5 text-base font-bold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                    <CalendarCheck2 size={17} />
                  </span>
                  Attendance
                </h2>
                <span className="chip">{attStats.total} class days</span>
              </div>

              {attStats.total === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center text-[0.85rem] text-[var(--muted)]">
                  No attendance recorded yet — scan your QR card at the next class.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-6">
                  {/* ring */}
                  <div className="relative mx-auto">
                    <svg width="150" height="150" viewBox="0 0 150 150">
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <circle cx="75" cy="75" r={R} fill="none" strokeWidth="12" className="ring-track" />
                      <circle
                        cx="75"
                        cy="75"
                        r={R}
                        fill="none"
                        strokeWidth="12"
                        className="ring-val"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC * (1 - attStats.pct / 100)}
                        transform="rotate(-90 75 75)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-2xl font-extrabold">{attStats.pct}%</span>
                      <span className="text-[0.66rem] font-semibold uppercase tracking-widest text-[var(--muted)]">
                        present
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[150px] flex-1 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-[var(--teal-soft)] px-3.5 py-2.5">
                      <span className="text-[0.8rem] font-semibold text-[var(--teal)]">Days present</span>
                      <span className="font-display text-lg font-extrabold text-[var(--teal)]">{attStats.present}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5">
                      <span className="text-[0.8rem] font-semibold text-[var(--danger)]">Days absent</span>
                      <span className="font-display text-lg font-extrabold text-[var(--danger)]">{attStats.absent}</span>
                    </div>
                  </div>
                </div>
              )}

              {attStats.recent.length > 0 && (
                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="label mb-2.5">Recent classes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {attStats.recent.map(([date, v]) => (
                      <span
                        key={date}
                        className={`chip ${v.present ? "chip-teal" : "chip-danger"}`}
                      >
                        {v.present ? <CheckCircle2 size={11} /> : <Minus size={11} />}
                        {niceDate(date).slice(0, 6)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ============ MARKS ============ */}
          <section className="glass mt-5 rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="font-display flex items-center gap-2.5 text-base font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-2)]">
                  <GraduationCap size={17} />
                </span>
                Exam Marks
              </h2>
              <span className="chip">{marksArr.length} record{marksArr.length === 1 ? "" : "s"}</span>
            </div>

            {marksArr.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center text-[0.85rem] text-[var(--muted)]">
                No exam marks published yet. Keep building — the first test is coming!
              </p>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[430px] text-left text-[0.88rem]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">
                      <th className="pb-3 pr-4 font-semibold">Exam</th>
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 pr-4 font-semibold text-right">Score</th>
                      <th className="pb-3 font-semibold text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksArr.map((m) => {
                      const g = gradeFor(m.score, m.max);
                      return (
                        <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-3.5 pr-4 font-semibold">{m.exam}</td>
                          <td className="py-3.5 pr-4 text-[var(--muted)]">{niceDate(m.date)}</td>
                          <td className="py-3.5 pr-4 text-right font-display font-bold">
                            {m.score}
                            <span className="text-[var(--muted)] font-medium">/{m.max}</span>
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`chip ${
                                g.tone === "ok"
                                  ? "chip-ok"
                                  : g.tone === "teal"
                                  ? "chip-teal"
                                  : g.tone === "gold"
                                  ? "chip-gold"
                                  : "chip-danger"
                              }`}
                            >
                              {g.letter}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="mt-8 text-center text-[0.72rem] text-[var(--muted)]">
            This dashboard is read-only. For corrections, contact Nadeeka Weerasingha — 077 359 4701.
          </p>
        </>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  Wallet,
  GraduationCap,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  CloudOff,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../store/AppStore";
import QrScanner from "./QrScanner";
import {
  monthKeyOf,
  MONTHS_SHORT,
  niceDate,
  parseQr,
  todayISO,
  writeWithQueue,
  initials,
} from "../lib/helpers";
import type { PaymentStatus, Student } from "../types";

type Mode = "attendance" | "payment" | "marks";

const MODES: {
  key: Mode;
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  soft: string;
}[] = [
  {
    key: "attendance",
    icon: CalendarCheck2,
    title: "Attendance",
    desc: "Scan a card to mark the student present or absent for today's class.",
    color: "var(--teal)",
    soft: "var(--teal-soft)",
  },
  {
    key: "payment",
    icon: Wallet,
    title: "Payments",
    desc: "Record a monthly class fee as paid or pending right at the door.",
    color: "var(--gold)",
    soft: "var(--gold-soft)",
  },
  {
    key: "marks",
    icon: GraduationCap,
    title: "Exam Marks",
    desc: "Publish exam scores instantly to the student's dashboard.",
    color: "var(--primary-2)",
    soft: "var(--primary-soft)",
  },
];

interface Props {
  students: Student[];
}

interface Scanned {
  id: string;
  name: string;
}

export default function ActionsPanel({ students }: Props) {
  const { toast, refreshPending, online } = useApp();
  const [mode, setMode] = useState<Mode | null>(null);
  const [scanned, setScanned] = useState<Scanned | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);

  /* payment form */
  const monthOptions = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: monthKeyOf(d),
        label: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return out;
  }, []);
  const [payMonth, setPayMonth] = useState(monthOptions[0].key);
  const [payStatus, setPayStatus] = useState<PaymentStatus>("paid");

  /* marks form */
  const [exam, setExam] = useState("");
  const [score, setScore] = useState("");
  const [max, setMax] = useState("100");

  const resolve = (raw: string) => {
    const id = parseQr(raw);
    if (!id) {
      toast("That QR code is not a bot class student card.", "error");
      return;
    }
    const known = students.find((s) => s.id === id);
    setScanned({ id, name: known?.name || id });
  };

  const finish = async (path: string, value: unknown, label: string, doneMsg: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await writeWithQueue(path, value, label);
      if (res === "synced") {
        toast(doneMsg, "success");
      } else {
        toast(`Saved offline — "${label}" will auto-sync when online.`, "offline");
        refreshPending();
      }
      setScanned(null);
      setExam("");
      setScore("");
    } catch {
      toast("Could not save. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  /* ------------- mode pickers ------------- */
  if (mode === null) {
    return (
      <div>
        {!online && (
          <div className="chip chip-gold mb-4 w-full justify-center !py-2">
            <CloudOff size={13} /> Offline mode — scans are saved on this device and auto-synced later.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key);
                setScanned(null);
              }}
              className="glass card-hover group rounded-3xl p-6 text-left"
            >
              <span
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                style={{ background: m.soft, color: m.color }}
              >
                <m.icon size={22} />
              </span>
              <p className="font-display text-base font-bold">{m.title}</p>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--muted)]">{m.desc}</p>
              <span className="chip mt-4" style={{ color: m.color, background: m.soft, borderColor: "transparent" }}>
                Scan to start
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const active = MODES.find((m) => m.key === mode)!;

  /* ------------- scanning step ------------- */
  if (!scanned) {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="chip" style={{ color: active.color, background: active.soft, borderColor: "transparent" }}>
            <active.icon size={13} /> {active.title}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
            <ChevronLeft size={14} /> Change
          </button>
        </div>

        <QrScanner onScan={resolve} hint="Scan the student's ID card" />

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) resolve(manual);
          }}
        >
          <input
            className="input flex-1"
            placeholder="Or type ID — e.g. BC-001"
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
          <button className="btn btn-teal" type="submit" disabled={!manual.trim()}>
            <Keyboard size={16} /> Go
          </button>
        </form>
      </div>
    );
  }

  /* ------------- confirm step ------------- */
  return (
    <div className="mx-auto max-w-md">
      <div className="glass modal-card rounded-3xl p-6">
        <div className="mb-5 flex items-center gap-3.5">
          <div className="brand-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold text-white">
            {initials(scanned.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold">{scanned.name}</p>
            <span className="chip chip-primary mt-1 !text-[0.66rem]">{scanned.id}</span>
          </div>
        </div>

        {mode === "attendance" && (
          <>
            <p className="label">Today's class — {niceDate(todayISO())}</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="btn btn-teal w-full"
                disabled={busy}
                onClick={() =>
                  finish(
                    `attendance/${scanned.id}/${todayISO()}`,
                    { present: true, ts: Date.now() },
                    `Attendance (present) ${scanned.id}`,
                    `${scanned.name.split(" ")[0]} marked present.`
                  )
                }
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Present
              </button>
              <button
                type="button"
                className="btn btn-danger w-full"
                disabled={busy}
                onClick={() =>
                  finish(
                    `attendance/${scanned.id}/${todayISO()}`,
                    { present: false, ts: Date.now() },
                    `Attendance (absent) ${scanned.id}`,
                    `${scanned.name.split(" ")[0]} marked absent.`
                  )
                }
              >
                <XCircle size={16} /> Absent
              </button>
            </div>
          </>
        )}

        {mode === "payment" && (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="pay-month">Month</label>
              <select
                id="pay-month"
                className="input"
                value={payMonth}
                onChange={(e) => setPayMonth(e.target.value)}
              >
                {monthOptions.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pay-status">Status</label>
              <select
                id="pay-status"
                className="input"
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value as PaymentStatus)}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={busy}
              onClick={() => {
                const label = monthOptions.find((m) => m.key === payMonth)?.label || payMonth;
                finish(
                  `payments/${scanned.id}/${payMonth}`,
                  payStatus,
                  `Payment ${label} (${payStatus}) ${scanned.id}`,
                  `${label} fee for ${scanned.name.split(" ")[0]} marked ${payStatus}.`
                );
              }}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              Save payment
            </button>
          </div>
        )}

        {mode === "marks" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const sc = Number(score);
              const mx = Number(max);
              if (!exam.trim()) return toast("Enter the exam name.", "error");
              if (!Number.isFinite(sc) || sc < 0) return toast("Enter a valid score.", "error");
              if (!Number.isFinite(mx) || mx <= 0) return toast("Max marks must be above 0.", "error");
              if (sc > mx) return toast("Score cannot exceed max marks.", "error");
              finish(
                `marks/${scanned.id}/${Date.now().toString(36)}`,
                { exam: exam.trim(), score: sc, max: mx, date: todayISO(), ts: Date.now() },
                `Marks "${exam.trim()}" ${scanned.id}`,
                `${exam.trim()} marks published for ${scanned.name.split(" ")[0]}.`
              );
            }}
          >
            <div>
              <label className="label" htmlFor="mk-exam">Exam name</label>
              <input
                id="mk-exam"
                className="input"
                placeholder="e.g. Term Test 1 — Circuits"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="mk-score">Score</label>
                <input
                  id="mk-score"
                  className="input"
                  inputMode="numeric"
                  placeholder="78"
                  value={score}
                  onChange={(e) => setScore(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>
              <div>
                <label className="label" htmlFor="mk-max">Out of</label>
                <input
                  id="mk-max"
                  className="input"
                  inputMode="numeric"
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
              Publish marks
            </button>
          </form>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm mx-auto mt-5"
          onClick={() => setScanned(null)}
        >
          <ChevronLeft size={14} /> Scan another card
        </button>
      </div>
    </div>
  );
}

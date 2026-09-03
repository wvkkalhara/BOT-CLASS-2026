import { useMemo, useState, type FormEvent } from "react";
import { ref, update } from "firebase/database";
import {
  IdCard,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppStore";
import IdCardModal from "./IdCardModal";
import { initials, nextStudentId, niceDate, writeWithQueue } from "../lib/helpers";
import type { Student } from "../types";

interface Props {
  students: Student[];
}

export default function StudentsPanel({ students }: Props) {
  const { toast, refreshPending, online } = useApp();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [sid, setSid] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...students].sort((a, b) => a.id.localeCompare(b.id));
    if (!q) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [students, query]);

  const openAdd = () => {
    setSid(nextStudentId(students.map((s) => s.id)));
    setName("");
    setPass("");
    setFormErr(null);
    setShowAdd(true);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const nm = name.trim();
    const id = sid.trim().toUpperCase();
    if (nm.length < 2) return setFormErr("Please enter the student's full name.");
    if (!id) return setFormErr("Student ID cannot be empty.");
    if (!/^\d{4}$/.test(pass)) return setFormErr("Passcode must be exactly 4 digits.");
    if (students.some((s) => s.id === id))
      return setFormErr(`ID "${id}" is already taken. Choose another.`);

    setFormErr(null);
    setBusy(true);
    try {
      const value = { name: nm, passcode: pass, createdAt: Date.now() };
      const res = await writeWithQueue(`students/${id}`, value, `Add student ${nm}`);
      const st: Student = { id, ...value };
      if (res === "synced") {
        toast(`${nm} was added as ${id}.`, "success");
      } else {
        toast(`${nm} saved offline — will sync when you're back online.`, "offline");
        refreshPending();
      }
      setShowAdd(false);
      setCardStudent(st); // straight to ID card printing
    } catch {
      toast("Could not add the student. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (s: Student) => {
    if (!online) {
      toast("Deleting students needs an internet connection.", "error");
      setConfirmDelete(null);
      return;
    }
    try {
      await update(ref(db), {
        [`students/${s.id}`]: null,
        [`attendance/${s.id}`]: null,
        [`payments/${s.id}`]: null,
        [`marks/${s.id}`]: null,
      });
      toast(`${s.name} and all records removed.`, "info");
    } catch {
      toast("Delete failed. Try again.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* header row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input !pl-10"
            placeholder="Search name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={showAdd ? () => setShowAdd(false) : openAdd}>
          <UserPlus size={16} /> {showAdd ? "Close form" : "Add student"}
        </button>
      </div>

      {/* add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="glass modal-card rounded-3xl p-5 sm:p-6">
          <h3 className="font-display mb-4 flex items-center gap-2 text-base font-bold">
            <Plus size={16} className="text-[var(--teal)]" /> New student
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="ns-name">Full name</label>
              <input
                id="ns-name"
                className="input"
                placeholder="e.g. Kavin Perera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="ns-id">Student ID</label>
              <input
                id="ns-id"
                className="input font-display font-semibold tracking-wider"
                value={sid}
                onChange={(e) => setSid(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="label" htmlFor="ns-pass">4-digit passcode</label>
              <input
                id="ns-pass"
                className="input font-display tracking-[0.3em]"
                placeholder="••••"
                inputMode="numeric"
                maxLength={4}
                value={pass}
                onChange={(e) => setPass(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>

          {formErr && (
            <p className="mt-4 rounded-xl bg-[var(--danger-soft)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--danger)]">
              {formErr}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button className="btn btn-teal" type="submit" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {busy ? "Saving…" : "Save & create ID card"}
            </button>
            <p className="self-center text-[0.72rem] text-[var(--muted)]">
              Works offline too — the record syncs automatically later.
            </p>
          </div>
        </form>
      )}

      {/* list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-12 text-center">
          <p className="font-display text-base font-bold">
            {students.length === 0 ? "No students yet" : "No matches"}
          </p>
          <p className="mt-1.5 text-[0.82rem] text-[var(--muted)]">
            {students.length === 0
              ? "Add your first student to generate their QR ID card."
              : "Try a different name or ID."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="glass card-hover flex flex-wrap items-center gap-3.5 rounded-2xl px-4 py-3.5 sm:px-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] font-display text-sm font-bold text-[var(--primary-2)]">
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[0.95rem] font-bold">{s.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-primary !text-[0.66rem]">{s.id}</span>
                  <span className="chip !text-[0.66rem]">
                    <KeyRound size={10} /> PIN {s.passcode || "————"}
                  </span>
                  <span className="chip !text-[0.66rem]">
                    joined {s.createdAt ? niceDate(new Date(s.createdAt).toISOString().slice(0, 10)) : "—"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCardStudent(s)}
                >
                  <IdCard size={14} /> ID card
                </button>
                {confirmDelete === s.id ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => doDelete(s)}
                    onBlur={() => setConfirmDelete(null)}
                  >
                    <Trash2 size={14} /> Confirm delete
                  </button>
                ) : (
                  <button
                    type="button"
                    className="icon-btn !w-9 !h-9 text-[var(--muted)] hover:text-[var(--danger)]"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => setConfirmDelete(s.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <IdCardModal student={cardStudent} onClose={() => setCardStudent(null)} />
    </div>
  );
}

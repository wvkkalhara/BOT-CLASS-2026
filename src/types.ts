export interface Student {
  id: string;
  name: string;
  passcode: string;
  createdAt: number;
}

export type PaymentStatus = "paid" | "pending";

export interface AttendanceEntry {
  present: boolean;
  ts: number;
}

export interface MarkEntry {
  exam: string;
  score: number;
  max: number;
  date: string;
  ts: number;
}

export type Session =
  | { kind: "admin"; email: string }
  | { kind: "student"; id: string; name: string }
  | null;

export interface QueuedOp {
  key?: number;
  path: string;
  value: unknown;
  label: string;
  ts: number;
}

export interface StudentData {
  student: Student | null;
  attendance: Record<string, AttendanceEntry>;
  payments: Record<string, PaymentStatus>;
  marks: Record<string, MarkEntry>;
  fromCache: boolean;
}

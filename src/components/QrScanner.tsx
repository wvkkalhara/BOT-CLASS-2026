import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff, RotateCcw, ScanLine } from "lucide-react";
import { friendlyCameraError } from "../lib/helpers";

interface Props {
  onScan: (text: string) => void;
  hint?: string;
}

let uidSeq = 0;

export default function QrScanner({ onScan, hint }: Props) {
  const [elId] = useState(
    () => `qrscan-${++uidSeq}-${Math.random().toString(36).slice(2, 7)}`
  );
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const lastHit = useRef(0);

  useEffect(() => {
    setError(null);
    let disposed = false;
    const scanner = new Html5Qrcode(elId, { verbose: false });

    const timer = window.setTimeout(() => {
      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (w: number, h: number) => {
              const s = Math.floor(Math.min(w, h) * 0.72);
              return { width: s, height: s };
            },
            aspectRatio: 1,
          },
          (decoded: string) => {
            const now = Date.now();
            if (now - lastHit.current < 1800) return;
            lastHit.current = now;
            try {
              navigator.vibrate?.(90);
            } catch {
              /* haptics unsupported */
            }
            onScanRef.current(decoded);
          },
          () => {
            /* per-frame decode miss — ignore */
          }
        )
        .catch((e: unknown) => {
          if (!disposed) setError(friendlyCameraError(e));
        });
    }, 200);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      const clearScanner = () => {
        try {
          scanner.clear();
        } catch {
          /* already cleared */
        }
      };
      try {
        const stop = scanner.stop();
        Promise.resolve(stop)
          .catch(() => {})
          .finally(clearScanner);
      } catch {
        clearScanner();
      }
    };
  }, [elId, retryTick]);

  return (
    <div>
      {error ? (
        <div className="glass rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
            <CameraOff size={22} />
          </div>
          <p className="text-sm font-semibold mb-1.5">Camera unavailable</p>
          <p className="text-[0.8rem] leading-relaxed text-[var(--muted)] mb-4">
            {error}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm mx-auto"
            onClick={() => setRetryTick((t) => t + 1)}
          >
            <RotateCcw size={14} /> Retry camera
          </button>
        </div>
      ) : (
        <div className="scan-shell">
          <div id={elId} className="w-full" style={{ minHeight: 260 }} />
          <div className="scan-frame">
            <div className="scan-corners">
              <span />
              <span />
              <span />
              <span />
              <div className="scan-line" />
            </div>
          </div>
        </div>
      )}
      {!error && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.78rem] text-[var(--muted)]">
          <ScanLine size={13} className="text-[var(--teal)]" />
          {hint || "Point the camera at the student's QR card"}
        </p>
      )}
    </div>
  );
}

import { CheckCircle2, CloudOff, Info, XCircle } from "lucide-react";
import { useApp } from "../store/AppStore";

const ICONS = {
  success: <CheckCircle2 size={17} className="shrink-0 text-[var(--ok)]" />,
  error: <XCircle size={17} className="shrink-0 text-[var(--danger)]" />,
  info: <Info size={17} className="shrink-0 text-[var(--primary-2)]" />,
  offline: <CloudOff size={17} className="shrink-0 text-[var(--gold)]" />,
};

export default function ToastHost() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 no-print">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className="toast glass-strong pointer-events-auto text-left"
        >
          {ICONS[t.kind]}
          <span>{t.msg}</span>
        </button>
      ))}
    </div>
  );
}

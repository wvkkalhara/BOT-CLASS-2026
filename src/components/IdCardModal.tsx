import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Bot, Download, Loader2, Printer, X } from "lucide-react";
import { qrPayloadFor } from "../lib/helpers";
import { useApp } from "../store/AppStore";
import type { Student } from "../types";

interface Props {
  student: Student | null;
  onClose: () => void;
}

function CardFace({ qrUrl, student }: { qrUrl: string; student: Student }) {
  return (
    <div className="idcard">
      <div className="relative z-10 flex h-full flex-col justify-between p-[4.5%]">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-teal-400 text-white">
              <Bot size={15} />
            </span>
            <span className="font-display text-[15px] font-extrabold tracking-tight text-white">
              bot <span className="text-teal-300">class</span>
            </span>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/90">
            Student ID
          </span>
        </div>

        {/* body */}
        <div className="flex items-center gap-4">
          <div className="idcard-qr h-[86px] w-[86px] shrink-0 sm:h-[96px] sm:w-[96px]">
            {qrUrl && <img src={qrUrl} alt={`QR for ${student.id}`} />}
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.24em] text-teal-300">
              Student
            </p>
            <p className="font-display truncate text-[16px] font-bold leading-tight text-white sm:text-[18px]">
              {student.name}
            </p>
            <p className="mt-1 inline-block rounded-md bg-white/12 px-2 py-0.5 font-display text-[11px] font-bold tracking-[0.14em] text-amber-300">
              {student.id}
            </p>
            <p className="mt-1.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-white/60">
              Robotics &amp; Coding — Grades 6 &amp; 7
            </p>
          </div>
        </div>

        {/* footer */}
        <div>
          <div className="mb-1.5 h-px w-full bg-gradient-to-r from-teal-400/70 via-indigo-400/50 to-amber-400/70" />
          <div className="flex items-center justify-between text-[8.5px] font-medium text-white/75">
            <span>Nadeeka Weerasingha • 077 359 4701</span>
            <span className="tracking-[0.14em] text-white/50">VALID 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IdCardModal({ student, onClose }: Props) {
  const { toast } = useApp();
  const [qrUrl, setQrUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!student) return;
    let alive = true;
    QRCode.toDataURL(qrPayloadFor(student.id), {
      width: 512,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#1b1d4e", light: "#ffffff" },
    })
      .then((url) => {
        if (alive) setQrUrl(url);
      })
      .catch(() => toast("Could not generate QR code.", "error"));
    return () => {
      alive = false;
    };
  }, [student, toast]);

  if (!student) return null;

  const downloadPng = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `botclass-id-${student.id}.png`;
      a.click();
      toast("ID card image downloaded.", "success");
    } catch {
      toast("Download failed on this device. Try Print instead.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="modal-overlay absolute inset-0 bg-[#05070f]/60 backdrop-blur-md" onClick={onClose} />
      <div className="modal-card glass relative w-full sm:max-w-[460px] rounded-t-3xl sm:rounded-3xl p-6 max-h-[94vh] overflow-y-auto no-scrollbar">
        <button className="icon-btn absolute right-4 top-4 !w-9 !h-9 no-print" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <h2 className="font-display text-lg font-bold mb-1">Student ID Card</h2>
        <p className="text-[0.78rem] text-[var(--muted)] mb-5">
          Print or download this card and hand it to {student.name.split(" ")[0]}.
        </p>

        {/* on-screen preview */}
        <div className="flex justify-center no-print">
          <div ref={cardRef} className="w-full max-w-[372px]">
            <CardFace qrUrl={qrUrl} student={student} />
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-[var(--primary-soft)] px-4 py-2.5 text-[0.75rem] leading-relaxed text-[var(--muted)] no-print">
          Tip: on a phone, choose <strong className="text-[var(--text)]">Print</strong> and then
          "Save as PDF" — or download the PNG and share it on WhatsApp.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5 no-print">
          <button type="button" className="btn btn-primary flex-1" onClick={() => window.print()}>
            <Printer size={16} /> Print card
          </button>
          <button type="button" className="btn btn-ghost flex-1" onClick={downloadPng} disabled={downloading}>
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PNG
          </button>
        </div>
      </div>

      {/* print-only zone (hidden on screen, exact card size when printing) */}
      <div id="print-zone" aria-hidden="true">
        <CardFace qrUrl={qrUrl} student={student} />
      </div>
    </div>
  );
}

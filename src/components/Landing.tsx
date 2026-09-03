import { useEffect } from "react";
import {
  Bot,
  QrCode,
  ArrowRight,
  Sparkles,
  Gamepad2,
  CircuitBoard,
  Cpu,
  Car,
  Wrench,
  Users,
  Puzzle,
  Phone,
  MessageCircle,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface Props {
  onLogin: () => void;
}

interface Stage {
  n: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tool: string;
  color: string;
  soft: string;
}

const STAGES: Stage[] = [
  {
    n: "01",
    icon: Gamepad2,
    title: "Coding Basics",
    desc: "Logic & games using Scratch. Students think like programmers by building animations and playable games from day one.",
    tool: "Scratch",
    color: "var(--teal-bright)",
    soft: "var(--teal-soft)",
  },
  {
    n: "02",
    icon: CircuitBoard,
    title: "Virtual Electronics",
    desc: "Safe circuit simulation using Tinkercad. Wire LEDs, sensors and motors in a virtual lab before touching real hardware.",
    tool: "Tinkercad",
    color: "var(--primary-2)",
    soft: "var(--primary-soft)",
  },
  {
    n: "03",
    icon: Cpu,
    title: "Real Hardware",
    desc: "Arduino programming made easy with mBlock. Drag, drop, upload — and watch code come alive on a real board.",
    tool: "mBlock + Arduino",
    color: "var(--gold-bright)",
    soft: "var(--gold-soft)",
  },
  {
    n: "04",
    icon: Car,
    title: "Advanced Projects",
    desc: "Build a Smart Dustbin, a Motion Alarm and an Obstacle-Avoiding Car — real robots students proudly take home.",
    tool: "Physical Builds",
    color: "var(--teal-bright)",
    soft: "var(--teal-soft)",
  },
];

const MARQUEE = [
  "Scratch", "Tinkercad", "mBlock", "Arduino UNO", "Ultrasonic Sensors",
  "Servo Motors", "LED Circuits", "Smart Dustbin", "Motion Alarm",
  "Obstacle-Avoiding Car", "Logic & Loops", "Team Builds",
];

const QUALS = [
  "BSc BA Information Systems (Special Degree)",
  "PGDE",
  "SCJP",
];

export default function Landing({ onLogin }: Props) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ================= NAV ================= */}
      <header className="fixed inset-x-3 top-3 z-40 sm:inset-x-6">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 sm:px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="brand-tile flex h-9 w-9 items-center justify-center rounded-xl text-white">
              <Bot size={19} />
            </span>
            <span className="font-display text-[1.05rem] font-bold tracking-tight">
              bot <span className="grad-brand">class</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-[0.85rem] font-medium text-[var(--muted)] md:flex">
            <a href="#journey" className="transition-colors hover:text-[var(--text)]">Journey</a>
            <a href="#why" className="transition-colors hover:text-[var(--text)]">Why Us</a>
            <a href="#instructor" className="transition-colors hover:text-[var(--text)]">Instructor</a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" className="btn btn-primary btn-sm !rounded-xl" onClick={onLogin}>
              <QrCode size={14} /> Portal Login
            </button>
          </div>
        </nav>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="relative mx-auto max-w-6xl px-4 pt-32 pb-14 sm:px-6 sm:pt-40 sm:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="reveal in">
            <span className="chip chip-teal mb-5">
              <Sparkles size={13} /> Robotics &amp; Coding — Grades 6 &amp; 7
            </span>
            <h1 className="font-display text-[clamp(2.4rem,6.5vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight">
              Build the Future
              <br />
              with <span className="grad-text">bot class</span>
            </h1>
            <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-[var(--muted)]">
              Learn coding and hardware step-by-step through fun, practical
              projects for Grades 6 &amp; 7 — from your first Scratch game to a
              real obstacle-avoiding robot car.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" onClick={onLogin}>
                <QrCode size={17} /> Student Login
              </button>
              <a href="#journey" className="btn btn-ghost">
                Explore the Journey <ArrowRight size={16} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {[
                ["4", "Learning stages"],
                ["100%", "Hands-on practicals"],
                ["15+", "Real projects"],
              ].map(([num, label]) => (
                <div key={label} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                  <span className="font-display text-xl font-extrabold grad-brand">{num}</span>
                  <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* hero visual */}
          <div className="reveal in relative mx-auto w-full max-w-[420px]" style={{ ["--rd" as string]: "120ms" }}>
            <div className="glass overflow-hidden rounded-[2rem] p-2.5">
              <div className="relative overflow-hidden rounded-[1.55rem]">
                <img
                  src="/images/hero-robot.jpg"
                  alt="bot class robot holding a circuit board"
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0a0f2e]/85 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold text-white">Meet the class bot</p>
                    <p className="text-[0.7rem] text-white/70">Built &amp; coded by our students</p>
                  </div>
                  <span className="chip !border-white/20 !bg-white/10 !text-white backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Admissions open
                  </span>
                </div>
              </div>
            </div>

            {/* floating tool chips */}
            {[
              { label: "Scratch", cls: "-left-3 top-10 sm:-left-8", fd: "0ms" },
              { label: "Tinkercad", cls: "-right-2 top-1/3 sm:-right-7", fd: "900ms" },
              { label: "mBlock", cls: "-left-4 bottom-28 sm:-left-10", fd: "1500ms" },
              { label: "Arduino", cls: "-right-3 bottom-10 sm:-right-8", fd: "600ms" },
            ].map((c) => (
              <div
                key={c.label}
                className={`floaty glass absolute ${c.cls} rounded-xl px-3.5 py-2 font-display text-[0.74rem] font-bold`}
                style={{ ["--fd" as string]: c.fd }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* marquee */}
        <div className="marquee mt-16 sm:mt-20">
          <div className="marquee-track py-2">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="flex items-center gap-3 font-display text-[0.82rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= JOURNEY ================= */}
      <section id="journey" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal mx-auto mb-14 max-w-2xl text-center">
          <span className="chip chip-primary mb-4">Our Learning Journey</span>
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold tracking-tight">
            From first block of code to
            <span className="grad-text"> real moving robots</span>
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--muted)]">
            A carefully staged curriculum that keeps every lesson playful,
            practical and confidence-building.
          </p>
        </div>

        <div className="timeline flex flex-col gap-8 md:gap-12">
          {STAGES.map((s, i) => (
            <div
              key={s.n}
              className="tl-item reveal"
              style={{ ["--rd" as string]: `${i * 90}ms` }}
            >
              <span
                className="tl-dot"
                style={{ ["--tl-c" as string]: s.color, ["--tl-soft" as string]: s.soft }}
              />
              <article className="glass card-hover rounded-3xl p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="stage-num" style={{ ["--tl-c" as string]: s.color }}>
                    {s.n}
                  </span>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: s.soft, color: s.color }}
                  >
                    <s.icon size={22} />
                  </span>
                </div>
                <h3 className="font-display mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[var(--muted)]">{s.desc}</p>
                <span className="chip mt-4" style={{ color: s.color, background: s.soft, borderColor: "transparent" }}>
                  {s.tool}
                </span>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WHY ================= */}
      <section id="why" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal mx-auto mb-12 max-w-2xl text-center">
          <span className="chip chip-teal mb-4">Why Join Us</span>
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold tracking-tight">
            Skills that outlast the lesson
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Wrench,
              title: "100% Practical Learning",
              desc: "No dry theory. Every concept is wired, coded and tested by the student's own hands in every single session.",
              color: "var(--teal-bright)",
              soft: "var(--teal-soft)",
            },
            {
              icon: Users,
              title: "Teamwork",
              desc: "Students design, build and debug in small teams — learning to share ideas, divide work and celebrate wins together.",
              color: "var(--primary-2)",
              soft: "var(--primary-soft)",
            },
            {
              icon: Puzzle,
              title: "Problem-Solving",
              desc: "Real projects fail before they work. We coach kids to think, trace the bug, and fix it — a skill for life.",
              color: "var(--gold-bright)",
              soft: "var(--gold-soft)",
            },
          ].map((w, i) => (
            <article
              key={w.title}
              className="reveal glass card-hover rounded-3xl p-7"
              style={{ ["--rd" as string]: `${i * 100}ms` }}
            >
              <span
                className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl p-3"
                style={{ background: w.soft, color: w.color }}
              >
                <w.icon size={24} />
              </span>
              <h3 className="font-display text-lg font-bold">{w.title}</h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[var(--muted)]">{w.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= INSTRUCTOR ================= */}
      <section id="instructor" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal glass-strong relative overflow-hidden rounded-[2rem] p-7 sm:p-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--teal), transparent 60%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--primary-2), transparent 60%)" }}
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
            <div className="relative mx-auto lg:mx-0">
              <div className="brand-tile flex h-24 w-24 items-center justify-center rounded-[1.6rem] font-display text-3xl font-extrabold text-white sm:h-28 sm:w-28">
                NW
              </div>
              <span className="chip chip-ok absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">
                <BadgeCheck size={12} /> Instructor
              </span>
            </div>

            <div className="text-center lg:text-left">
              <span className="chip chip-primary mb-3">Meet Your Instructor</span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Nadeeka Weerasingha
              </h3>
              <div className="mt-3.5 flex flex-wrap justify-center gap-2 lg:justify-start">
                {QUALS.map((q) => (
                  <span key={q} className="chip">{q}</span>
                ))}
              </div>
              <p className="mx-auto mt-4 max-w-lg text-[0.9rem] leading-relaxed text-[var(--muted)] lg:mx-0">
                Guiding Grades 6 &amp; 7 students through coding, electronics and
                robotics with patience, structure and a whole lot of fun.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2.5 sm:flex-row lg:flex-col">
              <a href="tel:+94773594701" className="btn btn-primary">
                <Phone size={16} /> 077 359 4701
              </a>
              <a
                href="https://wa.me/94773594701"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="brand-tile flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <Bot size={16} />
            </span>
            <div>
              <p className="font-display text-sm font-bold">bot <span className="grad-brand">class</span></p>
              <p className="text-[0.7rem] text-[var(--muted)]">Robotics &amp; coding tuition — Grades 6 &amp; 7</p>
            </div>
          </div>
          <p className="text-[0.75rem] text-[var(--muted)]">
            Instructor: Nadeeka Weerasingha — 077 359 4701
          </p>
          <p className="text-[0.72rem] text-[var(--muted)]">© 2026 bot class. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

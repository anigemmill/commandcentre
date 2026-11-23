/*
  Command Centre design system: primitives (docs/design-system.md, spec 09 §5–6).
  Server-safe (no hooks). Semantic tokens only. Editorial rules: headings and hairline rules group
  content; one white working surface per area at most; forest is for action and emphasis.
*/
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { OBJECTIVE_STATUS_LABEL, PRIORITY_LABEL, STATUS_LABEL, type ObjectiveStatus, type TaskPriority, type TaskStatus } from "@/server/task-options";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function buttonClass(variant: Variant = "primary", size: "sm" | "md" = "md") {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-(--oi-duration-fast) disabled:opacity-60 disabled:cursor-not-allowed",
    size === "md" ? "min-h-10 px-4 text-sm" : "min-h-8 px-3 text-sm",
    variant === "primary" && "bg-action text-on-action hover:bg-action-hover",
    variant === "secondary" && "border border-control bg-surface text-ink hover:bg-surface-muted",
    variant === "ghost" && "text-ink hover:bg-surface-muted",
    variant === "danger" && "text-danger hover:bg-surface-muted",
  );
}
export function Button({ variant = "primary", size = "md", className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button className={cx(buttonClass(variant, size), className)} {...rest} />;
}
export function ButtonLink({ variant = "secondary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...rest} />;
}

/* ---------- Forms ---------- */
export const controlClass =
  "mt-1.5 block w-full min-h-10 rounded-sm border border-control bg-surface px-3 py-2 text-base text-ink placeholder:text-muted";
export function Field({ label, optional, hint, className, children }: { label: string; optional?: boolean; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cx("block text-sm font-medium text-ink", className)}>
      {label}
      {optional && <span className="ml-1 font-normal text-muted">optional</span>}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

/* ---------- Typography and structure ---------- */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-mono text-xs uppercase tracking-[0.08em] text-muted", className)}>{children}</p>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[72ch]">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-3xl tracking-tight md:text-[2.25rem]">{title}</h1>
        {description && <p className="mt-3 text-md text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </header>
  );
}

/** A content group: mono label above a hairline rule. No card. */
export function Section({ label, id, action, className, children }: { label: string; id?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  const headingId = id ?? `s-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex min-h-8 items-end justify-between border-b border-line pb-3">
        <h2 id={headingId} className="font-mono text-xs font-normal uppercase tracking-[0.08em] text-muted">{label}</h2>
        {action}
      </div>
      <div className="pt-2">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-sm text-muted">{children}</p>;
}

export function TextLink({ className, ...rest }: ComponentProps<typeof Link>) {
  return <Link className={cx("text-sm text-accent-ink underline decoration-line underline-offset-4 hover:decoration-current", className)} {...rest} />;
}

/* ---------- Status indicators: shape + text, never colour alone ---------- */
const STATUS_TONE: Record<TaskStatus, string> = {
  todo: "text-muted",
  in_progress: "text-info",
  blocked: "text-danger",
  in_review: "text-warning",
  done: "text-success",
};
function StatusGlyph({ status }: { status: TaskStatus }) {
  const common = { width: 12, height: 12, viewBox: "0 0 12 12", "aria-hidden": true, className: cx("shrink-0", STATUS_TONE[status]) } as const;
  switch (status) {
    case "todo":
      return <svg {...common}><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
    case "in_progress":
      return <svg {...common}><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" /></svg>;
    case "blocked":
      return <svg {...common}><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M3 9 9 3" stroke="currentColor" strokeWidth="1.5" /></svg>;
    case "in_review":
      return <svg {...common}><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="6" cy="6" r="1.75" fill="currentColor" /></svg>;
    case "done":
      return <svg {...common}><circle cx="6" cy="6" r="5.25" fill="currentColor" /><path d="m3.6 6.1 1.6 1.6 3.2-3.3" fill="none" className="stroke-surface" strokeWidth="1.4" /></svg>;
  }
}
export function TaskStatusIndicator({ status, hideLabel }: { status: TaskStatus; hideLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <StatusGlyph status={status} />
      <span className={hideLabel ? "sr-only" : undefined}>{STATUS_LABEL[status]}</span>
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: TaskPriority }) {
  if (priority === "normal" || priority === "low") return <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{PRIORITY_LABEL[priority]}</span>;
  return (
    <span className={cx("font-mono text-xs uppercase tracking-[0.08em]", priority === "urgent" ? "text-danger" : "text-accent-ink")}>
      {priority === "urgent" ? "▲▲ " : "▲ "}
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function ObjectiveStatusLabel({ status }: { status: ObjectiveStatus }) {
  return <span className={cx("font-mono text-xs uppercase tracking-[0.08em]", status === "achieved" ? "text-success" : status === "active" ? "text-accent-ink" : "text-muted")}>{OBJECTIVE_STATUS_LABEL[status]}</span>;
}

/** Real progress only: done of total linked tasks. With no linked tasks it says so instead of showing 0%. */
export function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  if (total === 0) return <p className="text-xs text-muted">No tasks linked yet</p>;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} of ${total} tasks done`} className="h-1 flex-1 overflow-hidden rounded-pill bg-line">
        <div className="h-full rounded-pill bg-action" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">{done}/{total}</span>
    </div>
  );
}

/* ---------- Dates (plain YYYY-MM-DD values, formatted without timezone shifts) ---------- */
const DAY = 86_400_000;
const asUtc = (d: string) => Date.parse(`${d}T00:00:00Z`);
export function formatDate(d: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-NZ", { ...opts, timeZone: "UTC" }).format(asUtc(d));
}
export function relativeDay(d: string, today: string) {
  const diff = Math.round((asUtc(d) - asUtc(today)) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff} days overdue`;
  if (diff < 7) return formatDate(d, { weekday: "long" });
  return formatDate(d);
}
export function DueLabel({ date, today, done }: { date: string | null; today: string; done?: boolean }) {
  if (!date) return <span className="text-sm text-muted">No date</span>;
  const overdue = !done && date < today;
  return (
    <time dateTime={date} className={cx("font-mono text-xs tabular-nums", overdue ? "text-danger" : date === today ? "text-ink" : "text-muted")}>
      {relativeDay(date, today)}
    </time>
  );
}
export function timeAgo(at: Date, now = new Date()) {
  const s = Math.round((now.getTime() - at.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en-NZ", { numeric: "auto" });
  if (s < 60) return "just now";
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}

/* ---------- Tables ---------- */
export const tableClass = "w-full border-collapse text-left text-sm";
export const thClass = "border-b border-line py-3 pr-4 font-mono text-xs font-normal uppercase tracking-[0.08em] text-muted";
export const tdClass = "border-b border-line py-3.5 pr-4 align-middle text-base";

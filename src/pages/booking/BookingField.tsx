import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function SummaryItem({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={["flex items-start justify-between gap-3", bold ? "font-semibold" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 text-right">{value}</dd>
    </div>
  );
}

import type { Notice } from "./utils";

export function BookingNoticeToast({
  notice,
  onClose,
  closeLabel,
}: {
  notice: Notice | null;
  onClose: () => void;
  closeLabel: string;
}) {
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 shadow-lg ring-1 ring-black/10 text-white flex items-center gap-3",
        notice.type === "success" ? "bg-green-600" : "bg-red-600",
      ].join(" ")}
    >
      <span>{notice.text}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
        aria-label={closeLabel}
        title={closeLabel}
      >
        x
      </button>
    </div>
  );
}

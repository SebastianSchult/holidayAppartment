export function BookingNoticeToast({
  notice,
  onClose,
}: {
  notice: null | {
    type: "success" | "error";
    text: string;
    actionText?: string;
    onAction?: () => void;
  };
  onClose: () => void;
}) {
  if (!notice) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-2 text-white shadow-lg ${notice.type === "success" ? "bg-green-600" : "bg-red-600"}`}
      role="status"
      aria-live="polite"
    >
      <span>{notice.text}</span>
      {notice.actionText && notice.onAction && (
        <button
          onClick={notice.onAction}
          className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
        >
          {notice.actionText}
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Schliessen"
        className="rounded bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
        type="button"
      >
        x
      </button>
    </div>
  );
}

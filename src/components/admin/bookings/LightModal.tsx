import { useEffect, useId, useRef, type ReactNode } from "react";

export function LightModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      onClick={(event) => {
        if (event.target === backdropRef.current) {
          onClose();
        }
      }}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full rounded-t-2xl bg-white p-4 shadow-xl md:max-w-2xl md:rounded-2xl md:p-5">
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Schliessen"
            onClick={onClose}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            x
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

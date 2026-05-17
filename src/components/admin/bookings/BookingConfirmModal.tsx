import { LightModal } from "./LightModal";
import type { ConfirmState } from "./types";

export function BookingConfirmModal({
  confirmState,
  onClose,
  onConfirmCancel,
  onConfirmDelete,
}: {
  confirmState: ConfirmState;
  onClose: () => void;
  onConfirmCancel: () => void;
  onConfirmDelete: () => void;
}) {
  if (!confirmState) return null;

  const isCancel = confirmState.kind === "cancel";

  return (
    <LightModal
      onClose={onClose}
      title={isCancel ? "Buchung stornieren" : "Eintrag loschen"}
    >
      <p className="text-sm text-slate-700">
        {isCancel
          ? "Mochtest du diese Buchung wirklich stornieren?"
          : "Mochtest du diesen Eintrag endgultig loschen? Dies kann nicht ruckgangig gemacht werden."}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
        >
          Abbrechen
        </button>
        {isCancel ? (
          <button
            onClick={onConfirmCancel}
            className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
          >
            Ja, stornieren
          </button>
        ) : (
          <button
            onClick={onConfirmDelete}
            className="rounded bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-800"
          >
            Ja, loschen
          </button>
        )}
      </div>
    </LightModal>
  );
}

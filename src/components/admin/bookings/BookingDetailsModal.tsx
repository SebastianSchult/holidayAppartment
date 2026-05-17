import type { ReactNode } from "react";
import type { BusyState, BookingRow } from "./types";
import { isApproved, isCancelled, isDeclined, normalizeStatus } from "./utils";
import { LightModal } from "./LightModal";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="font-medium text-slate-800">{title}</h4>
      <div className="mt-1 space-y-1">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={["flex justify-between gap-4", bold ? "font-semibold" : ""].filter(Boolean).join(" ")}>
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

export function BookingDetailsModal({
  selected,
  busy,
  onClose,
  onApprove,
  onDecline,
  onAskCancel,
  onAskDelete,
  formatDate,
  formatMoney,
}: {
  selected: BookingRow;
  busy: BusyState;
  onClose: () => void;
  onApprove: (booking: BookingRow) => void;
  onDecline: (booking: BookingRow) => void;
  onAskCancel: (booking: BookingRow) => void;
  onAskDelete: (booking: BookingRow) => void;
  formatDate: (isoDate: string) => string;
  formatMoney: (value: number, currency: string) => string;
}) {
  return (
    <LightModal onClose={onClose} title="Anfrage-Details">
      <div className="space-y-3 text-sm">
        <Section title="Kontakt">
          <Row label="Name" value={selected.contact?.name || "-"} />
          <Row label="E-Mail" value={selected.contact?.email || "-"} />
          {selected.contact?.phone ? <Row label="Telefon" value={selected.contact.phone} /> : null}
        </Section>

        <Section title="Reise">
          <Row label="Zeitraum" value={`${formatDate(selected.startDate)} - ${formatDate(selected.endDate)}`} />
          <Row label="Gaste" value={`${selected.adults} Erwachsene, ${selected.children} Kinder`} />
        </Section>

        {selected.summary && (
          <Section title="Preis (Zusammenfassung)">
            <Row label="Nachte" value={String(selected.summary.nights)} />
            <Row label="Ubernachtungen" value={formatMoney(selected.summary.nightlyTotal, selected.summary.currency)} />
            <Row label="Endreinigung" value={formatMoney(selected.summary.cleaningFee, selected.summary.currency)} />
            <Row label="Kurtaxe" value={formatMoney(selected.summary.touristTax, selected.summary.currency)} />
            <div className="my-1 h-px bg-slate-200" />
            <Row bold label="Gesamt" value={formatMoney(selected.summary.grandTotal, selected.summary.currency)} />
          </Section>
        )}

        {selected.message ? (
          <Section title="Nachricht">
            <p className="whitespace-pre-wrap text-slate-700">{selected.message}</p>
          </Section>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          {normalizeStatus(selected.status) === "requested" ? (
            <>
              <button
                disabled={!!busy}
                onClick={() => onDecline(selected)}
                className="rounded bg-red-600 px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy === "decline" ? "..." : "Ablehnen"}
              </button>
              <button
                disabled={!!busy}
                onClick={() => onApprove(selected)}
                className="rounded bg-green-600 px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy === "approve" ? "..." : "Bestatigen"}
              </button>
            </>
          ) : isApproved(selected.status) ? (
            <button
              onClick={() => onAskCancel(selected)}
              className="rounded bg-red-600 px-3 py-1.5 text-white hover:opacity-90"
            >
              Stornieren
            </button>
          ) : isDeclined(selected.status) || isCancelled(selected.status) ? (
            <button
              onClick={() => onAskDelete(selected)}
              className="rounded bg-slate-700 px-3 py-1.5 text-white hover:opacity-90"
            >
              Loschen
            </button>
          ) : (
            <span className="self-center text-slate-500">{selected.status}</span>
          )}
        </div>
      </div>
    </LightModal>
  );
}

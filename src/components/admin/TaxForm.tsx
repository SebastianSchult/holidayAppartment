import React, { useMemo, useState } from "react";
import { z } from "zod";
import { TouristTaxBandSchema, TouristTaxRangeSchema, type TouristTaxBand } from "../../lib/schemas";
import { createTaxBand, updateTaxBand } from "../../lib/db";

// Reuse the schema but keep the id optional on initial
const FormSchema = TouristTaxBandSchema.pick({
  propertyId: true,
  zone: true,
  label: true,
  currency: true,
  rate: true,
  ranges: true,
});

type Form = z.infer<typeof FormSchema>;

const mdRegex = /^\d{2}-\d{2}$/; // MM-DD

export default function TaxForm({
  propertyId,
  initial,
  onSaved,
}: {
  propertyId: string;
  initial?: (Partial<TouristTaxBand> & { id?: string });
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<Form>({
    propertyId,
    zone: initial?.zone ?? "Kurzone 1",
    label: initial?.label ?? "",
    currency: initial?.currency ?? "EUR",
    rate: initial?.rate ?? 0,
    ranges: initial?.ranges ?? [
      // Beispiel-Eintrag leer
      { startMD: "01-01", endMD: "01-02" },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isEdit = useMemo(() => Boolean(initial?.id), [initial?.id]);

  function update<K extends keyof Form>(key: K, val: Form[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function updateRange(idx: number, key: "startMD" | "endMD", val: string) {
    setForm((p) => ({
      ...p,
      ranges: p.ranges.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    }));
  }

  function addRange() {
    setForm((p) => ({ ...p, ranges: [...p.ranges, { startMD: "", endMD: "" }] }));
  }

  function removeRange(idx: number) {
    setForm((p) => ({ ...p, ranges: p.ranges.filter((_, i) => i !== idx) }));
  }

  function validateMonthDay(v: string): boolean {
    return mdRegex.test(v);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Validate each range first to give friendly errors
    for (const [i, r] of form.ranges.entries()) {
      if (!validateMonthDay(r.startMD) || !validateMonthDay(r.endMD)) {
        setMsg(`Bitte gültige Monat-Tag Werte im Format MM-DD angeben (Zeile ${i + 1}).`);
        return;
      }
      const parsed = TouristTaxRangeSchema.safeParse(r);
      if (!parsed.success) {
        setMsg(`Ungültiger Zeitraum in Zeile ${i + 1}.`);
        return;
      }
    }

    const parsedForm = FormSchema.safeParse(form);
    if (!parsedForm.success) {
      setMsg(parsedForm.error.issues.map((i) => i.message).join(", "));
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initial?.id) {
        await updateTaxBand(initial.id, parsedForm.data);
        setMsg("Kurtaxe aktualisiert.");
      } else {
        await createTaxBand(parsedForm.data);
        setMsg("Kurtaxe angelegt.");
      }
      onSaved?.();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Zone">
          <input
            className="input"
            value={form.zone}
            onChange={(e) => update("zone", e.target.value)}
            placeholder="Kurzone 1"
          />
        </Field>
        <Field label="Bezeichnung">
          <input
            className="input"
            value={form.label}
            onChange={(e) => update("label", e.target.value)}
            placeholder="Haupt-/Zwischensaison oder Nebensaison"
          />
        </Field>
        <Field label="Betrag pro Person/Nacht">
          <input
            className="input"
            type="number"
            step="0.01"
            min={0}
            value={form.rate}
            onChange={(e) => update("rate", Number(e.target.value))}
          />
        </Field>
        <Field label="Währung">
          <input
            className="input"
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            placeholder="EUR"
          />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Wiederkehrende Zeiträume (pro Jahr)</h3>
          <button type="button" className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100" onClick={addRange}>
            + Zeitraum hinzufügen
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <Th>Start (MM-DD)</Th>
                <Th>Ende (MM-DD, exklusiv)</Th>
                <Th className="text-right">Aktion</Th>
              </tr>
            </thead>
            <tbody>
              {form.ranges.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <Td>
                    <input
                      className="input"
                      value={r.startMD}
                      onChange={(e) => updateRange(idx, "startMD", e.target.value)}
                      placeholder="04-01"
                    />
                  </Td>
                  <Td>
                    <input
                      className="input"
                      value={r.endMD}
                      onChange={(e) => updateRange(idx, "endMD", e.target.value)}
                      placeholder="10-31"
                    />
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                      onClick={() => removeRange(idx)}
                    >
                      Entfernen
                    </button>
                  </Td>
                </tr>
              ))}
              {form.ranges.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-slate-500">Noch keine Zeiträume.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button disabled={saving} className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-4 py-2 font-semibold text-white hover:opacity-90">
          {isEdit ? "Aktualisieren" : "Anlegen"}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={["px-3 py-2 text-left font-medium", className].filter(Boolean).join(" ")}>{children}</th>;
}
function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={["px-3 py-2", className].filter(Boolean).join(" ") } colSpan={colSpan}>{children}</td>;
}

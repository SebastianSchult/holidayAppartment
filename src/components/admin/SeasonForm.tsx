import { useState } from "react";
import { z } from "zod";
import { SeasonSchema } from "../../lib/schemas";
import { createSeason, updateSeason } from "../../lib/db";

const FormSchema = SeasonSchema.pick({
  name: true, startDate: true, endDate: true, nightlyRate: true, minNights: true, propertyId: true,
});
type Form = z.infer<typeof FormSchema>;

export default function SeasonForm({
  propertyId, initial, onSaved,
}: {
  propertyId: string;
  initial?: (Form & { id?: string });
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<Form>({
    propertyId,
    name: initial?.name || "",
    startDate: initial?.startDate || "",
    endDate: initial?.endDate || "",
    nightlyRate: initial?.nightlyRate ?? 0,
    minNights: initial?.minNights ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const h = (k: keyof Form, v: string) => {
    setForm(p => ({ ...p, [k]: (k === "nightlyRate" || k === "minNights") ? Number(v) : v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) { setMsg("Bitte alle Felder korrekt ausfüllen."); return; }
    setSaving(true);
    try {
      if (initial?.id) {
        await updateSeason(initial.id, parsed.data);
      } else {
        await createSeason(parsed.data);
      }
      onSaved?.();
      setMsg("Gespeichert.");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Fehler beim Speichern."); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name"><input className="input" value={form.name} onChange={e=>h("name", e.target.value)} /></Field>
        <Field label="Min. Nächte"><input className="input" type="number" min={1} value={form.minNights} onChange={e=>h("minNights", e.target.value)} /></Field>
        <Field label="Start (YYYY-MM-DD)"><input className="input" type="date" value={form.startDate} onChange={e=>h("startDate", e.target.value)} /></Field>
        <Field label="Ende (YYYY-MM-DD)"><input className="input" type="date" value={form.endDate} onChange={e=>h("endDate", e.target.value)} /></Field>
        <Field label="Preis / Nacht (€)"><input className="input" type="number" min={0} value={form.nightlyRate} onChange={e=>h("nightlyRate", e.target.value)} /></Field>
      </div>
      <div className="flex gap-3">
        <button disabled={saving} className="btn-primary">{initial?.id ? "Aktualisieren" : "Anlegen"}</button>
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
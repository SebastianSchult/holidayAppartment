import { useEffect, useState } from "react";
import { z } from "zod";
import { PropertySchema, type Property } from "../../lib/schemas";
import { createProperty, getFirstProperty, updateProperty } from "../../lib/db";

const FormSchema = PropertySchema.pick({
  name: true, slug: true, maxGuests: true, currency: true, defaultNightlyRate: true, cleaningFee: true,
});

type Form = z.infer<typeof FormSchema>;

export default function PropertyForm() {
  const [docId, setDocId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    name: "Antjes Ankerplatz",
    slug: "antjes-ankerplatz",
    maxGuests: 6, currency: "EUR", defaultNightlyRate: 140, cleaningFee: 110,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await getFirstProperty();
      if (existing) {
        setDocId(existing.id);
        const p = existing.data as Property;
        setForm({
          name: p.name, slug: p.slug, maxGuests: p.maxGuests,
          currency: p.currency, defaultNightlyRate: p.defaultNightlyRate, cleaningFee: p.cleaningFee,
        });
      }
    })();
  }, []);

  const handleChange = (k: keyof Form, v: string) => {
    setForm(prev => ({ ...prev, [k]: k === "maxGuests" || k.includes("Rate") || k.includes("Fee") ? Number(v) : v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      setMsg(parsed.error.issues.map(i => i.message).join(", "));
      return;
    }
    setSaving(true);
    try {
      if (docId) {
        await updateProperty(docId, parsed.data);
        setMsg("Aktualisiert.");
      } else {
        const ref = await createProperty({ ...parsed.data, address: {}, images: [], description: "", checkInHour: 15, checkOutHour: 10 });
        setDocId(ref.id);
        setMsg("Angelegt.");
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input className="input" value={form.name} onChange={e=>handleChange("name", e.target.value)} />
        </Field>
        <Field label="Slug">
          <input className="input" value={form.slug} onChange={e=>handleChange("slug", e.target.value)} />
        </Field>
        <Field label="Max. Gäste">
          <input className="input" type="number" min={1} value={form.maxGuests} onChange={e=>handleChange("maxGuests", e.target.value)} />
        </Field>
        <Field label="Währung">
          <input className="input" value={form.currency} onChange={e=>handleChange("currency", e.target.value)} />
        </Field>
        <Field label="Basispreis / Nacht">
          <input className="input" type="number" min={0} value={form.defaultNightlyRate} onChange={e=>handleChange("defaultNightlyRate", e.target.value)} />
        </Field>
        <Field label="Endreinigung">
          <input className="input" type="number" min={0} value={form.cleaningFee} onChange={e=>handleChange("cleaningFee", e.target.value)} />
        </Field>
      </div>

      <div className="flex gap-3">
        <button disabled={saving} className="btn-primary">{docId ? "Aktualisieren" : "Anlegen"}</button>
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
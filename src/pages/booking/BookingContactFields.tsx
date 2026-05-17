import { Field } from "./BookingField";

type ContactValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
  street: string;
  zip: string;
  city: string;
  country: string;
};

type ContactSetters = {
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  setMessage: (value: string) => void;
  setStreet: (value: string) => void;
  setZip: (value: string) => void;
  setCity: (value: string) => void;
  setCountry: (value: string) => void;
};

export function BookingContactFields({
  values,
  setters,
  t,
}: {
  values: ContactValues;
  setters: ContactSetters;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-4">
      <Field label={t("booking.fieldName")}>
        <input
          className="input"
          value={values.name}
          onChange={(event) => setters.setName(event.target.value)}
          placeholder={t("booking.placeholderName")}
        />
      </Field>
      <Field label={t("booking.fieldEmail")}>
        <input
          className="input"
          type="email"
          value={values.email}
          onChange={(event) => setters.setEmail(event.target.value)}
          placeholder="name@example.com"
        />
      </Field>
      <Field label={t("booking.fieldPhoneOptional")}>
        <input
          className="input"
          value={values.phone}
          onChange={(event) => setters.setPhone(event.target.value)}
          placeholder="+49 ..."
        />
      </Field>

      <div className="grid gap-4">
        <Field label={t("booking.fieldStreet")}>
          <input
            className="input"
            value={values.street}
            onChange={(event) => setters.setStreet(event.target.value)}
            placeholder={t("booking.placeholderStreet")}
          />
        </Field>
        <Field label={t("booking.fieldZip")}>
          <input
            className="input"
            value={values.zip}
            onChange={(event) => setters.setZip(event.target.value)}
            placeholder="27476"
          />
        </Field>
        <Field label={t("booking.fieldCity")}>
          <input
            className="input"
            value={values.city}
            onChange={(event) => setters.setCity(event.target.value)}
            placeholder={t("booking.placeholderCity")}
          />
        </Field>
        <Field label={t("booking.fieldCountry")}>
          <input
            className="input"
            value={values.country}
            onChange={(event) => setters.setCountry(event.target.value)}
            placeholder={t("booking.placeholderCountry")}
          />
        </Field>
      </div>

      <Field label={t("booking.fieldMessageOptional")}>
        <textarea
          className="input"
          rows={3}
          value={values.message}
          onChange={(event) => setters.setMessage(event.target.value)}
          placeholder={t("booking.placeholderMessage")}
        />
      </Field>
    </div>
  );
}

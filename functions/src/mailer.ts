import nodemailer from "nodemailer";

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
  FROM_EMAIL, SMTP_AUTH_METHOD, SMTP_REQUIRE_TLS,
} = process.env;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 587,
  secure: SMTP_SECURE === "true", // 465 -> true, 587 -> false
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
    method: SMTP_AUTH_METHOD || "LOGIN", // LOGIN hilft bei manchen Hosts
  },
  requireTLS: SMTP_REQUIRE_TLS === "true", // erzwingt STARTTLS bei 587
  tls: {
    servername: SMTP_HOST, // SNI korrekt setzen
  },
  logger: true, // >>> Debug in Emulator-Logs
  debug: true,
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    console.warn("[mailer] SMTP env incomplete – skipping send");
    return;
  }
  // optional: Verbindung vorab prüfen, gibt klares Log bei Auth/Cert-Problemen
  await transporter.verify();
  await transporter.sendMail({from: FROM_EMAIL, to, subject, html});
}

const fmt = (d: string) => d.split("-").reverse().join(".");

export function bookingRequestOwner(p: any) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
    <h2>Neue Buchungsanfrage</h2>
    <p><strong>Zeitraum:</strong> ${fmt(p.startDate)} – ${fmt(p.endDate)}</p>
    <p><strong>Gäste:</strong> ${p.adults} Erw., ${p.children} Kinder</p>
    <p><strong>Kontakt:</strong> ${p.contactName || "-"} &lt;${p.contactEmail || "-"}&gt; ${p.contactPhone ? "• " + p.contactPhone : ""}</p>
    ${p.message ? `<p><strong>Nachricht:</strong><br>${String(p.message).replace(/\n/g,"<br>")}</p>` : ""}
  </div>`;
}

export function bookingRequestGuestAck(p: any) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
    <h2>Ihre Anfrage ist eingegangen</h2>
    <p>Hallo ${p.contactName || "und guten Tag"},</p>
    <p>vielen Dank für Ihre Anfrage für <strong>${fmt(p.startDate)} – ${fmt(p.endDate)}</strong>.
       Wir prüfen die Verfügbarkeit und melden uns in Kürze.</p>
    <p>Freundliche Grüße<br/>Antjes Ankerplatz</p>
  </div>`;
}

export function bookingApprovedGuest(p: any) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
    <h2>Buchung bestätigt</h2>
    <p>Hallo ${p.contactName || "und guten Tag"},</p>
    <p>wir bestätigen Ihre Buchung für <strong>${fmt(p.startDate)} – ${fmt(p.endDate)}</strong>.</p>
  </div>`;
}

export function bookingDeclinedGuest(p: any) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
    <h2>Ihre Anfrage</h2>
    <p>Hallo ${p.contactName || "und guten Tag"},</p>
    <p>leider können wir Ihre Anfrage <strong>${fmt(p.startDate)} – ${fmt(p.endDate)}</strong> nicht annehmen.</p>
  </div>`;
}

export function bookingCancelledGuest(p: any) {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6">
    <h2>Buchung storniert</h2>
    <p>Hallo ${p.contactName || "und guten Tag"},</p>
    <p>Ihre Buchung <strong>${fmt(p.startDate)} – ${fmt(p.endDate)}</strong> wurde storniert.</p>
  </div>`;
}
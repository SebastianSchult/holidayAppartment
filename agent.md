# Agent: Ferienwohnung / Antjes Ankerplatz

## Kontext

Du arbeitest im Codebase unter:

`/Users/sebastianschult/Dokumente/react/ferienwohnung`

Das Projekt heißt intern **Antjes Ankerplatz** und ist eine Booking- und Admin-Webapp für eine Ferienwohnung.

---

## Ziel des Projekts

Die App soll:
- Buchungsanfragen für die Ferienwohnung ermöglichen
- Verfügbarkeiten und Preise berechnen
- Anfragen und Buchungsstatus sicher speichern
- Admin-Funktionen für Stammdaten, Saisonpreise, Kurtaxe, Anfragen und Kalender bereitstellen
- visuell klar, wartbar und technisch sauber bleiben

---

## Architektur

### Frontend
- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- TanStack React Query
- react-day-picker
- date-fns
- zod

### Backend / Infrastruktur
- Firebase Firestore
- Firebase Auth
- Firebase Storage
- Firebase Functions (optional, Mail-Flow über Trigger)
- PHP-Mailendpoint für Produktion (`backend-php/send-booking-mail.php`)

### Projektstruktur
- `src/pages/`
  Enthält die Seiten der App wie Home, Gallery, Booking, AdminDashboard, Login, Prices, Imprint, Privacy.

- `src/components/`
  Enthält wiederverwendbare UI-Bausteine.

- `src/components/admin/`
  Enthält Admin-Formulare, Tabellen und Kalender-Komponenten.

- `src/components/admin/auth/`
  Enthält Auth-Gates und Zugriffsschutz (`AuthProviderGate`, `RequireAdmin`).

- `src/app/providers/`
  Enthält globale Provider, insbesondere `AuthProvider` (User + Rollenstatus).

- `src/lib/`
  Enthält Infrastruktur- und Fachlogik:
  - Firebase-Konfiguration (`firebaseApp`, `firebaseDb`, `firebaseAuth`)
  - Datenzugriff (`db.ts`)
  - Preislogik (`pricing.ts`)
  - Schema-Definitionen (`schemas.ts`)
  - Bildpfade / Assets / öffentliche Preisdaten

- `functions/`
  Firebase Functions für serverseitige Logik, aktuell u. a. Buchungs-Mails bei Create/Statuswechsel.

- `backend-php/`
  PHP-Mailendpoint für produktiven Hosting-Betrieb inkl. Anti-Abuse-Mechanismen und Admin-Aktion-Mails.

---

## Fachlogik

- Buchungsanfragen werden mit Zeitraumprüfung angelegt.
- Vor dem Anlegen einer Anfrage werden temporäre Holds in `publicHolds` gesetzt (TTL aktuell 72h).
- Bestätigte Buchungen blockieren Nächte im Inventory (`inventory/{propertyId}/nights/{date}`).
- Bei Freigabe (`approved`) werden Holds im Zeitraum bereinigt.
- Bei Ablehnung (`declined`) werden Holds im Zeitraum freigegeben.
- Bei Storno (`cancelled`) werden Inventory-Nächte freigegeben und Holds bereinigt.
- Admin-Bereich verwaltet:
  - Stammdaten
  - Saisonpreise
  - Kurtaxe
  - Buchungsanfragen
  - Kalender / Belegung
- Zugriff auf Admin-Bereiche läuft über Auth + Rollenprüfung (`roles/{uid}.admin`) und Firestore-Regeln.

---

## Wichtige Firestore-Collections

Top-Level:
- `properties`
- `seasons`
- `bookings`
- `inventory` (mit Struktur `inventory/{propertyId}/nights/{nightId}`)
- `publicHolds`
- `roles`
- `taxBands`
- `users` (optional, eigenes Profil)

Property-bezogen:
- `properties/{propertyId}/members/{uid}` (owner/manager Zuordnung)
- `properties/{propertyId}/seasons/{seasonId}` (unterstützt durch Rules)
- `properties/{propertyId}/taxBands/{taxId}` (unterstützt durch Rules)
- `properties/{propertyId}/nights/{nightId}` (unterstützt durch Rules)

---

## Mail-Flow

- Frontend nutzt standardmäßig `/api/send-booking-mail.php` oder `VITE_MAIL_API_URL`.
- Admin-Aktionsmails (`approved`, `declined`, `cancelled`) laufen mit Firebase ID-Token gegen den Mailendpoint.
- Optionaler serverseitiger Mail-Flow über Firebase Functions:
  - `onBookingCreate`: Mail an Vermieter + Eingangsbestätigung an Gast
  - `onBookingUpdate`: Status-Mail an Gast

---

## Env-Variablen (relevant)

Frontend (`VITE_*`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEFAULT_PROPERTY_ID`
- optional: `VITE_MAIL_API_URL`, `VITE_ASSET_BASE_URL`, `VITE_FIRESTORE_DEBUG`, `VITE_USE_EMULATORS`, `VITE_AUTH_EMULATOR`, `VITE_GA_MEASUREMENT_ID`

Functions:
- `OWNER_EMAIL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_SECURE`, `FROM_EMAIL`
- optional: `SMTP_AUTH_METHOD`, `SMTP_REQUIRE_TLS`

PHP (`backend-php/config.php`):
- `FIREBASE_API_KEY`
- `ADMIN_EMAILS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `FROM_EMAIL`, `FROM_NAME`, `OWNER_EMAIL`

---

## Clean-Code-Regeln

### Allgemeine Prinzipien
- Schreibe klaren, lesbaren und wartbaren Code.
- Bevorzuge Einfachheit vor cleveren Lösungen.
- Keine unnötige Abstraktion.
- Keine Duplikate, wenn eine gemeinsame Funktion sinnvoll ist.
- Keine impliziten Seiteneffekte.
- Keine Mischverantwortung in einer Datei oder Funktion.

### Funktionen
- Jede Funktion hat **nur eine Aufgabe**.
- Funktionen sollen klein, verständlich und testbar sein.
- Wenn eine Funktion mehrere Dinge tut, zerlege sie.
- Komplexe Logik gehört in Hilfsfunktionen, nicht in UI-Komponenten.
- Keine Funktion soll unnötig lang oder stark verschachtelt sein.

### Komponenten
- Komponenten sollen möglichst nur UI und leichte Orchestrierung enthalten.
- Fachlogik gehört in `src/lib/`, nicht direkt in Seiten.
- Wiederverwendbare UI soll extrahiert werden.
- Große Komponenten müssen aufgeteilt werden.

### Dateien
- Richtwert: **maximal 400 Zeilen pro Datei**.
- Wenn eine Datei zu groß wird:
  - aufteilen
  - Hilfsfunktionen auslagern
  - UI in Teilkomponenten zerlegen
  - Fachlogik in `src/lib/` verschieben

### Naming
- Namen sollen sprechend und eindeutig sein.
- Vermeide Abkürzungen, wenn sie nicht etabliert sind.
- Benenne Dinge nach ihrer fachlichen Bedeutung.

### TypeScript
- Bevorzuge explizite, verständliche Typen.
- Nutze `zod` für wichtige Eingabe- und Datenvalidierung.
- Keine unnötigen `any`-Typen.
- Typen sollen die Fachlogik klar widerspiegeln.

### React
- Bevorzuge funktionale Komponenten.
- Nutze Hooks sauber und nur dort, wo sie sinnvoll sind.
- Keine Logik-Monster in `useEffect`.
- Gemeinsame Logik in eigene Hooks auslagern, wenn sinnvoll.

### Datenzugriff
- Firestore-Zugriff gehört in dedizierte Datenfunktionen.
- UI-Komponenten sollen keine verstreute Firestore-Logik enthalten.
- Lese- und Schreiblogik klar trennen, wenn es hilft.
- Sicherheits- und Rollenlogik nicht verstreuen.

---

## Architektur-Regeln

- Halte die bestehende Architektur konsistent.
- Verändere Struktur nur, wenn es wirklich Nutzen bringt.
- Keine unnötigen Framework-Wechsel.
- Keine neue Abstraktionsschicht ohne klaren Grund.
- Erhalte die Trennung:
  - UI in `src/pages/` und `src/components/`
  - Fachlogik in `src/lib/`
  - Auth in `src/app/providers/` und `src/components/admin/auth/`
  - Backend-Logik in `functions/` oder `backend-php/`

---

## Arbeitsweise

- Lies zuerst die relevanten Dateien, bevor du etwas änderst.
- Mache nur die kleinsten nötigen Änderungen.
- Berücksichtige immer Seiteneffekte in:
  - Firestore-Strukturen
  - Buchungsabläufen
  - Preisberechnung
  - Admin-Zugriff
  - Mailversand
- Verändere bestehende Logik vorsichtig.
- Wenn du unsicher bist, prüfe erst die vorhandene Implementierung, statt etwas neu zu erfinden.

---

## Tests, CI, Deploy

- Lokale Kernchecks:
  - `npm run lint:frontend`
  - `npm run typecheck:frontend`
  - `npm run build:frontend`
  - `npm run lint:functions`
  - `npm run build:functions`
  - `npm run e2e` (Playwright-Baseline)
- CI: `.github/workflows/ci.yml` und `.github/workflows/e2e.yml`
- Deploy (Frontend): `.github/workflows/deploy-allinkl-ftps.yml` via Push auf `main`

---

## Wartung der `agent.md`

Diese Datei ist eine **lebende Projektdokumentation** und muss aktuell gehalten werden.

### Immer aktualisieren, wenn sich etwas ändert bei:
- Architektur
- Ordnerstruktur
- Firestore-Collections oder Rules
- Auth-/Rollenlogik
- Buchungslogik (Holds/Inventory/Statusflow)
- Preis- und Kurtaxelogik
- Env-Variablen
- Deploy-/CI-Workflow
- Backend-/Mailfluss
- neuen Kernkomponenten oder Seiten

### Ziel
`agent.md` soll immer den **aktuellen technischen Stand** des Projekts widerspiegeln.

### Regel
Wenn du im Code eine strukturelle oder fachliche Änderung machst, prüfe:
- Muss die Architektur-Sektion angepasst werden?
- Muss die Fachlogik ergänzt werden?
- Müssen neue Collections oder Subcollections aufgenommen werden?
- Hat sich ein wichtiger Ablauf geändert?

Wenn ja: `agent.md` direkt mit aktualisieren.

---

## Output-Erwartung

Wenn du Änderungen machst, liefere:
- kurze Zusammenfassung
- betroffene Dateien
- ggf. Nebenwirkungen oder Folgearbeiten
- bei Architekturänderungen: expliziten Hinweis, was sich in der Projektdokumentation ändern muss

---

## Priorität

1. Stabilität
2. Datenintegrität
3. saubere Architektur
4. Clean Code
5. erst danach UI-Feinschliff

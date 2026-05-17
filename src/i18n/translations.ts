export type Language = "de" | "en";

type TranslationParams = Record<string, string | number>;
type TranslationEntry = string | ((params: TranslationParams) => string);

export type TranslationDictionary = Record<string, TranslationEntry>;

export const de: TranslationDictionary = {
  "nav.brand": "Antjes Ankerplatz",
  "nav.ariaMain": "Hauptnavigation",
  "nav.gallery": "Galerie",
  "nav.prices": "Preise",
  "nav.book": "Buchen",
  "nav.languageLabel": "Sprache",
  "nav.languageDe": "DE",
  "nav.languageEn": "EN",

  "app.footer.bookNow": "Jetzt buchen",
  "app.footer.imprint": "Impressum",
  "app.footer.privacy": "Datenschutz",

  "cookie.title": "Cookie-Einstellungen",
  "cookie.description":
    "Wir nutzen notwendige Cookies und bieten dir optionale Kategorien für Statistik und Marketing an.",
  "cookie.alwaysActive": "Immer aktiv",
  "cookie.categoryNecessary.title": "Notwendige Cookies",
  "cookie.categoryNecessary.description":
    "Erforderlich für Basisfunktionen wie Seitennavigation und Sicherheit.",
  "cookie.categoryStatistics.title": "Statistik",
  "cookie.categoryStatistics.description":
    "Hilft uns zu verstehen, wie Besucher die Website nutzen, damit wir sie verbessern können.",
  "cookie.categoryMarketing.title": "Marketing",
  "cookie.categoryMarketing.description":
    "Erlaubt personalisierte Inhalte und Werbe-Messung über Drittanbieter.",
  "cookie.privacyLink": "Mehr in der Datenschutzerklärung",
  "cookie.essentialOnly": "Nur notwendige",
  "cookie.saveSelection": "Auswahl speichern",
  "cookie.acceptAll": "Alle akzeptieren",

  "routes.loading": "Laden …",

  "home.heroAlt": "Meerblick",
  "home.title": "Ferienwohnung Antjes Ankerplatz",
  "home.subtitle":
    "Maritimer Komfort, 2000 m bis zur Nordsee – jetzt Verfügbarkeit prüfen.",
  "home.arrival": "Anreise",
  "home.departure": "Abreise",
  "home.guests": "Gäste",
  "home.checkAvailability": "Verfügbarkeit prüfen",
  "home.featuresTitle": "Ausstattungsmerkmale",
  "home.featureBeach": "Strandnah",
  "home.featureBeachDesc": "20 Minuten zu Fuß",
  "home.featureParking": "Kostenloses Parken",
  "home.featureParkingDesc": "Privatstellplatz",
  "home.featurePets": "Haustiere erlaubt",
  "home.featurePetsDesc": "auf Anfrage",
  "home.featureWifi": "WLAN & Smart-TV",
  "home.featureWifiDesc": "inklusive",
  "home.descriptionTitle": "Wohnungsbeschreibung",
  "home.descriptionP1":
    "Antjes Ankerplatz ist eine gemütliche, maritime Ferienwohnung für entspannte Tage an der Nordsee. Die Wohnung bietet einen hellen Wohnbereich, eine gut ausgestattete Küche und komfortable Schlafmöglichkeiten für Paare und Familien.",
  "home.descriptionP2":
    "Dank der strandnahen Lage, eigenem Stellplatz und kurzer Wege zu Einkaufsmöglichkeiten ist sie ein idealer Ausgangspunkt für Erholung, Spaziergänge und Ausflüge rund um Cuxhaven.",
  "home.galleryTitle": "Bildergalerie",
  "home.galleryHint":
    "Die Bilder laufen automatisch von rechts nach links durch.",
  "home.galleryAlt": ({ index }: TranslationParams) =>
    `Ferienwohnung Ansicht ${index}`,
  "home.galleryCount": ({ current, total }: TranslationParams) =>
    `Bild ${current} von ${total}`,

  "gallery.title": "Galerie",
  "gallery.intro":
    "Klick auf ein Bild für die große Ansicht. Mit den Pfeiltasten kannst du durchblättern.",
  "gallery.imageAlt": ({ index }: TranslationParams) =>
    `Ferienwohnung Ansicht ${index}`,
  "gallery.lightboxTitle": "Große Bildansicht",
  "gallery.close": "Schließen",
  "gallery.prev": "Vorheriges Bild",
  "gallery.next": "Nächstes Bild",
  "gallery.count": ({ current, total }: TranslationParams) =>
    `Bild ${current} von ${total}`,

  "prices.defaultPropertyName": "Ferienwohnung",
  "prices.title": ({ propertyName }: TranslationParams) => `${propertyName} – Preise`,
  "prices.subtitle":
    "Transparente Saisonpreise & Standardpreis. Endreinigung und Kurtaxe separat wie angegeben.",
  "prices.standardTitle": "Standardpreis außerhalb von Saisons",
  "prices.perNight": "/ Nacht",
  "prices.standardHint": "Gilt für Nächte, die in keine definierte Saison fallen.",
  "prices.cleaningTitle": "Endreinigung",
  "prices.cleaningHint":
    "Einmalig pro Aufenthalt. Kurtaxe nach lokaler Satzung ggf. zusätzlich.",
  "prices.seasonsTitle": "Saisonpreise",
  "prices.loading": "Laden …",
  "prices.errorLoad": "Preise konnten nicht geladen werden.",
  "prices.empty": "Noch keine Saisons erfasst.",
  "prices.caption": ({ propertyName }: TranslationParams) =>
    `Saisonpreise für ${propertyName} mit Zeitraum, Tarifname, Preis pro Nacht und Mindestnächten`,
  "prices.colRange": "Zeitraum",
  "prices.colName": "Name",
  "prices.colRate": "Preis/Nacht",
  "prices.colMinNights": "Min. Nächte",
  "prices.rangeEndExclusive": "(Ende exkl.)",
  "prices.ctaTitle": "Fragen zum Zeitraum oder Preis?",
  "prices.ctaText":
    "Prüfe die Verfügbarkeit und erhalte den Gesamtpreis direkt im nächsten Schritt.",
  "prices.ctaButton": "Jetzt Verfügbarkeit prüfen",

  "booking.defaultPropertyName": "Ferienwohnung",
  "booking.loadError": "Daten konnten nicht geladen werden.",
  "booking.noProperty":
    "Keine Unterkunft gefunden. Bitte zuerst Stammdaten im Adminbereich anlegen.",
  "booking.propertyLoadError": "Unterkunft konnte nicht geladen werden.",
  "booking.invalidRange": "Bitte zuerst einen gültigen Zeitraum auswählen.",
  "booking.rangeUnavailable": "Der gewählte Zeitraum ist aktuell nicht verfügbar.",
  "booking.requiredNameEmail": "Bitte Name und E-Mail angeben.",
  "booking.requiredAddress": "Bitte Straße, PLZ und Ort angeben.",
  "booking.requiredValidEmail": "Bitte eine gültige E-Mail angeben.",
  "booking.submitSuccess":
    "Vielen Dank! Deine Anfrage wurde übermittelt und die Bestätigungsmail wurde versendet.",
  "booking.submitMailFailed": ({ reason }: TranslationParams) =>
    `Anfrage gespeichert, aber Mailversand fehlgeschlagen (${reason || "unbekannter Fehler"}).`,
  "booking.submitError": "Anfrage konnte nicht gesendet werden.",
  "booking.rateLabelStandard": "Standard",
  "booking.heading": ({ propertyName }: TranslationParams) =>
    `Buchen – ${propertyName}`,
  "booking.subheading":
    "Wähle Zeitraum & Gäste. Der Preis wird live berechnet (inkl. Endreinigung & Kurtaxe ab 16 Jahren).",
  "booking.fieldDateRange": "Zeitraum wählen",
  "booking.fieldAdults": "Erwachsene (≥16)",
  "booking.fieldChildren": "Kinder (0–15)",
  "booking.fieldName": "Name",
  "booking.placeholderName": "Vor- und Nachname",
  "booking.fieldEmail": "E-Mail",
  "booking.fieldPhoneOptional": "Telefon (optional)",
  "booking.fieldStreet": "Straße & Nr.",
  "booking.placeholderStreet": "z. B. Spangerstraße 9",
  "booking.fieldZip": "PLZ",
  "booking.fieldCity": "Ort",
  "booking.placeholderCity": "Cuxhaven",
  "booking.fieldCountry": "Land",
  "booking.placeholderCountry": "Deutschland",
  "booking.fieldMessageOptional": "Nachricht (optional)",
  "booking.placeholderMessage": "z.B. Ankunftszeit, Fragen …",
  "booking.loading": "Laden …",
  "booking.invalidNightCount":
    "Bitte ein gültiges Datum wählen (mindestens eine Nacht).",
  "booking.summaryTitle": "Zusammenfassung",
  "booking.summaryNights": "Nächte",
  "booking.summaryStays": "Übernachtungen",
  "booking.summaryCleaning": "Endreinigung",
  "booking.summaryTax": "Kurtaxe (Erwachsene)",
  "booking.summaryTotal": "Gesamt",
  "booking.summaryHint":
    "Kurtaxe ab 16 Jahren. Saisonpreise inkl. USt., Kurtaxe nach Ortsrecht.",
  "booking.notesTitle": "Hinweise",
  "booking.noteEndExclusive": "Ende exkl.: Die Abreise-Nacht ist nicht berechnet.",
  "booking.noteSeasonRates":
    "In definierten Saisons gilt der jeweilige Nachtpreis. Außerhalb gilt der Standardpreis.",
  "booking.noteTax":
    "Kurtaxe je Nacht pro zahlender Person (≥16) gemäß Kurtaxe-Band.",
  "booking.nightlyDetails": "Preis je Nacht anzeigen",
  "booking.nightlyCaption":
    "Preisaufschlüsselung pro Nacht für den ausgewählten Zeitraum inklusive Tarif, Kurtaxe und Gesamtsumme",
  "booking.colDate": "Datum",
  "booking.colRateType": "Tarif",
  "booking.colRatePerNight": "Preis / Nacht",
  "booking.colTaxPerNight": "Kurtaxe / Nacht",
  "booking.colTotalPerNight": "Summe / Nacht",
  "booking.rowStayTotal": "Summe Übernachtungen",
  "booking.rowCleaning": "Endreinigung",
  "booking.rowTaxTotal": "Kurtaxe (gesamt)",
  "booking.rowGrandTotal": "Gesamt",
  "booking.priceCalcError": "Preis konnte nicht berechnet werden.",
  "booking.availabilityChecking": "Verfügbarkeit wird geprüft …",
  "booking.availabilityAvailable": "Zeitraum ist aktuell verfügbar.",
  "booking.availabilityUnavailable": "Zeitraum ist leider bereits belegt.",
  "booking.minStay": ({ nights }: TranslationParams) =>
    `Mindestaufenthalt: ${nights} Nächte.`,
  "booking.submitSending": "Sende …",
  "booking.submit": "Anfrage senden",
  "booking.closeNotice": "Hinweis schließen",

  "login.errorLogin": "Login fehlgeschlagen.",
  "login.successRegister": "Konto angelegt. Du bist jetzt angemeldet.",
  "login.errorRegister": "Registrierung fehlgeschlagen.",
  "login.resetNeedEmail": "Bitte E-Mail eingeben, um einen Reset-Link zu erhalten.",
  "login.resetSent": "Passwort-Reset gesendet. Bitte Posteingang prüfen.",
  "login.resetError": "Reset fehlgeschlagen.",
  "login.adminTitle": "Admin",
  "login.loggedInAs": ({ email }: TranslationParams) => `Angemeldet als ${email}`,
  "login.logout": "Logout",
  "login.titleLogin": "Anmelden",
  "login.titleRegister": "Registrieren",
  "login.email": "E-Mail",
  "login.password": "Passwort",
  "login.forgot": "Passwort vergessen?",
  "login.noAccount": "Kein Konto?",
  "login.registerNow": "Jetzt registrieren",
  "login.hasAccount": "Schon ein Konto?",
  "login.toLogin": "Zum Login",
};

export const en: TranslationDictionary = {
  "nav.brand": "Antjes Ankerplatz",
  "nav.ariaMain": "Main navigation",
  "nav.gallery": "Gallery",
  "nav.prices": "Prices",
  "nav.book": "Book",
  "nav.languageLabel": "Language",
  "nav.languageDe": "DE",
  "nav.languageEn": "EN",

  "app.footer.bookNow": "Book now",
  "app.footer.imprint": "Legal notice",
  "app.footer.privacy": "Privacy",
  "cookie.title": "Cookie settings",
  "cookie.description":
    "We use essential cookies and offer optional categories for statistics and marketing.",
  "cookie.alwaysActive": "Always active",
  "cookie.categoryNecessary.title": "Essential cookies",
  "cookie.categoryNecessary.description":
    "Required for basic features such as site navigation and security.",
  "cookie.categoryStatistics.title": "Statistics",
  "cookie.categoryStatistics.description":
    "Helps us understand how visitors use the website so we can improve it.",
  "cookie.categoryMarketing.title": "Marketing",
  "cookie.categoryMarketing.description":
    "Allows personalized content and ad measurement through third parties.",
  "cookie.privacyLink": "Read more in the privacy policy",
  "cookie.essentialOnly": "Essential only",
  "cookie.saveSelection": "Save selection",
  "cookie.acceptAll": "Accept all",

  "routes.loading": "Loading …",

  "home.heroAlt": "Sea view",
  "home.title": "Holiday Apartment Antjes Ankerplatz",
  "home.subtitle":
    "Maritime comfort, 2000 m to the North Sea - check availability now.",
  "home.arrival": "Arrival",
  "home.departure": "Departure",
  "home.guests": "Guests",
  "home.checkAvailability": "Check availability",
  "home.featuresTitle": "Amenities",
  "home.featureBeach": "Near the beach",
  "home.featureBeachDesc": "20 minutes on foot",
  "home.featureParking": "Free parking",
  "home.featureParkingDesc": "Private parking space",
  "home.featurePets": "Pets allowed",
  "home.featurePetsDesc": "on request",
  "home.featureWifi": "Wi-Fi & Smart TV",
  "home.featureWifiDesc": "included",
  "home.descriptionTitle": "Apartment description",
  "home.descriptionP1":
    "Antjes Ankerplatz is a cozy maritime holiday apartment for relaxing days at the North Sea. The apartment offers a bright living area, a well-equipped kitchen, and comfortable sleeping arrangements for couples and families.",
  "home.descriptionP2":
    "Thanks to its beachside location, private parking, and short distances to shopping options, it is an ideal base for recreation, walks, and trips around Cuxhaven.",
  "home.galleryTitle": "Photo gallery",
  "home.galleryHint":
    "Images automatically slide from right to left.",
  "home.galleryAlt": ({ index }: TranslationParams) =>
    `Holiday apartment view ${index}`,
  "home.galleryCount": ({ current, total }: TranslationParams) =>
    `Image ${current} of ${total}`,

  "gallery.title": "Gallery",
  "gallery.intro":
    "Click an image for a larger view. Use the arrow keys to browse.",
  "gallery.imageAlt": ({ index }: TranslationParams) =>
    `Holiday apartment view ${index}`,
  "gallery.lightboxTitle": "Large image view",
  "gallery.close": "Close",
  "gallery.prev": "Previous image",
  "gallery.next": "Next image",
  "gallery.count": ({ current, total }: TranslationParams) =>
    `Image ${current} of ${total}`,

  "prices.defaultPropertyName": "Holiday apartment",
  "prices.title": ({ propertyName }: TranslationParams) => `${propertyName} - Prices`,
  "prices.subtitle":
    "Transparent seasonal prices and standard rate. Final cleaning and tourist tax are listed separately.",
  "prices.standardTitle": "Standard price outside seasons",
  "prices.perNight": "/ night",
  "prices.standardHint": "Applies to nights not covered by a defined season.",
  "prices.cleaningTitle": "Final cleaning",
  "prices.cleaningHint":
    "One-time fee per stay. Tourist tax may apply according to local regulations.",
  "prices.seasonsTitle": "Seasonal prices",
  "prices.loading": "Loading …",
  "prices.errorLoad": "Prices could not be loaded.",
  "prices.empty": "No seasons configured yet.",
  "prices.caption": ({ propertyName }: TranslationParams) =>
    `Seasonal prices for ${propertyName} with date range, rate name, price per night, and minimum nights`,
  "prices.colRange": "Date range",
  "prices.colName": "Name",
  "prices.colRate": "Price/night",
  "prices.colMinNights": "Min. nights",
  "prices.rangeEndExclusive": "(end excl.)",
  "prices.ctaTitle": "Questions about dates or price?",
  "prices.ctaText":
    "Check availability and get the total price in the next step.",
  "prices.ctaButton": "Check availability now",

  "booking.defaultPropertyName": "Holiday apartment",
  "booking.loadError": "Data could not be loaded.",
  "booking.noProperty":
    "No accommodation found. Please create the property data in admin first.",
  "booking.propertyLoadError": "Accommodation could not be loaded.",
  "booking.invalidRange": "Please select a valid date range first.",
  "booking.rangeUnavailable": "The selected period is currently unavailable.",
  "booking.requiredNameEmail": "Please enter name and email.",
  "booking.requiredAddress": "Please enter street, ZIP code, and city.",
  "booking.requiredValidEmail": "Please enter a valid email address.",
  "booking.submitSuccess":
    "Thank you. Your request has been submitted and the confirmation email has been sent.",
  "booking.submitMailFailed": ({ reason }: TranslationParams) =>
    `Request saved, but sending email failed (${reason || "unknown error"}).`,
  "booking.submitError": "Request could not be sent.",
  "booking.rateLabelStandard": "Standard",
  "booking.heading": ({ propertyName }: TranslationParams) =>
    `Book - ${propertyName}`,
  "booking.subheading":
    "Choose period and guests. Price is calculated live (including final cleaning and tourist tax from age 16).",
  "booking.fieldDateRange": "Select date range",
  "booking.fieldAdults": "Adults (>=16)",
  "booking.fieldChildren": "Children (0-15)",
  "booking.fieldName": "Name",
  "booking.placeholderName": "First and last name",
  "booking.fieldEmail": "Email",
  "booking.fieldPhoneOptional": "Phone (optional)",
  "booking.fieldStreet": "Street & No.",
  "booking.placeholderStreet": "e.g. Spangerstrasse 9",
  "booking.fieldZip": "ZIP code",
  "booking.fieldCity": "City",
  "booking.placeholderCity": "Cuxhaven",
  "booking.fieldCountry": "Country",
  "booking.placeholderCountry": "Germany",
  "booking.fieldMessageOptional": "Message (optional)",
  "booking.placeholderMessage": "e.g. arrival time, questions ...",
  "booking.loading": "Loading …",
  "booking.invalidNightCount": "Please select valid dates (at least one night).",
  "booking.summaryTitle": "Summary",
  "booking.summaryNights": "Nights",
  "booking.summaryStays": "Overnight stays",
  "booking.summaryCleaning": "Final cleaning",
  "booking.summaryTax": "Tourist tax (adults)",
  "booking.summaryTotal": "Total",
  "booking.summaryHint":
    "Tourist tax applies from age 16. Seasonal prices include VAT, tourist tax according to local regulations.",
  "booking.notesTitle": "Notes",
  "booking.noteEndExclusive": "End excl.: Departure night is not charged.",
  "booking.noteSeasonRates":
    "Defined seasons use the corresponding nightly rate. Outside seasons, the standard rate applies.",
  "booking.noteTax":
    "Tourist tax is charged per night per paying person (>=16), depending on the tax band.",
  "booking.nightlyDetails": "Show nightly breakdown",
  "booking.nightlyCaption":
    "Nightly price breakdown for the selected period including rate, tourist tax, and total",
  "booking.colDate": "Date",
  "booking.colRateType": "Rate",
  "booking.colRatePerNight": "Price / night",
  "booking.colTaxPerNight": "Tourist tax / night",
  "booking.colTotalPerNight": "Total / night",
  "booking.rowStayTotal": "Total overnight stays",
  "booking.rowCleaning": "Final cleaning",
  "booking.rowTaxTotal": "Tourist tax (total)",
  "booking.rowGrandTotal": "Total",
  "booking.priceCalcError": "Price could not be calculated.",
  "booking.availabilityChecking": "Checking availability …",
  "booking.availabilityAvailable": "The period is currently available.",
  "booking.availabilityUnavailable": "Unfortunately, the period is already booked.",
  "booking.minStay": ({ nights }: TranslationParams) =>
    `Minimum stay: ${nights} nights.`,
  "booking.submitSending": "Sending …",
  "booking.submit": "Send request",
  "booking.closeNotice": "Close notice",

  "login.errorLogin": "Login failed.",
  "login.successRegister": "Account created. You are now signed in.",
  "login.errorRegister": "Registration failed.",
  "login.resetNeedEmail": "Please enter your email to receive a reset link.",
  "login.resetSent": "Password reset sent. Please check your inbox.",
  "login.resetError": "Reset failed.",
  "login.adminTitle": "Admin",
  "login.loggedInAs": ({ email }: TranslationParams) => `Signed in as ${email}`,
  "login.logout": "Logout",
  "login.titleLogin": "Sign in",
  "login.titleRegister": "Register",
  "login.email": "Email",
  "login.password": "Password",
  "login.forgot": "Forgot password?",
  "login.noAccount": "No account?",
  "login.registerNow": "Register now",
  "login.hasAccount": "Already have an account?",
  "login.toLogin": "Go to sign in",
};

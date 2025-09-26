export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose">
      <h1 className="text-2xl font-bold mb-4">Datenschutzerklärung</h1>
      <p className="mb-4">
        Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Website verarbeitet personenbezogene Daten
        ausschließlich im Einklang mit den gesetzlichen Bestimmungen (DSGVO, BDSG).
      </p>
      <ol className="list-decimal pl-6">
        <li>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Cookies</h2>
            <p>
              Unsere Website verwendet Cookies, um grundlegende Funktionen sicherzustellen.
            </p>
          </div>
        </li>
        <li>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Kontaktaufnahme</h2>
            <p>
              Wenn Sie uns per Formular oder E-Mail kontaktieren, werden Ihre Angaben zur Bearbeitung
              der Anfrage gespeichert.
            </p>
          </div>
        </li>
        <li>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Ihre Rechte</h2>
            <p>
              Sie haben jederzeit das Recht auf Auskunft, Berichtigung oder Löschung Ihrer gespeicherten Daten.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
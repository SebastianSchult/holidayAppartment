<?php
// /api/send-booking-mail.php

// === Konfiguration (anpassen) ==========================
$ALLOWED_ORIGIN = 'https://www.antjes-ankerplatz.net'; // deine Prod-Domain
$API_KEY        = 'n6OylfQ7Lp9MIZ0logXFK1raF61vhB4a';              // gleich sicher ersetzen!
// =======================================================

// SMTP (all-inkl – aus KAS)
$SMTP_HOST   = 'w01f67fb.kasserver.com';
$SMTP_PORT   = 465;      // 465 = SMTPS (SSL)
$SMTP_SECURE = 'ssl';    // 'ssl' für 465, 'tls' für 587
$SMTP_USER   = 'mutzi@antjes-ankerplatz.net';
$SMTP_PASS   = 'A#130489r#0815';                    // <-- ERSETZEN!

$FROM_EMAIL  = 'mutzi@antjes-ankerplatz.net';
$FROM_NAME   = 'Antjes Ankerplatz';
$OWNER_EMAIL = 'contact@sebastian-schult-dev.de';       // Empfänger für neue Anfragen
// =======================================

// CORS – beide Origins erlauben (mit und ohne www)
$ALLOWED_ORIGINS = [
  'https://www.antjes-ankerplatz.net',
  'https://antjes-ankerplatz.net'
];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Content-Type: application/json');

if (in_array($origin, $ALLOWED_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
} else {
  // GET-Healthcheck bleibt offen
  if ($method !== 'GET') {
    http_response_code(403);
    echo json_encode(['ok'=>false,'error'=>'forbidden_origin']);
    exit;
  }
}

// Preflight
if ($method === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// OPTIONS Preflight
if ($method === 'OPTIONS') { http_response_code(204); exit; }

// GET-Healthcheck
if ($method === 'GET') {
  echo json_encode(['ok'=>true,'message'=>'API alive','method'=>'GET']); exit;
}

// POST: API-Key prüfen
$providedKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if (!hash_equals($API_KEY, $providedKey)) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}

// JSON lesen
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'bad_json']); exit;
}

// Pflichtfelder prüfen (Minimal)
$propertyId = $input['propertyId'] ?? null;
$startDate  = $input['startDate']  ?? null;
$endDate    = $input['endDate']    ?? null;
$adults     = isset($input['adults']) ? (int)$input['adults'] : null;
$children   = isset($input['children']) ? (int)$input['children'] : null;
$contact    = $input['contact']    ?? null;
$guestName  = is_array($contact) ? ($contact['name']  ?? '') : '';
$guestMail  = is_array($contact) ? ($contact['email'] ?? '') : '';
$message    = $input['message']    ?? '';

if (!$propertyId || !$startDate || !$endDate || $adults===null || $children===null || !$guestMail) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing_fields']); exit;
}

// HTML escapen (Basics)
function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

// PHPMailer laden
require __DIR__.'/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Transporter-Factory
function makeMailer($host,$port,$secure,$user,$pass,$fromEmail,$fromName) {
  $m = new PHPMailer(true);
  $m->isSMTP();
  $m->Host = $host;
  $m->SMTPAuth = true;
  $m->Username = $user;
  $m->Password = $pass;
  if ($secure === 'ssl') { $m->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; }
  else { $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; }
  $m->Port = $port;
  $m->CharSet = 'UTF-8';
  $m->setFrom($fromEmail, $fromName);
  return $m;
}

// Owner-Mail (neue Anfrage)
$ownerHtml = "
  <h2>Neue Buchungsanfrage</h2>
  <p><strong>Zeitraum:</strong> ".h($startDate)." – ".h($endDate)."</p>
  <p><strong>Gäste:</strong> ".h($adults)." Erw., ".h($children)." Kinder</p>
  <p><strong>Kontakt:</strong> ".h($guestName)." &lt;".h($guestMail)."&gt;</p>
  ".($message ? ('<p><strong>Nachricht:</strong><br>'.nl2br(h($message)).'</p>') : '')."
  <p><small>Property-ID: ".h($propertyId)."</small></p>
";

$guestHtml = "
  <p>Hallo ".h($guestName).",</p>
  <p>vielen Dank für Ihre Anfrage für den Zeitraum <strong>".h($startDate)." – ".h($endDate)."</strong>.
  Wir prüfen die Verfügbarkeit und melden uns in Kürze.</p>
  <p>Freundliche Grüße<br>Antjes Ankerplatz</p>
";

$results = ['owner'=>null,'guest'=>null];

try {
  // an Owner
  $m1 = makeMailer($SMTP_HOST,$SMTP_PORT,$SMTP_SECURE,$SMTP_USER,$SMTP_PASS,$FROM_EMAIL,$FROM_NAME);
  $m1->addAddress($OWNER_EMAIL);
  $m1->isHTML(true);
  $m1->Subject = 'Neue Buchungsanfrage';
  $m1->Body    = $ownerHtml;
  $m1->AltBody = strip_tags(str_replace(['<br>','<br/>','<br />'],"\n",$ownerHtml));
  $m1->send();
  $results['owner'] = 'sent';
} catch (Exception $e) {
  $results['owner'] = 'error: '.$e->getMessage();
}

try {
  // Eingangsbestätigung an Gast (nur bei valider Mail)
  if (filter_var($guestMail, FILTER_VALIDATE_EMAIL)) {
    $m2 = makeMailer($SMTP_HOST,$SMTP_PORT,$SMTP_SECURE,$SMTP_USER,$SMTP_PASS,$FROM_EMAIL,$FROM_NAME);
    $m2->addAddress($guestMail, $guestName);
    $m2->isHTML(true);
    $m2->Subject = 'Ihre Anfrage ist eingegangen';
    $m2->Body    = $guestHtml;
    $m2->AltBody = strip_tags(str_replace(['<br>','<br/>','<br />'],"\n",$guestHtml));
    $m2->send();
    $results['guest'] = 'sent';
  } else {
    $results['guest'] = 'skipped_invalid_email';
  }
} catch (Exception $e) {
  $results['guest'] = 'error: '.$e->getMessage();
}

echo json_encode(['ok'=>true,'status'=>$results]);
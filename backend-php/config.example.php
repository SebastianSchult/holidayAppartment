<?php
/**
 * Private configuration for backend-php/send-booking-mail.php
 *
 * 1) Copy this file to backend-php/config.php
 * 2) Fill in real values
 * 3) Never commit backend-php/config.php
 */

// Secret API key checked against X-Api-Key header
define("API_KEY", "REPLACE_WITH_STRONG_RANDOM_API_KEY");

// SMTP settings
define("SMTP_HOST", "smtp.example.com");
define("SMTP_PORT", 587);
define("SMTP_SECURE", "tls"); // 'ssl' for 465, 'tls' for 587
define("SMTP_USER", "mailer@example.com");
define("SMTP_PASS", "REPLACE_WITH_SMTP_PASSWORD");
define("FROM_EMAIL", "mailer@example.com");
define("FROM_NAME", "Antjes Ankerplatz");

// Optional default owner notification address
define("OWNER_EMAIL", "owner@example.com");

<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed', 405);
}

$forms = [
    'contact' => [
        'to' => 'kontakt@twojadomena.pl',
        'subject' => 'Rozmowa coachingowa',
        'required' => ['name', 'email', 'message', 'consent'],
    ],
    'cooperation' => [
        'to' => 'wspolpraca@twojadomena.pl',
        'subject' => 'Zapytanie o współpracę',
        'required' => ['name', 'email', 'message', 'consent'],
    ],
];

// Use an address from the same domain as the website mailbox.
$fromEmail = 'kontakt@twojadomena.pl';
$fromName = 'Relevateme';

$rawBody = file_get_contents('php://input') ?: '';
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    respond(false, 'Invalid payload', 400);
}

$type = sanitizeText((string)($payload['type'] ?? ''));

if (!isset($forms[$type])) {
    respond(false, 'Unknown form type', 400);
}

// Honeypot: bots often fill hidden fields. Pretend success and do nothing.
if (trim((string)($payload['website'] ?? '')) !== '') {
    respond(true);
}

$name = sanitizeText((string)($payload['name'] ?? ''));
$email = sanitizeEmail((string)($payload['email'] ?? ''));
$phone = sanitizeText((string)($payload['phone'] ?? ''));
$message = sanitizeMultiline((string)($payload['message'] ?? ''));
$consent = filter_var($payload['consent'] ?? false, FILTER_VALIDATE_BOOLEAN);

if ($name === '' || $email === '' || $message === '' || !$consent) {
    respond(false, 'Missing required fields', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Invalid email', 422);
}

$form = $forms[$type];
$subject = $form['subject'] . ' - ' . $name;
$mailBody = buildBody($type, $name, $email, $phone, $message);
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . formatMailbox($fromName, $fromEmail),
    'Reply-To: ' . formatMailbox($name, $email),
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail(
    $form['to'],
    encodeHeader($subject),
    $mailBody,
    implode("\r\n", $headers),
    '-f' . $fromEmail
);

if (!$sent) {
    respond(false, 'Could not send email', 500);
}

respond(true);

function buildBody(string $type, string $name, string $email, string $phone, string $message): string
{
    $labels = [
        'contact' => 'Formularz kontaktowy',
        'cooperation' => 'Formularz współpracy',
    ];

    $lines = [
        'Źródło: ' . ($labels[$type] ?? $type),
        'Imię: ' . $name,
        'E-mail: ' . $email,
    ];

    if ($phone !== '') {
        $lines[] = 'Telefon: ' . $phone;
    }

    $lines[] = '';
    $lines[] = 'Wiadomość:';
    $lines[] = $message;
    $lines[] = '';
    $lines[] = 'Zgoda na kontakt i przetwarzanie danych: tak';
    $lines[] = 'Data wysłania: ' . date('Y-m-d H:i:s');

    return implode("\n", $lines);
}

function sanitizeText(string $value): string
{
    $value = preg_replace('/[\r\n]+/', ' ', $value) ?? '';
    return trim(strip_tags($value));
}

function sanitizeMultiline(string $value): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = strip_tags($value);
    return trim($value);
}

function sanitizeEmail(string $value): string
{
    return trim(filter_var($value, FILTER_SANITIZE_EMAIL) ?: '');
}

function formatMailbox(string $name, string $email): string
{
    $safeName = addcslashes(sanitizeText($name), '"\\');
    return '"' . $safeName . '" <' . sanitizeEmail($email) . '>';
}

function encodeHeader(string $value): string
{
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }

    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function respond(bool $ok, string $message = '', int $status = 200): void
{
    http_response_code($status);
    echo json_encode(
        ['ok' => $ok, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

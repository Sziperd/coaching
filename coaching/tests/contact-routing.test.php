<?php
declare(strict_types=1);
require __DIR__ . '/../contact-routing.php';

$config = [
    'mentors' => [
        'milosz-stawecki' => ['name' => 'Miłosz Stawecki', 'email' => 'milosz@example.com'],
        'paulina-mackiewicz' => ['name' => 'Paulina Mackiewicz', 'email' => 'paulina@example.com'],
        'not-ready' => ['name' => 'Not ready', 'email' => ''],
        'bad-header' => ['name' => 'Bad header', 'email' => "valid@example.com\r\nBcc:other@example.com"],
    ],
    'sources' => ['linkedin-featured' => 'LinkedIn / Featured'],
];

function check(bool $condition, string $message): void
{
    if (!$condition) { throw new RuntimeException($message); }
}
function expectException(string $class, string $code, array $payload, array $config): void
{
    try { resolveContactRouting($payload, $config, 'general@example.com'); }
    catch (Throwable $error) {
        check($error instanceof $class && $error->getMessage() === $code, 'Unexpected routing error');
        return;
    }
    throw new RuntimeException('Expected routing failure');
}

$general = resolveContactRouting([], $config, 'general@example.com');
check($general['to'] === 'general@example.com', 'General recipient changed');
$mentor = resolveContactRouting(['mentor' => 'milosz-stawecki', 'to' => 'attacker@example.com', 'sourceId' => 'linkedin-featured'], $config, 'general@example.com');
check($mentor['to'] === 'milosz@example.com', 'Client controlled recipient');
check($mentor['sourceName'] === 'LinkedIn / Featured', 'Missing source');
$second = resolveContactRouting(['mentor' => 'paulina-mackiewicz'], $config, 'general@example.com');
check($second['to'] === 'paulina@example.com', 'Wrong mentor');
expectException(InvalidArgumentException::class, 'mentor_unknown', ['mentor' => 'unknown'], $config);
expectException(InvalidArgumentException::class, 'mentor_unknown', ['mentor' => ['milosz-stawecki']], $config);
expectException(InvalidArgumentException::class, 'mentor_unknown', ['mentor' => "milosz-stawecki\r\nBcc:attacker@example.com"], $config);
expectException(RuntimeException::class, 'mentor_unavailable', ['mentor' => 'not-ready'], $config);
expectException(RuntimeException::class, 'mentor_unavailable', ['mentor' => 'bad-header'], $config);
$unknownSource = resolveContactRouting(['sourceId' => 'private@example.com'], $config, 'general@example.com');
check($unknownSource['sourceId'] === '', 'Unknown source was accepted');
echo "Contact routing checks passed. No email sent.\n";

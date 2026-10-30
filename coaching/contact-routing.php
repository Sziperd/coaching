<?php
declare(strict_types=1);

function resolveContactRouting(array $payload, array $config, string $defaultRecipient): array
{
    $mentorId = $payload['mentor'] ?? '';
    if (!is_string($mentorId) || ($mentorId !== '' && !preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/D', $mentorId))) {
        throw new InvalidArgumentException('mentor_unknown');
    }
    $result = ['to' => $defaultRecipient, 'mentorId' => '', 'mentorName' => '', 'sourceId' => '', 'sourceName' => ''];
    if ($mentorId !== '') {
        $mentor = $config['mentors'][$mentorId] ?? null;
        if (!is_array($mentor)) {
            throw new InvalidArgumentException('mentor_unknown');
        }
        $email = $mentor['email'] ?? '';
        if (!is_string($email) || preg_match('/[\r\n]/', $email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('mentor_unavailable');
        }
        $result['to'] = $email;
        $result['mentorId'] = $mentorId;
        $result['mentorName'] = (string)$mentor['name'];
    }
    $sourceId = $payload['sourceId'] ?? '';
    if (is_string($sourceId) && isset($config['sources'][$sourceId])) {
        $result['sourceId'] = $sourceId;
        $result['sourceName'] = (string)$config['sources'][$sourceId];
    }
    return $result;
}

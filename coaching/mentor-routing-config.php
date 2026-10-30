<?php
declare(strict_types=1);

// Server-side only. Set environment variables or replace the empty fallbacks
// with verified mailbox addresses before distributing mentor links.
return [
    'mentors' => [
        'milosz-stawecki' => [
            'name' => 'Miłosz Stawecki',
            'email' => getenv('RELEVATEME_MILOSZ_EMAIL') ?: '',
        ],
        'paulina-mackiewicz' => [
            'name' => 'Paulina Mackiewicz',
            'email' => getenv('RELEVATEME_PAULINA_EMAIL') ?: '',
        ],
    ],
    'sources' => [
        'linkedin-featured' => 'LinkedIn / Featured',
        'linkedin-about' => 'LinkedIn / About',
        'linkedin-contact' => 'LinkedIn / Contact',
        'mentor-referral' => 'Link polecający eksperta',
    ],
];

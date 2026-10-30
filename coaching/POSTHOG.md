# PostHog: plan i uruchomienie

## Decyzje wdrożeniowe

1. Chcemy wiedzieć, gdzie ludzie docierają, co oglądają i co prowadzi do konsultacji. Nie potrzebujemy znać tożsamości odwiedzającego.
2. Główna, trzy pakiety i dedykowany kontakt korzystają z jednego projektu PostHog. Losowy identyfikator przeglądarki po zgodzie pozwala połączyć drogę główna → pakiet → formularz.
3. Odsłona oznacza załadowanie dokumentu, nie każde przejście do kotwicy. Kliknięcie kotwicy jest osobnym zdarzeniem nawigacji.
4. Zamiast szerokiego autocapture wdrażamy mały, jawny schemat zdarzeń. Nie odczytujemy wartości pól, treści klikanych elementów, odpowiedzi, punktacji ani profilu z ankiety.
5. Oglądanie sekcji mierzymy po co najmniej sekundzie jej widoczności. Karuzele raportują widoczne karty, w tym zmianę przez swipe; nie zmieniamy ich działania.
6. Session Replay daje jakościowy obraz przewijania i ruchów kursora. Wymaga osobnej zgody; cały tekst jest maskowany, a formularze, ankieta, modale i panel zgód są blokowane. Nagranie nie jest wideo ekranu: odtwarza strukturę strony.
7. Nie uruchamiamy SDK, analitycznych cookies/storage ani żądań do PostHog przed zgodą lub po odmowie. Nie ma śledzenia „cookieless” po odrzuceniu. Jedyny zapis przed zgodą to wybór prywatności, jeśli użytkownik go dokona.
8. Ustawienia respektują Do Not Track i Global Privacy Control. Zgoda na kontakt jest niezależna od zgody na analitykę.
9. Rejestrujemy początek formularza, próbę wysłania, potwierdzenie serwera albo błąd. Potwierdzenie serwera nie gwarantuje dostarczenia e-maila do skrzynki.
10. Nie włączamy heatmap, nagrywania konsoli, payloadów sieciowych, automatycznego zbierania błędów ani tworzenia profili osób. Nie wysyłamy surowych query stringów, hashy ani dowolnych parametrów UTM. Oprócz domeny referrera obsługujemy zatwierdzone oznaczenia źródeł i mentorów z katalogu linków, opisane w [REFERRALS.md](REFERRALS.md).
11. SDK ładuje się asynchronicznie dopiero po zgodzie. Zdarzenia sprzed zgody i z krótkiego okresu ładowania SDK nie są odtwarzane wstecz. Adblockery i odmowa zgody oznaczają brak części wizyt w statystykach.
12. Najpierw uruchamiamy pomiar i sprawdzamy jakość danych, dopiero potem rozważamy eksperymenty. Reverse proxy, personalizacja i A/B testing nie są potrzebne na ten etap.

## Co zostało dodane

- `analytics-config.js`: publiczna konfiguracja projektu, region, dozwolone domeny i kill switch.
- `analytics.js`: odroczony bootstrap SDK, zgody, zdarzenia, filtr właściwości i ochrona replay.
- `analytics.css`: panel ustawień prywatności dopasowany do strony.
- Integracja w pięciu HTML-ach, stopce, formularzach i ankiecie.
- `tests/analytics.test.cjs`: testy bez zewnętrznego SDK i bez wysyłania danych do PostHog.

## Uruchomienie krok po kroku

1. Załóż projekt w [PostHog Cloud EU](https://eu.posthog.com). Region wybierz przy tworzeniu projektu. Dla obecnego konfiguratora obsługujemy oficjalny Cloud EU lub US, nie dowolny host/proxy.
2. W ustawieniach projektu znajdź **Project token** (`phc_...`) i host API. To publiczny token do zbierania zdarzeń, nie sekret. **Nie wklejaj Personal API key.**
3. Uzupełnij `analytics-config.js`:

   ```js
   projectToken: "phc_TWOJ_PUBLICZNY_TOKEN",
   apiHost: "https://eu.i.posthog.com",
   allowedHosts: ["relevateme.pl", "www.relevateme.pl"],
   ```

   Użyj rzeczywistych domen hostingu. Hosty muszą zgadzać się dokładnie, bez protokołu i ścieżki. Dla US host to `https://us.i.posthog.com`. Do świadomego testu localhost ustaw `allowLocalhost: true` i użyj osobnego projektu testowego. `file://` nigdy nie zbiera danych.

4. Włącz **Web Analytics / Product Analytics** oraz **Session Replay** w projekcie. Jeżeli panel udostępnia listę domen dopuszczonych do nagrywania, dodaj właściwe domeny.
5. W ustawieniach Replay ustaw regułę obejmującą witrynę. Zacznij np. od 20% sesji i minimum 10 sekund, po czym dopasuj próbkowanie do ruchu i budżetu. Kod respektuje reguły PostHog; nie wymusza nagrywania ponad limit/próbkowanie. W nagraniu znajdą się tylko osoby z obiema zgodami. Aby całkowicie wyłączyć Replay w kodzie, ustaw `sessionReplay: false`.
6. Pozostaw wyłączone nagrywanie request/response bodies, headers i console logs. Kod dodatkowo wyłącza je lokalnie, maskuje tekst oraz blokuje formularze i ankietę. Nie dodawaj na stronie drugiego SDK przez GTM.
7. Ustaw retencję zdarzeń i nagrań w projekcie, ogranicz dostęp zespołu i ustaw limity wydatków/alerty dostępne w planie. Początkowo sugerujemy krótką retencję nagrań, np. 30 dni, jeżeli plan ją umożliwia. Sprawdź bieżące limity w swoim panelu; kod ich nie ustawia.
8. Zatwierdź z osobą odpowiedzialną za prywatność treść zgód i polityki, podmiot administratora, informacje o dostawcy, faktyczny region, retencję i umowę powierzenia (DPA). Techniczna integracja nie oznacza automatycznie zgodności prawnej. Obecna polityka ma uzupełnioną sekcję analityki, ale nadal wymaga biznesowo-prawnego zatwierdzenia.
9. Wgraj zmienione pliki na hosting. Przy każdej zmianie konfiguracji podbij wersje zasobów w pięciu HTML-ach, aby uniknąć starego cache. Sam PostHog nie wymaga backendu PHP; routing formularzy do mentorów wymaga plików i konfiguracji opisanych w [REFERRALS.md](REFERRALS.md).
10. Jeżeli hosting ustawia CSP, dopuść oficjalne domeny PostHog dla `script-src` i `connect-src`; Replay może wymagać również `worker-src 'self' blob: data:`. Dopasuj reguły do istniejącej CSP, nie zastępuj jej w całości. Dokumentacja SDK opisuje także wymagania toolbaru.

## Zdarzenia

Każde zdarzenie dostaje `site_page` (`home`, `navigate`, `elevate`, `relevate`) i `site_environment`. SDK zachowuje techniczne dane przeglądarki, viewport oraz pseudonimowe identyfikatory sesji/urządzenia. Query stringi, hashe, dane kontaktowe i dowolne dodatkowe właściwości są odrzucane przez filtr.

| Zdarzenie | Znaczenie / właściwości |
| --- | --- |
| `$pageview`, `$pageleave` | Wejście i opuszczenie dokumentu po zgodzie |
| `section_viewed` | Sekcja widoczna min. 1 s; `section` |
| `scroll_depth_reached` | Progi 25, 50, 75, 90%; `percent` |
| `carousel_slide_viewed` | Oglądana karta; `carousel`, `slide` (liczba od 1) |
| `navigation_clicked` | Przejście do znanej sekcji lub pakietu; `target`, `placement` |
| `package_details_clicked` | Wejście do opisu pakietu; `package`, `placement` |
| `consultation_cta_clicked` | CTA do formularza; `placement` |
| `contact_link_clicked` | Kliknięcie e-maila/telefonu; `channel`, `placement`, bez adresu/numeru |
| `faq_opened` | Ręczne otwarcie pytania; `question` (indeks), `placement` |
| `form_started` | Pierwsze skupienie pola danego formularza; `form` |
| `form_submit_started` | Rozpoczęcie żądania do serwera; `form` |
| `form_submit_succeeded` | Serwer zwrócił `ok: true`; `form` |
| `form_submit_failed` | Błąd sieci/serwera; `form`, bez komunikatu błędu i payloadu |
| `quiz_started` | Start lub restart ankiety |
| `quiz_step_answered` | Odpowiedziano na krok; `step`, bez wybranej odpowiedzi |
| `quiz_completed` | Ukończono ankietę; `questions`, bez punktacji i rekomendacji |
| `analytics_consent_updated` | Aktywowano/zmieniono udzieloną zgodę; `analytics`, `replay`, `notice_version` |
| `referral_landing` | Dokument otwarty z oznaczeniem linku; kontekst `link_source`, UTM-y z katalogu oraz opcjonalnie `referral_mentor` |

Odmowa i wycofanie zgody nie wysyłają zdarzenia do PostHog. Wybór z wersją i czasem jest przechowywany lokalnie przez maks. 180 dni. Po tym czasie ponownie pytamy. Lokalny zapis nie zastępuje centralnego rejestru zgód; jeśli firma wymaga takiego rejestru, potrzebny będzie CMP lub osobny backend. Zwiększenie `consentVersion` wymusi nowy wybór.

## Dashboard i lejki

Utwórz dashboard **RelevateMe: droga do konsultacji** i dodaj:

1. **Web Analytics**: użytkownicy/sesje, wejścia, wyjścia, urządzenia i domeny odsyłające. Dane obejmują tylko ruch ze zgodą.
2. **Trends**: unikalne sesje `section_viewed`, breakdown `section`. Widać, ile osób dociera do oferty, ekspertów, F1 i kontaktu.
3. **Trends**: `carousel_slide_viewed`, breakdown `carousel` i `slide`. Porównaj mobile z desktopem; na desktopie kilka kart może być widocznych naraz.
4. **Funnel, sesje, 1 dzień**: `$pageview` na `site_page=home` → `package_details_clicked` → `form_started` → `form_submit_succeeded`. Breakdown po `site_page` ostatniego kroku lub osobne lejki dla pakietów. Lejek pomija klientów przechodzących od razu do kontaktu, więc nie traktuj go jako całej konwersji strony.
5. **Funnel, sesje**: `consultation_cta_clicked` → `form_started` → `form_submit_started` → `form_submit_succeeded`. Osobny widok `form_submit_failed` pokaże problemy wysyłki.
6. **Funnel, sesje**: `quiz_started` → `quiz_step_answered` z `step=1` → ... → `step=6` → `quiz_completed`. Sprawdzaj odpływ na kolejnych pytaniach, nie treść odpowiedzi.
7. **Paths**: start `$pageview`, następnie `navigation_clicked`, `package_details_clicked`, `consultation_cta_clicked`. Wyklucz techniczne consent events z tego widoku.
8. **Session Replay**: filtruj po `consultation_cta_clicked`, `form_submit_failed` albo `quiz_started`. Ankieta i formularz będą celowo zasłonięte. Oglądaj, czy użytkownik znajduje CTA i potrafi przejść między sekcjami.

Zdarzenia sekcji, kart i progów scrolla są deduplikowane w obrębie dokumentu. Nie sumuj ich jako liczby wizyt. W raportach konwersji preferuj sesje i filtr `site_environment=production`.

## Test po wdrożeniu

1. Nowe okno prywatne: przed wyborem brak żądań do `*.posthog.com` i brak identyfikatorów PostHog w storage.
2. Odrzuć: nadal brak żądań. Formularz kontaktowy i cała strona nadal działają.
3. Zezwól tylko na statystyki: w **Live events / Activity** pojawia się `$pageview` i kolejne jawne zdarzenia, bez `$snapshot`.
4. Włącz też Replay: po spełnieniu reguł/próbkowania projektu pojawi się nagranie. Obejrzyj je i sprawdź maskowanie oraz zablokowane formularze, quiz i modale. Publiczne napisy też będą maskowane, co jest celowym punktem wyjścia.
5. Przejdź główna → pakiet → CTA, przewiń karty, otwórz FAQ i ukończ ankietę. W PostHog sprawdź właściwości zdarzeń: brak nazwiska, e-maila, telefonu, wartości odpowiedzi i query stringów.
6. Zmień preferencje w stopce i odrzuć: nowe zdarzenia i nagrywanie ustają. To nie usuwa historycznych danych z PostHog. Sprawdź też wycofanie zgody w drugiej otwartej karcie.
7. Wyślij kontrolne zapytanie dopiero po uzgodnieniu testu skrzynki. Zobacz `form_submit_succeeded` po potwierdzeniu serwera. Błędna walidacja HTML nie powinna udawać sukcesu.
8. DNT/GPC i niedozwolona domena wyłączają śledzenie. `SiteAnalytics.getStatus()` w konsoli pokazuje konfigurację, stan zgód, załadowanie SDK i ewentualny błąd ładowania, bez danych użytkownika.

Testy lokalne: `node tests/analytics.test.cjs` (lub `node --test tests/analytics.test.cjs` w aktualnym Node.js). Bez publicznego tokena integracja pozostaje nieaktywna; podgląd pliku nie jest testem dostarczenia danych do PostHog.

Stan weryfikacji wdrożenia: 16 testów logiki z atrapą SDK zakończonych powodzeniem; panel otwierania/odrzucania zgód sprawdzony w Safari przy szerokościach 402 i 1329 px, na głównej i podstronie pakietu. Rzeczywisty ingest i odtwarzanie nagrania trzeba potwierdzić po dodaniu tokena w projekcie PostHog. Testy oznaczeń źródeł i mentorów są opisane w [REFERRALS.md](REFERRALS.md).

## Dokumentacja dostawcy

- [Instalacja JavaScript SDK](https://posthog.com/docs/libraries/js)
- [Konfiguracja i before_send](https://posthog.com/docs/libraries/js/config)
- [Maskowanie i blokowanie Session Replay](https://posthog.com/docs/session-replay/privacy)
- [Wyłączenie odczytu payloadów i nagłówków](https://posthog.com/docs/session-replay/network-recording)
- [Próbkowanie i reguły nagrań](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record)
- [Wskazówki PostHog dotyczące GDPR](https://posthog.com/docs/privacy/gdpr-compliance)

# Źródła wejścia i linki kontaktowe mentorów

## Jak to działa

- Link zawiera publiczne oznaczenie źródła `from` oraz opcjonalnie identyfikator eksperta `mentor`. Nie zawiera e-maila odbiorcy ani identyfikatora odwiedzającego.
- Źródło i ekspert są odczytywane z URL-u oraz przekazywane w wewnętrznych linkach między pięcioma stronami. Nie zapisujemy ich w cookies, localStorage ani sessionStorage.
- Kotwice na tej samej stronie zachowują bieżący query string. Linki do innych domen, adresy mailto/tel i endpoint serwera nie dostają oznaczeń.
- Zwykła wizyta bez oznaczenia nie otrzymuje sztucznego źródła. Po usunięciu parametrów, ręcznym wpisaniu nowego adresu albo późniejszym powrocie nie pamiętamy wcześniejszego źródła. To celowe ograniczenie atrybucji bez zapisu w przeglądarce.
- Do PostHog źródło trafia dopiero po zgodzie na analitykę. Routing formularza działa niezależnie od zgody analitycznej. Oznaczenie źródła i wybrany ekspert są też dołączane do treści wysyłanego zapytania.
- „Źródło” oznacza użyty link. Jeśli ktoś skopiuje link Featured do wiadomości, nadal będzie oznaczony jako Featured. Nie da się na tej podstawie dowieść miejsca kliknięcia ani tożsamości polecającego. Nie używaj tych wartości jako autoryzacji, dowodu prowizji lub płatności.

To rozszerzenie nie zmienia istniejącej polityki PostHog: SDK używa localStorage dopiero po zgodzie. Sam mechanizm linków nie wymaga storage, ale cała analityka nie jest przez to automatycznie wolna od zgód i obowiązków prywatności.

## Gotowe linki

Zastąp domenę rzeczywistym adresem produkcyjnym. Parametry działają na zwykłym hostingu bez reguł przekierowań.

| Miejsce | Link |
| --- | --- |
| LinkedIn Featured | `https://relevateme.pl/index.html?from=linkedin-featured` |
| LinkedIn About | `https://relevateme.pl/index.html?from=linkedin-about` |
| LinkedIn Contact, od razu formularz | `https://relevateme.pl/kontakt.html?from=linkedin-contact` |
| Link Miłosza | `https://relevateme.pl/kontakt.html?mentor=milosz-stawecki` |
| Link Pauliny | `https://relevateme.pl/kontakt.html?mentor=paulina-mackiewicz` |
| Featured Miłosza, od razu formularz | `https://relevateme.pl/kontakt.html?mentor=milosz-stawecki&from=linkedin-featured` |
| About Pauliny, od razu formularz | `https://relevateme.pl/kontakt.html?mentor=paulina-mackiewicz&from=linkedin-about` |

Link mentora bez `from` dostaje domyślne oznaczenie `mentor-referral`. Obsługujemy też skróty `?from=featured`, `?from=about`, `?from=contact`, `?mentor=milosz` oraz `?mentor=paulina`; wewnętrzne linki przekazują dalej pełne identyfikatory.

## Konfiguracja odbiorców wiadomości

**Przed udostępnieniem linków mentorów trzeba skonfigurować ich prawdziwe skrzynki. Nie zgadujemy adresów.**

W `mentor-routing-config.php` ustaw na hostingu zmienne środowiskowe:

```text
RELEVATEME_MILOSZ_EMAIL=rzeczywisty-adres-milosza
RELEVATEME_PAULINA_EMAIL=rzeczywisty-adres-pauliny
```

Jeżeli hosting nie pozwala ustawiać zmiennych, w tym samym pliku zamień pusty fallback `''` przy danym `getenv(...)` na zatwierdzony adres e-mail. Przykład składni, nie rzeczywisty adres:

```php
'email' => getenv('RELEVATEME_MILOSZ_EMAIL') ?: 'milosz@example.com',
```

Odbiorca nie jest pobierany z pola `to`, `email` ani z URL-u. Przeglądarka przesyła jedynie publiczny identyfikator mentora. Serwer wybiera adres z własnej listy. `email` z formularza pozostaje adresem osoby pytającej, używanym wyłącznie jako Reply-To.

- Brak parametru `mentor`: dotychczasowa skrzynka ogólna `kontakt@relevateme.pl`.
- Znany mentor z poprawnie skonfigurowanym adresem: skrzynka tego mentora, bez automatycznej kopii do ogólnej.
- Nieznany lub niepoprawny identyfikator: błąd `mentor_unknown`, bez wysyłki.
- Znany mentor bez poprawnej skrzynki: błąd `mentor_unavailable`, bez wysyłki do innej osoby.
- Formularz współpracy: nadal `wspolpraca@relevateme.pl`, bez routingu do mentora.

Upewnij się też, że hosting zezwala na wysyłanie z `kontakt@relevateme.pl` i ma poprawną konfigurację domeny/poczty. `mail()` potwierdza przekazanie do systemu pocztowego, nie dostarczenie do skrzynki. Rzeczywisty test dostarczenia musi objąć każdą skonfigurowaną skrzynkę.

## Krótkie ścieżki typu /from:featured

Nie włączono reguł serwera w ciemno, bo typ hostingu nie jest jeszcze potwierdzony. Przygotowane reguły Apache są w `deployment/apache-referrals.htaccess.example`. Scal je z istniejącym `.htaccess`, nie zastępuj całej konfiguracji serwera.

Po włączeniu `mod_rewrite` i dopuszczeniu reguł `.htaccess`:

```text
/from:featured                 → /index.html?from=featured
/from/linkedin-about           → /index.html?from=linkedin-about
/mentor/milosz-stawecki         → /kontakt.html?mentor=milosz-stawecki&from=mentor-referral
/mentor/paulina-mackiewicz      → /kontakt.html?mentor=paulina-mackiewicz&from=mentor-referral
```

To przekierowania 302 do działających adresów z parametrami. Dzięki temu obrazy, CSS i linki względne nadal działają, również gdy strona jest wdrożona w podkatalogu. Nie dodawaj surowego rewrite do HTML bez przekierowania, jeśli nie ustawisz również poprawnej bazy zasobów.

Na nginx/innym serwerze administrator powinien dodać równoważne przekierowania. Do czasu ich skonfigurowania używaj gotowych linków z tabeli, nie skróconych ścieżek.

## Co zobaczysz w PostHog

Na `$pageview`, `referral_landing`, kliknięciach, formularzach i pozostałych jawnych zdarzeniach dodajemy:

| Właściwość | Przykład |
| --- | --- |
| `link_source` | `linkedin-featured` |
| `utm_source` | `linkedin` |
| `utm_medium` | `social` |
| `utm_content` | `featured` |
| `utm_campaign` | `profile` |
| `referral_mentor` | `milosz-stawecki` |
| `site_page` na nowej stronie | `contact` |

UTM-y pochodzą z zamkniętego katalogu źródeł, nie z dowolnych parametrów UTM użytkownika. Surowy query string nadal jest usuwany z raportowanego URL-u. Nieznane identyfikatory źródeł są ignorowane. Nieznane identyfikatory mentorów blokują wysyłkę, zamiast niejawnie wybierać innego odbiorcę.

Proponowane raporty:

1. **Trends**: `$pageview`, unikalne sesje, breakdown `link_source`. Porównaj Featured / About / Contact.
2. **Funnel**: `referral_landing` → `consultation_cta_clicked` → `form_started` → `form_submit_succeeded`, breakdown `link_source`. Dla linków prowadzących prosto do formularza pomiń krok CTA.
3. **Trends**: `form_submit_succeeded`, filtr `form=consultation`, breakdown `referral_mentor` i `link_source`.
4. **Paths**: sesje z `link_source=linkedin-featured`, aby zobaczyć dalszą drogę przez pakiety i kontakt.

`referral_landing` występuje na każdym załadowanym dokumencie z zachowanym oznaczeniem, nie tylko na pierwszym wejściu z zewnątrz. Do liczenia wizyt z linku używaj unikalnych sesji, nie sumy zdarzeń. Nazwa mentora opisuje wybranego odbiorcę, nie odwiedzającego.

Bez zgody analitycznej PostHog nie liczy takiej wizyty. Nadal można zobaczyć źródło konkretnego zapytania w otrzymanym mailu. Nie wdrożono odrębnego, bez-zgodowego licznika wszystkich wejść.

## Dodawanie źródeł i mentorów

- Źródła/aliasy, publiczne nazwy ekspertów i ich indeks w obecnym zespole: `referral-config.js`.
- Zatwierdzone skrzynki i opisy źródeł w mailach: `mentor-routing-config.php`.
- Dodając źródło, użyj krótkiego, publicznego identyfikatora z małych liter, cyfr i myślników. Nie umieszczaj danych klienta, adresu e-mail ani tajnych kodów w URL-ach.
- Dodając mentora, ustaw identyczny identyfikator w konfiguracji publicznej i serwerowej. Potem sprawdź nazwę, formularz i faktyczne dostarczenie maila. Opcjonalne reguły krótkich linków również wymagają rozszerzenia.
- Po zmianach podbij wersje zasobów w pięciu HTML-ach, aby uniknąć starego cache.

## Weryfikacja

```sh
node tests/referral.test.cjs
node tests/analytics.test.cjs
php -l send-form.php
php -l contact-routing.php
php -l mentor-routing-config.php
php tests/contact-routing.test.php
```

Testy PHP korzystają ze skrzynek `example.com` i nie wywołują `mail()`.

Sprawdzono 11 testów JavaScript dotyczących źródeł i linków oraz 16 testów analityki. W Safari sprawdzono kontakt mentora na desktopie i telefonie, przejście do oferty z zachowaniem źródła i mentora oraz blokadę nieznanego identyfikatora. PHP CLI nie jest dostępne lokalnie: lint, test routingu PHP, przekierowania Apache i dostarczenie wiadomości należy potwierdzić na hostingu. Nie wysyłano wiadomości testowych.

Powiązane: [konfiguracja PostHog](POSTHOG.md), [oficjalna dokumentacja segmentacji UTM](https://posthog.com/docs/data/utm-segmentation).
# Linki LinkedIn do statystyk cookieless

| Miejsce | Link |
| --- | --- |
| Featured | `https://relevateme.pl/?from=featured` |
| About | `https://relevateme.pl/?from=about` |
| Contact info | `https://relevateme.pl/?from=contact` |
| Doswiadczenie | `https://relevateme.pl/?from=experience` |
| Post (przyklad daty) | `https://relevateme.pl/?from=post-2026-10-31` |
| Wiadomosci prywatne | `https://relevateme.pl/?from=dm` |

Obslugiwany jest tez zapis `?from[featured]`, ale zalecany jest standardowy `?from=featured`. Data posta: RRRR-MM-DD, poprawna data kalendarzowa. Linki zakladaja, ze domena serwuje strone z katalogu coaching; przy hostowaniu pod podsciezka dodaj /coaching/ przed znakiem zapytania.

PostHog: filtruj `referral_landing` i rozbijaj po `link_source`; dla postow `utm_content=post` i `post_date`. Te wlasciwosci sa tez dolaczane do pozostalych zdarzen na stronie. Krotkie nazwy profilu sa normalizowane do linkedin-featured/about/contact/experience/dm, a post zachowuje post-RRRR-MM-DD. Zrodlo jest przenoszone miedzy podstronami w URL, bez storage. To deklaracja w linku, nie dowod faktycznego pochodzenia wizyty; link mozna przekazac dalej. DNT/GPC i blokery moga ograniczac pomiar.


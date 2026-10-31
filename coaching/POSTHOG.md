# PostHog: zbiorcze statystyki cookieless

## Uruchomienie

Token EU i domeny relevateme.pl oraz www.relevateme.pl sa skonfigurowane.
W PostHog otworz Settings > Project > Web analytics, wlacz Enable cookieless tracking i zapisz. Bez tego dostawca moze odrzucac zdarzenia.
Wgraj aktualne pliki strony na hosting. Nie dodawaj drugiego snippetu przez GTM.

## Zakres

Brak popupu, cookies analitycznych, zapisu identyfikatorow w localStorage/sessionStorage, profili osob i Session Replay. SDK uzywa cookieless_mode: always. DNT/GPC wylaczaja pomiar. Stare lokalne wpisy naszej integracji sa usuwane; historyczne dane w PostHog nie sa usuwane automatycznie.
Mierzymy odslony, znane sekcje i karty, progi przewijania, klikniecia CTA oraz liczniki formularzy i ankiety. Nigdy wartosci pol ani odpowiedzi. URL jest ograniczony do znanej strony, referrer do domeny, zrodla linkow do katalogu dozwolonych wartosci.

## Ograniczenia i prywatnosc

To pomiar cookieless, nie gwarancja pelnej anonimowosci. PostHog przetwarza IP i User-Agent do dziennego hasha na serwerze. Nie obiecujemy rozpoznawania powracajacych osob, dokladnych miesiecznych unikalnych uzytkownikow ani nagran. Preferuj laczne liczniki zdarzen i podzial po site_page/link_source. Ocena podstawy prawnej, DPA, retencji i polityki prywatnosci pozostaje po stronie administratora.

## Weryfikacja

node tests/analytics.test.cjs
Na wdrozonej domenie sprawdz brak popupu i nowych wpisow PostHog w cookies/localStorage/sessionStorage, brak $snapshot i danych formularzy w Activity oraz dzialanie oznaczonych linkow. Sprawdz tez DNT/GPC. Testy z atrapa SDK nie potwierdzaja rzeczywistego ingestu ani zachowania zewnetrznego SDK; to wymaga testu po wdrozeniu.

Dokumentacja: https://posthog.com/tutorials/cookieless-tracking

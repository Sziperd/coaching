# Zmiany według projektów Julki

## Źródła i pierwszeństwo ustaleń

- Główna: https://claude.ai/artifact/CUTfzpuNLCQoV5eNgRoYht
- Navigate: https://claude.ai/artifact/G2M7B4PKNroDLqk5bPhFyN
- Elevate: https://claude.ai/artifact/RqVawcTeBaNHXnJ7LdVWU9
- Relevate: https://claude.ai/artifact/Y6Cz7LkdjiUappVLxY8cP9
- Rozmowa z Julką koryguje mobilne renderowanie projektów: zachowujemy poziome karuzele, trzy slajdy F1 i kształt zdjęć ekspertów. Usuwamy dodatkowy przycisk za stopką.

## Analiza i decyzje wdrożeniowe

1. Nawigacja: pełny logotyp, rozwijana oferta z trzema podstronami, FAQ oraz „Dołącz do zespołu”. Konsultacja pozostaje głównym CTA.
2. Hero: ten sam główny nagłówek, precyzyjniejszy opis odbiorcy i efektu sesji. Dodajemy wyraźne CTA. Zachowujemy działające fiszki i ich treści zamiast placeholderów projektu.
3. Sygnały: zostaje siedem problemów, wizualnie lżejsza lista oraz zdjęcie z obecnej strony. Jednolite jasne tło od początku strony.
4. Usuwamy powielającą ofertę sekcję metodologii i jej trzy skrótowe karty. Jej rolę przejmują pełniejsze opisy pakietów.
5. Historie: trzy sytuacje w kolejności Magda, Aleksandra, Marek. Aktualizujemy teksty i nazwy na business-life coaching/mentoring. Rekomendacje prowadzą do konkretnych pakietów; mobilnie zachowujemy poziomy scroll i kropki.
6. Oferta: ciemny pas, sześć wspólnych korzyści z ikonami, trzy osobne karty. Każda zawiera sytuację, sposób pracy, tagi, liczbę i długość sesji, czas procesu, efekt, orientacyjną stawkę i link do podstrony. Relevate oznaczamy jako flagowy.
7. Początek współpracy: konsultacja 60 min, plan współpracy, sesje 1:1. Umieszczamy przy ofercie i usuwamy powtórzony proces pod F1.
8. Ankieta: zachowujemy istniejący działający mechanizm sześciu pytań. Poprawiamy stare, odwrócone przypisania wyników: regeneracja to Elevate, a skalowanie i niezależność firmy to Relevate. Linkujemy z oferty i mobilnego menu. Mobilnie usuwamy pływający przycisk zasłaniający karty; desktopowo chowamy go przy stopce.
9. Eksperci: nowe biografie Miłosza i Pauliny, role, CTA, statystyki. Zachowujemy poziomy scroll, kropki i dotychczasowy kształt fotografii; kontrolki są przy karuzeli. Zdjęcie Miłosza pochodzi z obecnego projektu. Dla Pauliny pokazujemy inicjały PM, bo projekt nie zawiera jej zdjęcia; nie przypisujemy jej zdjęcia wcześniejszej, przykładowej Anny Kowalskiej.
10. O nas: nowy opis powstania RelevateMe i cztery wartości z ikonami. Jasne tło, mniej osobnych bloczków.
11. F1: przenosimy za „O nas”; zachowujemy zdjęcia, teksty i trzy mobilne slajdy, zgodnie z rozmową.
12. Kontakt: imię, e-mail, wybór pakietu, zgoda i rozwijana informacja RODO. Bez obowiązkowej wiadomości i telefonu. Prawdziwy formularz wysyła przez dotychczasowy endpoint PHP, nie symuluje sukcesu jak prototyp.
13. FAQ: dziewięć pytań na głównej. Odpowiedzi oznaczone w projekcie jako „z obecnej strony” przenosimy z obecnych danych.
14. Stopka: logo, kontakt@relevateme.pl, eksperci, FAQ, prywatność i współpraca. Linki profili pojawiają się dopiero po ustawieniu rzeczywistych adresów `linkedin` w danych ekspertów. Nie tworzymy fikcyjnych dokumentów prawnych z placeholderów.
15. Podstrony: trzy rzeczywiste adresy HTML, wspólna nawigacja i zakładki, indywidualny kolor, hero i podsumowanie, „Dla kogo”, zawartość pakietu i sesje, efekty, skrót ekspertów, FAQ i formularz. Treści odwzorowują projekty.
16. Placeholdery: nie publikujemy instrukcji typu „DO UZUPEŁNIENIA” ani „DO DECYZJI”. Zachowujemy obecne informacje prawne; finalna treść wymaga danych administratora. Nie obiecujemy nieuzgodnionych spotkań kontrolnych.

## Kontrola

- Sprawdzono renderowanie głównej i trzech podstron w Safari, w tym szerokości mobilne i desktopowe.
- Potwierdzono przełączanie historii oraz trzeciego slajdu F1. Pozycje historii liczymy względem pierwszej karty, niezależnie od jej offset parent.
- Sprawdzono menu mobilne, otwieranie ankiety z menu, rozwijanie FAQ i odblokowanie formularza po zaznaczeniu zgody.
- Sprawdzono składnię wszystkich zmienionych i nowych skryptów JavaScript oraz dane pakietów, rekomendacje ankiety i obecność lokalnych podstron.
- PHP CLI nie jest dostępne w środowisku, więc lint PHP i rzeczywista dostarczalność poczty wymagają sprawdzenia na hostingu. Nie wysyłano testowych wiadomości.

## Materiały do uzupełnienia

- Rzeczywiste zdjęcie Pauliny Mackiewicz oraz adresy LinkedIn ekspertów.
- Zatwierdzone informacje administratora danych i ostateczne zgody prawne formularzy.
- Potwierdzenie konfiguracji skrzynek kontakt@relevateme.pl i wspolpraca@relevateme.pl na hostingu.

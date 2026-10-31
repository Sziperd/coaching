/* Content approved in the supplied redesigns. */
(() => {
  const c = window.siteContent;
  c.hero.lead = "Coaching i mentoring 1:1 dla właścicieli i liderów małych i średnich firm. Dobieramy eksperta do Twojej sytuacji, a po każdym spotkaniu wiesz, co robisz dalej.";
  c.hero.goalTitle = "Co zmienisz po pierwszym miesiącu";
  c.signals.eyebrow = "Sygnały ostrzegawcze";
  c.stories.eyebrow = "Najczęstsze problemy";
  c.stories.lead = "Trzy typowe sytuacje. Sprawdź, która brzmi najbliżej Twojej.";
  const oldStories = c.stories.items;
  c.stories.items = [oldStories[3], oldStories[1], oldStories[0]];
  c.stories.items[0].text = "Czuję, że mam energię, ale coś się rozmywa. Szukam kogoś, kto pomoże mi nazwać kierunek, zada dobre pytania i przełoży chaos w głowie na konkretny pierwszy krok.";
  c.stories.items[1].packageDetail = "business-life coaching";
  c.stories.items[2].packageDetail = "business-life mentoring";
  c.stories.items[2].profile = "Wiem, jak rozwijać firmę, ale boję się, ile zapłacę za to w domu.";
  c.packages.lead = "Ścieżki różnią się tym, od czego zaczynasz i jak długo pracujemy. To, co niżej, dostajesz w każdej z nich.";
  c.quiz.results.aleksandra.package = "Elevate";
  c.quiz.results.marek.package = "Relevate";
  c.quiz.results.krzysztof.package = "Relevate";
  c.quiz.results.magda.note = "Coaching dla osób, które chcą wreszcie ruszyć z miejsca.";
  const pairPackages = {
    "aleksandra+magda": "Navigate + Elevate",
    "magda+marek": "Navigate + Relevate",
    "aleksandra+marek": "Elevate + Relevate",
    "aleksandra+krzysztof": "Elevate + Relevate",
    "krzysztof+marek": "Relevate"
  };
  Object.entries(pairPackages).forEach(([key, value]) => { c.quiz.pairResults[key].package = value; });
  c.packages.items.forEach((item, i) => {
    item.slug = ["navigate", "elevate", "relevate"][i];
    item.type = ["Start | coaching", "Regeneracja | business-life coaching", "Skalowanie | business-life mentoring"][i];
    item.contextLabel = "Jak pracujemy";
    item.includes = [
      ["4-5 sesji po 50 min", "4-6 tygodni", "matryce decyzyjne"],
      ["6 sesji po 60 min", "2,5-3 miesiące", "wiadomości audio między sesjami"],
      ["8-9 sesji po 2 godziny", "ok. 5 miesięcy", "audyt blokad w firmie i kontakt na bieżąco"]
    ][i];
    item.price = ["ok. 360-450 zł netto / h*", "1 500 zł netto / h*", "Wycena projektowa*"][i];
  });
  Object.assign(c.packages.items[0], {
    tagline: "Gdy masz mętlik w głowie, za dużo opcji i nie możesz podjąć ważnej decyzji, w pracy albo w życiu.",
    context: "Porządkujemy fakty, potrzeby i ograniczenia, aż zostaje decyzja, za którą naprawdę stoisz.",
    result: "Wypracowujesz własne odpowiedzi i masz plan na najbliższe tygodnie."
  });
  Object.assign(c.packages.items[1], {
    context: "Pracujemy na Twoim prawdziwym tygodniu: sprawdzamy, gdzie uciekają czas i energia, i ustalamy granice, które da się utrzymać razem z firmą.",
    result: "Planujesz tydzień, w którym jest miejsce na odpoczynek i bliskich, i wiesz, które sprawy może przejąć zespół."
  });
  Object.assign(c.packages.items[2], {
    tagline: "Gdy uświadamiasz sobie, że jesteś największą blokadą w firmie i chcesz czerpać z wiedzy praktyków.",
    context: "Z ekspertem, który zna realia zarządzania firmą, mapujecie blokady w firmie i przenosicie odpowiedzialność na zespół.",
    result: "Przebudowujesz strukturę tak, żeby firma mogła rosnąć bez Twojej ciągłej obecności."
  });
  c.experts.lead = "Eksperta dobieramy indywidualnie, po rozmowie o Twojej sytuacji. Jeśli chcesz pracować z kimś konkretnym, powiedz nam o tym na konsultacji.";
  Object.assign(c.experts.items[0], {
    role: "Mentor biznesowy",
    shortBio: "31 lat zarządzania firmami i zespołami. Pomaga właścicielom delegować decyzje i rozwijać firmę bez płacenia za to zdrowiem i czasem.",
    linkedin: "",
    bio: [
      "Od 31 lat zarządza firmami i zespołami. Pracował w siedmiu branżach: transporcie, motoryzacji i handlu, produkcji, doradztwie, mediach, sporcie i medycynie - jako prezes zarządu, członek zarządu, dyrektor i członek rad nadzorczych spółek akcyjnych.",
      "Zbudował firmę od podstaw, wyprowadził spółkę z zaległości wobec urzędu skarbowego, celnego i banku, prowadził restrukturyzacje i rozmowy ze związkami zawodowymi. W TVP Katowice zbudował zespół, który zrealizował 1800 wejść na żywo do programów ogólnopolskich. Decyzje, z którymi przychodzą właściciele firm, zna od środka, bo sam je podejmował.",
      "W RelevateMe pracuje 1:1 z właścicielami małych i średnich firm. Pomaga ustalić, które decyzje nie muszą już wracać na biurko właściciela, i ułożyć firmę tak, żeby rosła bez płacenia za to zdrowiem i czasem. Kierownicę zostawia klientowi: pokazuje zakręty wcześniej i pomaga przejść od decyzji do efektu."
    ],
    stats: [
      { value: 31, suffix: " lat", label: "w zarządach i na stanowiskach dyrektorskich" },
      { value: 5, label: "firm zbudowanych od zera" },
      { value: 150, suffix: " mln zł", label: "największy roczny budżet, którym zarządzał" },
      { value: 1200, prefix: "do ", suffix: " osób", label: "w zespołach, którymi kierował" }
    ]
  });
  Object.assign(c.experts.items[1], {
    name: "Paulina Mackiewicz", signature: "Paulina Mackiewicz", photo: null, photoAlt: "Paulina Mackiewicz", role: "Executive coach", linkedin: "",
    shortBio: "Ponad 20 lat pracy z liderami. Wspiera w delegowaniu, trudnych rozmowach i budowaniu odporności na stres oraz wypalenie.",
    bio: [
      "Od ponad 20 lat pracuje z liderami i firmami w momentach zmiany. Łączy doświadczenie executive coacha, konsultantki ds. zarządzania zmianą, trenerki biznesu i menedżerki projektów międzynarodowych. W globalnych organizacjach odpowiadała za wdrożenia, rozwój liderów i przygotowanie firm do zmian, pracując z zespołami w Skandynawii, Stanach Zjednoczonych, Europie i Azji.",
      "W RelevateMe pracuje 1:1 z właścicielami i menedżerami firm, którzy chcą prowadzić ludzi skuteczniej i przestać płacić za to sobą. Najczęściej zajmuje się delegowaniem i budowaniem odpowiedzialności w zespole, trudnymi rozmowami i informacją zwrotną, własnym stylem przywództwa oraz odpornością na stres i wypalenie.",
      "Pomaga też liderom praktycznie korzystać z narzędzi AI w codziennej pracy. Łączy doświadczenie biznesowe z podejściem coachingowym: zaczyna od tego, co klient chce osiągnąć i co jest dla niego ważne, a kończy na konkretnych krokach."
    ],
    stats: [
      { value: 20, suffix: "+ lat", label: "w rozwoju liderów i zarządzaniu firmą" },
      { value: 3, label: "kontynenty, na których prowadziła projekty" },
      { value: 4, suffix: " role", label: "coach, konsultantka zmiany, trenerka, menedżerka projektów" }
    ]
  });
  c.contact.lead = "Zostaw imię i e-mail. Odpowiemy w ciągu 24 godzin i zaproponujemy termin. Rozmowa jest bezpłatna, trwa 60 minut i odbywa się online.";
  c.contact.email = c.contact.formEmail = "kontakt@relevateme.pl";
  c.contact.submit = "Umów bezpłatną konsultację";
  c.contact.fields.name = "Imię *";
  c.contact.fields.email = "E-mail *";
  c.contact.fields.consent = "Akceptuję kontakt zwrotny i potwierdzam zapoznanie się z informacją RODO.";
  const oldFaq = c.modals.faq.items;
  c.modals.faq.items = [
    { question: "Czym różnią się między sobą pakiety?", answer: "Mamy trzy ścieżki. Navigate to coaching dla osób, które stoją przed ważną decyzją albo mają za dużo opcji i nie wiedzą, od czego zacząć. Elevate to business-life coaching: firma działa, ale płacisz za to snem, zdrowiem i czasem z bliskimi. Relevate to business-life mentoring dla właścicieli, bez których w firmie nic się nie dzieje.", extra: "Coaching i mentoring różnią się podejściem. Coach pomaga Ci dojść do własnej decyzji: zadaje pytania, porządkuje opcje i pilnuje kolejnych kroków. Mentor robi to samo, ale sam prowadził firmy, więc kiedy trzeba, mówi wprost, co zrobił w podobnej sytuacji." },
    { question: "Nie wiem, który pakiet wybrać. Co zrobić?", answer: "Umów bezpłatną konsultację albo dobierz pakiet w 6 pytaniach, a ankieta od razu pokaże rekomendację. Nie ma złej odpowiedzi, ankieta i tak prowadzi do rozmowy." },
    { question: "Mogę zacząć od jednego pakietu i przejść do innego?", answer: "Tak. Zdarza się, że w trakcie Navigate okazuje się, że potrzebujesz szerszego wsparcia. Wtedy przechodzisz do Elevate albo Relevate. Czasem łączymy też elementy kilku ścieżek w jednym procesie. Decydujemy razem, kiedy znamy Twoją sytuację." },
    { question: "Co znaczy wsparcie między sesjami?", answer: "W Elevate możesz w dni robocze nagrać wiadomość audio, a ekspert wraca z odpowiedzią. W Relevate masz kontakt z mentorem na bieżąco, kiedy pojawia się pilna decyzja, problem w zespole albo nowa okazja." },
    { question: "Czy mogę wybrać eksperta?", answer: "Tak. Eksperta dobieramy indywidualnie do Twojej sytuacji, ale jeśli chcesz pracować z kimś konkretnym, powiedz nam o tym na konsultacji." },
    oldFaq.find(f => f.question.startsWith("Czy wchodzicie")),
    { question: "Co dzieje się na konsultacji wstępnej?", answer: "Rozmawiamy online, przez około 60 minut. To Ty oceniasz, czy nasza praca jest dla Ciebie. Opowiadasz, z czym przychodzisz, zadajemy pytania i pokazujemy możliwy kierunek. Po rozmowie wiesz, który pakiet pasuje, ile to może potrwać i z kim będziesz pracować." },
    { question: "Ile kosztuje współpraca?", answer: "Orientacyjna inwestycja w cały proces to od 1 800 zł netto w Navigate, od 9 000 zł netto w Elevate i od 30 000 zł netto w Relevate. Dokładną kwotę ustalamy po bezpłatnej konsultacji, kiedy znamy zakres i długość współpracy." },
    oldFaq.find(f => f.question.startsWith("Wszystko"))
  ].filter(Boolean);
  c.modals.cooperation.eyebrow = "Dołącz do zespołu";
  c.modals.cooperation.title = "Porozmawiajmy o współpracy";
  c.modals.cooperation.lead = "Pracujesz jako coach, mentor albo trener i chcesz dołączyć do RelevateMe? Masz pomysł na wspólny projekt? Napisz kilka słów o sobie.";
  c.modals.cooperation.formEmail = "wspolpraca@relevateme.pl";
  c.modals.cooperation.fields.phone = "Telefon (opcjonalnie)";
  c.modals.cooperation.fields.linkedin = "LinkedIn (opcjonalnie)";
  c.modals.cooperation.fields.namePlaceholder = "Imię i nazwisko";
  c.modals.cooperation.fields.message = "O czym chcesz porozmawiać?";
  c.modals.cooperation.fields.messagePlaceholder = "Kim jesteś, w jakiej branży pracujesz i jaki masz pomysł";
  c.modals.cooperation.consent = c.contact.fields.consent;
  c.modals.privacy.sections.forEach(section => {
    section.text = section.text.replaceAll("kontakt@twojadomena.pl", "kontakt@relevateme.pl");
  });
  c.modals.privacy.sections[3] = {
    title: "Obsługa formularzy",
    text: "Formularze przesyłają dane do serwera strony, który wysyła zapytanie na nasz adres e-mail albo do eksperta wybranego w linku kontaktowym. Do zapytania możemy dołączyć oznaczenie źródła linku, np. LinkedIn / Featured. Te oznaczenia są przekazywane w URL-u, bez zapisywania ich w cookies lub localStorage. Nie otwieramy klienta pocztowego użytkownika."
  };
  c.modals.privacy.sections[4] = {
    title: "Zbiorcze statystyki korzystania ze strony",
    text: "Korzystamy z PostHog Cloud EU w trybie cookieless do zbiorczego pomiaru odsłon, źródeł wejścia, przewijania i kliknięć. Analityka nie zapisuje cookies ani identyfikatorów w localStorage lub sessionStorage. Nie nagrywamy wizyt, nie tworzymy profili osób i nie przesyłamy danych formularzy ani odpowiedzi ankiety. Dostawca przetwarza adres IP i informacje o przeglądarce do obliczenia dziennego hasha po stronie serwera; nie jest to gwarancja pełnej anonimowości. Respektujemy Do Not Track i Global Privacy Control."
  };
})();

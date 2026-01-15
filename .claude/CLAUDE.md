# Partner Recruiter - posrednik.app

## Opis projektu
Narzędzie do rekrutacji partnerów B2B dla serwisu oddłużeniowego. Składa się z dwóch trybów:
1. **Generator Mode** - panel dla managera do generowania linków zaproszeniowych
2. **Landing Mode** - strona dla potencjalnego partnera (pośrednika)

## Struktura plików
```
partner-recruiter/
├── index.html    # Główny plik HTML (Generator + Landing)
├── styles.css    # Style CSS - jasny motyw SaaS
├── app.js        # Logika JavaScript
└── .claude/
    └── CLAUDE.md # Ten plik
```

## Kluczowe sekcje Landing Page
- **Hero** - powitanie z imieniem partnera i zapraszającego
- **Problem** - opis problemów pośredników
- **Solution** - 5 usług oddłużeniowych (karuzela na mobile)
- **How it works** - 3 kroki współpracy
- **Commission** - tabela prowizji + progi (10-35%)
- **Calculator** - interaktywny kalkulator zarobków
- **Transparency** - gwarancje i zasady
- **CTA/Scheduler** - formularz umawiania spotkania

## URL Parameters (Landing)
- `n` - imię partnera (np. "Jan Kowalski")
- `p` - telefon partnera
- `e` - email partnera
- `z` - klucz zapraszającego (np. "Marcin")
- `zp` - telefon zapraszającego (nadpisuje CONFIG)
- `ze` - email zapraszającego
- `zr` - rola zapraszającego
- `zb` - bio zapraszającego
- `zph` - URL zdjęcia zapraszającego

## Zapraszający (Inviters)
- Przechowywani w `localStorage` pod kluczem `partnerRecruiterInviters`
- Zarządzanie przez panel Settings (ikona koła zębatego)
- Domyślni w `CONFIG.inviters`: Sławek, Marcin, Irek

## Scheduler
- Wybór metody kontaktu: telefon / video
- Wybór daty (7 dni, przewijanie)
- Wybór godziny (09:00 - 17:30)
- Spotkania zapisywane w `localStorage` pod `scheduledMeetings`

## Style CSS
- **Motyw:** Jasny SaaS (--bg-body: #f0f4f8)
- **Primary color:** #2563eb (niebieski)
- **Font:** Inter (Google Fonts)
- **Klasy dat:** `.date-item`, `.date-item.active`
- **Klasy czasu:** `.time-slot`, `.time-slot.active`
- **Summary:** `.scheduler-summary.ready`

## Ważne ID elementów
- `inviterName`, `partnerName` - w hero
- `calcClients`, `calcValue`, `calcTier` - kalkulator
- `ctaInviterName`, `ctaInviterPhone` - karta zapraszającego w scheduler

## Funkcje JavaScript
- `initGenerator()` - inicjalizacja panelu generatora
- `initLanding()` - inicjalizacja landing page
- `generateLink()` - generowanie linku zaproszeniowego
- `initSettings()` - panel ustawień zapraszających
- `displayInviterOnLanding()` - wypełnianie danych zapraszającego z URL

## Uwagi
- NIE używaj git w tym projekcie (brak repozytorium)
- Przed dużymi zmianami - zrób backup do osobnego folderu
- Oryginalna wersja (przed mobile) jest w: `partner-recruiter-original/`
- Landing page powinien działać zarówno na desktop jak i mobile

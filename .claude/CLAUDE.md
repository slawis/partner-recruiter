# Partner Recruiter - posrednik.app

## Opis projektu
Narzędzie do rekrutacji partnerów B2B dla serwisu oddłużeniowego. Składa się z dwóch trybów:
1. **Generator Mode** - panel dla managera do generowania linków zaproszeniowych + kalendarz spotkań
2. **Landing Mode** - strona dla potencjalnego partnera (pośrednika)

## Struktura plików
```
partner-recruiter/
├── index.html           # Główny plik HTML (Generator + Landing)
│
├── css/                 # Style CSS - modularny
│   ├── base.css         # Zmienne CSS, reset, scrollbar
│   ├── generator.css    # Style panelu generatora
│   ├── sidebar.css      # Style sidebar navigation
│   ├── landing.css      # Style landing page + mobile app
│   ├── scheduler.css    # Scheduler, modals, toast
│   ├── auth.css         # Login, settings, user management
│   └── responsive.css   # Media queries, layout switching
│
├── js/                  # Logika JavaScript - modularny
│   ├── config.js        # CONFIG, stałe, Supabase credentials
│   ├── utils.js         # Helpers: showToast, formatCurrency, DOM utils
│   ├── state.js         # AppState, detectMode(), loadState/saveState
│   ├── supabase.js      # Operacje bazodanowe (invitations, meetings)
│   ├── auth.js          # AuthState, login/logout, password reset
│   ├── users.js         # UsersState, zarządzanie użytkownikami (admin)
│   ├── generator.js     # Generator mode: historia, kalendarz, preview
│   ├── calculator.js    # Kalkulator prowizji, projekcje
│   ├── scheduler.js     # Scheduler spotkań (mobile + desktop)
│   ├── landing.js       # Landing page, personalizacja
│   ├── inviters.js      # InvitersState, zarządzanie zapraszającymi
│   ├── partners.js      # PartnersState, zarządzanie pośrednikami
│   ├── navigation.js    # Sidebar navigation, section switching
│   └── main.js          # Entry point, inicjalizacja
│
├── styles.css           # [LEGACY] Oryginalne style (backup)
├── app.js               # [LEGACY] Oryginalny kod (backup)
│
└── .claude/
    └── CLAUDE.md        # Ten plik
```

## Kolejność ładowania skryptów
```html
<!-- CSS -->
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/generator.css">
<link rel="stylesheet" href="css/sidebar.css">
<link rel="stylesheet" href="css/landing.css">
<link rel="stylesheet" href="css/scheduler.css">
<link rel="stylesheet" href="css/auth.css">
<link rel="stylesheet" href="css/responsive.css">

<!-- JS (kolejność ważna!) -->
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/state.js"></script>
<script src="js/supabase.js"></script>
<script src="js/auth.js"></script>
<script src="js/users.js"></script>
<script src="js/generator.js"></script>
<script src="js/calculator.js"></script>
<script src="js/scheduler.js"></script>
<script src="js/landing.js"></script>
<script src="js/inviters.js"></script>
<script src="js/partners.js"></script>
<script src="js/navigation.js"></script>
<script src="js/main.js"></script>
```

## Generator Mode - Sidebar Navigation

### Layout
Panel generatora używa sidebar navigation z sekcjami:

```
┌──────────────────────────────────────────────────────────┐
│  ⚡ Partner Recruiter                    [User] [Wyloguj]│
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│ 📊 Dashboard│    ZAWARTOŚĆ AKTYWNEJ SEKCJI               │
│             │                                            │
│ ✉️ Generator │                                            │
│             │                                            │
│ 📋 Historia │                                            │
│             │                                            │
│ 📅 Spotkania│                                            │
│             │                                            │
│ 👥 Pośred.  │                                            │
│             │                                            │
│ ─────────── │                                            │
│             │                                            │
│ 👥 Doradcy  │                                            │
│   (admin)   │                                            │
│             │                                            │
│ 👤 Użytk.   │                                            │
│   (admin)   │                                            │
│             │                                            │
└─────────────┴────────────────────────────────────────────┘
```

### Sekcje

| Sekcja | ID | Opis | Dostęp |
|--------|-----|------|--------|
| Dashboard | `section-dashboard` | Statystyki, ostatnie zaproszenia, spotkania | Wszyscy |
| Generator | `section-generator` | Formularz generowania zaproszeń + preview | Wszyscy |
| Historia | `section-historia` | Tabela wysłanych zaproszeń | Wszyscy |
| Spotkania | `section-spotkania` | Kalendarz umówionych spotkań | Wszyscy |
| Pośrednicy | `section-posrednicy` | Zarządzanie pośrednikami (partnerami) | Wszyscy |
| Doradcy | `section-doradcy` | Zarządzanie doradcami (karty) | Admin |
| Użytkownicy | `section-uzytkownicy` | Zarządzanie kontami użytkowników | Admin |

### Nawigacja (navigation.js)
- `initNavigation()` - inicjalizacja nawigacji
- `switchSection(sectionId)` - przełączanie sekcji
- `updateNavigationBadges()` - aktualizacja liczników w sidebar
- Aktywna sekcja zapisywana w `localStorage.activeSection`

### Kalendarz spotkań
- Statystyki: łączna liczba, nadchodzące w tym tygodniu, dziś
- Filtry: Wszystkie / Nadchodzące / Przeszłe
- Karty spotkań z datą, godziną, metodą kontaktu, danymi partnera
- Automatyczne czyszczenie duplikatów przy inicjalizacji

## Landing Page - Sekcje

- **Hero** - powitanie z imieniem partnera i zapraszającego (desktop: 2-kolumnowy layout)
- **Problem** - opis problemów pośredników
- **Solution** - 5 usług oddłużeniowych (karuzela na mobile)
- **How it works** - 3 kroki współpracy
- **Commission + Calculator** - interaktywny kalkulator z progami prowizji (10-35%)
- **Transparency** - warunki współpracy i zasady
- **CTA/Scheduler** - formularz umawiania spotkania

## URL Parameters (Landing)
- `id` - unikalne ID zaproszenia (do śledzenia)
- `n` - imię partnera (np. "Jan Kowalski")
- `p` - telefon partnera
- `e` - email partnera
- `z` - klucz zapraszającego (np. "Marcin")
- `zp` - telefon zapraszającego (nadpisuje CONFIG)
- `ze` - email zapraszającego
- `zr` - rola zapraszającego
- `zb` - bio zapraszającego
- `zph` - URL zdjęcia zapraszającego

## Supabase - Baza danych

### Konfiguracja
- **URL:** `https://rgcvncpmcmqskrybobbd.supabase.co`
- **Anon Key:** w pliku `js/config.js`

### Tabele
| Tabela | Opis |
|--------|------|
| `inviters` | Doradcy/zapraszający (id, key, name, role, phone, email, bio, photo_url) |
| `invitations` | Historia zaproszeń (id, inviter_key, partner_name, status, link, sent_at) |
| `meetings` | Umówione spotkania (id, invitation_id, partner_name, meeting_date, meeting_time, method) |
| `partners` | Pośrednicy (id, name, last_name, company, phone, email, status, inviter_key, invitations_count, meetings_count) |

### Funkcje Supabase
- `getSupabase()` - inicjalizacja klienta
- `loadInviters()` / `saveInviters()` - zarządzanie doradcami
- `saveInvitationToSupabase()` - zapis zaproszenia
- `trackOpening()` / `updateInvitationStatus()` - śledzenie statusów
- `getMeetings()` / `saveMeetingToSupabase()` - zarządzanie spotkaniami

### Fallback
Wszystkie funkcje mają fallback do localStorage - jeśli Supabase niedostępne, dane zapisują się lokalnie.

## localStorage Keys (backup)
- `recruiter_inviters` - lista zapraszających (doradców)
- `recruiter_history` - historia wygenerowanych zaproszeń
- `scheduledMeetings` - umówione spotkania (wspólne dla landing i kalendarza)

## Scheduler - Umawianie spotkań

### Funkcjonalność
- Wybór metody kontaktu: telefon / video
- Wybór daty (przewijanie, pomijanie weekendów)
- Wybór godziny (09:00 - 17:30)

### Wykrywanie istniejących spotkań
- Przy otwarciu schedulera sprawdza czy partner ma już spotkanie
- Wyświetla baner "Masz już umówione spotkanie" z datą
- Przy zapisie nadpisuje istniejące spotkanie (to samo ID)
- Szuka po `invitationId` lub kombinacji: imię + telefon + doradca

### Stan "Spotkanie umówione"
- **Mobile**: Dolna belka zmienia tekst na datę spotkania, przycisk "Zmień"
- **Desktop**: Panel potwierdzenia z przyciskiem "Zmień termin"

## Struktura danych - Meeting
```javascript
{
  id: 'meeting_123456789_abc',
  partnerName: 'Jan Kowalski',
  partnerPhone: '123456789',
  partnerEmail: 'jan@example.com',
  date: '2026-01-21',
  time: '13:00',
  method: 'phone', // lub 'video'
  inviterName: 'Sławek',
  invitationId: 'inv_abc123',
  scheduledAt: '2026-01-16T10:00:00.000Z'
}
```

## Kluczowe funkcje JavaScript (wg modułów)

### config.js
- `CONFIG` - obiekt konfiguracji (baseUrl, inviters, emailStyles)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - dane dostępowe

### utils.js
- `showToast()` - powiadomienia toast
- `formatCurrency()` / `formatCurrencyShort()` - formatowanie walut
- `setTextContent()`, `setupContactLink()`, `toggleDetailRow()` - DOM helpers

### state.js
- `AppState` - globalny stan aplikacji
- `detectMode()` - wykrywanie trybu (generator/landing)
- `loadState()` / `saveState()` - persystencja stanu

### auth.js
- `AuthState` - stan autentykacji
- `initAuth()` - sprawdzenie sesji
- `handleLogin()` / `handleLogout()` - logowanie/wylogowanie
- `initPasswordReset()` - reset hasła

### users.js (admin)
- `UsersState` - stan zarządzania użytkownikami
- `loadUsers()` / `renderUsersList()` - lista użytkowników
- `handleAddUser()` / `handleEditUser()` / `deleteUser()` - CRUD

### generator.js
- `initGenerator()` - inicjalizacja panelu
- `initDashboardTabs()` - przełączanie zakładek
- `initCalendar()` / `renderMeetings()` - kalendarz spotkań
- `generateLink()` - generowanie linku zaproszeniowego
- `renderHistory()` - historia zaproszeń

### scheduler.js
- `initMeetingScheduler()` - inicjalizacja schedulera
- `initBottomSheet()` - mobile bottom sheet
- `handleMobileScheduleSubmit()` / `handleDesktopScheduleSubmit()` - zapis
- `getExistingMeetingForInvitation()` - szukanie istniejącego spotkania

### landing.js
- `initLanding()` - inicjalizacja landing page
- `personalizeContent()` - personalizacja treści
- `populatePartnerBusinessCard()` - karta partnera

### calculator.js
- `initCalculator()` - kalkulator prowizji
- `updateProjectionChart()` - wykres projekcji
- `initMobileCalculator()` / `initDesktopCalculator()` - wersje

### inviters.js
- `InvitersState` - stan zapraszających
- `loadInviters()` / `saveInviters()` - persystencja
- `handleAddInviter()` / `handleEditInviter()` / `deleteInviter()` - CRUD
- `renderInvitersList()` / `updateInviterSelect()` - UI

### partners.js
- `PartnersState` - stan pośredników
- `loadPartners()` - ładowanie z Supabase
- `savePartner()` - zapis/aktualizacja
- `findOrCreatePartner()` - szuka lub tworzy partnera przy zaproszeniu
- `findPartnerByPhone()` / `findPartnerByEmail()` / `findPartnerByName()` - szukanie
- `updatePartnerMeetingsCount()` - aktualizacja licznika spotkań
- `changePartnerStatus()` - zmiana statusu (lead, contacted, meeting, converted, rejected)
- `addPartnerNote()` - dodanie notatki
- `renderPartnersSection()` - renderowanie listy pośredników
- `renderPartnerCard()` - renderowanie pojedynczej karty

### navigation.js
- `NavigationState` - stan nawigacji (currentSection, sidebarOpen)
- `initNavigation()` - inicjalizacja nawigacji sidebar
- `switchSection(sectionId)` - przełączanie sekcji
- `updateNavigationBadges()` - aktualizacja liczników w sidebar
- `renderDoradcySection()` - renderowanie sekcji Doradcy
- `renderDashboardWidgets()` - renderowanie widgetów Dashboard
- Mobile menu: `toggleMobileSidebar()`, `openMobileSidebar()`, `closeMobileSidebar()`

### main.js
- Entry point - inicjalizacja aplikacji na DOMContentLoaded
- `initGeneratorWithSettings()` - pełna inicjalizacja generatora
- `updateSidebarUserInfo()` - aktualizacja danych użytkownika w sidebar

## Style CSS - Klasy

### Główne
- **Primary gradient:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Motyw:** Jasny SaaS (--bg-body: #f0f4f8)
- **Font:** Inter (Google Fonts)

### Sidebar (sidebar.css)
- `.app-layout` - główny kontener flex
- `.app-sidebar` - sidebar (width: 260px, fixed)
- `.sidebar-header`, `.sidebar-footer` - nagłówek i stopka sidebar
- `.sidebar-nav` - nawigacja
- `.nav-section`, `.nav-item`, `.nav-item.active` - sekcje i elementy nawigacji
- `.nav-item-badge` - licznik przy elemencie nawigacji
- `.app-main` - główny obszar treści (margin-left: 260px)
- `.app-topbar` - górny pasek z tytułem sekcji
- `.app-section`, `.app-section.active` - sekcje treści
- `.dashboard-stats-grid`, `.dashboard-stat-card` - siatka statystyk dashboard
- `.dashboard-widget` - widget dashboard
- `.doradcy-grid`, `.doradca-card` - siatka i karty doradców
- `.users-table-wrapper`, `.users-table` - tabela użytkowników
- Mobile: `.sidebar-overlay`, `.mobile-menu-btn`

### Scheduler
- `.date-item`, `.date-item.active` - elementy daty
- `.time-slot`, `.time-slot.active` - sloty czasowe
- `.existing-meeting-banner` - baner istniejącego spotkania
- `.meeting-confirmed-panel` - panel potwierdzenia (desktop)
- `.app-bottom-bar.confirmed` - stan potwierdzenia (mobile)

### Kalendarz
- `.meeting-card` - karta spotkania
- `.cal-stat` - statystyki

## Uwagi
- Projekt używa Git - repozytorium: https://github.com/slawis/partner-recruiter
- Dane synchronizują się przez Supabase między urządzeniami
- localStorage służy jako backup gdy Supabase niedostępne
- Landing page działa zarówno na desktop jak i mobile (responsive)

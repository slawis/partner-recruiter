/* ========================================
   PARTNER RECRUITER - CONFIGURATION
   Stałe, konfiguracja aplikacji
   ======================================== */

// ============ CONFIGURATION ============
const CONFIG = {
    baseUrl: window.location.origin + window.location.pathname,
    inviters: {
        'Sławek': { name: 'Sławomir Wiśniewski', role: 'Właściciel', phone: '', email: '' },
        'slawomir': { name: 'Sławomir Wiśniewski', role: 'Partner Manager', phone: '+48 123 456 789', email: '' },
        'Marcin': { name: 'Marcin Górecki', role: 'Manager', phone: '606 285 419', email: '' },
        'Irek': { name: 'Irek Lewandowski', role: 'Manager', phone: '533 210 540', email: '' }
    },
    emailStyles: {
        direct: {
            name: 'Bezpośredni',
            subject: 'Propozycja współpracy - dodatkowy dochód',
            template: (data) => `Cześć ${data.partnerName}!

Tu ${data.inviterName}. Krótko i na temat: mam propozycję współpracy dla pośredników finansowych.

Co oferuję?
• 10-35% prowizji od klientów, których i tak tracisz (odmowy kredytowe, zadłużeni)
• Zero dodatkowej pracy - przekazujesz kontakt, resztę robimy my
• Wypłata co 14 dni, pełna transparentność

Obsługujemy oddłużanie: ugody z wierzycielami, upadłość konsumencką, ochronę majątku.

Szczegóły i kalkulator zarobków tutaj:
${data.link}

Jeśli masz 2 minuty - zerknij. Jak Ci to pasuje, odezwij się.

${data.inviterName}
posrednik.app`
        },
        warm: {
            name: 'Relacyjny',
            subject: 'Hej, mam coś dla Ciebie',
            template: (data) => `Hej ${data.partnerName}!

Dawno się nie odzywałem. Mam nadzieję, że u Ciebie wszystko OK.

Pracuję teraz nad projektem, który może Cię zainteresować - chodzi o dodatkowy dochód z klientów "odrzutów". Wiesz, tych co przychodzą po kredyt, a bank odmawia przez BIK czy zadłużenie.

Zamiast ich tracić - można na nich zarobić. 10-35% prowizji za przekazanie kontaktu, resztę robimy my (oddłużanie).

Przygotowałem dla Ciebie stronę ze szczegółami:
${data.link}

Jak znajdziesz chwilę - zerknij i daj znać co myślisz. Chętnie opowiem więcej.

Pozdrawiam,
${data.inviterName}`
        },
        curiosity: {
            name: 'Ciekawość',
            subject: 'Szybkie pytanie',
            template: (data) => `${data.partnerName}, szybkie pytanie:

Co robisz z klientami, którym bank odmówił kredytu?

Jeśli nic - tracisz pieniądze. Dosłownie.

Mam rozwiązanie: przekazujesz kontakt do osoby zadłużonej → my zajmujemy się oddłużaniem → Ty dostajesz 10-35% prowizji.

5 minut Twojej pracy = 500-6000 zł.

Szczegóły:
${data.link}

${data.inviterName}
posrednik.app`
        }
    }
};

// ============ SUPABASE CONFIG ============
const SUPABASE_URL = 'https://rgcvncpmcmqskrybobbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY3ZuY3BtY21xc2tyeWJvYmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MjYzODgsImV4cCI6MjA4NDIwMjM4OH0.f-FK_pgCqb0Yx_xRXsN1cxdmOVeVA3ECIEurIFtvJJA';

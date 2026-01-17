/* ========================================
   PARTNER RECRUITER - APPLICATION
   Generator + Landing Page Logic
   ======================================== */

// ============ CONFIGURATION ============
const CONFIG = {
    baseUrl: window.location.origin + window.location.pathname,
    inviters: {
        'Sławek': { name: 'Sławomir Wiśniewski', role: 'Właściciel', phone: '', email: '' },
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

// Inicjalizacja klienta Supabase
let supabaseClient = null;
function getSupabase() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// ============ STATE ============
let AppState = {
    mode: 'generator', // 'generator' or 'landing'
    currentInvitation: null,
    history: [],
    stats: {
        sent: 0,
        opened: 0,
        converted: 0
    },
    landingParams: {
        partnerName: null,
        partnerLastName: null,
        partnerCompany: null,
        partnerNIP: null,
        partnerPhone: null,
        partnerEmail: null,
        partnerAddress: null,
        inviterName: null,
        invitationId: null
    }
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    detectMode();
    await loadState();

    if (AppState.mode === 'generator') {
        await initGenerator();
    } else {
        initLanding();
    }
});

function detectMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasLandingParams = urlParams.has('n') || urlParams.has('z');

    if (hasLandingParams) {
        AppState.mode = 'landing';

        // Pobierz dane partnera
        const partnerName = urlParams.get('n') || '';
        const partnerLastName = urlParams.get('ln') || '';
        const partnerCompany = urlParams.get('c') || '';

        // Pobierz dane zapraszającego
        const inviterKey = urlParams.get('z') || '';
        const inviterFullName = urlParams.get('zn') || ''; // Pełne imię z URL
        const inviterRole = urlParams.get('zr') || '';
        const inviterPhone = urlParams.get('zp') || '';
        const inviterEmail = urlParams.get('ze') || '';
        const inviterBio = urlParams.get('zb') || '';
        const inviterPhoto = urlParams.get('zph') || '';

        // Fallback do CONFIG jeśli brak w URL
        const configInviter = CONFIG.inviters[inviterKey] || {};

        AppState.landingParams = {
            // Partner
            partnerName: partnerName,
            partnerLastName: partnerLastName,
            partnerFullName: partnerLastName ? `${partnerName} ${partnerLastName}` : partnerName,
            partnerCompany: partnerCompany,
            partnerNIP: urlParams.get('nip') || '',
            partnerPhone: urlParams.get('p') || '',
            partnerEmail: urlParams.get('e') || '',
            partnerAddress: urlParams.get('a') || '',

            // Zapraszający - priorytet: URL > CONFIG > domyślne
            inviterKey: inviterKey,
            inviterName: inviterFullName || configInviter.name || inviterKey || 'Twój doradca',
            inviterRole: inviterRole || configInviter.role || '',
            inviterPhone: inviterPhone || configInviter.phone || '',
            inviterEmail: inviterEmail || configInviter.email || '',
            inviterBio: inviterBio || configInviter.bio || '',
            inviterPhoto: inviterPhoto || configInviter.photo || '',

            invitationId: urlParams.get('id') || null
        };

        document.getElementById('generatorMode').style.display = 'none';
        document.getElementById('landingMode').style.display = 'block';

        // Track opening
        if (AppState.landingParams.invitationId) {
            trackOpening(AppState.landingParams.invitationId);
        }
    } else {
        AppState.mode = 'generator';
        document.getElementById('generatorMode').style.display = 'block';
        document.getElementById('landingMode').style.display = 'none';
    }
}

async function loadState() {
    const sb = getSupabase();

    if (sb) {
        try {
            // Załaduj invitations z Supabase
            const { data: invitations, error: invError } = await sb
                .from('invitations')
                .select('*')
                .order('sent_at', { ascending: false });

            if (invError) throw invError;

            if (invitations && invitations.length > 0) {
                // Mapuj dane z Supabase na format aplikacji
                AppState.history = invitations.map(inv => ({
                    id: inv.id,
                    partnerName: inv.partner_name,
                    partnerPhone: inv.partner_phone || '',
                    partnerEmail: inv.partner_email || '',
                    inviterKey: inv.inviter_key,
                    status: inv.status,
                    link: inv.link || '',
                    sentAt: inv.sent_at,
                    openedAt: inv.opened_at,
                    registeredAt: inv.registered_at
                }));

                // Oblicz statystyki
                AppState.stats = {
                    sent: invitations.length,
                    opened: invitations.filter(i => i.status === 'opened' || i.status === 'registered').length,
                    converted: invitations.filter(i => i.status === 'registered').length
                };
                console.log('Invitations loaded from Supabase:', AppState.history.length);
                return;
            }
        } catch (err) {
            console.error('Error loading invitations from Supabase:', err);
        }
    }

    // Fallback: localStorage
    const savedHistory = localStorage.getItem('recruiter_history');
    const savedStats = localStorage.getItem('recruiter_stats');

    if (savedHistory) {
        AppState.history = JSON.parse(savedHistory);
    }
    if (savedStats) {
        AppState.stats = JSON.parse(savedStats);
    }
}

async function saveState() {
    // Zawsze zapisz do localStorage jako backup
    localStorage.setItem('recruiter_history', JSON.stringify(AppState.history));
    localStorage.setItem('recruiter_stats', JSON.stringify(AppState.stats));
}

async function saveInvitationToSupabase(invitation) {
    const sb = getSupabase();
    if (!sb) return;

    try {
        const { error } = await sb
            .from('invitations')
            .upsert({
                id: invitation.id,
                inviter_key: invitation.inviterKey,
                partner_name: invitation.partnerName,
                partner_phone: invitation.partnerPhone || '',
                partner_email: invitation.partnerEmail || '',
                status: invitation.status || 'sent',
                link: invitation.link || '',
                sent_at: invitation.sentAt || new Date().toISOString(),
                opened_at: invitation.openedAt || null,
                registered_at: invitation.registeredAt || null
            }, { onConflict: 'id' });

        if (error) throw error;
        console.log('Invitation saved to Supabase:', invitation.id);
    } catch (err) {
        console.error('Error saving invitation to Supabase:', err);
    }
}

// ============ GENERATOR MODE ============
async function initGenerator() {
    // Update stats display
    updateStatsDisplay();

    // Render history
    renderHistory();

    // Initialize invitation selection (checkboxes)
    initInvitationSelection();

    // Initialize dashboard tabs
    initDashboardTabs();

    // Initialize calendar
    await initCalendar();

    // Style selector
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            styleOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            updateEmailPreview();
        });
    });

    // Form inputs - live preview
    const inputs = document.querySelectorAll('#generatorForm input, #generatorForm select');
    inputs.forEach(input => {
        input.addEventListener('input', updateEmailPreview);
    });

    // Form submit
    const generatorForm = document.getElementById('generatorForm');
    if (generatorForm) generatorForm.addEventListener('submit', handleGenerateInvitation);

    // Preview tabs
    const tabs = document.querySelectorAll('.preview-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchPreviewTab(tabId);
        });
    });

    // Copy buttons
    const btnCopyEmail = document.getElementById('btnCopyEmail');
    const btnCopyLink = document.getElementById('btnCopyLink');
    const btnOpenPreview = document.getElementById('btnOpenPreview');
    const btnClearHistory = document.getElementById('btnClearHistory');

    if (btnCopyEmail) btnCopyEmail.addEventListener('click', copyEmail);
    if (btnCopyLink) btnCopyLink.addEventListener('click', copyLink);
    if (btnOpenPreview) btnOpenPreview.addEventListener('click', openPreview);
    if (btnClearHistory) btnClearHistory.addEventListener('click', clearHistory);
}

// ============ DASHBOARD TABS ============
function initDashboardTabs() {
    const tabs = document.querySelectorAll('.dashboard-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;

            // Update tab buttons
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update tab content
            document.querySelectorAll('.dashboard-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const targetContent = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
            if (targetContent) targetContent.classList.add('active');
        });
    });
}

// ============ CALENDAR ============
let calendarFilter = 'all';

async function cleanupDuplicateMeetings() {
    const meetings = await getMeetings();
    if (meetings.length === 0) return;

    const seen = new Map();
    const cleaned = [];

    // Keep only the most recent meeting for each partner+inviter combination
    // Sort by scheduledAt descending so we keep the newest
    meetings.sort((a, b) => new Date(b.scheduledAt || 0) - new Date(a.scheduledAt || 0));

    meetings.forEach(meeting => {
        // Create a unique key based on invitationId or partner+inviter combination
        let key;
        if (meeting.invitationId) {
            key = `id:${meeting.invitationId}`;
        } else {
            key = `partner:${meeting.partnerName}|${meeting.partnerPhone || ''}|${meeting.inviterName || ''}`;
        }

        if (!seen.has(key)) {
            seen.set(key, true);
            cleaned.push(meeting);
        }
    });

    // Only save if we removed duplicates
    if (cleaned.length < meetings.length) {
        console.log(`Cleaned ${meetings.length - cleaned.length} duplicate meetings`);
        saveMeetings(cleaned);
    }
}

async function initCalendar() {
    // Cleanup duplicates on init
    await cleanupDuplicateMeetings();

    // Initialize filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calendarFilter = btn.dataset.filter;
            await renderMeetings();
        });
    });

    // Load and render meetings
    await renderMeetings();
    await updateCalendarStats();
    await updateBadgeCounts();
}

async function getMeetings() {
    const sb = getSupabase();

    // Zawsze najpierw pobierz z localStorage
    const saved = localStorage.getItem('scheduledMeetings');
    const localMeetings = saved ? JSON.parse(saved) : [];

    if (sb) {
        try {
            const { data, error } = await sb
                .from('meetings')
                .select('*')
                .order('meeting_date', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Mapuj dane z Supabase na format aplikacji
                const supabaseMeetings = data.map(m => ({
                    id: m.id,
                    localId: m.local_id,
                    invitationId: m.invitation_id,
                    inviterKey: m.inviter_key,
                    inviterName: m.inviter_key,
                    partnerName: m.partner_name,
                    partnerPhone: m.partner_phone || '',
                    partnerEmail: m.partner_email || '',
                    date: m.meeting_date,
                    time: m.meeting_time,
                    method: m.method,
                    scheduledAt: m.scheduled_at
                }));

                // Połącz dane z Supabase i localStorage (usuń duplikaty)
                const allMeetings = [...supabaseMeetings];
                localMeetings.forEach(local => {
                    const existsInSupabase = supabaseMeetings.some(s =>
                        s.localId === local.id ||
                        (s.partnerName === local.partnerName && s.date === local.date && s.time === local.time)
                    );
                    if (!existsInSupabase) {
                        allMeetings.push(local);
                    }
                });

                console.log('Meetings loaded from Supabase:', supabaseMeetings.length, '+ localStorage:', localMeetings.length);
                return allMeetings;
            }
        } catch (err) {
            console.error('Error loading meetings from Supabase:', err);
        }
    }

    // Fallback: tylko localStorage
    console.log('Meetings loaded from localStorage:', localMeetings.length);
    return localMeetings;
}

function getMeetingsSync() {
    // Synchroniczna wersja dla kompatybilności
    const saved = localStorage.getItem('scheduledMeetings');
    return saved ? JSON.parse(saved) : [];
}

async function saveMeetings(meetings) {
    // Zawsze zapisz do localStorage jako backup
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));
}

async function saveMeetingToSupabase(meeting) {
    const sb = getSupabase();
    if (!sb) return;

    try {
        // Nie wysyłamy 'id' - Supabase wygeneruje UUID
        // Nasz lokalny ID przechowujemy w 'local_id'
        const { data, error } = await sb
            .from('meetings')
            .insert({
                local_id: meeting.id, // Nasz lokalny ID jako tekst
                invitation_id: meeting.invitationId || null,
                inviter_key: meeting.inviterKey || meeting.inviterName || '',
                partner_name: meeting.partnerName,
                partner_phone: meeting.partnerPhone || '',
                partner_email: meeting.partnerEmail || '',
                meeting_date: meeting.date,
                meeting_time: meeting.time,
                method: meeting.method,
                scheduled_at: meeting.scheduledAt || new Date().toISOString()
            })
            .select();

        if (error) throw error;
        console.log('Meeting saved to Supabase:', meeting.id, '→', data?.[0]?.id);
    } catch (err) {
        console.error('Error saving meeting to Supabase:', err);
    }
}

async function renderMeetings() {
    const container = document.getElementById('meetingsList');
    if (!container) return;

    let meetings = await getMeetings();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date (newest first)
    meetings.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    // Apply filter
    if (calendarFilter === 'upcoming') {
        meetings = meetings.filter(m => new Date(m.date) >= today);
    } else if (calendarFilter === 'past') {
        meetings = meetings.filter(m => new Date(m.date) < today);
    }

    if (meetings.length === 0) {
        container.innerHTML = `
            <div class="meetings-empty">
                <span class="empty-icon">📅</span>
                <p>Brak ${calendarFilter === 'past' ? 'przeszłych' : calendarFilter === 'upcoming' ? 'nadchodzących' : 'umówionych'} spotkań</p>
                <small>Spotkania pojawią się tutaj, gdy partnerzy umówią rozmowę</small>
            </div>
        `;
        return;
    }

    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    let html = '';

    meetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        const isToday = meetingDate.toDateString() === today.toDateString();
        const isPast = meetingDate < today;

        const day = meetingDate.getDate();
        const month = monthNames[meetingDate.getMonth()];
        const weekday = dayNames[meetingDate.getDay()].substring(0, 3);

        const cardClass = isPast ? 'past' : isToday ? 'today' : '';
        const methodClass = meeting.method === 'phone' ? 'phone' : 'video';
        const methodIcon = meeting.method === 'phone' ? '📞' : '🎥';
        const methodText = meeting.method === 'phone' ? 'Telefon' : 'Video';

        html += `
            <div class="meeting-card ${cardClass}" data-id="${meeting.id}">
                <div class="meeting-date-block">
                    <span class="mdb-day">${day}</span>
                    <span class="mdb-month">${month}</span>
                    <span class="mdb-weekday">${weekday}</span>
                </div>
                <div class="meeting-info">
                    <h4 class="meeting-partner-name">${meeting.partnerName || 'Partner'}</h4>
                    <div class="meeting-details">
                        <span class="meeting-detail">
                            <span class="meeting-detail-icon">🕐</span>
                            ${meeting.time}
                        </span>
                        ${meeting.partnerPhone ? `
                        <span class="meeting-detail">
                            <span class="meeting-detail-icon">📱</span>
                            ${meeting.partnerPhone}
                        </span>
                        ` : ''}
                        ${meeting.inviterName ? `
                        <span class="meeting-detail">
                            <span class="meeting-detail-icon">👤</span>
                            ${meeting.inviterName}
                        </span>
                        ` : ''}
                    </div>
                </div>
                <div class="meeting-method ${methodClass}">
                    <span class="meeting-method-icon">${methodIcon}</span>
                    ${methodText}
                </div>
                <div class="meeting-actions">
                    <button class="meeting-action-btn delete" onclick="deleteMeeting('${meeting.id}')" title="Usuń">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function updateCalendarStats() {
    const meetings = await getMeetings();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const todayMeetings = meetings.filter(m => {
        const d = new Date(m.date);
        return d.toDateString() === today.toDateString();
    }).length;

    const weekMeetings = meetings.filter(m => {
        const d = new Date(m.date);
        return d >= today && d < endOfWeek;
    }).length;

    const totalMeetings = meetings.length;

    const statToday = document.getElementById('statTodayMeetings');
    const statWeek = document.getElementById('statWeekMeetings');
    const statTotal = document.getElementById('statTotalMeetings');

    if (statToday) statToday.textContent = todayMeetings;
    if (statWeek) statWeek.textContent = weekMeetings;
    if (statTotal) statTotal.textContent = totalMeetings;
}

async function updateBadgeCounts() {
    const meetings = await getMeetings();
    const history = AppState.history || [];

    const historyCount = document.getElementById('historyCount');
    const meetingsCount = document.getElementById('meetingsCount');

    if (historyCount) historyCount.textContent = history.length;
    if (meetingsCount) meetingsCount.textContent = meetings.length;
}

async function deleteMeeting(meetingId) {
    if (!confirm('Czy na pewno chcesz usunąć to spotkanie?')) return;

    // Usuń z Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            const { error } = await sb
                .from('meetings')
                .delete()
                .eq('id', meetingId);
            if (error) console.error('Error deleting meeting from Supabase:', error);
        } catch (err) {
            console.error('Error deleting meeting from Supabase:', err);
        }
    }

    // Usuń z localStorage
    let meetings = await getMeetings();
    meetings = meetings.filter(m => m.id !== meetingId);
    await saveMeetings(meetings);

    await renderMeetings();
    await updateCalendarStats();
    await updateBadgeCounts();
    showToast('Spotkanie usunięte', 'success');
}

function updateStatsDisplay() {
    const statSent = document.getElementById('statSent');
    const statOpened = document.getElementById('statOpened');
    const statConverted = document.getElementById('statConverted');

    if (statSent) statSent.textContent = AppState.stats.sent;
    if (statOpened) statOpened.textContent = AppState.stats.opened;
    if (statConverted) statConverted.textContent = AppState.stats.converted;
}

function updateEmailPreview() {
    const partnerName = document.getElementById('partnerName').value || '[Imię]';
    const inviterSelect = document.getElementById('inviterSelect');
    const inviterName = inviterSelect.value || '[Zapraszający]';
    const style = document.querySelector('input[name="emailStyle"]:checked')?.value || 'direct';

    if (!partnerName || !inviterName || inviterName === '') {
        return;
    }

    const styleConfig = CONFIG.emailStyles[style];
    const previewLink = '[LINK ZOSTANIE WYGENEROWANY]';

    const emailContent = styleConfig.template({
        partnerName,
        inviterName: CONFIG.inviters[inviterName]?.name || inviterName,
        link: previewLink
    });

    document.getElementById('emailSubject').textContent = styleConfig.subject;
    document.getElementById('emailBody').innerHTML = formatEmailForDisplay(emailContent);
}

function formatEmailForDisplay(text) {
    return text
        .split('\n')
        .map(line => {
            if (line.startsWith('•')) {
                return `<p style="padding-left: 20px;">${line}</p>`;
            }
            if (line.trim() === '') {
                return '<br>';
            }
            return `<p>${line}</p>`;
        })
        .join('');
}

function handleGenerateInvitation(e) {
    e.preventDefault();
    console.log('handleGenerateInvitation called');

    const partnerNameEl = document.getElementById('partnerName');
    const inviterSelectEl = document.getElementById('inviterSelect');
    const styleEl = document.querySelector('input[name="emailStyle"]:checked');

    console.log('partnerNameEl:', partnerNameEl);
    console.log('inviterSelectEl:', inviterSelectEl);
    console.log('styleEl:', styleEl);

    if (!partnerNameEl || !inviterSelectEl || !styleEl) {
        console.error('Missing form elements');
        showToast('Błąd formularza', 'error');
        return;
    }

    const partnerName = partnerNameEl.value.trim();
    const partnerLastName = (document.getElementById('partnerLastName')?.value || '').trim();
    const partnerCompany = (document.getElementById('partnerCompany')?.value || '').trim();
    const partnerNIP = (document.getElementById('partnerNIP')?.value || '').trim();
    const partnerPhone = (document.getElementById('partnerPhone')?.value || '').trim();
    const partnerEmail = (document.getElementById('partnerEmail')?.value || '').trim();
    const partnerAddress = (document.getElementById('partnerAddress')?.value || '').trim();
    const inviterKey = inviterSelectEl.value;
    const style = styleEl.value;

    console.log('partnerName:', partnerName);
    console.log('inviterKey:', inviterKey);
    console.log('style:', style);

    if (!partnerName || !inviterKey) {
        showToast('Wypełnij wymagane pola', 'error');
        console.log('Validation failed: partnerName or inviterKey empty');
        return;
    }

    // Sprawdź czy już istnieje zaproszenie dla tego partnera (ten sam telefon lub email)
    const existingInvitation = AppState.history.find(inv => {
        // Sprawdź po telefonie (jeśli podany)
        if (partnerPhone && inv.partnerPhone === partnerPhone) return true;
        // Sprawdź po emailu (jeśli podany)
        if (partnerEmail && inv.partnerEmail === partnerEmail) return true;
        // Sprawdź po imieniu + nazwisku u tego samego zapraszającego
        const fullName = partnerLastName ? `${partnerName} ${partnerLastName}` : partnerName;
        const invFullName = inv.partnerLastName ? `${inv.partnerName} ${inv.partnerLastName}` : inv.partnerName;
        if (fullName === invFullName && inv.inviterKey === inviterKey) return true;
        return false;
    });

    if (existingInvitation) {
        const confirmDuplicate = confirm(
            `Zaproszenie dla "${partnerName}" już istnieje (status: ${existingInvitation.status}).\n\n` +
            `Czy na pewno chcesz utworzyć kolejne zaproszenie?`
        );
        if (!confirmDuplicate) {
            return;
        }
    }

    // Generate unique ID
    const invitationId = generateId();

    // Prepare partner data for link
    const partnerData = {
        name: partnerName,
        lastName: partnerLastName,
        company: partnerCompany,
        nip: partnerNIP,
        phone: partnerPhone,
        email: partnerEmail,
        address: partnerAddress
    };

    // Generate link
    const link = generateLink(partnerData, inviterKey, invitationId);

    // Get email content
    const styleConfig = CONFIG.emailStyles[style];

    // Find inviter from InvitersState first, fallback to CONFIG
    const inviterFromState = InvitersState.inviters.find(inv => inv.key === inviterKey);
    const inviterInfo = inviterFromState || CONFIG.inviters[inviterKey] || { name: inviterKey };

    console.log('inviterFromState:', inviterFromState);
    console.log('inviterInfo:', inviterInfo);

    const emailContent = styleConfig.template({
        partnerName,
        inviterName: inviterInfo.name,
        link
    });

    // Store current invitation
    AppState.currentInvitation = {
        id: invitationId,
        partnerName,
        partnerLastName,
        partnerCompany,
        partnerNIP,
        partnerPhone,
        partnerEmail,
        partnerAddress,
        inviterKey,
        inviterName: inviterInfo.name,
        style,
        styleName: styleConfig.name,
        subject: styleConfig.subject,
        emailContent,
        link,
        createdAt: new Date().toISOString(),
        status: 'sent'
    };

    // Add to history
    AppState.history.unshift(AppState.currentInvitation);
    AppState.stats.sent++;
    saveState();

    // Zapisz do Supabase
    saveInvitationToSupabase({
        id: invitationId,
        partnerName,
        partnerPhone,
        partnerEmail,
        inviterKey,
        status: 'sent',
        link,
        sentAt: new Date().toISOString()
    });

    // Update UI
    updateStatsDisplay();
    renderHistory();

    // Update preview
    document.getElementById('emailBody').innerHTML = formatEmailForDisplay(emailContent);
    document.getElementById('generatedLink').innerHTML = `<a href="${link}" target="_blank" style="color: var(--accent-info); word-break: break-all;">${link}</a>`;

    // Enable buttons
    document.getElementById('btnCopyEmail').disabled = false;
    document.getElementById('btnCopyLink').disabled = false;
    document.getElementById('btnOpenPreview').disabled = false;

    // Update preview frame
    const previewFrame = document.querySelector('.preview-frame');
    const fullName = partnerLastName ? `${partnerName} ${partnerLastName}` : partnerName;
    previewFrame.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <span style="font-size: 48px; display: block; margin-bottom: 16px;">✅</span>
            <p style="color: var(--text-primary); font-size: 16px; margin-bottom: 8px;">Zaproszenie wygenerowane!</p>
            <p style="color: var(--text-secondary); font-size: 14px;">Dla: <strong>${fullName}</strong></p>
            ${partnerCompany ? `<p style="color: var(--text-muted); font-size: 13px;">${partnerCompany}</p>` : ''}
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 16px;">Kliknij "Otwórz stronę" aby zobaczyć podgląd</p>
        </div>
    `;

    showToast('Zaproszenie wygenerowane!', 'success');

    // Reset formularza po wygenerowaniu (żeby uniknąć duplikatów)
    document.getElementById('generatorForm').reset();

    // Switch to email tab
    switchPreviewTab('email');
}

function generateId() {
    return 'inv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateLink(partnerData, inviterKey, invitationId) {
    const params = new URLSearchParams({
        n: partnerData.name,
        z: inviterKey,
        id: invitationId
    });

    // Add optional fields only if they have values
    if (partnerData.lastName) params.set('ln', partnerData.lastName);
    if (partnerData.company) params.set('c', partnerData.company);
    if (partnerData.nip) params.set('nip', partnerData.nip);
    if (partnerData.phone) params.set('p', partnerData.phone);
    if (partnerData.email) params.set('e', partnerData.email);
    if (partnerData.address) params.set('a', partnerData.address);

    return `${CONFIG.baseUrl}?${params.toString()}`;
}

function switchPreviewTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.preview-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.preview-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    });
}

function copyEmail() {
    if (!AppState.currentInvitation) return;

    const textToCopy = `Temat: ${AppState.currentInvitation.subject}\n\n${AppState.currentInvitation.emailContent.replace(/<[^>]*>/g, '')}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Email skopiowany!', 'success');
    }).catch(() => {
        showToast('Błąd kopiowania', 'error');
    });
}

function copyLink() {
    if (!AppState.currentInvitation) return;

    navigator.clipboard.writeText(AppState.currentInvitation.link).then(() => {
        showToast('Link skopiowany!', 'success');
    }).catch(() => {
        showToast('Błąd kopiowania', 'error');
    });
}

function openPreview() {
    if (!AppState.currentInvitation) return;
    window.open(AppState.currentInvitation.link, '_blank');
}

function renderHistory() {
    const tbody = document.getElementById('historyBody');
    const selectAllCheckbox = document.getElementById('selectAllInvitations');

    if (AppState.history.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Brak wysłanych zaproszeń</td>
            </tr>
        `;
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        updateDeleteSelectedButton();
        return;
    }

    tbody.innerHTML = AppState.history.slice(0, 50).map(inv => {
        const date = new Date(inv.createdAt);
        const dateStr = date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = inv.status === 'registered' ? 'registered' :
                           inv.status === 'opened' ? 'opened' : 'sent';
        const statusText = inv.status === 'registered' ? 'Zarejestrowany' :
                          inv.status === 'opened' ? 'Otworzył' : 'Wysłany';
        const statusIcon = inv.status === 'registered' ? '✅' :
                          inv.status === 'opened' ? '👁️' : '📤';

        // Build extra info line
        let extraInfo = [];
        if (inv.partnerCompany) extraInfo.push(inv.partnerCompany);
        if (inv.partnerPhone) extraInfo.push(`📞 ${inv.partnerPhone}`);
        if (inv.partnerEmail) extraInfo.push(`✉️ ${inv.partnerEmail}`);

        return `
            <tr data-id="${inv.id}">
                <td class="td-checkbox">
                    <input type="checkbox" class="invitation-checkbox" data-id="${inv.id}" onchange="updateDeleteSelectedButton()">
                </td>
                <td>${dateStr}</td>
                <td>
                    <strong>${inv.partnerName}</strong>
                    ${inv.partnerLastName ? ` ${inv.partnerLastName}` : ''}
                    ${extraInfo.length > 0 ? `<br><small style="color: var(--text-muted);">${extraInfo.join(' • ')}</small>` : ''}
                </td>
                <td>${inv.inviterName}</td>
                <td>${inv.styleName}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td class="td-actions">
                    <button class="action-btn" onclick="copyInvitationLink('${inv.id}')" title="Kopiuj link">🔗</button>
                    <button class="action-btn" onclick="openInvitationLink('${inv.id}')" title="Otwórz">🚀</button>
                    <button class="action-btn action-btn-delete" onclick="deleteInvitation('${inv.id}')" title="Usuń">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    updateDeleteSelectedButton();
}

function copyInvitationLink(id) {
    const inv = AppState.history.find(i => i.id === id);
    if (inv) {
        navigator.clipboard.writeText(inv.link).then(() => {
            showToast('Link skopiowany!', 'success');
        });
    }
}

function openInvitationLink(id) {
    const inv = AppState.history.find(i => i.id === id);
    if (inv) {
        window.open(inv.link, '_blank');
    }
}

function clearHistory() {
    if (confirm('Czy na pewno chcesz wyczyścić całą historię?')) {
        // Usuń wszystko z Supabase
        deleteAllInvitationsFromSupabase();

        AppState.history = [];
        AppState.stats = { sent: 0, opened: 0, converted: 0 };
        saveState();
        updateStatsDisplay();
        renderHistory();
        showToast('Historia wyczyszczona', 'success');
    }
}

// Usuwanie pojedynczego zaproszenia
async function deleteInvitation(id) {
    if (!confirm('Czy na pewno chcesz usunąć to zaproszenie?')) return;

    // Usuń z Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            const { error } = await sb
                .from('invitations')
                .delete()
                .eq('id', id);
            if (error) console.error('Error deleting invitation from Supabase:', error);
        } catch (err) {
            console.error('Error deleting invitation from Supabase:', err);
        }
    }

    // Usuń z lokalnego state
    const inv = AppState.history.find(i => i.id === id);
    if (inv) {
        // Zaktualizuj statystyki
        AppState.stats.sent--;
        if (inv.status === 'opened' || inv.status === 'registered') AppState.stats.opened--;
        if (inv.status === 'registered') AppState.stats.converted--;
    }

    AppState.history = AppState.history.filter(i => i.id !== id);
    saveState();
    updateStatsDisplay();
    renderHistory();
    showToast('Zaproszenie usunięte', 'success');
}

// Usuwanie wielu zaznaczonych zaproszeń
async function deleteSelectedInvitations() {
    const checkboxes = document.querySelectorAll('.invitation-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);

    if (ids.length === 0) return;

    if (!confirm(`Czy na pewno chcesz usunąć ${ids.length} zaproszenie(a)?`)) return;

    // Usuń z Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            const { error } = await sb
                .from('invitations')
                .delete()
                .in('id', ids);
            if (error) console.error('Error deleting invitations from Supabase:', error);
        } catch (err) {
            console.error('Error deleting invitations from Supabase:', err);
        }
    }

    // Zaktualizuj statystyki i usuń z lokalnego state
    ids.forEach(id => {
        const inv = AppState.history.find(i => i.id === id);
        if (inv) {
            AppState.stats.sent--;
            if (inv.status === 'opened' || inv.status === 'registered') AppState.stats.opened--;
            if (inv.status === 'registered') AppState.stats.converted--;
        }
    });

    AppState.history = AppState.history.filter(i => !ids.includes(i.id));
    saveState();
    updateStatsDisplay();
    renderHistory();
    showToast(`Usunięto ${ids.length} zaproszenie(a)`, 'success');
}

// Usuń wszystkie z Supabase
async function deleteAllInvitationsFromSupabase() {
    const sb = getSupabase();
    if (sb) {
        try {
            const { error } = await sb
                .from('invitations')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Usuwa wszystko
            if (error) console.error('Error clearing invitations from Supabase:', error);
        } catch (err) {
            console.error('Error clearing invitations from Supabase:', err);
        }
    }
}

// Aktualizacja przycisku "Usuń zaznaczone"
function updateDeleteSelectedButton() {
    const checkboxes = document.querySelectorAll('.invitation-checkbox:checked');
    const count = checkboxes.length;
    const btn = document.getElementById('btnDeleteSelected');
    const countSpan = document.getElementById('selectedCount');

    if (btn) {
        btn.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (countSpan) {
        countSpan.textContent = count;
    }
}

// Zaznacz/odznacz wszystkie
function toggleSelectAllInvitations() {
    const selectAll = document.getElementById('selectAllInvitations');
    const checkboxes = document.querySelectorAll('.invitation-checkbox');

    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });

    updateDeleteSelectedButton();
}

// Inicjalizacja obsługi usuwania zaproszeń
function initInvitationSelection() {
    const selectAll = document.getElementById('selectAllInvitations');
    const btnDeleteSelected = document.getElementById('btnDeleteSelected');

    if (selectAll) {
        selectAll.addEventListener('change', toggleSelectAllInvitations);
    }

    if (btnDeleteSelected) {
        btnDeleteSelected.addEventListener('click', deleteSelectedInvitations);
    }
}

// Dodaj do globalnego window
window.deleteInvitation = deleteInvitation;
window.updateDeleteSelectedButton = updateDeleteSelectedButton;

// ============ LANDING MODE ============
function initLanding() {
    // Personalize content
    personalizeContent();

    // Initialize calculator
    initCalculator();

    // Initialize meeting scheduler
    initMeetingScheduler();

    // Initialize mobile and desktop apps
    initMobileApp();
    initDesktopApp();
}

function personalizeContent() {
    const params = AppState.landingParams;

    // ========== PERSONALIZACJA PARTNERA ==========

    // Imię do powitania (tylko imię, bez nazwiska - bardziej osobiste)
    const greetingName = params.partnerName || 'Partnerze';
    setTextContent('partnerDisplayName', greetingName);
    setTextContent('desktopPartnerName', greetingName);

    // Pełne dane partnera do formularza rejestracji
    const regName = document.getElementById('regName');
    if (regName && params.partnerName) {
        regName.value = params.partnerFullName || params.partnerName;
    }

    const regPhone = document.getElementById('regPhone');
    if (regPhone && params.partnerPhone) {
        regPhone.value = params.partnerPhone;
    }

    const regEmail = document.getElementById('regEmail');
    if (regEmail && params.partnerEmail) {
        regEmail.value = params.partnerEmail;
    }

    // ========== PERSONALIZACJA ZAPRASZAJĄCEGO ==========

    // Wszystkie miejsca gdzie wyświetlane jest imię zapraszającego
    const inviterNameElements = [
        'appInviterName',           // Mobile welcome card
        'inviterName',              // Legacy element
        'ctaInviterName',           // CTA section
        'modalInviterName',         // Success modal
        'inviterContactName',       // Mobile contact card
        'desktopInviterName',       // Desktop hero
        'desktopInviterCardName'    // Desktop scheduler card
    ];

    inviterNameElements.forEach(id => {
        setTextContent(id, params.inviterName);
    });

    // Rola zapraszającego
    const inviterRoleElements = [
        'appInviterRole',
        'ctaInviterRole',
        'inviterContactRole',
        'desktopInviterCardRole'
    ];

    inviterRoleElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (params.inviterRole) {
                el.textContent = params.inviterRole;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Zdjęcie zapraszającego
    const inviterPhotoElements = [
        'appInviterPhoto',
        'inviterContactPhoto',
        'desktopInviterPhoto'
    ];

    const defaultPhoto = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";

    inviterPhotoElements.forEach(id => {
        const img = document.getElementById(id);
        if (img) {
            img.src = params.inviterPhoto || defaultPhoto;
            img.onerror = function() { this.src = defaultPhoto; };
        }
    });

    // Telefon zapraszającego
    setupContactLink('inviterBtnPhone', 'tel:', params.inviterPhone);
    setupContactLink('ctaInviterPhoneLink', 'tel:', params.inviterPhone, 'ctaInviterPhone');
    setupContactLink('desktopInviterPhoneLink', 'tel:', params.inviterPhone, 'desktopInviterCardPhone');

    // Email zapraszającego
    setupContactLink('inviterBtnEmail', 'mailto:', params.inviterEmail);
    setupContactLink('ctaInviterEmailLink', 'mailto:', params.inviterEmail, 'ctaInviterEmail');
    setupContactLink('desktopInviterEmailLink', 'mailto:', params.inviterEmail, 'desktopInviterCardEmail');

    // Kontakty zapraszającego w hero sekcji (mobile)
    // Phone link (obok roli)
    const phoneLink = document.getElementById('inviterPhoneLink');
    if (phoneLink) {
        if (params.inviterPhone) {
            phoneLink.href = 'tel:' + params.inviterPhone.replace(/\s/g, '');
            setTextContent('inviterPhoneText', params.inviterPhone);
            phoneLink.style.display = 'inline-flex';
        } else {
            phoneLink.style.display = 'none';
        }
    }

    // Email link (pod rolą)
    const emailLink = document.getElementById('inviterEmailLink');
    if (emailLink) {
        if (params.inviterEmail) {
            emailLink.href = 'mailto:' + params.inviterEmail;
            setTextContent('inviterEmailText', params.inviterEmail);
            emailLink.style.display = 'inline-flex';
        } else {
            emailLink.style.display = 'none';
        }
    }

    // Kontakty zapraszającego w hero sekcji (desktop)
    const desktopInviterContacts = document.getElementById('desktopInviterContacts');
    if (desktopInviterContacts) {
        const hasInviterContact = params.inviterPhone || params.inviterEmail;
        if (hasInviterContact) {
            desktopInviterContacts.style.display = 'flex';

            // Phone link
            const phoneLink = document.getElementById('desktopInviterPhoneBadge');
            if (phoneLink) {
                if (params.inviterPhone) {
                    phoneLink.href = 'tel:' + params.inviterPhone.replace(/\s/g, '');
                    setTextContent('desktopInviterPhoneText', params.inviterPhone);
                    phoneLink.style.display = 'flex';
                } else {
                    phoneLink.style.display = 'none';
                }
            }

            // Email link
            const emailLink = document.getElementById('desktopInviterEmailBadge');
            if (emailLink) {
                if (params.inviterEmail) {
                    emailLink.href = 'mailto:' + params.inviterEmail;
                    setTextContent('desktopInviterEmailText', params.inviterEmail);
                    emailLink.style.display = 'flex';
                } else {
                    emailLink.style.display = 'none';
                }
            }
        } else {
            desktopInviterContacts.style.display = 'none';
        }
    }

    // Bio zapraszającego
    const bioElements = ['inviterContactBio', 'ctaInviterBio', 'desktopInviterCardBio'];
    bioElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (params.inviterBio) {
                el.textContent = params.inviterBio;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Zapisz numer do przycisku w headerze
    window.inviterPhoneNumber = params.inviterPhone;

    // ========== AKTUALIZACJA TYTUŁU STRONY ==========
    if (params.partnerName && params.inviterName) {
        document.title = `${params.partnerName}, zaproszenie od ${params.inviterName} | posrednik.app`;
    }

    // ========== PARTNER BUSINESS CARD ==========
    populatePartnerBusinessCard(params);

    console.log('Personalizacja zakończona:', params);
}

function populatePartnerBusinessCard(params) {
    // Sprawdź czy mamy dane partnera do wyświetlenia (przynajmniej firma lub szczegóły kontaktowe)
    const hasBusinessData = params.partnerCompany || params.partnerNIP ||
                            params.partnerPhone || params.partnerEmail || params.partnerAddress;

    const fullName = params.partnerFullName || params.partnerName || 'Partner';
    const initials = generateInitials(fullName);

    // ========== MOBILE VERSION ==========
    const mobileSection = document.getElementById('partnerBusinessCard');
    if (mobileSection) {
        if (!hasBusinessData) {
            mobileSection.style.display = 'none';
        } else {
            mobileSection.style.display = 'block';

            setTextContent('partnerCardName', fullName);
            setTextContent('partnerAvatarInitials', initials);

            // Firma
            const companyRow = document.getElementById('partnerCardCompany');
            if (companyRow) {
                if (params.partnerCompany) {
                    companyRow.style.display = '';
                    setTextContent('partnerCardCompanyName', params.partnerCompany);
                } else {
                    companyRow.style.display = 'none';
                }
            }

            // Szczegóły
            toggleDetailRow('partnerCardNipRow', 'partnerCardNip', params.partnerNIP);
            toggleDetailRow('partnerCardPhoneRow', 'partnerCardPhone', params.partnerPhone);
            toggleDetailRow('partnerCardEmailRow', 'partnerCardEmail', params.partnerEmail);
            toggleDetailRow('partnerCardAddressRow', 'partnerCardAddress', params.partnerAddress);

            // Ukryj siatkę szczegółów jeśli nie ma żadnych danych
            const detailsGrid = mobileSection.querySelector('.for-details-grid');
            if (detailsGrid) {
                const hasAnyDetail = params.partnerNIP || params.partnerPhone ||
                                     params.partnerEmail || params.partnerAddress;
                detailsGrid.style.display = hasAnyDetail ? 'grid' : 'none';
            }
        }
    }

    // ========== DESKTOP VERSION ==========
    const desktopCard = document.getElementById('desktopPartnerCard');
    if (desktopCard) {
        if (!hasBusinessData) {
            desktopCard.style.display = 'none';
        } else {
            desktopCard.style.display = 'block';

            setTextContent('desktopPartnerFullName', fullName);
            setTextContent('desktopPartnerInitials', initials);

            // Firma
            const companyRow = document.getElementById('desktopPartnerCompanyRow');
            if (companyRow) {
                if (params.partnerCompany) {
                    companyRow.style.display = '';
                    setTextContent('desktopPartnerCompany', params.partnerCompany);
                } else {
                    companyRow.style.display = 'none';
                }
            }

            // Szczegóły
            toggleDetailRow('desktopPartnerNipRow', 'desktopPartnerNip', params.partnerNIP);
            toggleDetailRow('desktopPartnerPhoneRow', 'desktopPartnerPhone', params.partnerPhone);
            toggleDetailRow('desktopPartnerEmailRow', 'desktopPartnerEmail', params.partnerEmail);
            toggleDetailRow('desktopPartnerAddressRow', 'desktopPartnerAddress', params.partnerAddress);

            // Ukryj siatkę szczegółów jeśli nie ma żadnych danych
            const detailsGrid = desktopCard.querySelector('.dpc-details');
            if (detailsGrid) {
                const hasAnyDetail = params.partnerNIP || params.partnerPhone ||
                                     params.partnerEmail || params.partnerAddress;
                detailsGrid.style.display = hasAnyDetail ? 'grid' : 'none';
            }
        }
    }
}

function generateInitials(name) {
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
}

function toggleDetailRow(rowId, valueId, value) {
    const row = document.getElementById(rowId);
    if (row) {
        if (value) {
            row.style.display = '';
            setTextContent(valueId, value);
        } else {
            row.style.display = 'none';
        }
    }
}

// Pomocnicze funkcje
function setTextContent(elementId, text) {
    const el = document.getElementById(elementId);
    if (el && text) {
        el.textContent = text;
    }
}

function setupContactLink(linkId, prefix, value, textId) {
    const link = document.getElementById(linkId);
    if (link) {
        if (value) {
            link.href = prefix + value.replace(/\s/g, '');
            link.style.display = '';
            if (textId) {
                setTextContent(textId, value);
            }
        } else {
            link.style.display = 'none';
        }
    }
}

function initCalculator() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');
    const tierSelector = document.getElementById('tierSelector');
    const tierInfoBar = document.getElementById('tierInfoBar');

    // Exit if required elements don't exist
    if (!clientsSlider || !valueSlider || !tierSlider) return;

    // Tier info mapping
    const tierInfo = {
        10: { name: 'Start', req: 'Każdy nowy partner' },
        15: { name: 'Brązowy', req: '3+ klientów' },
        20: { name: 'Srebrny', req: '10+ klientów' },
        25: { name: 'Złoty', req: '25+ klientów' },
        35: { name: 'Platynowy', req: '50+ klientów' }
    };

    // Update slider progress color
    function updateSliderProgress(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const val = parseFloat(slider.value) || 0;
        const percent = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #667eea 0%, #667eea ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    }

    function updateCalculator() {
        const clients = parseInt(clientsSlider.value) || 0;
        const avgValue = parseInt(valueSlider.value) || 0;
        const tierPercent = parseInt(tierSlider.value) || 20;

        // Update slider progress
        updateSliderProgress(clientsSlider);
        updateSliderProgress(valueSlider);

        // Update display values
        const calcClientsValueEl = document.getElementById('calcClientsValue');
        const calcValueDisplayEl = document.getElementById('calcValueDisplay');
        if (calcClientsValueEl) calcClientsValueEl.textContent = clients;
        if (calcValueDisplayEl) calcValueDisplayEl.textContent = avgValue.toLocaleString('pl-PL');

        // Update tier value display if exists (legacy)
        const tierValueEl = document.getElementById('calcTierValue');
        if (tierValueEl) tierValueEl.textContent = tierPercent;

        // Calculate earnings
        const monthlyCommission = clients * avgValue * (tierPercent / 100);
        const quarterlyCommission = monthlyCommission * 3;
        const yearlyCommission = monthlyCommission * 12;

        // Update results
        const resultMonthlyEl = document.getElementById('resultMonthly');
        const resultQuarterlyEl = document.getElementById('resultQuarterly');
        const resultYearlyEl = document.getElementById('resultYearly');
        if (resultMonthlyEl) resultMonthlyEl.textContent = formatCurrency(monthlyCommission);
        if (resultQuarterlyEl) resultQuarterlyEl.textContent = formatCurrency(quarterlyCommission);
        if (resultYearlyEl) resultYearlyEl.textContent = formatCurrency(yearlyCommission);

        // Update tier info bar
        if (tierInfoBar && tierInfo[tierPercent]) {
            const info = tierInfo[tierPercent];
            tierInfoBar.innerHTML = `<span class="tier-info-text"><strong>${info.name}</strong> — ${info.req}</span>`;
        }

        // Update projection chart
        updateProjectionChart(clients, avgValue, tierPercent);
    }

    // Tier button click handler
    if (tierSelector) {
        const tierBtns = tierSelector.querySelectorAll('.tier-btn');
        tierBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all
                tierBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Update hidden input
                const tierValue = this.getAttribute('data-tier');
                tierSlider.value = tierValue;
                // Recalculate
                updateCalculator();
            });
        });
    }

    clientsSlider.addEventListener('input', updateCalculator);
    valueSlider.addEventListener('input', updateCalculator);

    // Legacy: if tierSlider is a range input, listen to it
    if (tierSlider && tierSlider.type === 'range') {
        tierSlider.addEventListener('input', updateCalculator);
    }

    // Initial calculation
    updateCalculator();

    // Initialize projection chart toggles
    initProjectionToggles();
}

// ============ PROJECTION CHART ============
function initProjectionToggles() {
    const growthToggle = document.getElementById('includeGrowth');
    const tierToggle = document.getElementById('includeTierProgression');

    if (growthToggle) {
        growthToggle.addEventListener('change', triggerProjectionUpdate);
    }
    if (tierToggle) {
        tierToggle.addEventListener('change', triggerProjectionUpdate);
    }
}

function triggerProjectionUpdate() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');

    if (clientsSlider && valueSlider && tierSlider) {
        const clients = parseInt(clientsSlider.value);
        const avgValue = parseInt(valueSlider.value);
        const tierPercent = parseInt(tierSlider.value);
        updateProjectionChart(clients, avgValue, tierPercent);
    }
}

function updateProjectionChart(baseClients, avgValue, baseTier) {
    const includeGrowth = document.getElementById('includeGrowth')?.checked ?? true;
    const includeTierProgression = document.getElementById('includeTierProgression')?.checked ?? true;

    // Tier progression thresholds (total clients needed for tier upgrade)
    const tierThresholds = [
        { clients: 0, tier: 10 },
        { clients: 3, tier: 15 },
        { clients: 10, tier: 20 },
        { clients: 25, tier: 25 },
        { clients: 50, tier: 35 }
    ];

    function getTierForTotalClients(totalClients, baseTier) {
        if (!includeTierProgression) return baseTier;

        let tier = baseTier;
        for (const threshold of tierThresholds) {
            if (totalClients >= threshold.clients && threshold.tier > tier) {
                tier = threshold.tier;
            }
        }
        return Math.min(tier, 35); // Cap at 35%
    }

    // Calculate projections for each year
    let projections = [];
    let cumulativeClients = 0;
    let cumulativeEarnings = 0;

    for (let year = 1; year <= 5; year++) {
        // Client growth: +2 clients per year if growth is enabled
        const clientsThisYear = includeGrowth
            ? baseClients + (year - 1) * 2
            : baseClients;

        const yearlyClients = clientsThisYear * 12;
        cumulativeClients += yearlyClients;

        // Get tier based on cumulative clients
        const currentTier = getTierForTotalClients(cumulativeClients, baseTier);

        // Calculate yearly earnings
        const monthlyEarnings = clientsThisYear * avgValue * (currentTier / 100);
        const yearlyEarnings = monthlyEarnings * 12;
        cumulativeEarnings += yearlyEarnings;

        projections.push({
            year,
            clientsPerMonth: clientsThisYear,
            yearlyClients,
            cumulativeClients,
            tier: currentTier,
            monthlyEarnings,
            yearlyEarnings,
            cumulativeEarnings
        });
    }

    // Get data for years 1, 2, 5
    const year1 = projections[0];
    const year2 = projections[1];
    const year5 = projections[4];

    // Calculate max value for chart scaling
    const maxValue = year5.cumulativeEarnings;

    // Update chart bars
    updateChartBar(1, year1.cumulativeEarnings, maxValue, year1.cumulativeClients);
    updateChartBar(2, year2.cumulativeEarnings, maxValue, year2.cumulativeClients, year1.cumulativeEarnings);
    updateChartBar(5, year5.cumulativeEarnings, maxValue, year5.cumulativeClients, year1.cumulativeEarnings);

    // Update Y-axis labels
    updateYAxis(maxValue);

    // Update breakdown cards
    updateBreakdownCard(1, year1);
    updateBreakdownCard(2, year2, year1.cumulativeEarnings);
    updateBreakdownCard(5, year5, projections[3].cumulativeEarnings);

    // Update summary stats (with null checks)
    const summaryTotal = document.getElementById('summaryTotal5Year');
    const summaryAvg = document.getElementById('summaryAvgMonthly');
    const summaryClients = document.getElementById('summaryTotalClients');

    if (summaryTotal) summaryTotal.textContent = formatCurrency(year5.cumulativeEarnings);
    if (summaryAvg) summaryAvg.textContent = formatCurrency(year5.cumulativeEarnings / 60);
    if (summaryClients) summaryClients.textContent = year5.cumulativeClients.toLocaleString('pl-PL');
}

function updateChartBar(year, cumulativeValue, maxValue, totalClients, previousValue = 0) {
    const barFill = document.getElementById(`bar${year}Year`);
    const barAmount = document.getElementById(`projection${year}Year`);
    const barGrowth = document.getElementById(`growth${year}Year`);
    const barClients = document.getElementById(`clients${year}Year`);

    if (!barFill || !barAmount) return;

    // Calculate height percentage (min 10% for visibility)
    const heightPercent = Math.max(10, (cumulativeValue / maxValue) * 100);
    barFill.style.height = `${heightPercent}%`;

    // Update amount
    barAmount.textContent = formatCurrencyShort(cumulativeValue);

    // Update growth percentage
    if (barGrowth && previousValue > 0) {
        const growthPercent = Math.round(((cumulativeValue - previousValue) / previousValue) * 100);
        barGrowth.textContent = `+${growthPercent}%`;
        barGrowth.style.display = 'inline-block';
    } else if (barGrowth) {
        barGrowth.style.display = 'none';
    }

    // Update clients count
    if (barClients) {
        barClients.textContent = `${totalClients} klientów`;
    }
}

function updateYAxis(maxValue) {
    const yMax = document.getElementById('yMax');
    const yMid = document.getElementById('yMid');
    const yMin = document.getElementById('yMin');

    if (yMax) yMax.textContent = formatCurrencyShort(maxValue);
    if (yMid) yMid.textContent = formatCurrencyShort(maxValue / 2);
    if (yMin) yMin.textContent = '0';
}

function updateBreakdownCard(year, data, previousCumulative = 0) {
    const clientsEl = document.getElementById(`breakdown${year}Clients`);
    const commissionEl = document.getElementById(`breakdown${year}Commission`);
    const monthlyEl = document.getElementById(`breakdown${year}Monthly`);
    const totalEl = document.getElementById(`breakdown${year}Total`);

    if (clientsEl) clientsEl.textContent = data.clientsPerMonth;
    if (commissionEl) commissionEl.textContent = `${data.tier}%`;
    if (monthlyEl) monthlyEl.textContent = formatCurrency(data.monthlyEarnings);
    if (totalEl) totalEl.textContent = formatCurrency(data.cumulativeEarnings);
}

function formatCurrencyShort(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.0', '') + ' mln zł';
    }
    if (value >= 1000) {
        return Math.round(value / 1000) + 'k zł';
    }
    return Math.round(value) + ' zł';
}

function formatCurrency(value) {
    return value.toLocaleString('pl-PL') + ' zł';
}

// ============ MEETING SCHEDULER ============
let schedulerState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone',
    dateOffset: 0
};

function initMeetingScheduler() {
    // Generate date options
    generateDateOptions();

    // Setup date navigation (with null checks)
    const datePrev = document.getElementById('datePrev');
    const dateNext = document.getElementById('dateNext');

    if (datePrev) {
        datePrev.addEventListener('click', () => {
            if (schedulerState.dateOffset > 0) {
                schedulerState.dateOffset -= 5;
                generateDateOptions();
            }
        });
    }

    if (dateNext) {
        dateNext.addEventListener('click', () => {
            if (schedulerState.dateOffset < 9) {
                schedulerState.dateOffset += 5;
                generateDateOptions();
            }
        });
    }

    // Setup contact method selector
    const methodOptions = document.querySelectorAll('.method-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', () => {
            methodOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            schedulerState.selectedMethod = option.querySelector('input').value;
            updateSchedulerSummary();
        });
    });

    // Setup time slots
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            schedulerState.selectedTime = slot.dataset.time;
            updateSchedulerSummary();
        });
    });

    // Note: Form submission is handled by handleMobileScheduleSubmit in initBottomSheet
    // Don't add duplicate listener here
}

function generateDateOptions() {
    const dateList = document.getElementById('dateList');
    if (!dateList) return; // Exit if element doesn't exist

    const today = new Date();
    const dayNames = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    dateList.innerHTML = '';

    let daysAdded = 0;
    let dayOffset = 1 + schedulerState.dateOffset;

    while (daysAdded < 5 && dayOffset < 30) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);
        dayOffset++;

        const dayOfWeek = date.getDay();
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        const dateString = date.toISOString().split('T')[0];
        const isSelected = schedulerState.selectedDate === dateString;

        const dateItem = document.createElement('div');
        dateItem.className = `date-item${isSelected ? ' active' : ''}`;
        dateItem.dataset.date = dateString;
        dateItem.innerHTML = `
            <span class="date-weekday">${dayNames[dayOfWeek]}</span>
            <span class="date-day">${date.getDate()}</span>
            <span class="date-month">${monthNames[date.getMonth()]}</span>
        `;

        dateItem.addEventListener('click', () => {
            document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
            dateItem.classList.add('active');
            schedulerState.selectedDate = dateString;
            updateSchedulerSummary();
        });

        dateList.appendChild(dateItem);
        daysAdded++;
    }

    // Update navigation buttons (with null checks)
    const datePrev = document.getElementById('datePrev');
    const dateNext = document.getElementById('dateNext');
    if (datePrev) datePrev.disabled = schedulerState.dateOffset === 0;
    if (dateNext) dateNext.disabled = schedulerState.dateOffset >= 15;
}

function updateSchedulerSummary() {
    const summary = document.getElementById('schedulerSummary');
    const dateTimeEl = document.getElementById('summaryDateTime');
    const methodEl = document.getElementById('summaryMethod');

    if (schedulerState.selectedDate && schedulerState.selectedTime) {
        const date = new Date(schedulerState.selectedDate);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
        if (dateTimeEl) dateTimeEl.textContent = `${formattedDate}, godz. ${schedulerState.selectedTime}`;

        if (summary) summary.classList.add('ready');
    } else {
        if (dateTimeEl) dateTimeEl.textContent = '-';
        if (summary) summary.classList.remove('ready');
    }

    const methodIcon = schedulerState.selectedMethod === 'phone' ? '📞' : '🎥';
    const methodText = schedulerState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';
    if (methodEl) methodEl.textContent = `${methodIcon} ${methodText}`;

    updateScheduleButton();
}

function updateScheduleButton() {
    const btn = document.getElementById('btnSchedule');
    if (!btn) return;

    const isReady = schedulerState.selectedDate && schedulerState.selectedTime;

    btn.disabled = !isReady;
}

function handleMeetingSchedule(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim() || AppState.landingParams.partnerName;
    const phone = document.getElementById('regPhone').value.trim() || AppState.landingParams.partnerPhone || '';
    const email = document.getElementById('regEmail').value.trim() || AppState.landingParams.partnerEmail || '';

    if (!schedulerState.selectedDate || !schedulerState.selectedTime) {
        showToast('Wybierz datę i godzinę spotkania', 'error');
        return;
    }

    // Prepare meeting data
    const date = new Date(schedulerState.selectedDate);
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;

    const meeting = {
        name,
        phone,
        email,
        date: schedulerState.selectedDate,
        time: schedulerState.selectedTime,
        method: schedulerState.selectedMethod,
        formattedDateTime: `${formattedDate}, godz. ${schedulerState.selectedTime}`,
        invitedBy: AppState.landingParams.inviterName,
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    // Save to localStorage (for demo)
    const meetings = JSON.parse(localStorage.getItem('recruiter_meetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('recruiter_meetings', JSON.stringify(meetings));

    // Update invitation status in generator history
    if (AppState.landingParams.invitationId) {
        updateInvitationStatus(AppState.landingParams.invitationId, 'registered');
    }

    // Update modal with meeting details
    document.getElementById('modalDateTime').textContent = meeting.formattedDateTime;
    document.getElementById('modalMethodIcon').textContent = meeting.method === 'phone' ? '📞' : '🎥';
    document.getElementById('modalMethodText').textContent = meeting.method === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';

    // Show success modal
    document.getElementById('successModal').classList.add('active');

    showToast('Spotkanie umówione!', 'success');
}

async function trackOpening(invitationId) {
    if (!invitationId) return;

    const sb = getSupabase();

    // Próbuj zaktualizować w Supabase
    if (sb) {
        try {
            const { error } = await sb
                .from('invitations')
                .update({
                    status: 'opened',
                    opened_at: new Date().toISOString()
                })
                .eq('id', invitationId)
                .eq('status', 'sent');

            if (!error) {
                console.log('Invitation opened tracked in Supabase:', invitationId);
                return;
            }
        } catch (err) {
            console.error('Error tracking opening in Supabase:', err);
        }
    }

    // Fallback: localStorage
    const savedHistory = localStorage.getItem('recruiter_history');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const invitation = history.find(inv => inv.id === invitationId);

        if (invitation && invitation.status === 'sent') {
            invitation.status = 'opened';
            invitation.openedAt = new Date().toISOString();

            // Update stats
            const savedStats = localStorage.getItem('recruiter_stats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                stats.opened++;
                localStorage.setItem('recruiter_stats', JSON.stringify(stats));
            }

            localStorage.setItem('recruiter_history', JSON.stringify(history));
        }
    }
}

async function updateInvitationStatus(invitationId, status) {
    if (!invitationId) return;

    const sb = getSupabase();
    const now = new Date().toISOString();

    // Próbuj zaktualizować w Supabase
    if (sb) {
        try {
            const updateData = { status };
            if (status === 'registered') {
                updateData.registered_at = now;
            } else if (status === 'opened') {
                updateData.opened_at = now;
            }

            const { error } = await sb
                .from('invitations')
                .update(updateData)
                .eq('id', invitationId);

            if (!error) {
                console.log('Invitation status updated in Supabase:', invitationId, status);
                return;
            }
        } catch (err) {
            console.error('Error updating invitation status in Supabase:', err);
        }
    }

    // Fallback: localStorage
    const savedHistory = localStorage.getItem('recruiter_history');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const invitation = history.find(inv => inv.id === invitationId);

        if (invitation) {
            invitation.status = status;
            if (status === 'registered') {
                invitation.registeredAt = now;

                // Update stats
                const savedStats = localStorage.getItem('recruiter_stats');
                if (savedStats) {
                    const stats = JSON.parse(savedStats);
                    stats.converted++;
                    localStorage.setItem('recruiter_stats', JSON.stringify(stats));
                }
            }

            localStorage.setItem('recruiter_history', JSON.stringify(history));
        }
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// ============ UTILITIES ============
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ SETTINGS & INVITER MANAGEMENT ============
let InvitersState = {
    inviters: [],
    editingId: null
};

async function initSettings() {
    // Load saved inviters
    await loadInviters();

    // Open/Close settings
    const btnOpen = document.getElementById('btnOpenSettings');
    const btnClose = document.getElementById('btnCloseSettings');
    const modal = document.getElementById('settingsModal');
    const addForm = document.getElementById('addInviterForm');
    const editForm = document.getElementById('editInviterForm');

    if (btnOpen) btnOpen.addEventListener('click', openSettings);
    if (btnClose) btnClose.addEventListener('click', closeSettings);

    // Close settings on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                closeSettings();
            }
        });
    }

    // Add inviter form
    if (addForm) addForm.addEventListener('submit', handleAddInviter);

    // Edit inviter form
    if (editForm) editForm.addEventListener('submit', handleEditInviter);

    // Render inviters list
    renderInvitersList();

    // Update inviter select dropdown
    updateInviterSelect();
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function loadInviters() {
    const sb = getSupabase();

    if (sb) {
        try {
            const { data, error } = await sb
                .from('inviters')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Mapuj dane z Supabase na format aplikacji
                InvitersState.inviters = data.map(inv => ({
                    id: inv.id,
                    key: inv.key,
                    name: inv.name,
                    role: inv.role || '',
                    phone: inv.phone || '',
                    email: inv.email || '',
                    bio: inv.bio || '',
                    photo: inv.photo_url || ''
                }));
                updateConfigInviters();
                console.log('Inviters loaded from Supabase:', InvitersState.inviters.length);
                return;
            }
        } catch (err) {
            console.error('Error loading from Supabase:', err);
        }
    }

    // Fallback: localStorage lub domyślne
    const saved = localStorage.getItem('recruiter_inviters');
    if (saved) {
        InvitersState.inviters = JSON.parse(saved);
    } else {
        // Initialize with default inviters from CONFIG
        InvitersState.inviters = Object.entries(CONFIG.inviters).map(([key, data], index) => ({
            id: 'inv_default_' + index,
            key: key,
            name: data.name,
            role: data.role || '',
            phone: data.phone || '',
            email: data.email || '',
            bio: data.bio || '',
            photo: data.photo || ''
        }));
        saveInviters();
    }
}

async function saveInviters() {
    // Zawsze zapisz do localStorage jako backup
    localStorage.setItem('recruiter_inviters', JSON.stringify(InvitersState.inviters));
    updateConfigInviters();

    // Próbuj zapisać do Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            // Dla każdego invitera - upsert do Supabase
            for (const inv of InvitersState.inviters) {
                const { error } = await sb
                    .from('inviters')
                    .upsert({
                        id: inv.id.startsWith('inv_default_') ? undefined : inv.id,
                        key: inv.key,
                        name: inv.name,
                        role: inv.role || '',
                        phone: inv.phone || '',
                        email: inv.email || '',
                        bio: inv.bio || '',
                        photo_url: inv.photo || '',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) throw error;
            }
            console.log('Inviters saved to Supabase');
        } catch (err) {
            console.error('Error saving to Supabase:', err);
        }
    }
}

function updateConfigInviters() {
    // Update CONFIG.inviters for backward compatibility
    CONFIG.inviters = {};
    InvitersState.inviters.forEach(inv => {
        CONFIG.inviters[inv.key] = {
            name: inv.name,
            role: inv.role,
            phone: inv.phone,
            email: inv.email,
            bio: inv.bio,
            photo: inv.photo
        };
    });
}

function generateInviterKey(name) {
    // Generate a unique key from name
    const baseKey = name.split(' ')[0]; // First name
    let key = baseKey;
    let counter = 1;

    while (InvitersState.inviters.some(inv => inv.key === key && inv.id !== InvitersState.editingId)) {
        key = baseKey + counter;
        counter++;
    }

    return key;
}

async function handleAddInviter(e) {
    e.preventDefault();

    const name = document.getElementById('inviterName').value.trim();
    const role = document.getElementById('inviterRole').value.trim();
    const phone = document.getElementById('inviterPhone').value.trim();
    const email = document.getElementById('inviterEmail').value.trim();
    const bio = document.getElementById('inviterBio').value.trim();
    const photo = document.getElementById('inviterPhoto').value.trim();

    if (!name) {
        showToast('Podaj imię i nazwisko', 'error');
        return;
    }

    const newInviter = {
        id: 'inv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        key: generateInviterKey(name),
        name,
        role,
        phone,
        email,
        bio,
        photo
    };

    InvitersState.inviters.push(newInviter);
    await saveInviters();

    // Reset form
    document.getElementById('addInviterForm').reset();

    // Update UI
    renderInvitersList();
    updateInviterSelect();

    showToast('Zapraszający dodany!', 'success');
}

async function handleEditInviter(e) {
    e.preventDefault();

    const id = document.getElementById('editInviterId').value;
    const name = document.getElementById('editInviterName').value.trim();
    const role = document.getElementById('editInviterRole').value.trim();
    const phone = document.getElementById('editInviterPhone').value.trim();
    const email = document.getElementById('editInviterEmail').value.trim();
    const bio = document.getElementById('editInviterBio').value.trim();
    const photo = document.getElementById('editInviterPhoto').value.trim();

    if (!name) {
        showToast('Podaj imię i nazwisko', 'error');
        return;
    }

    const inviter = InvitersState.inviters.find(inv => inv.id === id);
    if (inviter) {
        InvitersState.editingId = id;
        inviter.name = name;
        inviter.key = generateInviterKey(name);
        inviter.role = role;
        inviter.phone = phone;
        inviter.email = email;
        inviter.bio = bio;
        inviter.photo = photo;
        InvitersState.editingId = null;

        await saveInviters();
        renderInvitersList();
        updateInviterSelect();
        closeEditInviterModal();

        showToast('Zmiany zapisane!', 'success');
    }
}

function openEditInviterModal(id) {
    const inviter = InvitersState.inviters.find(inv => inv.id === id);
    if (!inviter) return;

    document.getElementById('editInviterId').value = inviter.id;
    document.getElementById('editInviterName').value = inviter.name;
    document.getElementById('editInviterRole').value = inviter.role || '';
    document.getElementById('editInviterPhone').value = inviter.phone || '';
    document.getElementById('editInviterEmail').value = inviter.email || '';
    document.getElementById('editInviterBio').value = inviter.bio || '';
    document.getElementById('editInviterPhoto').value = inviter.photo || '';

    document.getElementById('editInviterModal').classList.add('active');
}

function closeEditInviterModal() {
    document.getElementById('editInviterModal').classList.remove('active');
    document.getElementById('editInviterForm').reset();
}

async function deleteInviter(id) {
    if (!confirm('Czy na pewno chcesz usunąć tego zapraszającego?')) return;

    // Usuń z Supabase jeśli dostępne
    const sb = getSupabase();
    if (sb && !id.startsWith('inv_default_')) {
        try {
            const { error } = await sb
                .from('inviters')
                .delete()
                .eq('id', id);
            if (error) console.error('Error deleting from Supabase:', error);
        } catch (err) {
            console.error('Error deleting from Supabase:', err);
        }
    }

    InvitersState.inviters = InvitersState.inviters.filter(inv => inv.id !== id);
    await saveInviters();
    renderInvitersList();
    updateInviterSelect();

    showToast('Zapraszający usunięty', 'success');
}

function renderInvitersList() {
    const container = document.getElementById('invitersList');
    if (!container) return;

    if (InvitersState.inviters.length === 0) {
        container.innerHTML = `
            <div class="inviters-empty">
                <span class="empty-icon">👥</span>
                <p>Brak zapraszających. Dodaj pierwszego!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = InvitersState.inviters.map(inv => `
        <div class="inviter-list-item" data-id="${inv.id}">
            <div class="inviter-item-photo">
                ${inv.photo
                    ? `<img src="${inv.photo}" alt="${inv.name}" class="inviter-thumb">`
                    : `<span class="inviter-thumb-placeholder">👤</span>`
                }
            </div>
            <div class="inviter-item-info">
                <h4 class="inviter-item-name">${inv.name}</h4>
                ${inv.role ? `<span class="inviter-item-role">${inv.role}</span>` : ''}
                <div class="inviter-item-contacts">
                    ${inv.phone ? `<span class="inviter-contact"><span class="contact-icon">📞</span> ${inv.phone}</span>` : ''}
                    ${inv.email ? `<span class="inviter-contact"><span class="contact-icon">✉️</span> ${inv.email}</span>` : ''}
                </div>
            </div>
            <div class="inviter-item-actions">
                <button type="button" class="btn-edit-inviter" onclick="openEditInviterModal('${inv.id}')" title="Edytuj">
                    ✏️
                </button>
                <button type="button" class="btn-delete-inviter" onclick="deleteInviter('${inv.id}')" title="Usuń">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function updateInviterSelect() {
    const select = document.getElementById('inviterSelect');
    if (!select) return;

    const currentValue = select.value;

    // Clear existing options except the placeholder
    select.innerHTML = '<option value="">Wybierz osobę...</option>';

    // Add options for each inviter
    InvitersState.inviters.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.key;
        option.textContent = inv.name + (inv.role ? ` (${inv.role})` : '');
        select.appendChild(option);
    });

    // Restore previous selection if still exists
    if (currentValue && InvitersState.inviters.some(inv => inv.key === currentValue)) {
        select.value = currentValue;
    }
}

// Update generateLink to include inviter details
const originalGenerateLink = generateLink;
function generateLinkWithInviterDetails(partnerData, inviterKey, invitationId) {
    const params = new URLSearchParams({
        n: partnerData.name,
        z: inviterKey,
        id: invitationId
    });

    // Add partner optional fields
    if (partnerData.lastName) params.set('ln', partnerData.lastName);
    if (partnerData.company) params.set('c', partnerData.company);
    if (partnerData.nip) params.set('nip', partnerData.nip);
    if (partnerData.phone) params.set('p', partnerData.phone);
    if (partnerData.email) params.set('e', partnerData.email);
    if (partnerData.address) params.set('a', partnerData.address);

    // Add inviter details
    const inviter = InvitersState.inviters.find(inv => inv.key === inviterKey);
    if (inviter) {
        // WAŻNE: Dodaj pełne imię zapraszającego
        params.set('zn', inviter.name);
        if (inviter.phone) params.set('zp', inviter.phone);
        if (inviter.email) params.set('ze', inviter.email);
        if (inviter.role) params.set('zr', inviter.role);
        if (inviter.bio) params.set('zb', inviter.bio);
        if (inviter.photo) params.set('zph', inviter.photo);
    }

    return `${CONFIG.baseUrl}?${params.toString()}`;
}

// Override generateLink
generateLink = generateLinkWithInviterDetails;

// Update initGenerator to include settings init
const originalInitGenerator = initGenerator;
initGenerator = async function() {
    await originalInitGenerator();
    await initSettings();
};

// Personalizacja jest teraz obsługiwana centralnie przez personalizeContent()

// Global functions for onclick handlers
window.copyInvitationLink = copyInvitationLink;
window.openInvitationLink = openInvitationLink;
window.closeModal = closeModal;
window.openEditInviterModal = openEditInviterModal;
window.closeEditInviterModal = closeEditInviterModal;
window.deleteInviter = deleteInviter;

// ============ MOBILE APP EXPERIENCE ============
let mobileAppState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone'
};

function initMobileApp() {
    // Only initialize on landing page
    if (AppState.mode !== 'landing') return;

    // Initialize bottom sheet
    initBottomSheet();

    // Initialize mobile date picker
    initMobileDatePicker();

    // Initialize time grid
    initTimeGrid();

    // Initialize method toggle
    initMethodToggle();

    // Initialize services carousel
    initServicesCarousel();

    // Initialize calculator sliders for mobile
    initMobileCalculator();

    // Setup header call button
    setupHeaderCallButton();

    // Check for existing meeting and update UI
    updateMeetingConfirmedUI();
}

function getExistingMeetingForInvitation() {
    const meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    if (meetings.length === 0) return null;

    const invitationId = AppState.landingParams.invitationId;
    const partnerName = AppState.landingParams.partnerName;
    const partnerPhone = AppState.landingParams.partnerPhone;
    const inviterName = AppState.landingParams.inviterName;

    // First try to find by invitationId if available
    if (invitationId) {
        const byId = meetings.find(m => m.invitationId === invitationId);
        if (byId) return byId;
    }

    // Fallback: find by partner name + phone + inviter combination
    if (partnerName) {
        const byPartner = meetings.find(m =>
            m.partnerName === partnerName &&
            (m.partnerPhone === partnerPhone || !partnerPhone) &&
            (m.inviterName === inviterName || !inviterName)
        );
        if (byPartner) return byPartner;
    }

    return null;
}

function formatMeetingDateForDisplay(meeting) {
    const date = new Date(meeting.date);
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function updateMeetingConfirmedUI(meeting = null) {
    const existing = meeting || getExistingMeetingForInvitation();

    // Mobile bottom bar elements
    const mobileBar = document.getElementById('mobileBottomBar');
    const mobileTitle = document.getElementById('mobileBarTitle');
    const mobileSubtitle = document.getElementById('mobileBarSubtitle');
    const mobileIcon = document.getElementById('mobileBarIcon');
    const mobileBtnText = document.getElementById('mobileBarBtnText');

    // Desktop elements
    const desktopConfirmed = document.getElementById('desktopMeetingConfirmed');
    const desktopForm = document.getElementById('desktopMeetingForm');
    const desktopDate = document.getElementById('desktopConfirmedDate');
    const desktopMethod = document.getElementById('desktopConfirmedMethod');
    const btnChangeDesktop = document.getElementById('btnChangeDesktopMeeting');

    if (existing) {
        const formattedDate = formatMeetingDateForDisplay(existing);
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const methodText = existing.method === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';

        // Update mobile bottom bar
        if (mobileBar) mobileBar.classList.add('confirmed');
        if (mobileTitle) mobileTitle.textContent = 'Umówione spotkanie';
        if (mobileSubtitle) mobileSubtitle.textContent = `${formattedDate}, ${existing.time}`;
        if (mobileIcon) mobileIcon.textContent = '✏️';
        if (mobileBtnText) mobileBtnText.textContent = 'Zmień';

        // Update desktop panel
        if (desktopConfirmed) {
            desktopConfirmed.style.display = 'block';
        }
        if (desktopForm) {
            desktopForm.style.display = 'none';
        }
        if (desktopDate) {
            desktopDate.textContent = `📅 ${formattedDate}, godz. ${existing.time}`;
        }
        if (desktopMethod) {
            desktopMethod.innerHTML = `${methodIcon} ${methodText}`;
        }

        // Setup change button
        if (btnChangeDesktop) {
            btnChangeDesktop.onclick = () => {
                if (desktopConfirmed) desktopConfirmed.style.display = 'none';
                if (desktopForm) desktopForm.style.display = 'block';
                showDesktopExistingMeetingBanner();
            };
        }
    } else {
        // Reset to default state
        if (mobileBar) mobileBar.classList.remove('confirmed');
        if (mobileTitle) mobileTitle.textContent = 'Gotowy na współpracę?';
        if (mobileSubtitle) mobileSubtitle.textContent = 'Umów bezpłatną rozmowę';
        if (mobileIcon) mobileIcon.textContent = '📅';
        if (mobileBtnText) mobileBtnText.textContent = 'Umów się';

        if (desktopConfirmed) desktopConfirmed.style.display = 'none';
        if (desktopForm) desktopForm.style.display = 'block';
    }
}

function showExistingMeetingBanner() {
    const banner = document.getElementById('existingMeetingBanner');
    const detailsEl = document.getElementById('existingMeetingDetails');

    if (!banner || !detailsEl) return;

    const existing = getExistingMeetingForInvitation();

    if (existing) {
        // Store existing meeting ID for later update
        mobileAppState.existingMeetingId = existing.id;

        // Format the date for display
        const date = new Date(existing.date);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')} o ${existing.time}`;

        detailsEl.textContent = `${methodIcon} ${formattedDate}`;
        banner.style.display = 'flex';

        // Pre-select the existing method
        const methodRadio = document.querySelector(`input[name="contactMethod"][value="${existing.method}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            methodRadio.closest('.method-toggle-option')?.classList.add('active');
            document.querySelectorAll('.method-toggle-option').forEach(opt => {
                if (opt !== methodRadio.closest('.method-toggle-option')) {
                    opt.classList.remove('active');
                }
            });
            mobileAppState.selectedMethod = existing.method;
        }
    } else {
        mobileAppState.existingMeetingId = null;
        banner.style.display = 'none';
    }
}

function initBottomSheet() {
    const overlay = document.getElementById('schedulerOverlay');
    const sheet = document.getElementById('schedulerSheet');
    const openBtn = document.getElementById('btnOpenScheduler');
    const closeBtn = document.getElementById('btnCloseScheduler');

    if (!overlay || !sheet || !openBtn) return;

    openBtn.addEventListener('click', () => {
        // Check for existing meeting before showing
        showExistingMeetingBanner();

        overlay.classList.add('active');
        sheet.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeBottomSheet);
    }

    overlay.addEventListener('click', closeBottomSheet);

    // Handle form submission
    const form = document.getElementById('meetingForm');
    if (form) {
        form.addEventListener('submit', handleMobileScheduleSubmit);
    }
}

function closeBottomSheet() {
    const overlay = document.getElementById('schedulerOverlay');
    const sheet = document.getElementById('schedulerSheet');

    if (overlay) overlay.classList.remove('active');
    if (sheet) sheet.classList.remove('active');
    document.body.style.overflow = '';
}

function initMobileDatePicker() {
    const container = document.getElementById('dateScrollContainer');
    if (!container) return;

    const today = new Date();
    const dayNames = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    container.innerHTML = '';

    let daysAdded = 0;
    let dayOffset = 0;

    while (daysAdded < 14 && dayOffset < 30) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);

        const dayOfWeek = date.getDay();
        const isToday = dayOffset === 0;

        // Skip weekends (unless today is weekend)
        if (!isToday && (dayOfWeek === 0 || dayOfWeek === 6)) {
            dayOffset++;
            continue;
        }

        const dateString = date.toISOString().split('T')[0];

        const dateItem = document.createElement('div');
        dateItem.className = `date-scroll-item${isToday ? ' today' : ''}`;
        dateItem.dataset.date = dateString;
        dateItem.innerHTML = `
            <span class="dsi-weekday">${dayNames[dayOfWeek]}</span>
            <span class="dsi-day">${date.getDate()}</span>
            <span class="dsi-month">${monthNames[date.getMonth()]}</span>
            ${isToday ? '<span class="dsi-today-badge">DZIŚ</span>' : ''}
        `;

        dateItem.addEventListener('click', () => {
            document.querySelectorAll('.date-scroll-item').forEach(d => d.classList.remove('selected'));
            dateItem.classList.add('selected');
            mobileAppState.selectedDate = dateString;
            updateMobileSummary();
        });

        container.appendChild(dateItem);
        daysAdded++;
        dayOffset++;
    }
}

function initTimeGrid() {
    const timeGrid = document.getElementById('timeGrid');
    if (!timeGrid) return;

    const timeBtns = timeGrid.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            mobileAppState.selectedTime = btn.dataset.time;
            updateMobileSummary();
        });
    });
}

function initMethodToggle() {
    const methodOptions = document.querySelectorAll('.method-toggle-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', () => {
            methodOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            const input = option.querySelector('input');
            if (input) {
                input.checked = true;
                mobileAppState.selectedMethod = input.value;
            }
            updateMobileSummary();
        });
    });
}

function updateMobileSummary() {
    const dateEl = document.getElementById('summaryDate');
    const methodEl = document.getElementById('summaryMethodText');
    const submitBtn = document.getElementById('btnScheduleSubmit');

    if (mobileAppState.selectedDate && mobileAppState.selectedTime) {
        const date = new Date(mobileAppState.selectedDate);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}, ${mobileAppState.selectedTime}`;
        if (dateEl) dateEl.textContent = formattedDate;

        if (submitBtn) submitBtn.disabled = false;
    } else {
        if (dateEl) dateEl.textContent = 'Wybierz termin';
        if (submitBtn) submitBtn.disabled = true;
    }

    const methodIcon = mobileAppState.selectedMethod === 'phone' ? '📞' : '🎥';
    const methodText = mobileAppState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';
    if (methodEl) methodEl.textContent = `${methodIcon} ${methodText}`;
}

function handleMobileScheduleSubmit(e) {
    e.preventDefault();

    if (!mobileAppState.selectedDate || !mobileAppState.selectedTime) {
        showToast('Wybierz datę i godzinę', 'error');
        return;
    }

    const name = document.getElementById('regName')?.value.trim() || AppState.landingParams.partnerName;
    const phone = document.getElementById('regPhone')?.value.trim() || AppState.landingParams.partnerPhone || '';
    const email = document.getElementById('regEmail')?.value.trim() || AppState.landingParams.partnerEmail || '';

    const date = new Date(mobileAppState.selectedDate);
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;

    const isUpdate = !!mobileAppState.existingMeetingId;

    const meeting = {
        id: isUpdate ? mobileAppState.existingMeetingId : 'meeting_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        partnerName: name,
        partnerPhone: phone,
        partnerEmail: email,
        date: mobileAppState.selectedDate,
        time: mobileAppState.selectedTime,
        method: mobileAppState.selectedMethod,
        formattedDateTime: `${formattedDate}, godz. ${mobileAppState.selectedTime}`,
        inviterName: AppState.landingParams.inviterName,
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    // Save to localStorage (scheduledMeetings - shared with calendar)
    let meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');

    if (isUpdate) {
        // Update existing meeting - remove old one and add updated
        meetings = meetings.filter(m => m.id !== mobileAppState.existingMeetingId);
    }

    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));

    // Zapisz do Supabase
    saveMeetingToSupabase(meeting);

    // Update invitation status
    if (AppState.landingParams.invitationId) {
        updateInvitationStatus(AppState.landingParams.invitationId, 'registered');
    }

    // Close bottom sheet
    closeBottomSheet();

    // Update and show success modal
    const modalDateTime = document.getElementById('modalDateTime');
    const modalMethodIcon = document.getElementById('modalMethodIcon');
    const modalMethodText = document.getElementById('modalMethodText');

    if (modalDateTime) modalDateTime.textContent = meeting.formattedDateTime;
    if (modalMethodIcon) modalMethodIcon.textContent = mobileAppState.selectedMethod === 'phone' ? '📞' : '🎥';
    if (modalMethodText) modalMethodText.textContent = mobileAppState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';

    document.getElementById('successModal').classList.add('active');

    // Update the bottom bar to show confirmed state
    updateMeetingConfirmedUI(meeting);

    showToast(isUpdate ? 'Termin spotkania zmieniony!' : 'Spotkanie umówione!', 'success');
}

function initServicesCarousel() {
    const carousel = document.getElementById('servicesCarousel');
    const dotsContainer = document.getElementById('carouselDots');

    if (!carousel || !dotsContainer) return;

    const slides = carousel.querySelectorAll('.service-slide');
    const dots = dotsContainer.querySelectorAll('.dot');

    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        const slideWidth = slides[0]?.offsetWidth + 12 || 272; // 260 + 12 gap
        const activeIndex = Math.round(scrollLeft / slideWidth);

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    });

    // Make dots clickable
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const slideWidth = slides[0]?.offsetWidth + 12 || 272;
            carousel.scrollTo({
                left: index * slideWidth,
                behavior: 'smooth'
            });
        });
    });
}

function initMobileCalculator() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');

    if (!clientsSlider || !valueSlider || !tierSlider) return;

    function updateRangeBackground(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percentage = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--border-light) ${percentage}%)`;
    }

    [clientsSlider, valueSlider, tierSlider].forEach(slider => {
        slider.addEventListener('input', () => updateRangeBackground(slider));
        updateRangeBackground(slider);
    });
}

// updateMobileInviterInfo - usunięta, personalizacja przez personalizeContent()

function setupHeaderCallButton() {
    const callBtn = document.getElementById('btnCallInviter');
    if (!callBtn) return;

    callBtn.addEventListener('click', () => {
        const phone = window.inviterPhoneNumber;
        if (phone) {
            window.location.href = `tel:${phone.replace(/\s/g, '')}`;
        } else {
            showToast('Brak numeru telefonu', 'info');
        }
    });
}

// ===== DESKTOP VERSION FUNCTIONS =====

let desktopSchedulerState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone',
    dateOffset: 0,
    existingMeetingId: null
};

function showDesktopExistingMeetingBanner() {
    const banner = document.getElementById('desktopExistingMeetingBanner');
    const detailsEl = document.getElementById('desktopExistingMeetingDetails');

    if (!banner || !detailsEl) return;

    const existing = getExistingMeetingForInvitation();

    if (existing) {
        // Store existing meeting ID for later update
        desktopSchedulerState.existingMeetingId = existing.id;

        // Format the date for display
        const date = new Date(existing.date);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')} o ${existing.time}`;

        detailsEl.textContent = `${methodIcon} ${formattedDate}`;
        banner.style.display = 'flex';

        // Pre-select the existing method
        const methodRadio = document.querySelector(`input[name="desktopContactMethod"][value="${existing.method}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            document.querySelectorAll('.method-option').forEach(opt => {
                opt.classList.toggle('active', opt.contains(methodRadio));
            });
            desktopSchedulerState.selectedMethod = existing.method;
        }
    } else {
        desktopSchedulerState.existingMeetingId = null;
        banner.style.display = 'none';
    }
}

function initDesktopScheduler() {
    initDesktopDatePicker();
    initDesktopTimeSlots();
    initDesktopMethodSelector();

    // Check for existing meetings
    showDesktopExistingMeetingBanner();

    const form = document.getElementById('desktopMeetingForm');
    if (form) {
        form.addEventListener('submit', handleDesktopScheduleSubmit);
    }
}

function initDesktopDatePicker() {
    const dateList = document.getElementById('desktopDateList');
    const prevBtn = document.getElementById('desktopDatePrev');
    const nextBtn = document.getElementById('desktopDateNext');

    if (!dateList) return;

    function renderDates() {
        dateList.innerHTML = '';
        const today = new Date();
        const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
        const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + desktopSchedulerState.dateOffset + i);

            const dateStr = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const dayNum = date.getDate();
            const monthName = monthNames[date.getMonth()];

            const isSelected = desktopSchedulerState.selectedDate === dateStr;

            const dateItem = document.createElement('div');
            dateItem.className = `date-item${isSelected ? ' active' : ''}`;
            dateItem.dataset.date = dateStr;
            dateItem.innerHTML = `
                <span class="date-weekday">${dayName}</span>
                <span class="date-day">${dayNum}</span>
                <span class="date-month">${monthName}</span>
            `;

            dateItem.addEventListener('click', () => {
                desktopSchedulerState.selectedDate = dateStr;
                dateList.querySelectorAll('.date-item').forEach(opt => {
                    opt.classList.toggle('active', opt.dataset.date === dateStr);
                });
                updateDesktopSummary();
            });

            dateList.appendChild(dateItem);
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (desktopSchedulerState.dateOffset > 0) {
                desktopSchedulerState.dateOffset -= 7;
                renderDates();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            desktopSchedulerState.dateOffset += 7;
            renderDates();
        });
    }

    renderDates();
}

function initDesktopTimeSlots() {
    const timeSlotsContainer = document.getElementById('desktopTimeSlots');
    if (!timeSlotsContainer) return;

    const timeSlots = timeSlotsContainer.querySelectorAll('.time-slot');

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            const time = slot.dataset.time;
            desktopSchedulerState.selectedTime = time;

            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');

            updateDesktopSummary();
        });
    });
}

function initDesktopMethodSelector() {
    const methodOptions = document.querySelectorAll('.desktop-layout .method-option');

    methodOptions.forEach(option => {
        const input = option.querySelector('input');

        option.addEventListener('click', () => {
            methodOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            if (input) {
                input.checked = true;
                desktopSchedulerState.selectedMethod = input.value;
                updateDesktopSummary();
            }
        });
    });
}

function updateDesktopSummary() {
    const summaryBox = document.getElementById('desktopSchedulerSummary');
    const summaryDateTime = document.getElementById('desktopSummaryDateTime');
    const summaryMethod = document.getElementById('desktopSummaryMethod');
    const submitBtn = document.getElementById('desktopBtnSchedule');

    const { selectedDate, selectedTime, selectedMethod } = desktopSchedulerState;

    if (selectedDate && selectedTime) {
        const date = new Date(selectedDate);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                          'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;

        if (summaryDateTime) {
            summaryDateTime.textContent = `${formattedDate} o ${selectedTime}`;
        }

        if (summaryMethod) {
            summaryMethod.textContent = selectedMethod === 'phone'
                ? '📞 Rozmowa telefoniczna'
                : '🎥 Video rozmowa';
        }

        if (summaryBox) {
            summaryBox.classList.add('ready');
        }

        if (submitBtn) {
            submitBtn.disabled = false;
        }
    } else {
        if (summaryBox) {
            summaryBox.classList.remove('ready');
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }
}

function handleDesktopScheduleSubmit(e) {
    e.preventDefault();

    const { selectedDate, selectedTime, selectedMethod, existingMeetingId } = desktopSchedulerState;

    if (!selectedDate || !selectedTime) {
        showToast('Wybierz datę i godzinę', 'error');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isUpdate = !!existingMeetingId;

    const meeting = {
        id: isUpdate ? existingMeetingId : 'meeting_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        time: selectedTime,
        method: selectedMethod,
        partnerName: urlParams.get('n') || 'Partner',
        partnerPhone: urlParams.get('p') || '',
        partnerEmail: urlParams.get('e') || '',
        inviterName: urlParams.get('z') || 'Nieznany',
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    let meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');

    if (isUpdate) {
        // Update existing meeting - remove old one and add updated
        meetings = meetings.filter(m => m.id !== existingMeetingId);
    }

    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));

    // Zapisz do Supabase
    saveMeetingToSupabase(meeting);

    // Update invitation status
    if (AppState.landingParams.invitationId) {
        updateInvitationStatus(AppState.landingParams.invitationId, 'registered');
    }

    // Show success modal
    const date = new Date(selectedDate);
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

    const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} o ${selectedTime}`;

    const modalDateTime = document.getElementById('modalDateTime');
    const modalMethodIcon = document.getElementById('modalMethodIcon');
    const modalMethodText = document.getElementById('modalMethodText');

    if (modalDateTime) modalDateTime.textContent = formattedDate;
    if (modalMethodIcon) modalMethodIcon.textContent = selectedMethod === 'phone' ? '📞' : '🎥';
    if (modalMethodText) modalMethodText.textContent = selectedMethod === 'phone'
        ? 'Rozmowa telefoniczna'
        : 'Video rozmowa';

    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.style.display = 'flex';
    }

    // Update UI to show confirmed state
    updateMeetingConfirmedUI(meeting);

    showToast(isUpdate ? 'Termin spotkania zmieniony!' : 'Spotkanie umówione!', 'success');
}

function initDesktopCalculator() {
    console.log('initDesktopCalculator called');

    const clientsSlider = document.getElementById('desktopCalcClients');
    const valueSlider = document.getElementById('desktopCalcValue');
    const tierInput = document.getElementById('desktopCalcTier');
    const tierSelector = document.getElementById('desktopTierSelector');

    console.log('clientsSlider:', clientsSlider);
    console.log('valueSlider:', valueSlider);
    console.log('tierInput:', tierInput);
    console.log('tierSelector:', tierSelector);

    if (!clientsSlider || !valueSlider || !tierInput) {
        console.log('Desktop calculator elements not found, skipping init');
        return;
    }

    const clientsValue = document.getElementById('desktopCalcClientsValue');
    const valueDisplay = document.getElementById('desktopCalcValueDisplay');
    const resultMonthly = document.getElementById('desktopResultMonthly');
    const resultQuarterly = document.getElementById('desktopResultQuarterly');
    const resultYearly = document.getElementById('desktopResultYearly');

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function updateRangeBackground(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percentage = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #667eea 0%, #667eea ${percentage}%, #e2e8f0 ${percentage}%)`;
    }

    function calculateResults() {
        const clients = parseInt(clientsSlider.value);
        const value = parseInt(valueSlider.value);
        const tier = parseInt(tierInput.value);

        if (clientsValue) clientsValue.textContent = clients;
        if (valueDisplay) valueDisplay.textContent = formatNumber(value);

        // Update slider backgrounds
        updateRangeBackground(clientsSlider);
        updateRangeBackground(valueSlider);

        const monthly = Math.round(clients * value * (tier / 100));
        const quarterly = monthly * 3;
        const yearly = monthly * 12;

        if (resultMonthly) resultMonthly.textContent = formatNumber(monthly) + ' zł';
        if (resultQuarterly) resultQuarterly.textContent = formatNumber(quarterly) + ' zł';
        if (resultYearly) resultYearly.textContent = formatNumber(yearly) + ' zł';
    }

    // Tier buttons handler
    if (tierSelector) {
        const tierBtns = tierSelector.querySelectorAll('.tier-btn-desktop');
        tierBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all
                tierBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Update hidden input
                const tierValue = this.getAttribute('data-tier');
                tierInput.value = tierValue;
                // Recalculate
                calculateResults();
            });
        });
    }

    // Slider event listeners
    console.log('Adding event listeners to sliders');
    clientsSlider.addEventListener('input', function() {
        console.log('clientsSlider input event fired, value:', this.value);
        calculateResults();
    });
    valueSlider.addEventListener('input', function() {
        console.log('valueSlider input event fired, value:', this.value);
        calculateResults();
    });

    // Initial calculation
    console.log('Running initial calculateResults');
    calculateResults();
    console.log('initDesktopCalculator completed');
}

// updateDesktopInviterInfo - usunięta, personalizacja przez personalizeContent()

function initDesktopApp() {
    console.log('initDesktopApp called');
    initDesktopCalculator();
    initDesktopScheduler();

    // Check for existing meeting and update UI
    updateMeetingConfirmedUI();

    console.log('initDesktopApp completed');
}

// ============ PHOTO PICKER FOR EDIT INVITER ============

const DEFAULT_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";

function initPhotoPicker() {
    const fileInput = document.getElementById('editInviterPhotoFile');
    const preview = document.getElementById('editInviterPhotoPreview');
    const hiddenInput = document.getElementById('editInviterPhoto');
    const removeBtn = document.getElementById('btnRemovePhoto');

    if (!fileInput) return;

    // Obsługa wyboru pliku
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Sprawdź rozmiar (max 500KB)
            if (file.size > 500 * 1024) {
                showToast('Zdjęcie za duże. Maksymalnie 500 KB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                preview.src = base64;
                hiddenInput.value = base64;
                removeBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Obsługa usunięcia zdjęcia
    removeBtn.addEventListener('click', function() {
        preview.src = DEFAULT_PHOTO;
        hiddenInput.value = '';
        fileInput.value = '';
        removeBtn.style.display = 'none';
    });
}

// Rozszerz funkcję otwierania modalu edycji
const originalOpenEditInviterModal = openEditInviterModal;
openEditInviterModal = function(id) {
    originalOpenEditInviterModal(id);

    setTimeout(() => {
        initPhotoPicker();

        const inviter = InvitersState.inviters.find(inv => inv.id === id);
        const preview = document.getElementById('editInviterPhotoPreview');
        const hiddenInput = document.getElementById('editInviterPhoto');
        const removeBtn = document.getElementById('btnRemovePhoto');
        const fileInput = document.getElementById('editInviterPhotoFile');

        if (inviter && inviter.photo) {
            preview.src = inviter.photo;
            hiddenInput.value = inviter.photo;
            removeBtn.style.display = 'block';
        } else {
            preview.src = DEFAULT_PHOTO;
            hiddenInput.value = '';
            removeBtn.style.display = 'none';
        }

        // Resetuj file input
        if (fileInput) fileInput.value = '';
    }, 100);
};

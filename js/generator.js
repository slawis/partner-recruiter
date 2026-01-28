/* ========================================
   PARTNER RECRUITER - GENERATOR MODE
   Panel generatora, historia, kalendarz
   ======================================== */

// ============ CALENDAR STATE ============
let calendarFilter = 'all';

// ============ STATS FILTER STATE ============
let StatsFilter = {
    type: 'all', // all, today, week, month, custom
    customFrom: null,
    customTo: null
};

// ============ GENERATOR INITIALIZATION ============
async function initGenerator() {
    // Initialize stats filter
    initStatsFilter();

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
    const btnDownloadQR = document.getElementById('btnDownloadQR');

    if (btnCopyEmail) btnCopyEmail.addEventListener('click', copyEmail);
    if (btnCopyLink) btnCopyLink.addEventListener('click', copyLink);
    if (btnOpenPreview) btnOpenPreview.addEventListener('click', openPreview);
    if (btnClearHistory) btnClearHistory.addEventListener('click', clearHistory);
    if (btnDownloadQR) btnDownloadQR.addEventListener('click', downloadQR);
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
                <div class="meeting-method ${meeting.method}">
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

// ============ STATS DATE FILTER ============
function initStatsFilter() {
    // Załaduj zapisany filtr
    const savedFilter = localStorage.getItem('statsFilter');
    if (savedFilter) {
        try {
            const parsed = JSON.parse(savedFilter);
            StatsFilter = { ...StatsFilter, ...parsed };
        } catch (e) {
            console.error('Error loading stats filter:', e);
        }
    }

    // Ustaw aktywny pill
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filter === StatsFilter.type);

        pill.addEventListener('click', () => {
            const filterType = pill.dataset.filter;

            // Toggle custom date range visibility
            const customRange = document.getElementById('customDateRange');
            if (filterType === 'custom') {
                customRange.style.display = customRange.style.display === 'none' ? 'flex' : 'none';
                if (customRange.style.display === 'flex') {
                    // Ustaw domyślne daty jeśli brak
                    const fromInput = document.getElementById('filterDateFrom');
                    const toInput = document.getElementById('filterDateTo');
                    if (!fromInput.value) {
                        const today = new Date();
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        fromInput.value = monthAgo.toISOString().split('T')[0];
                        toInput.value = today.toISOString().split('T')[0];
                    }
                }
                return;
            }

            // Ukryj custom range dla innych filtrów
            if (customRange) customRange.style.display = 'none';

            // Ustaw aktywny pill
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // Zastosuj filtr
            StatsFilter.type = filterType;
            saveStatsFilter();
            updateStatsDisplay();
        });
    });

    // Przycisk "OK" dla custom range
    const btnApplyRange = document.getElementById('btnApplyRange');
    if (btnApplyRange) {
        btnApplyRange.addEventListener('click', () => {
            const fromInput = document.getElementById('filterDateFrom');
            const toInput = document.getElementById('filterDateTo');
            const customRange = document.getElementById('customDateRange');

            console.log('Applying custom range:', fromInput.value, '-', toInput.value);

            StatsFilter.type = 'custom';
            StatsFilter.customFrom = fromInput.value;
            StatsFilter.customTo = toInput.value;

            // Ustaw aktywny pill
            const pills = document.querySelectorAll('.filter-pill');
            pills.forEach(p => p.classList.toggle('active', p.dataset.filter === 'custom'));

            // Zamknij date picker
            if (customRange) customRange.style.display = 'none';

            saveStatsFilter();
            updateStatsDisplay();

            console.log('Filter applied, filtered count:', getFilteredInvitations().length);
        });
    }

    // Jeśli custom był wybrany, pokaż zakres dat
    if (StatsFilter.type === 'custom') {
        const customRange = document.getElementById('customDateRange');
        if (customRange) {
            customRange.style.display = 'flex';
            const fromInput = document.getElementById('filterDateFrom');
            const toInput = document.getElementById('filterDateTo');
            if (StatsFilter.customFrom) fromInput.value = StatsFilter.customFrom;
            if (StatsFilter.customTo) toInput.value = StatsFilter.customTo;
        }
    }
}

function saveStatsFilter() {
    localStorage.setItem('statsFilter', JSON.stringify(StatsFilter));
}

function getFilteredInvitations() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return AppState.history.filter(inv => {
        if (StatsFilter.type === 'all') return true;

        // Sprawdź czy sentAt istnieje
        if (!inv.sentAt) return true; // Pokaż zaproszenia bez daty

        const sentDate = new Date(inv.sentAt);
        if (isNaN(sentDate.getTime())) return true; // Invalid date - pokaż

        const sentDay = new Date(sentDate.getFullYear(), sentDate.getMonth(), sentDate.getDate());

        switch (StatsFilter.type) {
            case 'today':
                return sentDay.getTime() === today.getTime();

            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return sentDay >= weekAgo;

            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return sentDay >= monthAgo;

            case 'custom':
                if (!StatsFilter.customFrom || !StatsFilter.customTo) return true;
                const from = new Date(StatsFilter.customFrom);
                const to = new Date(StatsFilter.customTo);
                to.setHours(23, 59, 59, 999); // Include the whole "to" day
                return sentDate >= from && sentDate <= to;

            default:
                return true;
        }
    });
}

function updateStatsDisplay() {
    const statSent = document.getElementById('statSent');
    const statOpened = document.getElementById('statOpened');
    const statConverted = document.getElementById('statConverted');

    // Filtruj zaproszenia według wybranego zakresu dat
    const filtered = getFilteredInvitations();

    const stats = {
        sent: filtered.length,
        opened: filtered.filter(i => i.status === 'opened' || i.status === 'registered').length,
        converted: filtered.filter(i => i.status === 'registered').length
    };

    if (statSent) statSent.textContent = stats.sent;
    if (statOpened) statOpened.textContent = stats.opened;
    if (statConverted) statConverted.textContent = stats.converted;
}

// ============ EMAIL PREVIEW ============
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

// ============ INVITATION GENERATION ============
function handleGenerateInvitation(e) {
    e.preventDefault();
    console.log('handleGenerateInvitation called');

    const partnerNameEl = document.getElementById('partnerName');
    const inviterSelectEl = document.getElementById('inviterSelect');
    const styleEl = document.querySelector('input[name="emailStyle"]:checked');

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

    if (!partnerName || !inviterKey) {
        showToast('Wypełnij wymagane pola', 'error');
        return;
    }

    // Sprawdź czy jesteśmy w trybie edycji
    const isEditing = AppState.editingInvitationId !== null;

    // Sprawdź czy już istnieje zaproszenie dla tego partnera (ten sam telefon lub email)
    // Pomiń to sprawdzenie jeśli edytujemy to samo zaproszenie
    const existingInvitation = AppState.history.find(inv => {
        // Pomiń edytowane zaproszenie
        if (isEditing && inv.id === AppState.editingInvitationId) return false;
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

    // Użyj istniejącego ID przy edycji lub wygeneruj nowy
    const invitationId = isEditing ? AppState.editingInvitationId : generateId();

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

    // Dodaj lub zaktualizuj w historii
    if (isEditing) {
        // Tryb edycji - zaktualizuj istniejące zaproszenie
        const existingIndex = AppState.history.findIndex(inv => inv.id === AppState.editingInvitationId);
        if (existingIndex !== -1) {
            // Zachowaj oryginalną datę utworzenia i status
            AppState.currentInvitation.createdAt = AppState.history[existingIndex].createdAt || AppState.currentInvitation.createdAt;
            AppState.currentInvitation.status = AppState.history[existingIndex].status;
            AppState.currentInvitation.updatedAt = new Date().toISOString();
            AppState.history[existingIndex] = AppState.currentInvitation;
        }
    } else {
        // Nowe zaproszenie
        AppState.history.unshift(AppState.currentInvitation);
        AppState.stats.sent++;
    }
    saveState();

    // Zapisz do Supabase (insert lub update)
    if (isEditing) {
        updateInvitationInSupabase({
            id: invitationId,
            partnerName,
            partnerPhone,
            partnerEmail,
            inviterKey,
            link
        });
    } else {
        saveInvitationToSupabase({
            id: invitationId,
            partnerName,
            partnerLastName,
            partnerCompany,
            partnerPhone,
            partnerEmail,
            inviterKey,
            inviterName: inviterInfo.name,
            styleKey: style,
            styleName: styleConfig.name,
            status: 'sent',
            link,
            sentAt: new Date().toISOString()
        });
    }

    // Auto-zapis partnera (pośrednika)
    if (typeof findOrCreatePartner === 'function') {
        findOrCreatePartner({
            name: partnerName,
            lastName: partnerLastName,
            company: partnerCompany,
            nip: partnerNIP,
            phone: partnerPhone,
            email: partnerEmail,
            address: partnerAddress
        }, inviterKey).then(() => {
            // Aktualizuj badge pośredników
            if (typeof updateNavigationBadges === 'function') {
                updateNavigationBadges();
            }
        }).catch(err => {
            console.error('Error saving partner:', err);
        });
    }

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
    document.getElementById('btnDownloadQR').disabled = false;

    // Generate QR code
    generateQRCode(link);

    // Update preview frame
    const previewFrame = document.querySelector('.preview-frame');
    const fullName = partnerLastName ? `${partnerName} ${partnerLastName}` : partnerName;
    const actionText = isEditing ? 'zaktualizowane' : 'wygenerowane';
    previewFrame.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <span style="font-size: 48px; display: block; margin-bottom: 16px;">✅</span>
            <p style="color: var(--text-primary); font-size: 16px; margin-bottom: 8px;">Zaproszenie ${actionText}!</p>
            <p style="color: var(--text-secondary); font-size: 14px;">Dla: <strong>${fullName}</strong></p>
            ${partnerCompany ? `<p style="color: var(--text-muted); font-size: 13px;">${partnerCompany}</p>` : ''}
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 16px;">Kliknij "Otwórz stronę" aby zobaczyć podgląd</p>
        </div>
    `;

    showToast(`Zaproszenie ${actionText}!`, 'success');

    // Reset formularza po wygenerowaniu (żeby uniknąć duplikatów)
    document.getElementById('generatorForm').reset();

    // Wyczyść stan edycji i przywróć tekst przycisku
    AppState.editingInvitationId = null;
    const btnText = document.getElementById('btnGenerateText');
    if (btnText) {
        btnText.textContent = 'Generuj zaproszenie';
    }

    // Switch to email tab
    switchPreviewTab('email');
}

// ============ LINK GENERATION ============
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

    // Add inviter details from InvitersState
    const inviter = InvitersState.inviters.find(inv => inv.key === inviterKey);
    if (inviter) {
        params.set('zn', inviter.name);
        if (inviter.phone) params.set('zp', inviter.phone);
        if (inviter.email) params.set('ze', inviter.email);
        if (inviter.role) params.set('zr', inviter.role);
        if (inviter.bio) params.set('zb', inviter.bio);
        if (inviter.photo) params.set('zph', inviter.photo);
    }

    return `${CONFIG.baseUrl}?${params.toString()}`;
}

// ============ PREVIEW TABS ============
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

// ============ COPY/PREVIEW FUNCTIONS ============
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

// ============ HISTORY MANAGEMENT ============
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
                    <button class="action-btn" onclick="editInvitation('${inv.id}')" title="Edytuj">✏️</button>
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

// Edycja zaproszenia - wypełnia formularz danymi i przełącza na Generator
function editInvitation(id) {
    const inv = AppState.history.find(i => i.id === id);
    if (!inv) {
        showToast('Nie znaleziono zaproszenia', 'error');
        return;
    }

    // Przełącz na sekcję Generator
    if (typeof switchSection === 'function') {
        switchSection('generator');
    }

    // Wypełnij formularz danymi zaproszenia
    const partnerNameEl = document.getElementById('partnerName');
    const partnerLastNameEl = document.getElementById('partnerLastName');
    const partnerCompanyEl = document.getElementById('partnerCompany');
    const partnerNIPEl = document.getElementById('partnerNIP');
    const partnerPhoneEl = document.getElementById('partnerPhone');
    const partnerEmailEl = document.getElementById('partnerEmail');
    const partnerAddressEl = document.getElementById('partnerAddress');
    const inviterSelectEl = document.getElementById('inviterSelect');
    const emailStyleEl = document.getElementById('emailStyle');

    if (partnerNameEl) partnerNameEl.value = inv.partnerName || '';
    if (partnerLastNameEl) partnerLastNameEl.value = inv.partnerLastName || '';
    if (partnerCompanyEl) partnerCompanyEl.value = inv.partnerCompany || '';
    if (partnerNIPEl) partnerNIPEl.value = inv.partnerNIP || '';
    if (partnerPhoneEl) partnerPhoneEl.value = inv.partnerPhone || '';
    if (partnerEmailEl) partnerEmailEl.value = inv.partnerEmail || '';
    if (partnerAddressEl) partnerAddressEl.value = inv.partnerAddress || '';

    // Ustaw zapraszającego
    if (inviterSelectEl && inv.inviterKey) {
        inviterSelectEl.value = inv.inviterKey;
    }

    // Ustaw styl emaila
    if (emailStyleEl && inv.styleKey) {
        emailStyleEl.value = inv.styleKey;
    }

    // Zaktualizuj podgląd emaila
    if (typeof updateEmailPreview === 'function') {
        updateEmailPreview();
    }

    // Zapisz ID edytowanego zaproszenia (do użycia przy generowaniu)
    AppState.editingInvitationId = id;

    // Zmień tekst przycisku na "Aktualizuj zaproszenie"
    const btnText = document.getElementById('btnGenerateText');
    if (btnText) {
        btnText.textContent = 'Aktualizuj zaproszenie';
    }

    showToast('Dane załadowane do formularza', 'info');
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

// ============ ROLE-BASED UI ============
function applyRoleBasedUI() {
    const btnSettings = document.getElementById('btnSettings');

    if (isDoradca()) {
        // Doradca nie widzi ustawień (zarządzanie doradcami)
        if (btnSettings) btnSettings.style.display = 'none';
    } else if (isAdmin()) {
        // Admin widzi wszystko
        if (btnSettings) btnSettings.style.display = '';
    }
}

// ============ QR CODE GENERATION ============
async function generateQRCode(link) {
    const canvas = document.getElementById('qrCanvas');
    const placeholder = document.getElementById('qrPlaceholder');

    if (!canvas || typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded or canvas not found');
        return;
    }

    try {
        // Generate QR code
        await QRCode.toCanvas(canvas, link, {
            width: 200,
            margin: 2,
            color: {
                dark: '#1e293b',
                light: '#ffffff'
            }
        });

        // Show canvas, hide placeholder
        canvas.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } catch (err) {
        console.error('Error generating QR code:', err);
        showToast('Błąd generowania kodu QR', 'error');
    }
}

function downloadQR() {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas || !AppState.currentInvitation) return;

    // Create a link and download
    const link = document.createElement('a');
    const partnerName = AppState.currentInvitation.partnerName || 'partner';
    const safeName = partnerName.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '_');
    link.download = `QR_${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Kod QR pobrany!', 'success');
}

// ============ GLOBAL FUNCTIONS ============
window.deleteMeeting = deleteMeeting;
window.deleteInvitation = deleteInvitation;
window.updateDeleteSelectedButton = updateDeleteSelectedButton;
window.copyInvitationLink = copyInvitationLink;
window.openInvitationLink = openInvitationLink;
window.downloadQR = downloadQR;

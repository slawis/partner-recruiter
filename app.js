/* ========================================
   PARTNER RECRUITER - APPLICATION
   Generator + Landing Page Logic
   ======================================== */

// ============ CONFIGURATION ============
const CONFIG = {
    baseUrl: window.location.origin + window.location.pathname,
    inviters: {
        'Sławek': { name: 'Sławek', role: 'Właściciel', phone: '' },
        'Marcin': { name: 'Marcin Górecki', role: 'Manager', phone: '606 285 419' },
        'Irek': { name: 'Irek Lewandowski', role: 'Manager', phone: '533 210 540' }
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
document.addEventListener('DOMContentLoaded', () => {
    detectMode();
    loadState();

    if (AppState.mode === 'generator') {
        initGenerator();
    } else {
        initLanding();
    }
});

function detectMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasLandingParams = urlParams.has('n') || urlParams.has('z');

    if (hasLandingParams) {
        AppState.mode = 'landing';
        AppState.landingParams = {
            partnerName: urlParams.get('n') || 'Partnerze',
            partnerLastName: urlParams.get('ln') || null,
            partnerCompany: urlParams.get('c') || null,
            partnerNIP: urlParams.get('nip') || null,
            partnerPhone: urlParams.get('p') || null,
            partnerEmail: urlParams.get('e') || null,
            partnerAddress: urlParams.get('a') || null,
            inviterName: urlParams.get('z') || 'Partner',
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

function loadState() {
    const savedHistory = localStorage.getItem('recruiter_history');
    const savedStats = localStorage.getItem('recruiter_stats');

    if (savedHistory) {
        AppState.history = JSON.parse(savedHistory);
    }
    if (savedStats) {
        AppState.stats = JSON.parse(savedStats);
    }
}

function saveState() {
    localStorage.setItem('recruiter_history', JSON.stringify(AppState.history));
    localStorage.setItem('recruiter_stats', JSON.stringify(AppState.stats));
}

// ============ GENERATOR MODE ============
function initGenerator() {
    // Update stats display
    updateStatsDisplay();

    // Render history
    renderHistory();

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
    document.getElementById('generatorForm').addEventListener('submit', handleGenerateInvitation);

    // Preview tabs
    const tabs = document.querySelectorAll('.preview-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchPreviewTab(tabId);
        });
    });

    // Copy buttons
    document.getElementById('btnCopyEmail').addEventListener('click', copyEmail);
    document.getElementById('btnCopyLink').addEventListener('click', copyLink);
    document.getElementById('btnOpenPreview').addEventListener('click', openPreview);

    // Clear history
    document.getElementById('btnClearHistory').addEventListener('click', clearHistory);
}

function updateStatsDisplay() {
    document.getElementById('statSent').textContent = AppState.stats.sent;
    document.getElementById('statOpened').textContent = AppState.stats.opened;
    document.getElementById('statConverted').textContent = AppState.stats.converted;
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

    const partnerName = document.getElementById('partnerName').value.trim();
    const partnerLastName = document.getElementById('partnerLastName').value.trim();
    const partnerCompany = document.getElementById('partnerCompany').value.trim();
    const partnerNIP = document.getElementById('partnerNIP').value.trim();
    const partnerPhone = document.getElementById('partnerPhone').value.trim();
    const partnerEmail = document.getElementById('partnerEmail').value.trim();
    const partnerAddress = document.getElementById('partnerAddress').value.trim();
    const inviterKey = document.getElementById('inviterSelect').value;
    const style = document.querySelector('input[name="emailStyle"]:checked').value;

    if (!partnerName || !inviterKey) {
        showToast('Wypełnij wymagane pola', 'error');
        return;
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
    const inviterInfo = CONFIG.inviters[inviterKey];

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

    if (AppState.history.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">Brak wysłanych zaproszeń</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = AppState.history.slice(0, 20).map(inv => {
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
            <tr>
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
                <td>
                    <button class="action-btn" onclick="copyInvitationLink('${inv.id}')" title="Kopiuj link">🔗</button>
                    <button class="action-btn" onclick="openInvitationLink('${inv.id}')" title="Otwórz">🚀</button>
                </td>
            </tr>
        `;
    }).join('');
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
    if (confirm('Czy na pewno chcesz wyczyścić historię?')) {
        AppState.history = [];
        AppState.stats = { sent: 0, opened: 0, converted: 0 };
        saveState();
        updateStatsDisplay();
        renderHistory();
        showToast('Historia wyczyszczona', 'success');
    }
}

// ============ LANDING MODE ============
function initLanding() {
    // Personalize content
    personalizeContent();

    // Initialize calculator
    initCalculator();

    // Initialize meeting scheduler
    initMeetingScheduler();
}

function personalizeContent() {
    const {
        partnerName,
        partnerLastName,
        partnerCompany,
        partnerNIP,
        partnerPhone,
        partnerEmail,
        partnerAddress,
        inviterName
    } = AppState.landingParams;

    // Update all personalized elements
    document.getElementById('partnerDisplayName').textContent = partnerName;
    document.getElementById('inviterName').textContent = inviterName;
    document.getElementById('ctaInviterName').textContent = CONFIG.inviters[inviterName]?.name || inviterName;
    document.getElementById('modalInviterName').textContent = CONFIG.inviters[inviterName]?.name || inviterName;

    // Pre-fill registration form with name and other data
    document.getElementById('regName').value = partnerName !== 'Partnerze' ? partnerName : '';
    if (partnerPhone) {
        document.getElementById('regPhone').value = partnerPhone;
    }
    if (partnerEmail) {
        document.getElementById('regEmail').value = partnerEmail;
    }

    // Populate partner info card
    const partnerInfoCard = document.getElementById('partnerInfoCard');
    const hasExtraInfo = partnerLastName || partnerCompany || partnerNIP || partnerPhone || partnerEmail || partnerAddress;

    if (hasExtraInfo && partnerInfoCard) {
        partnerInfoCard.style.display = 'block';

        // Full name
        const fullName = partnerLastName ? `${partnerName} ${partnerLastName}` : partnerName;
        document.getElementById('cardPartnerFullName').textContent = fullName;

        // Company
        const companyEl = document.getElementById('cardPartnerCompany');
        if (partnerCompany) {
            companyEl.textContent = partnerCompany;
            companyEl.style.display = 'block';
        } else {
            companyEl.style.display = 'none';
        }

        // NIP
        const nipRow = document.getElementById('cardNIPRow');
        if (partnerNIP) {
            document.getElementById('cardPartnerNIP').textContent = partnerNIP;
            nipRow.style.display = 'flex';
        } else {
            nipRow.style.display = 'none';
        }

        // Phone
        const phoneRow = document.getElementById('cardPhoneRow');
        if (partnerPhone) {
            document.getElementById('cardPartnerPhone').textContent = partnerPhone;
            phoneRow.style.display = 'flex';
        } else {
            phoneRow.style.display = 'none';
        }

        // Email
        const emailRow = document.getElementById('cardEmailRow');
        if (partnerEmail) {
            document.getElementById('cardPartnerEmail').textContent = partnerEmail;
            emailRow.style.display = 'flex';
        } else {
            emailRow.style.display = 'none';
        }

        // Address
        const addressRow = document.getElementById('cardAddressRow');
        if (partnerAddress) {
            document.getElementById('cardPartnerAddress').textContent = partnerAddress;
            addressRow.style.display = 'flex';
        } else {
            addressRow.style.display = 'none';
        }
    }
}

function initCalculator() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');

    function updateCalculator() {
        const clients = parseInt(clientsSlider.value);
        const avgValue = parseInt(valueSlider.value);
        const tierPercent = parseInt(tierSlider.value);

        // Update display values
        document.getElementById('calcClientsValue').textContent = clients;
        document.getElementById('calcValueDisplay').textContent = avgValue.toLocaleString('pl-PL');
        document.getElementById('calcTierValue').textContent = tierPercent;

        // Calculate earnings
        const monthlyCommission = clients * avgValue * (tierPercent / 100);
        const quarterlyCommission = monthlyCommission * 3;
        const yearlyCommission = monthlyCommission * 12;

        // Update results
        document.getElementById('resultMonthly').textContent = formatCurrency(monthlyCommission);
        document.getElementById('resultQuarterly').textContent = formatCurrency(quarterlyCommission);
        document.getElementById('resultYearly').textContent = formatCurrency(yearlyCommission);

        // Update projection chart
        updateProjectionChart(clients, avgValue, tierPercent);
    }

    clientsSlider.addEventListener('input', updateCalculator);
    valueSlider.addEventListener('input', updateCalculator);
    tierSlider.addEventListener('input', updateCalculator);

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

    // Update summary stats
    document.getElementById('summaryTotal5Year').textContent = formatCurrency(year5.cumulativeEarnings);
    document.getElementById('summaryAvgMonthly').textContent = formatCurrency(year5.cumulativeEarnings / 60);
    document.getElementById('summaryTotalClients').textContent = year5.cumulativeClients.toLocaleString('pl-PL');
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

    // Setup date navigation
    document.getElementById('datePrev').addEventListener('click', () => {
        if (schedulerState.dateOffset > 0) {
            schedulerState.dateOffset -= 5;
            generateDateOptions();
        }
    });

    document.getElementById('dateNext').addEventListener('click', () => {
        if (schedulerState.dateOffset < 9) {
            schedulerState.dateOffset += 5;
            generateDateOptions();
        }
    });

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

    // Setup form submission
    document.getElementById('meetingForm').addEventListener('submit', handleMeetingSchedule);
}

function generateDateOptions() {
    const dateList = document.getElementById('dateList');
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

    // Update navigation buttons
    document.getElementById('datePrev').disabled = schedulerState.dateOffset === 0;
    document.getElementById('dateNext').disabled = schedulerState.dateOffset >= 15;
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
        dateTimeEl.textContent = `${formattedDate}, godz. ${schedulerState.selectedTime}`;

        summary.classList.add('ready');
    } else {
        dateTimeEl.textContent = '-';
        summary.classList.remove('ready');
    }

    const methodIcon = schedulerState.selectedMethod === 'phone' ? '📞' : '🎥';
    const methodText = schedulerState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';
    methodEl.textContent = `${methodIcon} ${methodText}`;

    updateScheduleButton();
}

function updateScheduleButton() {
    const btn = document.getElementById('btnSchedule');

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

function trackOpening(invitationId) {
    // Load history from localStorage
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

function updateInvitationStatus(invitationId, status) {
    const savedHistory = localStorage.getItem('recruiter_history');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const invitation = history.find(inv => inv.id === invitationId);

        if (invitation) {
            invitation.status = status;
            if (status === 'registered') {
                invitation.registeredAt = new Date().toISOString();

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
    document.getElementById('successModal').classList.remove('active');
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

function initSettings() {
    // Load saved inviters
    loadInviters();

    // Open/Close settings
    document.getElementById('btnOpenSettings').addEventListener('click', openSettings);
    document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);

    // Close settings on backdrop click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettings();
        }
    });

    // Add inviter form
    document.getElementById('addInviterForm').addEventListener('submit', handleAddInviter);

    // Edit inviter form
    document.getElementById('editInviterForm').addEventListener('submit', handleEditInviter);

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

function loadInviters() {
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

function saveInviters() {
    localStorage.setItem('recruiter_inviters', JSON.stringify(InvitersState.inviters));

    // Also update CONFIG.inviters for backward compatibility
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

function handleAddInviter(e) {
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
    saveInviters();

    // Reset form
    document.getElementById('addInviterForm').reset();

    // Update UI
    renderInvitersList();
    updateInviterSelect();

    showToast('Zapraszający dodany!', 'success');
}

function handleEditInviter(e) {
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

        saveInviters();
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

function deleteInviter(id) {
    if (!confirm('Czy na pewno chcesz usunąć tego zapraszającego?')) return;

    InvitersState.inviters = InvitersState.inviters.filter(inv => inv.id !== id);
    saveInviters();
    renderInvitersList();
    updateInviterSelect();

    showToast('Zapraszający usunięty', 'success');
}

function renderInvitersList() {
    const container = document.getElementById('invitersList');

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
initGenerator = function() {
    originalInitGenerator();
    initSettings();
};

// ============ LANDING PAGE INVITER DISPLAY ============
function displayInviterOnLanding() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterName = urlParams.get('z') || 'Partner';
    const inviterPhone = urlParams.get('zp') || '';
    const inviterEmail = urlParams.get('ze') || '';
    const inviterRole = urlParams.get('zr') || '';
    const inviterBio = urlParams.get('zb') || '';
    const inviterPhoto = urlParams.get('zph') || '';

    // Get inviter info from CONFIG (fallback)
    const inviterInfo = CONFIG.inviters[inviterName] || {};

    // Use URL params first, then CONFIG fallback
    const finalPhone = inviterPhone || inviterInfo.phone || '';
    const finalEmail = inviterEmail || inviterInfo.email || '';
    const finalRole = inviterRole || inviterInfo.role || '';
    const finalBio = inviterBio || inviterInfo.bio || '';
    const finalPhoto = inviterPhoto || inviterInfo.photo || '';
    const finalName = inviterInfo.name || inviterName;

    // Update inviter card
    const inviterCard = document.getElementById('inviterCard');
    const inviterPhotoEl = document.getElementById('inviterPhoto');
    const ctaInviterName = document.getElementById('ctaInviterName');
    const ctaInviterRole = document.getElementById('ctaInviterRole');
    const ctaInviterPhone = document.getElementById('ctaInviterPhone');
    const ctaInviterPhoneLink = document.getElementById('ctaInviterPhoneLink');
    const ctaInviterEmail = document.getElementById('ctaInviterEmail');
    const ctaInviterEmailLink = document.getElementById('ctaInviterEmailLink');
    const ctaInviterBio = document.getElementById('ctaInviterBio');

    if (ctaInviterName) {
        ctaInviterName.textContent = finalName;
    }

    if (ctaInviterRole && finalRole) {
        ctaInviterRole.textContent = finalRole;
        ctaInviterRole.style.display = 'block';
    }

    if (finalPhoto && inviterPhotoEl) {
        inviterPhotoEl.src = finalPhoto;
        inviterPhotoEl.onerror = function() {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";
        };
    }

    if (finalPhone && ctaInviterPhone && ctaInviterPhoneLink) {
        ctaInviterPhone.textContent = finalPhone;
        ctaInviterPhoneLink.href = `tel:${finalPhone.replace(/\s/g, '')}`;
        ctaInviterPhoneLink.style.display = 'flex';
    }

    if (finalEmail && ctaInviterEmail && ctaInviterEmailLink) {
        ctaInviterEmail.textContent = finalEmail;
        ctaInviterEmailLink.href = `mailto:${finalEmail}`;
        ctaInviterEmailLink.style.display = 'flex';
    }

    if (finalBio && ctaInviterBio) {
        ctaInviterBio.textContent = finalBio;
        ctaInviterBio.style.display = 'block';
    }

    // Show card if we have any details
    if (inviterCard && (finalPhone || finalEmail || finalBio || finalRole)) {
        inviterCard.style.display = 'flex';
    }
}

// Extend initLanding to display inviter
const originalInitLanding = initLanding;
initLanding = function() {
    originalInitLanding();
    displayInviterOnLanding();
};

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

    // Update inviter info in mobile elements
    updateMobileInviterInfo();

    // Setup header call button
    setupHeaderCallButton();
}

function initBottomSheet() {
    const overlay = document.getElementById('schedulerOverlay');
    const sheet = document.getElementById('schedulerSheet');
    const openBtn = document.getElementById('btnOpenScheduler');
    const closeBtn = document.getElementById('btnCloseScheduler');

    if (!overlay || !sheet || !openBtn) return;

    openBtn.addEventListener('click', () => {
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

    const meeting = {
        name,
        phone,
        email,
        date: mobileAppState.selectedDate,
        time: mobileAppState.selectedTime,
        method: mobileAppState.selectedMethod,
        formattedDateTime: `${formattedDate}, godz. ${mobileAppState.selectedTime}`,
        invitedBy: AppState.landingParams.inviterName,
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    // Save to localStorage
    const meetings = JSON.parse(localStorage.getItem('recruiter_meetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('recruiter_meetings', JSON.stringify(meetings));

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
    showToast('Spotkanie umówione!', 'success');
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

function updateMobileInviterInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterKey = urlParams.get('z') || 'Partner';
    const inviterPhone = urlParams.get('zp') || '';
    const inviterEmail = urlParams.get('ze') || '';
    const inviterRole = urlParams.get('zr') || '';
    const inviterBio = urlParams.get('zb') || '';
    const inviterPhoto = urlParams.get('zph') || '';

    const inviterInfo = CONFIG.inviters[inviterKey] || {};

    const finalPhone = inviterPhone || inviterInfo.phone || '';
    const finalEmail = inviterEmail || inviterInfo.email || '';
    const finalRole = inviterRole || inviterInfo.role || '';
    const finalBio = inviterBio || inviterInfo.bio || '';
    const finalPhoto = inviterPhoto || inviterInfo.photo || '';
    const finalName = inviterInfo.name || inviterKey;

    // Update welcome card
    const appInviterName = document.getElementById('appInviterName');
    const appInviterRole = document.getElementById('appInviterRole');
    const appInviterPhoto = document.getElementById('appInviterPhoto');

    if (appInviterName) appInviterName.textContent = finalName;
    if (appInviterRole && finalRole) {
        appInviterRole.textContent = finalRole;
        appInviterRole.style.display = 'block';
    }
    if (appInviterPhoto && finalPhoto) {
        appInviterPhoto.src = finalPhoto;
        appInviterPhoto.onerror = function() {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";
        };
    }

    // Update inviter contact card
    const inviterContactName = document.getElementById('inviterContactName');
    const inviterContactRole = document.getElementById('inviterContactRole');
    const inviterContactPhoto = document.getElementById('inviterContactPhoto');
    const inviterContactBio = document.getElementById('inviterContactBio');
    const inviterBtnPhone = document.getElementById('inviterBtnPhone');
    const inviterBtnEmail = document.getElementById('inviterBtnEmail');

    if (inviterContactName) inviterContactName.textContent = finalName;
    if (inviterContactRole && finalRole) {
        inviterContactRole.textContent = finalRole;
        inviterContactRole.style.display = 'block';
    }
    if (inviterContactPhoto && finalPhoto) {
        inviterContactPhoto.src = finalPhoto;
        inviterContactPhoto.onerror = function() {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";
        };
    }
    if (inviterContactBio && finalBio) {
        inviterContactBio.textContent = finalBio;
        inviterContactBio.style.display = 'block';
    }
    if (inviterBtnPhone) {
        if (finalPhone) {
            inviterBtnPhone.href = `tel:${finalPhone.replace(/\s/g, '')}`;
            inviterBtnPhone.style.display = 'flex';
        } else {
            inviterBtnPhone.style.display = 'none';
        }
    }
    if (inviterBtnEmail) {
        if (finalEmail) {
            inviterBtnEmail.href = `mailto:${finalEmail}`;
            inviterBtnEmail.style.display = 'flex';
        } else {
            inviterBtnEmail.style.display = 'none';
        }
    }

    // Update success modal inviter name
    const modalInviterName = document.getElementById('modalInviterName');
    if (modalInviterName) modalInviterName.textContent = finalName;

    // Store phone for header button
    window.inviterPhoneNumber = finalPhone;
}

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
    dateOffset: 0
};

function initDesktopScheduler() {
    initDesktopDatePicker();
    initDesktopTimeSlots();
    initDesktopMethodSelector();

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

    const { selectedDate, selectedTime, selectedMethod } = desktopSchedulerState;

    if (!selectedDate || !selectedTime) {
        showToast('Wybierz datę i godzinę', 'error');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);

    const meeting = {
        id: Date.now(),
        date: selectedDate,
        time: selectedTime,
        method: selectedMethod,
        partnerName: urlParams.get('n') || 'Partner',
        partnerPhone: urlParams.get('p') || '',
        partnerEmail: urlParams.get('e') || '',
        inviter: urlParams.get('z') || 'Nieznany',
        createdAt: new Date().toISOString()
    };

    const meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));

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

    showToast('Spotkanie umówione!', 'success');
}

function initDesktopCalculator() {
    const clientsSlider = document.getElementById('desktopCalcClients');
    const valueSlider = document.getElementById('desktopCalcValue');
    const tierSlider = document.getElementById('desktopCalcTier');

    if (!clientsSlider || !valueSlider || !tierSlider) return;

    const clientsValue = document.getElementById('desktopCalcClientsValue');
    const valueDisplay = document.getElementById('desktopCalcValueDisplay');
    const tierValue = document.getElementById('desktopCalcTierValue');
    const resultMonthly = document.getElementById('desktopResultMonthly');
    const resultQuarterly = document.getElementById('desktopResultQuarterly');
    const resultYearly = document.getElementById('desktopResultYearly');

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function calculateResults() {
        const clients = parseInt(clientsSlider.value);
        const value = parseInt(valueSlider.value);
        const tier = parseInt(tierSlider.value);

        if (clientsValue) clientsValue.textContent = clients;
        if (valueDisplay) valueDisplay.textContent = formatNumber(value);
        if (tierValue) tierValue.textContent = tier;

        const monthly = Math.round(clients * value * (tier / 100));
        const quarterly = monthly * 3;
        const yearly = monthly * 12;

        if (resultMonthly) resultMonthly.textContent = formatNumber(monthly) + ' zł';
        if (resultQuarterly) resultQuarterly.textContent = formatNumber(quarterly) + ' zł';
        if (resultYearly) resultYearly.textContent = formatNumber(yearly) + ' zł';
    }

    function updateRangeBackground(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percentage = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, #e2e8f0 ${percentage}%)`;
    }

    [clientsSlider, valueSlider, tierSlider].forEach(slider => {
        slider.addEventListener('input', () => {
            calculateResults();
            updateRangeBackground(slider);
        });
        updateRangeBackground(slider);
    });

    calculateResults();
}

function updateDesktopInviterInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterKey = urlParams.get('z') || 'Partner';
    const inviterPhone = urlParams.get('zp') || '';
    const inviterEmail = urlParams.get('ze') || '';
    const inviterRole = urlParams.get('zr') || '';
    const inviterBio = urlParams.get('zb') || '';
    const inviterPhoto = urlParams.get('zph') || '';
    const partnerName = urlParams.get('n') || 'Partnerze';

    const inviterInfo = CONFIG.inviters[inviterKey] || {};

    const finalPhone = inviterPhone || inviterInfo.phone || '';
    const finalEmail = inviterEmail || inviterInfo.email || '';
    const finalRole = inviterRole || inviterInfo.role || '';
    const finalBio = inviterBio || inviterInfo.bio || '';
    const finalPhoto = inviterPhoto || inviterInfo.photo || '';
    const finalName = inviterInfo.name || inviterKey;

    // Update hero section
    const desktopInviterName = document.getElementById('desktopInviterName');
    const desktopPartnerName = document.getElementById('desktopPartnerName');

    if (desktopInviterName) desktopInviterName.textContent = finalName;
    if (desktopPartnerName) desktopPartnerName.textContent = partnerName;

    // Update inviter card in scheduler section
    const desktopInviterPhoto = document.getElementById('desktopInviterPhoto');
    const desktopInviterCardName = document.getElementById('desktopInviterCardName');
    const desktopInviterCardRole = document.getElementById('desktopInviterCardRole');
    const desktopInviterCardBio = document.getElementById('desktopInviterCardBio');
    const desktopInviterPhoneLink = document.getElementById('desktopInviterPhoneLink');
    const desktopInviterEmailLink = document.getElementById('desktopInviterEmailLink');
    const desktopInviterCardPhone = document.getElementById('desktopInviterCardPhone');
    const desktopInviterCardEmail = document.getElementById('desktopInviterCardEmail');

    if (desktopInviterCardName) desktopInviterCardName.textContent = finalName;

    if (desktopInviterCardRole) {
        if (finalRole) {
            desktopInviterCardRole.textContent = finalRole;
            desktopInviterCardRole.style.display = 'block';
        } else {
            desktopInviterCardRole.style.display = 'none';
        }
    }

    if (desktopInviterPhoto && finalPhoto) {
        desktopInviterPhoto.src = finalPhoto;
        desktopInviterPhoto.onerror = function() {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";
        };
    }

    if (desktopInviterCardBio) {
        if (finalBio) {
            desktopInviterCardBio.textContent = finalBio;
            desktopInviterCardBio.style.display = 'block';
        } else {
            desktopInviterCardBio.style.display = 'none';
        }
    }

    if (desktopInviterPhoneLink && desktopInviterCardPhone) {
        if (finalPhone) {
            desktopInviterPhoneLink.href = `tel:${finalPhone.replace(/\s/g, '')}`;
            desktopInviterCardPhone.textContent = finalPhone;
            desktopInviterPhoneLink.style.display = 'flex';
        } else {
            desktopInviterPhoneLink.style.display = 'none';
        }
    }

    if (desktopInviterEmailLink && desktopInviterCardEmail) {
        if (finalEmail) {
            desktopInviterEmailLink.href = `mailto:${finalEmail}`;
            desktopInviterCardEmail.textContent = finalEmail;
            desktopInviterEmailLink.style.display = 'flex';
        } else {
            desktopInviterEmailLink.style.display = 'none';
        }
    }
}

function initDesktopApp() {
    updateDesktopInviterInfo();
    initDesktopCalculator();
    initDesktopScheduler();
}

// Extend initLanding to include both mobile and desktop app init
const extendedInitLanding = initLanding;
initLanding = function() {
    extendedInitLanding();
    initMobileApp();
    initDesktopApp();
};

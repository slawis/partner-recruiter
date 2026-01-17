/* ========================================
   PARTNER RECRUITER - SIDEBAR NAVIGATION
   Obsługa nawigacji bocznej
   ======================================== */

// ============ NAVIGATION STATE ============
const NavigationState = {
    currentSection: 'dashboard',
    sidebarOpen: false
};

// ============ NAVIGATION INITIALIZATION ============
function initNavigation() {
    // Load saved section from localStorage
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
        NavigationState.currentSection = savedSection;
    }

    // Initialize nav items click handlers
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            switchSection(sectionId);
        });
    });

    // Initialize mobile menu
    initMobileMenu();

    // Show initial section
    switchSection(NavigationState.currentSection);

    // Update navigation badges
    updateNavigationBadges();
}

// ============ SWITCH SECTION ============
function switchSection(sectionId) {
    NavigationState.currentSection = sectionId;

    // Update nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Update sections
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });

    // Update topbar title
    updateTopbarTitle(sectionId);

    // Save to localStorage
    localStorage.setItem('activeSection', sectionId);

    // Close mobile sidebar
    closeMobileSidebar();

    // Section-specific initialization
    onSectionChange(sectionId);
}

// ============ UPDATE TOPBAR TITLE ============
function updateTopbarTitle(sectionId) {
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Przegląd statystyk i aktywności' },
        'generator': { title: 'Generator zaproszeń', subtitle: 'Twórz spersonalizowane zaproszenia' },
        'historia': { title: 'Historia zaproszeń', subtitle: 'Lista wszystkich wygenerowanych zaproszeń' },
        'spotkania': { title: 'Kalendarz spotkań', subtitle: 'Spotkania umówione przez partnerów' },
        'posrednicy': { title: 'Pośrednicy', subtitle: 'Zarządzaj swoimi pośrednikami' },
        'doradcy': { title: 'Zarządzanie doradcami', subtitle: 'Dodawaj i edytuj doradców' },
        'uzytkownicy': { title: 'Zarządzanie użytkownikami', subtitle: 'Administracja kontami' }
    };

    const info = titles[sectionId] || { title: 'Panel', subtitle: '' };

    const titleEl = document.querySelector('.topbar-title');
    const subtitleEl = document.querySelector('.topbar-subtitle');

    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
}

// ============ SECTION CHANGE CALLBACK ============
function onSectionChange(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            updateDashboardStats();
            renderDashboardWidgets();
            break;
        case 'historia':
            renderHistory();
            break;
        case 'spotkania':
            renderMeetings();
            updateCalendarStats();
            break;
        case 'posrednicy':
            if (typeof renderPartnersSection === 'function') {
                renderPartnersSection();
                initPartnersFilters();
            }
            break;
        case 'doradcy':
            renderDoradcySection();
            break;
        case 'uzytkownicy':
            if (typeof renderUsersTable === 'function') {
                renderUsersTable();
            }
            break;
    }
}

// ============ DASHBOARD WIDGETS ============
function renderDashboardWidgets() {
    // Render recent invitations
    renderDashboardHistory();
    // Render upcoming meetings
    renderDashboardMeetings();
}

function renderDashboardHistory() {
    const tbody = document.getElementById('dashboardHistoryBody');
    if (!tbody || !AppState.history) return;

    const recent = AppState.history.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="3">Brak zaproszeń</td></tr>';
        return;
    }

    tbody.innerHTML = recent.map(inv => {
        const date = new Date(inv.createdAt);
        const dateStr = date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit'
        });

        const statusClass = inv.status === 'registered' ? 'converted' :
                           inv.status === 'opened' ? 'opened' : 'sent';
        const statusText = inv.status === 'registered' ? 'Zarejestrowany' :
                          inv.status === 'opened' ? 'Otworzył' : 'Wysłany';

        return `
            <tr>
                <td>${dateStr}</td>
                <td>${inv.partnerName}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

async function renderDashboardMeetings() {
    const container = document.getElementById('dashboardMeetings');
    if (!container) return;

    const meetings = await getMeetings();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter upcoming meetings only
    const upcoming = meetings
        .filter(m => new Date(m.date) >= today)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="meetings-empty" style="padding: 30px;">
                <span class="empty-icon">📅</span>
                <p>Brak nadchodzących spotkań</p>
            </div>
        `;
        return;
    }

    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    container.innerHTML = upcoming.map(meeting => {
        const meetingDate = new Date(meeting.date);
        const day = meetingDate.getDate();
        const month = monthNames[meetingDate.getMonth()];
        const isToday = meetingDate.toDateString() === today.toDateString();

        return `
            <div class="meeting-card ${isToday ? 'today' : ''}" style="margin-bottom: 8px;">
                <div class="meeting-date-block">
                    <span class="mdb-day">${day}</span>
                    <span class="mdb-month">${month}</span>
                </div>
                <div class="meeting-info">
                    <h4 class="meeting-partner-name">${meeting.partnerName || 'Partner'}</h4>
                    <div class="meeting-details">
                        <span class="meeting-detail">
                            <span class="meeting-detail-icon">🕐</span>
                            ${meeting.time}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============ NAVIGATION BADGES ============
function updateNavigationBadges() {
    // Historia badge
    const historiaBadge = document.getElementById('navHistoriaBadge');
    if (historiaBadge) {
        const count = AppState.history?.length || 0;
        historiaBadge.textContent = count;
        historiaBadge.style.display = count > 0 ? '' : 'none';
    }

    // Spotkania badge
    getMeetings().then(meetings => {
        const spotkaniaBadge = document.getElementById('navSpotkaniaBadge');
        if (spotkaniaBadge) {
            const count = meetings.length;
            spotkaniaBadge.textContent = count;
            spotkaniaBadge.style.display = count > 0 ? '' : 'none';
        }
    });

    // Pośrednicy badge
    const posrednicyBadge = document.getElementById('navPosrednicyBadge');
    if (posrednicyBadge) {
        const count = typeof getPartnersCount === 'function' ? getPartnersCount() : 0;
        posrednicyBadge.textContent = count;
        posrednicyBadge.style.display = count > 0 ? '' : 'none';
    }

    // Doradcy badge
    const doradcyBadge = document.getElementById('navDoradcyBadge');
    if (doradcyBadge) {
        const count = InvitersState.inviters?.length || 0;
        doradcyBadge.textContent = count;
        doradcyBadge.style.display = count > 0 ? '' : 'none';
    }
}

// ============ MOBILE MENU ============
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && NavigationState.sidebarOpen) {
            closeMobileSidebar();
        }
    });
}

function toggleMobileSidebar() {
    if (NavigationState.sidebarOpen) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function openMobileSidebar() {
    NavigationState.sidebarOpen = true;
    document.querySelector('.app-sidebar')?.classList.add('open');
    document.querySelector('.sidebar-overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    NavigationState.sidebarOpen = false;
    document.querySelector('.app-sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

// ============ DASHBOARD STATS ============
function updateDashboardStats() {
    const filtered = getFilteredInvitations();

    // Sent
    const statDashSent = document.getElementById('statDashSent');
    if (statDashSent) statDashSent.textContent = filtered.length;

    // Opened
    const statDashOpened = document.getElementById('statDashOpened');
    if (statDashOpened) {
        const opened = filtered.filter(i => i.status === 'opened' || i.status === 'registered').length;
        statDashOpened.textContent = opened;
    }

    // Registered
    const statDashRegistered = document.getElementById('statDashRegistered');
    if (statDashRegistered) {
        const registered = filtered.filter(i => i.status === 'registered').length;
        statDashRegistered.textContent = registered;
    }

    // Meetings
    getMeetings().then(meetings => {
        const statDashMeetings = document.getElementById('statDashMeetings');
        if (statDashMeetings) {
            statDashMeetings.textContent = meetings.length;
        }
    });
}

// ============ DORADCY SECTION ============
function renderDoradcySection() {
    const container = document.getElementById('doradcyGrid');
    if (!container) return;

    let html = '';

    // Render existing doradcy
    InvitersState.inviters.forEach(inv => {
        html += `
            <div class="doradca-card" data-id="${inv.id}">
                <div class="doradca-card-header">
                    ${inv.photo
                        ? `<img src="${inv.photo}" alt="${inv.name}" class="doradca-avatar">`
                        : `<div class="doradca-avatar-placeholder">👤</div>`
                    }
                    <div class="doradca-info">
                        <h3 class="doradca-name">${inv.name}</h3>
                        ${inv.role ? `<span class="doradca-role">${inv.role}</span>` : ''}
                    </div>
                </div>
                <div class="doradca-card-body">
                    <div class="doradca-contacts">
                        ${inv.phone ? `
                            <div class="doradca-contact">
                                <span class="doradca-contact-icon">📞</span>
                                <span>${inv.phone}</span>
                            </div>
                        ` : ''}
                        ${inv.email ? `
                            <div class="doradca-contact">
                                <span class="doradca-contact-icon">✉️</span>
                                <span>${inv.email}</span>
                            </div>
                        ` : ''}
                        ${inv.bio ? `
                            <div class="doradca-contact" style="margin-top: 8px;">
                                <span style="font-size: 12px; color: var(--text-muted);">${inv.bio}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="doradca-card-actions">
                    <button class="doradca-action-btn" onclick="openEditInviterModal('${inv.id}')">
                        ✏️ Edytuj
                    </button>
                    <button class="doradca-action-btn delete" onclick="deleteInviter('${inv.id}')">
                        🗑️ Usuń
                    </button>
                </div>
            </div>
        `;
    });

    // Add "Add new" card
    html += `
        <div class="add-doradca-card" onclick="openAddDoradcaModal()">
            <span class="add-doradca-icon">➕</span>
            <span class="add-doradca-text">Dodaj doradcę</span>
        </div>
    `;

    container.innerHTML = html;
}

// ============ ADD DORADCA MODAL ============
function openAddDoradcaModal() {
    const modal = document.getElementById('addDoradcaModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAddDoradcaModal() {
    const modal = document.getElementById('addDoradcaModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        document.getElementById('addDoradcaForm')?.reset();
    }
}

async function handleAddDoradca(e) {
    e.preventDefault();

    const name = document.getElementById('addDoradcaName').value.trim();
    const role = document.getElementById('addDoradcaRole').value.trim();
    const phone = document.getElementById('addDoradcaPhone').value.trim();
    const email = document.getElementById('addDoradcaEmail').value.trim();
    const bio = document.getElementById('addDoradcaBio').value.trim();

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
        photo: ''
    };

    InvitersState.inviters.push(newInviter);
    await saveInviters();

    closeAddDoradcaModal();
    renderDoradcySection();
    updateInviterSelect();
    updateNavigationBadges();

    showToast('Doradca dodany!', 'success');
}

// ============ ADMIN VISIBILITY ============
function applyAdminNavigation() {
    const adminSection = document.querySelector('.nav-section.admin-section');
    if (adminSection) {
        // Show admin section only for admins
        adminSection.style.display = isAdmin() ? '' : 'none';
    }
}

// ============ GLOBAL FUNCTIONS ============
window.switchSection = switchSection;
window.openAddDoradcaModal = openAddDoradcaModal;
window.closeAddDoradcaModal = closeAddDoradcaModal;
window.handleAddDoradca = handleAddDoradca;
window.updateNavigationBadges = updateNavigationBadges;

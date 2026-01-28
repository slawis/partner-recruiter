/* ========================================
   PARTNER RECRUITER - PARTNERS MANAGEMENT
   Zarządzanie pośrednikami (partnerami)
   ======================================== */

// ============ PARTNERS STATE ============
const PartnersState = {
    partners: [],
    filter: {
        status: 'all',
        search: '',
        inviterKey: 'all'
    },
    currentPartner: null
};

// ============ STATUS CONFIGURATION ============
const PARTNER_STATUSES = {
    lead: { label: 'Lead', color: 'gray', icon: '🔵' },
    contacted: { label: 'Skontaktowano', color: 'blue', icon: '📞' },
    meeting: { label: 'Spotkanie', color: 'orange', icon: '📅' },
    converted: { label: 'Współpraca', color: 'green', icon: '✅' },
    rejected: { label: 'Odmowa', color: 'red', icon: '❌' }
};

// ============ LOAD PARTNERS ============
async function loadPartners() {
    const sb = getSupabase();

    if (sb) {
        try {
            let query = sb
                .from('partners')
                .select('*')
                .order('created_at', { ascending: false });

            // Filtruj po inviter_key dla doradców
            if (typeof isDoradca === 'function' && isDoradca()) {
                const myInviterKey = getCurrentUserInviterKey();
                if (myInviterKey) {
                    query = query.eq('inviter_key', myInviterKey);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                PartnersState.partners = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    lastName: p.last_name || '',
                    company: p.company || '',
                    nip: p.nip || '',
                    phone: p.phone || '',
                    email: p.email || '',
                    address: p.address || '',
                    status: p.status || 'lead',
                    notes: p.notes || '',
                    source: p.source || '',
                    createdBy: p.created_by,
                    createdByName: p.created_by_name || '',
                    inviterKey: p.inviter_key || '',
                    invitationsCount: p.invitations_count || 0,
                    meetingsCount: p.meetings_count || 0,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    lastContactAt: p.last_contact_at
                }));
                console.log('Partners loaded from Supabase:', PartnersState.partners.length);
                return PartnersState.partners;
            }
        } catch (err) {
            console.error('Error loading partners from Supabase:', err);
        }
    }

    // Fallback: localStorage
    const saved = localStorage.getItem('recruiter_partners');
    if (saved) {
        let partners = JSON.parse(saved);
        // Filtruj jeśli doradca
        if (typeof isDoradca === 'function' && isDoradca()) {
            const myInviterKey = getCurrentUserInviterKey();
            partners = partners.filter(p => p.inviterKey === myInviterKey);
        }
        PartnersState.partners = partners;
    }

    return PartnersState.partners;
}

// ============ SAVE PARTNER ============
async function savePartner(partner) {
    const sb = getSupabase();

    if (sb) {
        try {
            const partnerData = {
                name: partner.name,
                last_name: partner.lastName || null,
                company: partner.company || null,
                nip: partner.nip || null,
                phone: partner.phone || null,
                email: partner.email || null,
                address: partner.address || null,
                status: partner.status || 'lead',
                notes: partner.notes || null,
                source: partner.source || null,
                created_by: partner.createdBy || null,
                created_by_name: partner.createdByName || null,
                inviter_key: partner.inviterKey || null,
                invitations_count: partner.invitationsCount || 0,
                meetings_count: partner.meetingsCount || 0,
                last_contact_at: partner.lastContactAt || null
            };

            if (partner.id) {
                // Update existing
                const { error } = await sb
                    .from('partners')
                    .update(partnerData)
                    .eq('id', partner.id);

                if (error) throw error;
                console.log('Partner updated in Supabase:', partner.id);
            } else {
                // Insert new
                const { data, error } = await sb
                    .from('partners')
                    .insert(partnerData)
                    .select()
                    .single();

                if (error) throw error;
                partner.id = data.id;
                console.log('Partner created in Supabase:', partner.id);
            }
        } catch (err) {
            console.error('Error saving partner to Supabase:', err);
        }
    }

    // Update local state
    const existingIndex = PartnersState.partners.findIndex(p => p.id === partner.id);
    if (existingIndex >= 0) {
        PartnersState.partners[existingIndex] = partner;
    } else {
        PartnersState.partners.unshift(partner);
    }

    // Backup to localStorage
    savePartnersToLocalStorage();

    return partner;
}

// ============ FIND OR CREATE PARTNER ============
async function findOrCreatePartner(partnerData, inviterKey) {
    // Szukaj istniejącego partnera
    let existingPartner = null;

    // 1. Szukaj po telefonie (najważniejsze)
    if (partnerData.phone) {
        existingPartner = await findPartnerByPhone(partnerData.phone, inviterKey);
    }

    // 2. Szukaj po emailu
    if (!existingPartner && partnerData.email) {
        existingPartner = await findPartnerByEmail(partnerData.email, inviterKey);
    }

    // 3. Szukaj po imieniu + nazwisku u tego samego doradcy
    if (!existingPartner && partnerData.name) {
        existingPartner = await findPartnerByName(partnerData.name, partnerData.lastName, inviterKey);
    }

    if (existingPartner) {
        // Aktualizuj istniejącego partnera
        existingPartner.invitationsCount = (existingPartner.invitationsCount || 0) + 1;
        existingPartner.lastContactAt = new Date().toISOString();

        // Aktualizuj dane jeśli są nowsze/pełniejsze
        if (partnerData.lastName && !existingPartner.lastName) {
            existingPartner.lastName = partnerData.lastName;
        }
        if (partnerData.company && !existingPartner.company) {
            existingPartner.company = partnerData.company;
        }
        if (partnerData.nip && !existingPartner.nip) {
            existingPartner.nip = partnerData.nip;
        }
        if (partnerData.address && !existingPartner.address) {
            existingPartner.address = partnerData.address;
        }

        await savePartner(existingPartner);
        console.log('Partner updated from invitation:', existingPartner.id);
        return existingPartner;
    }

    // Utwórz nowego partnera
    const newPartner = {
        name: partnerData.name,
        lastName: partnerData.lastName || '',
        company: partnerData.company || '',
        nip: partnerData.nip || '',
        phone: partnerData.phone || '',
        email: partnerData.email || '',
        address: partnerData.address || '',
        status: 'lead',
        notes: '',
        source: 'invitation',
        createdBy: getCurrentUserId(),
        createdByName: AuthState.profile?.name || '',
        inviterKey: inviterKey,
        invitationsCount: 1,
        meetingsCount: 0,
        createdAt: new Date().toISOString(),
        lastContactAt: new Date().toISOString()
    };

    await savePartner(newPartner);
    console.log('New partner created from invitation:', newPartner.id);
    return newPartner;
}

// ============ FIND PARTNER HELPERS ============
async function findPartnerByPhone(phone, inviterKey) {
    if (!phone) return null;

    const normalizedPhone = normalizePhone(phone);

    // Najpierw szukaj w lokalnym state
    let found = PartnersState.partners.find(p =>
        normalizePhone(p.phone) === normalizedPhone &&
        (isAdmin() || p.inviterKey === inviterKey)
    );

    if (found) return found;

    // Szukaj w Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            let query = sb
                .from('partners')
                .select('*')
                .eq('phone', phone);

            if (!isAdmin()) {
                query = query.eq('inviter_key', inviterKey);
            }

            const { data, error } = await query.maybeSingle();
            if (!error && data) {
                return mapPartnerFromSupabase(data);
            }
        } catch (err) {
            console.error('Error finding partner by phone:', err);
        }
    }

    return null;
}

async function findPartnerByEmail(email, inviterKey) {
    if (!email) return null;

    const normalizedEmail = email.toLowerCase().trim();

    // Szukaj w lokalnym state
    let found = PartnersState.partners.find(p =>
        p.email?.toLowerCase().trim() === normalizedEmail &&
        (isAdmin() || p.inviterKey === inviterKey)
    );

    if (found) return found;

    // Szukaj w Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            let query = sb
                .from('partners')
                .select('*')
                .ilike('email', normalizedEmail);

            if (!isAdmin()) {
                query = query.eq('inviter_key', inviterKey);
            }

            const { data, error } = await query.maybeSingle();
            if (!error && data) {
                return mapPartnerFromSupabase(data);
            }
        } catch (err) {
            console.error('Error finding partner by email:', err);
        }
    }

    return null;
}

async function findPartnerByName(name, lastName, inviterKey) {
    if (!name) return null;

    // Szukaj w lokalnym state
    let found = PartnersState.partners.find(p =>
        p.name?.toLowerCase() === name.toLowerCase() &&
        (!lastName || p.lastName?.toLowerCase() === lastName.toLowerCase()) &&
        (isAdmin() || p.inviterKey === inviterKey)
    );

    if (found) return found;

    // Szukaj w Supabase
    const sb = getSupabase();
    if (sb) {
        try {
            let query = sb
                .from('partners')
                .select('*')
                .ilike('name', name);

            if (lastName) {
                query = query.ilike('last_name', lastName);
            }

            if (!isAdmin()) {
                query = query.eq('inviter_key', inviterKey);
            }

            const { data, error } = await query.maybeSingle();
            if (!error && data) {
                return mapPartnerFromSupabase(data);
            }
        } catch (err) {
            console.error('Error finding partner by name:', err);
        }
    }

    return null;
}

// ============ UPDATE PARTNER STATS ============
async function updatePartnerInvitationsCount(partnerId, increment = 1) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    partner.invitationsCount = (partner.invitationsCount || 0) + increment;
    partner.lastContactAt = new Date().toISOString();

    await savePartner(partner);
}

async function updatePartnerMeetingsCount(partnerId, increment = 1) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    partner.meetingsCount = (partner.meetingsCount || 0) + increment;
    partner.lastContactAt = new Date().toISOString();

    // Automatycznie zmień status na "meeting" jeśli to pierwsze spotkanie
    if (partner.status === 'lead' || partner.status === 'contacted') {
        partner.status = 'meeting';
    }

    await savePartner(partner);
}

// ============ CHANGE PARTNER STATUS ============
async function changePartnerStatus(partnerId, newStatus) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    partner.status = newStatus;
    partner.updatedAt = new Date().toISOString();

    await savePartner(partner);
    renderPartnersSection();
    updateNavigationBadges();

    showToast(`Status zmieniony na: ${PARTNER_STATUSES[newStatus].label}`, 'success');
}

// ============ ADD PARTNER NOTE ============
async function addPartnerNote(partnerId, note) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    const timestamp = new Date().toLocaleString('pl-PL');
    const newNote = `[${timestamp}] ${note}`;

    partner.notes = partner.notes
        ? partner.notes + '\n\n' + newNote
        : newNote;

    partner.lastContactAt = new Date().toISOString();

    await savePartner(partner);
    showToast('Notatka dodana', 'success');
}

// ============ DELETE PARTNER ============
async function deletePartner(partnerId) {
    if (!confirm('Czy na pewno chcesz usunąć tego pośrednika?')) return;

    const sb = getSupabase();
    if (sb) {
        try {
            const { error } = await sb
                .from('partners')
                .delete()
                .eq('id', partnerId);

            if (error) throw error;
        } catch (err) {
            console.error('Error deleting partner from Supabase:', err);
        }
    }

    PartnersState.partners = PartnersState.partners.filter(p => p.id !== partnerId);
    savePartnersToLocalStorage();

    renderPartnersSection();
    updateNavigationBadges();

    showToast('Pośrednik usunięty', 'success');
}

// ============ RENDER PARTNERS SECTION ============
function renderPartnersSection() {
    const container = document.getElementById('partnersGrid');
    if (!container) return;

    // Filtruj partnerów
    let filtered = PartnersState.partners;

    // Filtr statusu
    if (PartnersState.filter.status !== 'all') {
        filtered = filtered.filter(p => p.status === PartnersState.filter.status);
    }

    // Filtr doradcy (tylko dla admina)
    if (isAdmin() && PartnersState.filter.inviterKey !== 'all') {
        filtered = filtered.filter(p => p.inviterKey === PartnersState.filter.inviterKey);
    }

    // Filtr wyszukiwania
    if (PartnersState.filter.search) {
        const search = PartnersState.filter.search.toLowerCase();
        filtered = filtered.filter(p =>
            p.name?.toLowerCase().includes(search) ||
            p.lastName?.toLowerCase().includes(search) ||
            p.company?.toLowerCase().includes(search) ||
            p.phone?.includes(search) ||
            p.email?.toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="partners-empty">
                <span class="empty-icon">👥</span>
                <p>Brak pośredników</p>
                <small>Pośrednicy pojawią się tutaj po wygenerowaniu zaproszeń lub dodaniu ręcznym</small>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="partners-table-wrapper">
            <table class="partners-table">
                <thead>
                    <tr>
                        <th class="th-name">Pośrednik</th>
                        <th class="th-contact">Kontakt</th>
                        <th class="th-status">Status</th>
                        <th class="th-stats">Statystyki</th>
                        <th class="th-date">Data dodania</th>
                        <th class="th-actions">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(partner => renderPartnerRow(partner)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============ RENDER PARTNER ROW ============
function renderPartnerRow(partner) {
    const statusConfig = PARTNER_STATUSES[partner.status] || PARTNER_STATUSES.lead;
    const fullName = partner.lastName ? `${partner.name} ${partner.lastName}` : partner.name;

    const createdDate = partner.createdAt
        ? new Date(partner.createdAt).toLocaleDateString('pl-PL')
        : '-';

    return `
        <tr data-id="${partner.id}">
            <td class="td-name">
                <div class="partner-name-cell">
                    <strong>${fullName}</strong>
                    ${partner.company ? `<span class="partner-company-label">${partner.company}</span>` : ''}
                </div>
            </td>
            <td class="td-contact">
                <div class="partner-contact-cell">
                    ${partner.phone ? `<a href="tel:${partner.phone}" class="contact-link">📞 ${formatPhone(partner.phone)}</a>` : ''}
                    ${partner.email ? `<a href="mailto:${partner.email}" class="contact-link">✉️ ${partner.email}</a>` : ''}
                    ${!partner.phone && !partner.email ? '<span class="no-contact">-</span>' : ''}
                </div>
            </td>
            <td class="td-status">
                <div class="partner-status-dropdown">
                    <button class="status-badge-btn status-${statusConfig.color}" onclick="togglePartnerStatusDropdown('${partner.id}')">
                        ${statusConfig.icon} ${statusConfig.label}
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="partner-status-menu" id="statusMenu-${partner.id}">
                        ${Object.entries(PARTNER_STATUSES).map(([key, config]) => `
                            <button class="status-menu-item ${partner.status === key ? 'active' : ''}" onclick="changePartnerStatus('${partner.id}', '${key}')">
                                ${config.icon} ${config.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </td>
            <td class="td-stats">
                <div class="partner-stats-cell">
                    <span class="stat-item" title="Zaproszenia">📤 ${partner.invitationsCount || 0}</span>
                    <span class="stat-item" title="Spotkania">📅 ${partner.meetingsCount || 0}</span>
                </div>
            </td>
            <td class="td-date">${createdDate}</td>
            <td class="td-actions">
                <button class="action-btn" onclick="openEditPartnerModal('${partner.id}')" title="Edytuj">✏️</button>
                <button class="action-btn" onclick="openPartnerNotesModal('${partner.id}')" title="Notatki">📝</button>
                <button class="action-btn action-btn-delete" onclick="deletePartner('${partner.id}')" title="Usuń">🗑️</button>
            </td>
        </tr>
    `;
}

// Legacy alias for compatibility
function renderPartnerCard(partner) {
    return renderPartnerRow(partner);
}

// ============ UI INTERACTIONS ============
function togglePartnerStatusDropdown(partnerId) {
    const menu = document.getElementById(`statusMenu-${partnerId}`);
    if (!menu) return;

    // Zamknij inne otwarte menu
    document.querySelectorAll('.partner-status-menu.active').forEach(m => {
        if (m.id !== `statusMenu-${partnerId}`) {
            m.classList.remove('active');
        }
    });

    menu.classList.toggle('active');
}

function togglePartnerMenu(partnerId) {
    const menu = document.getElementById(`partnerMenu-${partnerId}`);
    if (!menu) return;

    // Zamknij inne otwarte menu
    document.querySelectorAll('.partner-menu.active').forEach(m => {
        if (m.id !== `partnerMenu-${partnerId}`) {
            m.classList.remove('active');
        }
    });

    menu.classList.toggle('active');
}

// Zamykanie menu po kliknięciu poza nimi
document.addEventListener('click', (e) => {
    if (!e.target.closest('.partner-status-dropdown') && !e.target.closest('.partner-menu-btn')) {
        document.querySelectorAll('.partner-status-menu.active, .partner-menu.active').forEach(m => {
            m.classList.remove('active');
        });
    }
});

// ============ FILTERS ============
function initPartnersFilters() {
    // Status filter
    const statusFilter = document.getElementById('partnersStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            PartnersState.filter.status = e.target.value;
            renderPartnersSection();
        });
    }

    // Search filter
    const searchInput = document.getElementById('partnersSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            PartnersState.filter.search = e.target.value;
            renderPartnersSection();
        });
    }

    // Inviter filter (admin only)
    const inviterFilter = document.getElementById('partnersInviterFilter');
    if (inviterFilter) {
        inviterFilter.addEventListener('change', (e) => {
            PartnersState.filter.inviterKey = e.target.value;
            renderPartnersSection();
        });

        // Populate inviter options
        if (isAdmin()) {
            const uniqueInviters = [...new Set(PartnersState.partners.map(p => p.inviterKey).filter(Boolean))];
            inviterFilter.innerHTML = `
                <option value="all">Wszyscy doradcy</option>
                ${uniqueInviters.map(key => {
                    // Pobierz pełną nazwę z CONFIG lub InvitersState
                    let displayName = key;
                    if (CONFIG && CONFIG.inviters && CONFIG.inviters[key]) {
                        displayName = CONFIG.inviters[key].name;
                    } else if (typeof InvitersState !== 'undefined' && InvitersState.inviters) {
                        const inviter = InvitersState.inviters.find(i => i.key === key);
                        if (inviter && inviter.name) displayName = inviter.name;
                    }
                    return `<option value="${key}">${displayName}</option>`;
                }).join('')}
            `;
            inviterFilter.closest('.filter-group')?.classList.remove('hidden');
        }
    }
}

// ============ ADD PARTNER MODAL ============
function openAddPartnerModal() {
    const modal = document.getElementById('addPartnerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAddPartnerModal() {
    const modal = document.getElementById('addPartnerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('addPartnerForm')?.reset();
    }
}

async function handleAddPartner(e) {
    e.preventDefault();

    const name = document.getElementById('addPartnerName').value.trim();
    const lastName = document.getElementById('addPartnerLastName')?.value.trim() || '';
    const company = document.getElementById('addPartnerCompany')?.value.trim() || '';
    const nip = document.getElementById('addPartnerNIP')?.value.trim() || '';
    const phone = document.getElementById('addPartnerPhone')?.value.trim() || '';
    const email = document.getElementById('addPartnerEmail')?.value.trim() || '';
    const address = document.getElementById('addPartnerAddress')?.value.trim() || '';
    const notes = document.getElementById('addPartnerNotes')?.value.trim() || '';

    if (!name) {
        showToast('Podaj imię pośrednika', 'error');
        return;
    }

    // Sprawdź duplikaty
    if (phone || email) {
        const inviterKey = getCurrentUserInviterKey() || '';
        const existing = await findPartnerByPhone(phone, inviterKey) || await findPartnerByEmail(email, inviterKey);

        if (existing) {
            const confirmAdd = confirm(
                `Pośrednik z tym ${phone ? 'numerem telefonu' : 'adresem email'} już istnieje: ${existing.name} ${existing.lastName || ''}\n\n` +
                `Czy na pewno chcesz dodać nowego?`
            );
            if (!confirmAdd) return;
        }
    }

    const newPartner = {
        name,
        lastName,
        company,
        nip,
        phone,
        email,
        address,
        status: 'lead',
        notes,
        source: 'manual',
        createdBy: getCurrentUserId(),
        createdByName: AuthState.profile?.name || '',
        inviterKey: getCurrentUserInviterKey() || '',
        invitationsCount: 0,
        meetingsCount: 0,
        createdAt: new Date().toISOString(),
        lastContactAt: new Date().toISOString()
    };

    await savePartner(newPartner);

    closeAddPartnerModal();
    renderPartnersSection();
    updateNavigationBadges();

    showToast('Pośrednik dodany!', 'success');
}

// ============ EDIT PARTNER MODAL ============
function openEditPartnerModal(partnerId) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    PartnersState.currentPartner = partner;

    // Fill form
    document.getElementById('editPartnerId').value = partner.id;
    document.getElementById('editPartnerName').value = partner.name || '';
    document.getElementById('editPartnerLastName').value = partner.lastName || '';
    document.getElementById('editPartnerCompany').value = partner.company || '';
    document.getElementById('editPartnerNIP').value = partner.nip || '';
    document.getElementById('editPartnerPhone').value = partner.phone || '';
    document.getElementById('editPartnerEmail').value = partner.email || '';
    document.getElementById('editPartnerAddress').value = partner.address || '';

    const modal = document.getElementById('editPartnerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Zamknij inne menu
    document.querySelectorAll('.partner-menu.active').forEach(m => m.classList.remove('active'));
}

function closeEditPartnerModal() {
    const modal = document.getElementById('editPartnerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    PartnersState.currentPartner = null;
}

async function handleEditPartner(e) {
    e.preventDefault();

    const partnerId = document.getElementById('editPartnerId').value;
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    partner.name = document.getElementById('editPartnerName').value.trim();
    partner.lastName = document.getElementById('editPartnerLastName').value.trim();
    partner.company = document.getElementById('editPartnerCompany').value.trim();
    partner.nip = document.getElementById('editPartnerNIP').value.trim();
    partner.phone = document.getElementById('editPartnerPhone').value.trim();
    partner.email = document.getElementById('editPartnerEmail').value.trim();
    partner.address = document.getElementById('editPartnerAddress').value.trim();

    await savePartner(partner);

    closeEditPartnerModal();
    renderPartnersSection();

    showToast('Dane zapisane!', 'success');
}

// ============ NOTES MODAL ============
function openPartnerNotesModal(partnerId) {
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (!partner) return;

    PartnersState.currentPartner = partner;

    // Fill notes
    document.getElementById('partnerNotesId').value = partner.id;
    document.getElementById('partnerNotesContent').innerHTML = partner.notes
        ? partner.notes.replace(/\n/g, '<br>')
        : '<span style="color: var(--text-muted);">Brak notatek</span>';
    document.getElementById('partnerNewNote').value = '';

    const modal = document.getElementById('partnerNotesModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Zamknij inne menu
    document.querySelectorAll('.partner-menu.active').forEach(m => m.classList.remove('active'));
}

function closePartnerNotesModal() {
    const modal = document.getElementById('partnerNotesModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    PartnersState.currentPartner = null;
}

async function handleAddPartnerNote(e) {
    e.preventDefault();

    const partnerId = document.getElementById('partnerNotesId').value;
    const newNote = document.getElementById('partnerNewNote').value.trim();

    if (!newNote) {
        showToast('Wpisz treść notatki', 'error');
        return;
    }

    await addPartnerNote(partnerId, newNote);

    // Refresh notes display
    const partner = PartnersState.partners.find(p => p.id === partnerId);
    if (partner) {
        document.getElementById('partnerNotesContent').innerHTML = partner.notes.replace(/\n/g, '<br>');
    }
    document.getElementById('partnerNewNote').value = '';
}

// ============ HELPER FUNCTIONS ============
function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/[\s\-\(\)]/g, '');
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
}

function mapPartnerFromSupabase(data) {
    return {
        id: data.id,
        name: data.name,
        lastName: data.last_name || '',
        company: data.company || '',
        nip: data.nip || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        status: data.status || 'lead',
        notes: data.notes || '',
        source: data.source || '',
        createdBy: data.created_by,
        createdByName: data.created_by_name || '',
        inviterKey: data.inviter_key || '',
        invitationsCount: data.invitations_count || 0,
        meetingsCount: data.meetings_count || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastContactAt: data.last_contact_at
    };
}

function savePartnersToLocalStorage() {
    localStorage.setItem('recruiter_partners', JSON.stringify(PartnersState.partners));
}

// ============ GET PARTNERS COUNT ============
function getPartnersCount() {
    return PartnersState.partners.length;
}

// ============ GLOBAL FUNCTIONS ============
window.changePartnerStatus = changePartnerStatus;
window.deletePartner = deletePartner;
window.togglePartnerStatusDropdown = togglePartnerStatusDropdown;
window.togglePartnerMenu = togglePartnerMenu;
window.openAddPartnerModal = openAddPartnerModal;
window.closeAddPartnerModal = closeAddPartnerModal;
window.handleAddPartner = handleAddPartner;
window.openEditPartnerModal = openEditPartnerModal;
window.closeEditPartnerModal = closeEditPartnerModal;
window.handleEditPartner = handleEditPartner;
window.openPartnerNotesModal = openPartnerNotesModal;
window.closePartnerNotesModal = closePartnerNotesModal;
window.handleAddPartnerNote = handleAddPartnerNote;

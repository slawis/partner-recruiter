/* ========================================
   PARTNER RECRUITER - STATE MANAGEMENT
   Stan aplikacji, wykrywanie trybu
   ======================================== */

// ============ APPLICATION STATE ============
let AppState = {
    mode: 'generator', // 'generator' or 'landing'
    currentInvitation: null,
    editingInvitationId: null, // ID zaproszenia w trybie edycji
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

// ============ MODE DETECTION ============
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

// ============ STATE PERSISTENCE ============
async function loadState() {
    const sb = getSupabase();

    if (sb) {
        try {
            // Załaduj invitations z Supabase
            let query = sb
                .from('invitations')
                .select('*')
                .order('sent_at', { ascending: false });

            // Filtruj po inviter_key dla doradców
            if (typeof isDoradca === 'function' && isDoradca()) {
                const myInviterKey = getCurrentUserInviterKey();
                if (myInviterKey) {
                    query = query.eq('inviter_key', myInviterKey);
                }
            }

            const { data: invitations, error: invError } = await query;

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
        let history = JSON.parse(savedHistory);
        // Filtruj localStorage jeśli doradca
        if (typeof isDoradca === 'function' && isDoradca()) {
            const myInviterKey = getCurrentUserInviterKey();
            history = history.filter(h => h.inviterKey === myInviterKey);
        }
        AppState.history = history;
    }
    if (savedStats && (typeof isAdmin === 'function' && isAdmin())) {
        // Tylko admin widzi globalne statystyki
        AppState.stats = JSON.parse(savedStats);
    }
}

async function saveState() {
    // Zawsze zapisz do localStorage jako backup
    localStorage.setItem('recruiter_history', JSON.stringify(AppState.history));
    localStorage.setItem('recruiter_stats', JSON.stringify(AppState.stats));
}

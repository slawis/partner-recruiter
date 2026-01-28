/* ========================================
   PARTNER RECRUITER - SUPABASE OPERATIONS
   Operacje bazodanowe, synchronizacja
   ======================================== */

// ============ SUPABASE CLIENT ============
let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized');
        } catch (err) {
            console.error('Error creating Supabase client:', err);
            return null;
        }
    }
    return supabaseClient;
}

// Poczekaj aż Supabase będzie gotowy (max 5 sekund)
async function waitForSupabase(maxWait = 5000) {
    const startTime = Date.now();
    while (!window.supabase && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    const client = getSupabase();
    if (!client) {
        console.warn('Supabase SDK not loaded after', maxWait, 'ms');
    }
    return client;
}

// Test połączenia z Supabase i pokaż status
async function testSupabaseConnection() {
    const sb = await waitForSupabase(3000);

    if (!sb) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Brak połączenia z bazą danych', 'error');
        }
        return false;
    }

    try {
        // Prosty test - sprawdź czy możemy połączyć się z bazą
        const { error } = await sb.from('meetings').select('id').limit(1);

        if (error) {
            console.error('Supabase connection test failed:', error);
            if (typeof showToast === 'function') {
                showToast('⚠️ Błąd połączenia z bazą: ' + error.message, 'error');
            }
            return false;
        }

        console.log('Supabase connection OK');
        return true;
    } catch (err) {
        console.error('Supabase connection test error:', err);
        if (typeof showToast === 'function') {
            showToast('⚠️ Błąd połączenia: ' + err.message, 'error');
        }
        return false;
    }
}

// ============ INVITATIONS ============
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

// Aktualizacja zaproszenia (tryb edycji - zachowuje status i daty)
async function updateInvitationInSupabase(invitation) {
    const sb = getSupabase();
    if (!sb) return;

    try {
        const { error } = await sb
            .from('invitations')
            .update({
                partner_name: invitation.partnerName,
                partner_phone: invitation.partnerPhone || '',
                partner_email: invitation.partnerEmail || '',
                inviter_key: invitation.inviterKey,
                link: invitation.link || ''
            })
            .eq('id', invitation.id);

        if (error) throw error;
        console.log('Invitation updated in Supabase:', invitation.id);
    } catch (err) {
        console.error('Error updating invitation in Supabase:', err);
    }
}

async function trackOpening(invitationId) {
    if (!invitationId) {
        console.log('trackOpening: no invitationId');
        return;
    }

    console.log('trackOpening called for:', invitationId);

    // Sprawdź czy invitationId jest prawidłowym UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invitationId)) {
        console.log('trackOpening: invitationId is not UUID:', invitationId);
        if (typeof showToast === 'function') {
            showToast('⚠️ Stary format ID - status nie zostanie zaktualizowany', 'warning');
        }
        return;
    }

    // Poczekaj aż Supabase będzie gotowy i przetestuj połączenie
    const sb = await waitForSupabase();

    if (!sb) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Baza niedostępna', 'warning');
        }
        return;
    }

    // Próbuj zaktualizować w Supabase
    try {
        const { data, error } = await sb
            .from('invitations')
            .update({
                status: 'opened',
                opened_at: new Date().toISOString()
            })
            .eq('id', invitationId)
            .eq('status', 'sent')
            .select();

        if (error) {
            console.error('trackOpening error:', error);
            if (typeof showToast === 'function') {
                showToast('⚠️ Błąd aktualizacji statusu: ' + error.message, 'error');
            }
        } else {
            console.log('Invitation opened tracked in Supabase:', invitationId, data);
            if (typeof showToast === 'function') {
                showToast('✅ Status zmieniony na: Otworzył', 'success');
            }
        }
    } catch (err) {
        console.error('Error tracking opening in Supabase:', err);
        if (typeof showToast === 'function') {
            showToast('⚠️ Błąd: ' + err.message, 'error');
        }
    }
}

async function updateInvitationStatus(invitationId, status) {
    if (!invitationId) {
        console.log('updateInvitationStatus: no invitationId');
        return;
    }

    console.log('updateInvitationStatus called:', invitationId, status);

    // Sprawdź czy invitationId jest prawidłowym UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invitationId)) {
        console.log('updateInvitationStatus: invitationId is not UUID:', invitationId);
        if (typeof showToast === 'function') {
            showToast('⚠️ Stary format ID - status nie zostanie zaktualizowany', 'warning');
        }
        return;
    }

    // Poczekaj aż Supabase będzie gotowy
    const sb = await waitForSupabase();
    const now = new Date().toISOString();

    if (!sb) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Baza niedostępna', 'warning');
        }
        return;
    }

    // Próbuj zaktualizować w Supabase
    try {
        const updateData = { status };
        if (status === 'registered') {
            updateData.registered_at = now;
        } else if (status === 'opened') {
            updateData.opened_at = now;
        }

        const { data, error } = await sb
            .from('invitations')
            .update(updateData)
            .eq('id', invitationId)
            .select();

        if (error) {
            console.error('updateInvitationStatus error:', error);
            if (typeof showToast === 'function') {
                showToast('⚠️ Błąd aktualizacji: ' + error.message, 'error');
            }
        } else {
            console.log('Invitation status updated in Supabase:', invitationId, status, data);
            const statusText = status === 'registered' ? 'Zarejestrowany' : status === 'opened' ? 'Otworzył' : status;
            if (typeof showToast === 'function') {
                showToast('✅ Status: ' + statusText, 'success');
            }
        }
    } catch (err) {
        console.error('Error updating invitation status in Supabase:', err);
        if (typeof showToast === 'function') {
            showToast('⚠️ Błąd: ' + err.message, 'error');
        }
    }
}

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

// ============ MEETINGS ============
async function getMeetings() {
    const sb = getSupabase();

    // Zawsze najpierw pobierz z localStorage
    const saved = localStorage.getItem('scheduledMeetings');
    let localMeetings = saved ? JSON.parse(saved) : [];

    // Filtruj localStorage jeśli doradca
    if (typeof isDoradca === 'function' && isDoradca()) {
        const myInviterKey = getCurrentUserInviterKey();
        localMeetings = localMeetings.filter(m => m.inviterKey === myInviterKey);
    }

    if (sb) {
        try {
            let query = sb
                .from('meetings')
                .select('*')
                .order('meeting_date', { ascending: true });

            // Filtruj po inviter_key dla doradców
            if (typeof isDoradca === 'function' && isDoradca()) {
                const myInviterKey = getCurrentUserInviterKey();
                if (myInviterKey) {
                    query = query.eq('inviter_key', myInviterKey);
                }
            }

            const { data, error } = await query;

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
    console.log('saveMeetingToSupabase called:', meeting.partnerName);

    // Poczekaj aż Supabase będzie gotowy
    const sb = await waitForSupabase();
    if (!sb) {
        console.warn('Supabase not available, meeting saved only to localStorage');
        return;
    }

    // Sprawdź czy invitationId jest prawidłowym UUID (jeśli nie - ustaw null)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invitationId = meeting.invitationId && uuidRegex.test(meeting.invitationId)
        ? meeting.invitationId
        : null;

    try {
        // Nie wysyłamy 'id' - Supabase wygeneruje UUID
        // Nasz lokalny ID przechowujemy w 'local_id'
        const { data, error } = await sb
            .from('meetings')
            .insert({
                local_id: meeting.id, // Nasz lokalny ID jako tekst
                invitation_id: invitationId,
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
        if (typeof showToast === 'function') {
            showToast('✅ Spotkanie zsynchronizowane z bazą', 'success');
        }
    } catch (err) {
        console.error('Error saving meeting to Supabase:', err);
        if (typeof showToast === 'function') {
            showToast('⚠️ Błąd zapisu do bazy: ' + err.message, 'error');
        }
    }
}

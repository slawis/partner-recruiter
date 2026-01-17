/* ========================================
   PARTNER RECRUITER - USER MANAGEMENT
   Zarządzanie użytkownikami, role
   ======================================== */

// ============ USERS STATE ============
let UsersState = {
    users: []
};

// ============ USER MANAGEMENT ============
function initUserManagement() {
    const addUserForm = document.getElementById('addUserForm');
    const userManagementSection = document.getElementById('userManagementSection');

    // Pokaż sekcję tylko dla adminów
    if (userManagementSection) {
        userManagementSection.style.display = isAdmin() ? 'block' : 'none';
    }

    if (!isAdmin()) return;

    // Załaduj listę użytkowników
    loadUsers();

    // Wypełnij select z zapraszającymi
    populateInviterSelect();

    // Obsługa formularza dodawania użytkownika
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddUser();
        });
    }

    // Obsługa formularza edycji użytkownika
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }

    // Zamknij modal po kliknięciu poza nim
    const editModal = document.getElementById('editUserModal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditUserModal();
            }
        });
    }
}

function populateInviterSelect() {
    const select = document.getElementById('newUserInviterKey');
    if (!select) return;

    // Wyczyść opcje (zostaw pierwszą)
    select.innerHTML = '<option value="">-- Wybierz (opcjonalne) --</option>';

    // Dodaj zapraszających z InvitersState
    if (typeof InvitersState !== 'undefined' && InvitersState.inviters) {
        InvitersState.inviters.forEach(inviter => {
            const option = document.createElement('option');
            option.value = inviter.key;
            option.textContent = inviter.name || inviter.key;
            select.appendChild(option);
        });
    }
}

async function loadUsers() {
    const sb = getSupabase();
    if (!sb) return;

    try {
        const { data, error } = await sb
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        UsersState.users = data || [];
        renderUsersList();
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

function renderUsersList() {
    const container = document.getElementById('usersList');
    if (!container) return;

    if (UsersState.users.length === 0) {
        container.innerHTML = '<div class="users-list-empty">Brak użytkowników</div>';
        return;
    }

    container.innerHTML = UsersState.users.map(user => {
        const initials = getInitials(user.name || user.email);
        const isCurrentUser = user.id === getCurrentUserId();
        const hasAvatar = user.photo_url;
        const isSuspended = user.is_suspended;

        return `
            <div class="user-card ${isSuspended ? 'suspended' : ''}" data-user-id="${user.id}">
                <div class="user-card-info">
                    ${hasAvatar
                        ? `<img class="user-card-avatar-img" src="${user.photo_url}" alt="${user.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''}
                    <div class="user-card-avatar ${user.role}" ${hasAvatar ? 'style="display:none;"' : ''}>${initials}</div>
                    <div class="user-card-details">
                        <span class="user-card-name">${user.name || 'Bez nazwy'}${isCurrentUser ? ' (Ty)' : ''}${isSuspended ? ' <span class="suspended-badge">Zawieszony</span>' : ''}</span>
                        ${user.position ? `<span class="user-card-position">${user.position}</span>` : ''}
                        <span class="user-card-email">${user.email}</span>
                        ${user.phone ? `<span class="user-card-phone">${user.phone}</span>` : ''}
                    </div>
                </div>
                <div class="user-card-meta">
                    <span class="user-card-role ${user.role}">${user.role === 'admin' ? 'Admin' : 'Doradca'}</span>
                    ${user.inviter_key ? `<span class="user-card-inviter">🔗 ${user.inviter_key}</span>` : ''}
                </div>
                <div class="user-card-actions">
                    ${!isCurrentUser ? `
                        <button type="button" class="btn-user-action edit" onclick="openEditUserModal('${user.id}')" title="Edytuj">
                            ✏️
                        </button>
                        <button type="button" class="btn-user-action ${isSuspended ? 'activate' : 'suspend'}" onclick="toggleUserSuspension('${user.id}')" title="${isSuspended ? 'Aktywuj' : 'Zawieś'}">
                            ${isSuspended ? '✅' : '⏸️'}
                        </button>
                        <button type="button" class="btn-user-action delete" onclick="deleteUser('${user.id}')" title="Usuń">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function handleAddUser() {
    const email = document.getElementById('newUserEmail').value.trim();
    const name = document.getElementById('newUserName').value.trim();
    const role = document.getElementById('newUserRole').value;
    const position = document.getElementById('newUserPosition')?.value.trim() || '';
    const phone = document.getElementById('newUserPhone')?.value.trim() || '';
    const inviterKey = document.getElementById('newUserKey')?.value.trim() || '';
    const bio = document.getElementById('newUserBio')?.value.trim() || '';
    const photoUrl = document.getElementById('newUserPhoto')?.value.trim() || '';
    const password = document.getElementById('newUserPassword').value;
    const passwordConfirm = document.getElementById('newUserPasswordConfirm').value;

    const errorDiv = document.getElementById('addUserError');
    const successDiv = document.getElementById('addUserSuccess');
    const btnAddUser = document.getElementById('btnAddUser');

    // Reset messages
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';

    // Walidacja
    if (password !== passwordConfirm) {
        if (errorDiv) {
            errorDiv.textContent = 'Hasła nie są identyczne';
            errorDiv.style.display = 'block';
        }
        return;
    }

    if (password.length < 6) {
        if (errorDiv) {
            errorDiv.textContent = 'Hasło musi mieć minimum 6 znaków';
            errorDiv.style.display = 'block';
        }
        return;
    }

    // Loading state
    if (btnAddUser) {
        btnAddUser.disabled = true;
        btnAddUser.innerHTML = '<span>Tworzenie...</span>';
    }

    try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not available');

        // 1. Utwórz użytkownika przez signUp
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    role: role
                }
            }
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('Nie udało się utworzyć użytkownika');
        }

        // 2. Dodaj profil do user_profiles
        const { error: profileError } = await sb
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email: email,
                name: name,
                role: role,
                position: position || null,
                phone: phone || null,
                inviter_key: inviterKey || null,
                bio: bio || null,
                photo_url: photoUrl || null
            });

        if (profileError) {
            console.error('Profile insert error:', profileError);
            // Użytkownik auth został utworzony, ale profil nie - to może być problem
            // W produkcji trzeba by to lepiej obsłużyć
        }

        // Sukces
        if (successDiv) {
            successDiv.textContent = `✅ Użytkownik ${name} (${email}) został utworzony!`;
            successDiv.style.display = 'block';
        }

        // Wyczyść formularz
        document.getElementById('addUserForm').reset();

        // Odśwież listę
        await loadUsers();

        // Ukryj komunikat sukcesu po 5 sekundach
        setTimeout(() => {
            if (successDiv) successDiv.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error('Add user error:', error);
        if (errorDiv) {
            let message = error.message;
            if (message.includes('already registered')) {
                message = 'Ten email jest już zarejestrowany';
            }
            errorDiv.textContent = 'Błąd: ' + message;
            errorDiv.style.display = 'block';
        }
    } finally {
        if (btnAddUser) {
            btnAddUser.disabled = false;
            btnAddUser.innerHTML = '<span>➕</span> Dodaj użytkownika';
        }
    }
}

async function deleteUser(userId) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

    const sb = getSupabase();
    if (!sb) return;

    try {
        // Usuń profil użytkownika (auth user zostanie, ale nie będzie mógł się zalogować do aplikacji)
        const { error } = await sb
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        showToast('Użytkownik usunięty', 'success');
        await loadUsers();

    } catch (err) {
        console.error('Error deleting user:', err);
        showToast('Błąd usuwania użytkownika', 'error');
    }
}

// ============ EDIT USER ============
function openEditUserModal(userId) {
    const user = UsersState.users.find(u => u.id === userId);
    if (!user) return;

    // Wypełnij formularz danymi użytkownika
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserPosition').value = user.position || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserRole').value = user.role || 'doradca';
    document.getElementById('editUserKey').value = user.inviter_key || '';
    document.getElementById('editUserBio').value = user.bio || '';
    document.getElementById('editUserPhoto').value = user.photo_url || '';

    // Pokaż modal
    document.getElementById('editUserModal').classList.add('active');
}

function closeEditUserModal() {
    document.getElementById('editUserModal').classList.remove('active');
    document.getElementById('editUserForm').reset();
    document.getElementById('editUserError').style.display = 'none';
}

async function handleEditUser(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const position = document.getElementById('editUserPosition').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    const role = document.getElementById('editUserRole').value;
    const inviterKey = document.getElementById('editUserKey').value.trim();
    const bio = document.getElementById('editUserBio').value.trim();
    const photoUrl = document.getElementById('editUserPhoto').value.trim();

    const errorDiv = document.getElementById('editUserError');
    const btnSave = document.getElementById('btnSaveUser');

    if (!name) {
        errorDiv.textContent = 'Imię i nazwisko jest wymagane';
        errorDiv.style.display = 'block';
        return;
    }

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = '<span>Zapisywanie...</span>';
    }

    try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not available');

        const { error } = await sb
            .from('user_profiles')
            .update({
                name: name,
                position: position || null,
                phone: phone || null,
                role: role,
                inviter_key: inviterKey || null,
                bio: bio || null,
                photo_url: photoUrl || null
            })
            .eq('id', userId);

        if (error) throw error;

        showToast('Dane użytkownika zaktualizowane', 'success');
        closeEditUserModal();
        await loadUsers();

    } catch (err) {
        console.error('Error updating user:', err);
        errorDiv.textContent = 'Błąd: ' + err.message;
        errorDiv.style.display = 'block';
    } finally {
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = '<span>💾</span> Zapisz zmiany';
        }
    }
}

// ============ SUSPEND USER ============
async function toggleUserSuspension(userId) {
    const user = UsersState.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.is_suspended;
    const action = newStatus ? 'zawiesić' : 'aktywować';

    if (!confirm(`Czy na pewno chcesz ${action} tego użytkownika?`)) return;

    const sb = getSupabase();
    if (!sb) return;

    try {
        const { error } = await sb
            .from('user_profiles')
            .update({ is_suspended: newStatus })
            .eq('id', userId);

        if (error) throw error;

        showToast(newStatus ? 'Użytkownik zawieszony' : 'Użytkownik aktywowany', 'success');
        await loadUsers();

    } catch (err) {
        console.error('Error toggling suspension:', err);
        showToast('Błąd zmiany statusu', 'error');
    }
}

// ============ ADD USER MODAL ============
function openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        document.getElementById('addUserForm')?.reset();
        document.getElementById('addUserError').style.display = 'none';
        document.getElementById('addUserSuccess').style.display = 'none';
    }
}

// ============ RENDER USERS TABLE ============
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (UsersState.users.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Brak użytkowników</td></tr>';
        return;
    }

    tbody.innerHTML = UsersState.users.map(user => {
        const isCurrentUser = user.id === getCurrentUserId();
        const isSuspended = user.is_suspended;

        return `
            <tr data-user-id="${user.id}" class="${isSuspended ? 'suspended' : ''}">
                <td>
                    <strong>${user.name || 'Bez nazwy'}</strong>
                    ${isCurrentUser ? '<span style="color: var(--primary);">(Ty)</span>' : ''}
                    ${user.position ? `<br><small style="color: var(--text-muted);">${user.position}</small>` : ''}
                </td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <span class="user-role-badge ${user.role}">
                        ${user.role === 'admin' ? 'Admin' : 'Doradca'}
                    </span>
                    ${isSuspended ? '<span class="user-role-badge" style="background: var(--danger-bg); color: var(--danger);">Zawieszony</span>' : ''}
                </td>
                <td>
                    ${!isCurrentUser ? `
                        <button type="button" class="action-btn" onclick="openEditUserModal('${user.id}')" title="Edytuj">✏️</button>
                        <button type="button" class="action-btn" onclick="toggleUserSuspension('${user.id}')" title="${isSuspended ? 'Aktywuj' : 'Zawieś'}">${isSuspended ? '✅' : '⏸️'}</button>
                        <button type="button" class="action-btn action-btn-delete" onclick="deleteUser('${user.id}')" title="Usuń">🗑️</button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// ============ GLOBAL FUNCTIONS ============
window.deleteUser = deleteUser;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.toggleUserSuspension = toggleUserSuspension;
window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.renderUsersTable = renderUsersTable;

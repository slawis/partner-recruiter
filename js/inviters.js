/* ========================================
   PARTNER RECRUITER - INVITERS MANAGEMENT
   Zarządzanie zapraszającymi
   ======================================== */

// ============ INVITERS STATE ============
let InvitersState = {
    inviters: [],
    editingId: null
};

// ============ SETTINGS INITIALIZATION ============
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

    // Initialize user management (admin only)
    initUserManagement();
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ============ LOAD/SAVE INVITERS ============
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

// ============ INVITER KEY GENERATION ============
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

// ============ ADD INVITER ============
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

// ============ EDIT INVITER ============
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

    // Initialize photo picker after modal is shown
    setTimeout(() => {
        initPhotoPicker();

        const preview = document.getElementById('editInviterPhotoPreview');
        const hiddenInput = document.getElementById('editInviterPhoto');
        const removeBtn = document.getElementById('btnRemovePhoto');
        const fileInput = document.getElementById('editInviterPhotoFile');

        if (inviter.photo) {
            preview.src = inviter.photo;
            hiddenInput.value = inviter.photo;
            removeBtn.style.display = 'block';
        } else {
            preview.src = DEFAULT_PHOTO;
            hiddenInput.value = '';
            removeBtn.style.display = 'none';
        }

        // Reset file input
        if (fileInput) fileInput.value = '';
    }, 100);
}

function closeEditInviterModal() {
    document.getElementById('editInviterModal').classList.remove('active');
    document.getElementById('editInviterForm').reset();
}

// ============ DELETE INVITER ============
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

// ============ RENDER INVITERS LIST ============
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

// ============ UPDATE INVITER SELECT ============
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

// ============ PHOTO PICKER ============
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

// ============ GLOBAL FUNCTIONS ============
window.openEditInviterModal = openEditInviterModal;
window.closeEditInviterModal = closeEditInviterModal;
window.deleteInviter = deleteInviter;

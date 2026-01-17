/* ========================================
   PARTNER RECRUITER - MAIN ENTRY POINT
   Inicjalizacja aplikacji
   ======================================== */

// ============ APPLICATION INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    detectMode();

    if (AppState.mode === 'generator') {
        // Inicjalizuj formularz logowania
        initLoginForm();

        // Sprawdź autentykację PRZED ładowaniem danych
        const isAuthenticated = await initAuth();

        if (isAuthenticated) {
            // Użytkownik zalogowany - załaduj dane i pokaż generator
            await loadState();
            hideLoginScreen();
            await initGeneratorWithSettings();
        } else {
            // Brak sesji - pokaż ekran logowania
            showLoginScreen();
        }
    } else {
        // Landing mode - bez logowania, załaduj dane
        document.getElementById('loginScreen')?.classList.add('hidden');
        await loadState();
        initLanding();
    }
});

// ============ GENERATOR WITH SETTINGS ============
async function initGeneratorWithSettings() {
    await initGenerator();
    await initSettings();
    applyRoleBasedUI();

    // Load partners data
    if (typeof loadPartners === 'function') {
        await loadPartners();
    }

    // Initialize sidebar navigation
    initNavigation();
    applyAdminNavigation();

    // Update sidebar user info
    updateSidebarUserInfo();
}

// ============ SIDEBAR USER INFO ============
function updateSidebarUserInfo() {
    const userName = AuthState.user?.user_metadata?.name || AuthState.user?.email || '-';
    const userRole = AuthState.user?.user_metadata?.role || 'admin';
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');

    if (sidebarUserName) sidebarUserName.textContent = userName;
    if (sidebarUserRole) sidebarUserRole.textContent = userRole === 'admin' ? 'Administrator' : 'Doradca';
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = initials;
}

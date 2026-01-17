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
}

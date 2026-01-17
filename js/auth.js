/* ========================================
   PARTNER RECRUITER - AUTHENTICATION
   Login, logout, sesja, resetowanie hasła
   ======================================== */

// ============ AUTH STATE ============
let AuthState = {
    user: null,
    profile: null,
    isAuthenticated: false
};

// ============ AUTH FUNCTIONS ============
async function initAuth() {
    const sb = getSupabase();
    if (!sb) {
        console.warn('Supabase not available for auth');
        return false;
    }

    // Sprawdź istniejącą sesję
    const { data: { session }, error } = await sb.auth.getSession();

    if (error) {
        console.error('Error getting session:', error);
        return false;
    }

    if (session) {
        AuthState.user = session.user;
        AuthState.isAuthenticated = true;

        // Pobierz profil użytkownika
        await loadUserProfile(session.user.id);
        return true;
    }

    return false;
}

async function loadUserProfile(userId) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error loading user profile:', error);
        return null;
    }

    AuthState.profile = data;
    console.log('User profile loaded:', data);
    return data;
}

async function handleLogin(email, password) {
    const sb = getSupabase();
    if (!sb) {
        throw new Error('Supabase not available');
    }

    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        throw error;
    }

    AuthState.user = data.user;
    AuthState.isAuthenticated = true;

    // Pobierz profil
    await loadUserProfile(data.user.id);

    return data;
}

async function handleLogout() {
    const sb = getSupabase();
    if (!sb) return;

    const { error } = await sb.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
    }

    AuthState.user = null;
    AuthState.profile = null;
    AuthState.isAuthenticated = false;

    // Pokaż ekran logowania
    showLoginScreen();
}

function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const generatorMode = document.getElementById('generatorMode');
    const userMenu = document.querySelector('.user-menu');

    if (loginScreen) loginScreen.classList.remove('hidden');
    if (generatorMode) generatorMode.style.display = 'none';
    if (userMenu) userMenu.classList.add('hidden');
}

function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const generatorMode = document.getElementById('generatorMode');
    const userMenu = document.querySelector('.user-menu');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (generatorMode) generatorMode.style.display = 'block';
    if (userMenu) userMenu.classList.remove('hidden');

    // Aktualizuj info o użytkowniku w UI
    updateUserUI();
}

function updateUserUI() {
    const userRole = document.getElementById('userRole');
    const userName = document.getElementById('userName');

    if (AuthState.profile) {
        if (userRole) {
            userRole.textContent = AuthState.profile.role === 'admin' ? 'Admin' : 'Doradca';
            userRole.className = 'user-role ' + AuthState.profile.role;
        }
        if (userName) {
            userName.textContent = AuthState.profile.name || AuthState.user?.email || '-';
        }
    }
}

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const btnLogout = document.getElementById('btnLogout');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const loginError = document.getElementById('loginError');
            const btnLogin = document.getElementById('btnLogin');

            // Reset error
            if (loginError) loginError.style.display = 'none';

            // Loading state
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<span>Logowanie...</span>';
            }

            try {
                await handleLogin(email, password);
                await loadState(); // Załaduj dane po zalogowaniu
                hideLoginScreen();
                await initGenerator();
            } catch (error) {
                console.error('Login error:', error);
                if (loginError) {
                    loginError.textContent = error.message === 'Invalid login credentials'
                        ? 'Nieprawidłowy email lub hasło'
                        : 'Błąd logowania: ' + error.message;
                    loginError.style.display = 'block';
                }
            } finally {
                if (btnLogin) {
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = '<span>Zaloguj się</span>';
                }
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await handleLogout();
        });
    }

    // Inicjalizuj resetowanie hasła
    initPasswordReset();
}

// ============ PASSWORD RESET ============
function initPasswordReset() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const newPasswordForm = document.getElementById('newPasswordForm');
    const loginForm = document.getElementById('loginForm');
    const loginHeaderText = document.getElementById('loginHeaderText');

    // Kliknięcie "Nie pamiętam hasła"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            forgotPasswordForm.style.display = 'flex';
            newPasswordForm.style.display = 'none';
            if (loginHeaderText) loginHeaderText.textContent = 'Resetowanie hasła';
        });
    }

    // Kliknięcie "Wróć do logowania"
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'flex';
            forgotPasswordForm.style.display = 'none';
            newPasswordForm.style.display = 'none';
            if (loginHeaderText) loginHeaderText.textContent = 'Zaloguj się do panelu';
            // Reset message
            const resetMessage = document.getElementById('resetMessage');
            if (resetMessage) resetMessage.style.display = 'none';
        });
    }

    // Wysłanie formularza resetowania hasła
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleForgotPassword();
        });
    }

    // Wysłanie formularza nowego hasła
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSetNewPassword();
        });
    }

    // Sprawdź czy to jest powrót z linku resetującego
    checkPasswordResetToken();
}

async function handleForgotPassword() {
    const email = document.getElementById('resetEmail').value;
    const resetMessage = document.getElementById('resetMessage');
    const btnResetPassword = document.getElementById('btnResetPassword');

    if (!email) return;

    // Loading state
    if (btnResetPassword) {
        btnResetPassword.disabled = true;
        btnResetPassword.innerHTML = '<span>Wysyłanie...</span>';
    }

    try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not available');

        // Wyślij email z linkiem do resetowania
        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });

        if (error) throw error;

        // Sukces
        if (resetMessage) {
            resetMessage.className = 'login-message success';
            resetMessage.innerHTML = '✅ Link do resetowania hasła został wysłany na <strong>' + email + '</strong>. Sprawdź swoją skrzynkę email.';
            resetMessage.style.display = 'block';
        }

        console.log('Password reset email sent to:', email);

    } catch (error) {
        console.error('Password reset error:', error);
        if (resetMessage) {
            resetMessage.className = 'login-message error';
            resetMessage.textContent = 'Błąd: ' + (error.message || 'Nie udało się wysłać emaila');
            resetMessage.style.display = 'block';
        }
    } finally {
        if (btnResetPassword) {
            btnResetPassword.disabled = false;
            btnResetPassword.innerHTML = '<span>Wyślij link resetujący</span>';
        }
    }
}

function checkPasswordResetToken() {
    // Supabase przekazuje token w URL hash jako #access_token=...&type=recovery
    const hash = window.location.hash;

    if (hash && hash.includes('type=recovery')) {
        console.log('Password reset token detected');

        // Pokaż formularz nowego hasła
        const loginForm = document.getElementById('loginForm');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const newPasswordForm = document.getElementById('newPasswordForm');
        const loginHeaderText = document.getElementById('loginHeaderText');
        const loginScreen = document.getElementById('loginScreen');

        if (loginForm) loginForm.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        if (newPasswordForm) newPasswordForm.style.display = 'flex';
        if (loginHeaderText) loginHeaderText.textContent = 'Ustaw nowe hasło';
        if (loginScreen) loginScreen.classList.remove('hidden');
    }
}

async function handleSetNewPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const newPasswordError = document.getElementById('newPasswordError');
    const newPasswordSuccess = document.getElementById('newPasswordSuccess');
    const btnSetNewPassword = document.getElementById('btnSetNewPassword');

    // Reset messages
    if (newPasswordError) newPasswordError.style.display = 'none';
    if (newPasswordSuccess) newPasswordSuccess.style.display = 'none';

    // Walidacja
    if (newPassword.length < 6) {
        if (newPasswordError) {
            newPasswordError.textContent = 'Hasło musi mieć minimum 6 znaków';
            newPasswordError.style.display = 'block';
        }
        return;
    }

    if (newPassword !== confirmPassword) {
        if (newPasswordError) {
            newPasswordError.textContent = 'Hasła nie są identyczne';
            newPasswordError.style.display = 'block';
        }
        return;
    }

    // Loading state
    if (btnSetNewPassword) {
        btnSetNewPassword.disabled = true;
        btnSetNewPassword.innerHTML = '<span>Zapisywanie...</span>';
    }

    try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase not available');

        // Aktualizuj hasło
        const { error } = await sb.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        // Sukces
        if (newPasswordSuccess) {
            newPasswordSuccess.innerHTML = '✅ Hasło zostało zmienione! Za chwilę nastąpi przekierowanie...';
            newPasswordSuccess.style.display = 'block';
        }

        // Ukryj przycisk
        if (btnSetNewPassword) btnSetNewPassword.style.display = 'none';

        // Wyczyść hash z URL
        window.history.replaceState(null, '', window.location.pathname);

        // Przekieruj do logowania po 2 sekundach
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Set new password error:', error);
        if (newPasswordError) {
            newPasswordError.textContent = 'Błąd: ' + (error.message || 'Nie udało się zmienić hasła');
            newPasswordError.style.display = 'block';
        }
    } finally {
        if (btnSetNewPassword) {
            btnSetNewPassword.disabled = false;
            btnSetNewPassword.innerHTML = '<span>Ustaw nowe hasło</span>';
        }
    }
}

// ============ ROLE HELPERS ============
function isAdmin() {
    return AuthState.profile?.role === 'admin';
}

function isDoradca() {
    return AuthState.profile?.role === 'doradca';
}

function getCurrentUserId() {
    return AuthState.user?.id || null;
}

function getCurrentUserInviterKey() {
    return AuthState.profile?.inviter_key || null;
}

// Sprawdza czy użytkownik może widzieć dane (admin widzi wszystko, doradca tylko swoje)
function canViewData(userId, inviterKey) {
    if (isAdmin()) return true;
    if (isDoradca()) {
        // Doradca widzi tylko swoje dane
        const currentUserId = getCurrentUserId();
        const currentInviterKey = getCurrentUserInviterKey();
        return userId === currentUserId || inviterKey === currentInviterKey;
    }
    return false;
}

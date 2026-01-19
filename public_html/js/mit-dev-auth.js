import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Login Page Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');

    // Sidebar Elements (on index.html)
    const authNavItem = document.getElementById('auth-nav-item');

    // Profile Dropdown Elements
    const userProfileContainer = document.getElementById('user-profile-container');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const dropdownAdminLink = document.getElementById('dropdown-admin-link');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

    // Admin Page Elements
    const logoutBtn = document.getElementById('logout-btn');

    // --- Event Listeners ---

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-container').classList.add('d-none');
            document.getElementById('register-container').classList.remove('d-none');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-container').classList.add('d-none');
            document.getElementById('login-container').classList.remove('d-none');
        });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);

    // --- Session Checks ---

    if (window.location.pathname.includes('admin.html')) {
        checkAdminSession();
    } else {
        // Check session for general pages (like index.html) to update UI
        updateUIState();
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('login-message');
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.textContent = 'Logowanie...';
    messageDiv.textContent = '';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Record login location (async, don't await)
        recordLoginLocation(data.user.id);

        // Check role to decide redirect
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }

    } catch (err) {
        console.error('Login error:', err);
        let msg = err.message || 'Błąd logowania.';

        if (msg.includes('Invalid login credentials')) {
            msg = 'Nieprawidłowy email lub hasło.';
        } else if (msg.includes('Email not confirmed')) {
            msg = 'Email nie został potwierdzony. Sprawdź skrzynkę pocztową.';
        }

        messageDiv.innerHTML = `<strong>Błąd:</strong> ${msg}`;
        btn.disabled = false;
        btn.textContent = 'Zaloguj się';
    }
}

async function recordLoginLocation(userId) {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) return;
        const locData = await response.json();

        await supabase.from('login_history').insert([{
            user_id: userId,
            country_code: locData.country_code,
            city: locData.city,
            ip: locData.ip,
            latitude: locData.latitude,
            longitude: locData.longitude,
            region: locData.region
        }]);
    } catch (err) {
        console.error('Error recording login location:', err);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const messageDiv = document.getElementById('register-message');
    const btn = document.getElementById('register-btn');

    btn.disabled = true;
    btn.textContent = 'Tworzenie konta...';
    messageDiv.textContent = '';

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            await supabase
                .from('profiles')
                .insert([{ id: data.user.id, role: 'user' }]);
        }

        alert('Konto zostało utworzone! Możesz się teraz zalogować.');
        document.getElementById('register-container').classList.add('d-none');
        document.getElementById('login-container').classList.remove('d-none');

    } catch (err) {
        console.error('Register error:', err);
        messageDiv.textContent = err.message || 'Błąd rejestracji.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Utwórz konto';
    }
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
        alert('Błąd wylogowywania.');
    }
}

async function checkAdminSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error || profile?.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

async function updateUIState() {
    const authNavItem = document.getElementById('auth-nav-item');
    const userProfileContainer = document.getElementById('user-profile-container');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const dropdownAdminLink = document.getElementById('dropdown-admin-link');

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Logged in: Hide sidebar login, Show profile icon
        if (authNavItem) authNavItem.classList.add('d-none');
        if (userProfileContainer) userProfileContainer.classList.remove('d-none');

        if (dropdownUserEmail) {
            dropdownUserEmail.textContent = session.user.email;
        }

        // Check if user is admin to show the link in dropdown
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role === 'admin') {
            if (dropdownAdminLink) dropdownAdminLink.classList.remove('d-none');
        }
    } else {
        // Guest: Show sidebar login, Hide profile icon
        if (authNavItem) authNavItem.classList.remove('d-none');
        if (userProfileContainer) userProfileContainer.classList.add('d-none');
    }
}

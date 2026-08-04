/* ============================================================
   EMS - Login Page JS
   login.js
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // Redirect if already logged in
  if (API.getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form      = document.getElementById('login-form');
  const emailIn   = document.getElementById('email');
  const pwdIn     = document.getElementById('password');
  const pwdToggle = document.getElementById('pwd-toggle');
  const pwdIcon   = document.getElementById('pwd-icon');
  const loginBtn  = document.getElementById('login-btn');
  const alertBox  = document.getElementById('login-alert');
  const alertMsg  = document.getElementById('login-alert-msg');

  /* ── Password Visibility Toggle ───────────────────────────── */
  pwdToggle?.addEventListener('click', () => {
    const isText = pwdIn.type === 'text';
    pwdIn.type  = isText ? 'password' : 'text';
    pwdIcon.className = isText ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  });

  /* ── Clear errors on input ────────────────────────────────── */
  emailIn?.addEventListener('input', () => clearFieldError('email'));
  pwdIn?.addEventListener('input',   () => clearFieldError('password'));

  /* ── Form Submit ───────────────────────────────────────────── */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email    = emailIn.value.trim();
    const password = pwdIn.value;
    let   valid    = true;

    // Validate email
    if (!email) {
      showFieldError('email', 'Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('email', 'Enter a valid email address.');
      valid = false;
    }

    // Validate password
    if (!password) {
      showFieldError('password', 'Password is required.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const res = await API.auth.login(email, password);

      if (res && res.token) {
        showToast('Login successful! Redirecting…', 'success', 1500);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      } else {
        showAlert('Invalid credentials. Please try again.');
      }

    } catch (err) {
      showAlert(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  });

  /* ── Helpers ───────────────────────────────────────────────── */
  function setLoading(loading) {
    loginBtn.disabled = loading;
    loginBtn.classList.toggle('loading', loading);
    const btnText    = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');
    if (btnText)    btnText.style.opacity  = loading ? '0' : '1';
    if (btnSpinner) btnSpinner.style.display = loading ? 'block' : 'none';
  }

  function showAlert(msg) {
    if (alertBox) { alertBox.style.display = 'flex'; }
    if (alertMsg) alertMsg.textContent = msg;
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  function showFieldError(field, msg) {
    const input = document.getElementById(field);
    const error = document.getElementById(`${field}-error`);
    input?.classList.add('error');
    if (error) error.textContent = msg;
  }

  function clearFieldError(field) {
    const input = document.getElementById(field);
    const error = document.getElementById(`${field}-error`);
    input?.classList.remove('error');
    if (error) error.textContent = '';
  }

  /* ── Demo Credential Quick-fill ───────────────────────────── */
  // Allow clicking on demo credentials to fill form
  document.querySelector('.demo-creds')?.addEventListener('click', (e) => {
    const codeEl = e.target.closest('code');
    if (!codeEl) return;
    const text = codeEl.textContent;
    if (text.includes('@')) {
      emailIn.value = text;
    } else {
      pwdIn.value = text;
    }
  });

  // Remember me
  const rememberMe = document.getElementById('remember-me');
  const savedEmail = localStorage.getItem('ems_remembered_email');
  if (savedEmail && rememberMe) {
    emailIn.value    = savedEmail;
    rememberMe.checked = true;
  }

  form?.addEventListener('submit', () => {
    if (rememberMe?.checked) {
      localStorage.setItem('ems_remembered_email', emailIn.value.trim());
    } else {
      localStorage.removeItem('ems_remembered_email');
    }
  }, { capture: false });

});

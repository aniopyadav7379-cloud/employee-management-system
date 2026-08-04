/* ============================================================
   EMS - API Utility
   api.js — centralized fetch wrapper, auth, token management
   ============================================================ */

const API = (() => {

  // ✅ FIX: Updated to match your actual Render service URL
  const BASE_URL = "https://employee-management-system-61n0.onrender.com/api";

  /* ── Token Management ─────────────────────────────────────── */
  const getToken    = () => localStorage.getItem('ems_token');
  const setToken    = (t) => localStorage.setItem('ems_token', t);
  const removeToken = () => localStorage.removeItem('ems_token');

  const getUser = () => {
    const raw = localStorage.getItem('ems_user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  };
  const setUser    = (u) => localStorage.setItem('ems_user', JSON.stringify(u));
  const removeUser = () => localStorage.removeItem('ems_user');

  /* ── Auth Check ───────────────────────────────────────────── */
  const requireAuth = () => {
    if (!getToken()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  };

  /* ── Build Headers ────────────────────────────────────────── */
  const buildHeaders = (json = true) => {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  /* ── Core Fetch ───────────────────────────────────────────── */
  const request = async (method, path, body = null, options = {}) => {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const config = {
      method,
      headers: buildHeaders(!options.formData),
    };

    if (body) {
      config.body = options.formData ? body : JSON.stringify(body);
    }

    try {
      const res = await fetch(url, config);

      // ✅ FIX: On 401, only redirect if NOT on login page to avoid redirect loops
      if (res.status === 401) {
        const isLoginPage = window.location.pathname.endsWith('index.html')
          || window.location.pathname === '/'
          || window.location.pathname.endsWith('/');
        if (!isLoginPage) {
          logout();
        }
        return null;
      }

      // No content responses
      if (res.status === 204) return { success: true };

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your connection or try again shortly.');
      }
      throw err;
    }
  };

  const get   = (path)        => request('GET',    path);
  const post  = (path, body)  => request('POST',   path, body);
  const put   = (path, body)  => request('PUT',    path, body);
  const patch = (path, body)  => request('PATCH',  path, body);
  const del   = (path)        => request('DELETE', path);

  /* ── Auth Endpoints ───────────────────────────────────────── */
  const auth = {
    login: async (email, password) => {
      const data = await post('/auth/login', { email, password });
      if (data?.token) {
        setToken(data.token);
        // ✅ FIX: Backend returns { token, userId, name, email, role }
        // Map all fields so sidebar/topbar display correctly
        setUser({
          id:    data.userId || data.id,
          name:  data.name  || email.split('@')[0],
          email: data.email || email,
          role:  data.role  || 'EMPLOYEE',
        });
      }
      return data;
    },
    logout: () => {
      removeToken();
      removeUser();
      window.location.href = 'index.html';
    },
    me: () => get('/auth/me'),
  };

  /* ── Employee Endpoints ───────────────────────────────────── */
  const employees = {
    getAll:   (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/employees${q ? '?' + q : ''}`);
    },
    getById:  (id)          => get(`/employees/${id}`),
    create:   (data)        => post('/employees', data),
    update:   (id, data)    => put(`/employees/${id}`, data),
    delete:   (id)          => del(`/employees/${id}`),
    search:   (q)           => get(`/employees/search?q=${encodeURIComponent(q)}`),
    getStats: ()            => get('/employees/stats'),
    recent:   ()            => get('/employees/recent'),
  };

  /* ── Department Endpoints ─────────────────────────────────── */
  const departments = {
    getAll:   ()            => get('/departments'),
    getById:  (id)          => get(`/departments/${id}`),
    create:   (data)        => post('/departments', data),
    update:   (id, data)    => put(`/departments/${id}`, data),
    delete:   (id)          => del(`/departments/${id}`),
    getStats: ()            => get('/departments/stats'),
  };

  /* ── Leave Endpoints ──────────────────────────────────────── */
  const leaves = {
    getAll:     (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return get(`/leaves${q ? '?' + q : ''}`);
    },
    getById:    (id)          => get(`/leaves/${id}`),
    create:     (data)        => post('/leaves', data),
    approve:    (id, note)    => patch(`/leaves/${id}/approve`, { note }),
    reject:     (id, reason)  => patch(`/leaves/${id}/reject`, { reason }),
    cancel:     (id)          => patch(`/leaves/${id}/cancel`),
    getStats:   ()            => get('/leaves/stats'),
    getBalance: (empId)       => get(`/leaves/balance/${empId}`),
    getMy:      ()            => get('/leaves/my'),
  };

  /* ── Dashboard Endpoints ──────────────────────────────────── */
  const dashboard = {
    getSummary:        ()       => get('/dashboard/summary'),
    getHeadcountTrend: (period) => get(`/dashboard/headcount?period=${period}`),
    getRecentActivity: ()       => get('/dashboard/activity'),
  };

  /* ── Profile Endpoints ────────────────────────────────────── */
  const profile = {
    get:            ()     => get('/profile'),
    update:         (data) => put('/profile', data),
    changePassword: (data) => post('/profile/change-password', data),
  };

  /* ── Convenience logout ───────────────────────────────────── */
  const logout = () => auth.logout();

  return {
    BASE_URL,
    getToken, setToken, removeToken,
    getUser, setUser, removeUser,
    requireAuth, logout,
    get, post, put, patch, del,
    auth, employees, departments, leaves, dashboard, profile,
  };

})();

/* ── Global Helpers ─────────────────────────────────────────── */

/** Show a toast notification */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-dismiss" onclick="this.closest('.toast').remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/** Open a modal */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

/** Close a modal */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

/** Format a date string to readable format */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Get initials from a name */
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
}

/** Calculate working days between two dates */
function workingDays(startStr, endStr) {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Debounce helper */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Init sidebar toggle & mobile support */
function initSidebar() {
  const toggle  = document.getElementById('sidebar-toggle');
  const shell   = document.getElementById('app-shell');
  const sidebar = document.getElementById('sidebar');

  if (toggle && shell) {
    toggle.addEventListener('click', () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        sidebar?.classList.toggle('mobile-open');
      } else {
        shell.classList.toggle('sidebar-collapsed');
      }
    });
  }

  // Close mobile sidebar on outside click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

/** Populate sidebar user info from localStorage */
function initSidebarUser() {
  const user = API.getUser();
  if (!user) return;

  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  const topbarAv = document.getElementById('topbar-avatar');

  const name     = user.name || user.email || 'User';
  // ✅ FIX: Format role nicely e.g. HR_MANAGER → HR Manager
  const role     = (user.role || 'Employee')
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  const initials = getInitials(name);

  if (nameEl)   nameEl.textContent   = name;
  if (roleEl)   roleEl.textContent   = role;
  if (avatarEl) avatarEl.textContent = initials;
  if (topbarAv) topbarAv.textContent = initials;
}

/** Logout binding */
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', (e) => {
    e.preventDefault();
    API.logout();
  });
}

/** Close modals on overlay click */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/** Close modals on Escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

// Init sidebar on every page
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initSidebarUser();
  initLogout();
});
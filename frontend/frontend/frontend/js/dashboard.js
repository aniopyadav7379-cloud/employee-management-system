/* ============================================================
   EMS - Dashboard JS
   dashboard.js
   ============================================================ */

'use strict';

let headcountChart = null;
let deptChart      = null;

const DEPT_COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.requireAuth()) return;

  setWelcomeDate();
  updateWelcomeName();

  // Load data in parallel
  await Promise.allSettled([
    loadStats(),
    loadHeadcountChart('month'),
    loadDeptChart(),
    loadRecentEmployees(),
  ]);
});

/* ── Date / Greeting ──────────────────────────────────────── */
function setWelcomeDate() {
  const now = new Date();
  const dateNum = document.getElementById('date-num');
  const dateStr = document.getElementById('date-str');
  if (dateNum) dateNum.textContent = now.getDate();
  if (dateStr) dateStr.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', year: 'numeric' });
}

function updateWelcomeName() {
  const user = API.getUser();
  const nameEl = document.getElementById('welcome-name');
  if (nameEl && user?.name) {
    nameEl.textContent = user.name.split(' ')[0];
  }
}

/* ── Stats ───────────────────────────────────────────────── */
async function loadStats() {
  try {
    const data = await API.dashboard.getSummary();
    if (!data) return useFallbackStats();

    setValue('stat-total',   data.totalEmployees   ?? '—');
    setValue('stat-depts',   data.totalDepartments ?? '—');
    setValue('stat-on-leave', data.onLeaveToday    ?? '—');
    setValue('stat-active',  data.activeEmployees  ?? '—');
    setValue('pending-leave-count', data.pendingLeaves ?? 0);
  } catch {
    useFallbackStats();
  }
}

function useFallbackStats() {
  setValue('stat-total',   '248');
  setValue('stat-depts',   '12');
  setValue('stat-on-leave', '7');
  setValue('stat-active',  '238');
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Headcount Chart ─────────────────────────────────────── */
async function loadHeadcountChart(period = 'month') {
  const canvas = document.getElementById('headcount-chart');
  if (!canvas) return;

  let labels, data;

  try {
    const res = await API.dashboard.getHeadcountTrend(period);
    labels = res?.labels || [];
    data   = res?.data   || [];
  } catch {
    // Fallback demo data
    if (period === 'month') {
      labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      data   = [210, 218, 222, 225, 229, 234, 238, 240, 242, 244, 246, 248];
    } else {
      labels = ['2019','2020','2021','2022','2023','2024'];
      data   = [120, 145, 165, 190, 220, 248];
    }
  }

  if (headcountChart) headcountChart.destroy();

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.02)');

  headcountChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Headcount',
        data,
        borderColor: '#4f46e5',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#020818',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1530',
          borderColor: 'rgba(99,102,241,0.3)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#94a3b8',
          padding: 12,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(99,102,241,0.06)' },
          ticks: { color: '#64748b', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(99,102,241,0.06)' },
          ticks: { color: '#64748b', font: { size: 11 } },
          beginAtZero: false,
        },
      },
    },
  });

  // Toggle buttons
  document.getElementById('btn-month')?.classList.toggle('text-cyan', period === 'month');
  document.getElementById('btn-year')?.classList.toggle('text-cyan',  period === 'year');
}

window.setChartPeriod = (p) => loadHeadcountChart(p);

/* ── Department Donut Chart ───────────────────────────────── */
async function loadDeptChart() {
  const canvas = document.getElementById('dept-chart');
  const legend = document.getElementById('dept-legend');
  if (!canvas) return;

  let labels = ['Engineering','Marketing','HR','Finance','Operations','Sales'];
  let counts = [82, 35, 24, 28, 45, 34];

  try {
    const res = await API.departments.getStats();
    if (res?.departments) {
      labels = res.departments.map(d => d.name);
      counts = res.departments.map(d => d.employeeCount);
    }
  } catch {}

  if (deptChart) deptChart.destroy();

  const total = counts.reduce((a, b) => a + b, 0);
  const ctx   = canvas.getContext('2d');

  deptChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: DEPT_COLORS.slice(0, labels.length),
        borderColor: '#020818',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1530',
          borderColor: 'rgba(99,102,241,0.3)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#94a3b8',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} employees`,
          },
        },
      },
    },
  });

  // Build legend
  if (legend) {
    legend.innerHTML = labels.slice(0, 5).map((label, i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${DEPT_COLORS[i]}"></div>
        <div class="legend-label">${label}</div>
        <div class="legend-value">${counts[i]}</div>
        <div class="legend-pct">${Math.round((counts[i] / total) * 100)}%</div>
      </div>
    `).join('');
  }
}

/* ── Recent Employees Table ───────────────────────────────── */
async function loadRecentEmployees() {
  const tbody = document.getElementById('recent-employees-body');
  if (!tbody) return;

  let employees;
  try {
    employees = await API.employees.recent();
  } catch {
    employees = getDemoEmployees();
  }

  if (!employees?.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="padding:2rem;"><i class="fa-solid fa-users"></i><br>No employees found.</td></tr>`;
    return;
  }

  tbody.innerHTML = employees.slice(0, 6).map(emp => {
    const name    = `${emp.firstName} ${emp.lastName}`;
    const initials = getInitials(name);
    const statusBadge = emp.status === 'ACTIVE'
      ? '<span class="badge badge-active badge-dot">Active</span>'
      : '<span class="badge badge-inactive badge-dot">Inactive</span>';

    return `
      <tr>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar">${initials}</div>
            <div>
              <div class="emp-name">${name}</div>
              <div class="emp-email">${emp.email || ''}</div>
            </div>
          </div>
        </td>
        <td class="text-secondary">${emp.department?.name || emp.departmentName || '—'}</td>
        <td class="text-secondary">${formatDate(emp.joinDate)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function getDemoEmployees() {
  return [
    { firstName:'Priya',    lastName:'Sharma',  email:'priya@ems.com',   departmentName:'Engineering', joinDate:'2025-06-10', status:'ACTIVE' },
    { firstName:'Rahul',    lastName:'Mehta',   email:'rahul@ems.com',   departmentName:'Marketing',   joinDate:'2025-06-05', status:'ACTIVE' },
    { firstName:'Ananya',   lastName:'Reddy',   email:'ananya@ems.com',  departmentName:'Finance',     joinDate:'2025-05-28', status:'ACTIVE' },
    { firstName:'Vikram',   lastName:'Nair',    email:'vikram@ems.com',  departmentName:'Engineering', joinDate:'2025-05-20', status:'ACTIVE' },
    { firstName:'Sneha',    lastName:'Kapoor',  email:'sneha@ems.com',   departmentName:'HR',          joinDate:'2025-05-15', status:'ACTIVE' },
    { firstName:'Arjun',    lastName:'Kumar',   email:'arjun@ems.com',   departmentName:'Sales',       joinDate:'2025-05-10', status:'INACTIVE' },
  ];
}

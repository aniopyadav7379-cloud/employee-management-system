/* ============================================================
   EMS - Leave Management JS
   leave.js
   ============================================================ */

'use strict';

let allLeaves   = [];
let currentTab  = 'pending';

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.requireAuth()) return;
  await Promise.allSettled([loadStats(), loadLeaves(), loadDeptFilter(), loadEmployeeSelect()]);
  bindEvents();
  setDefaultMonthFilter();
});

/* ── Load ─────────────────────────────────────────────────── */
async function loadLeaves() {
  try {
    const res = await API.leaves.getAll();
    allLeaves = Array.isArray(res) ? res : (res?.content || getDemoLeaves());
  } catch {
    allLeaves = getDemoLeaves();
  }
  updateTabCounts();
  renderLeaves();
}

async function loadStats() {
  try {
    const s = await API.leaves.getStats();
    document.getElementById('stat-pending').textContent       = s?.pending       ?? '—';
    document.getElementById('stat-approved').textContent      = s?.approvedMonth  ?? '—';
    document.getElementById('stat-rejected').textContent      = s?.rejectedMonth  ?? '—';
    document.getElementById('stat-on-leave-today').textContent = s?.onLeaveToday  ?? '—';
    document.getElementById('pending-leave-count').textContent = s?.pending       ?? 0;
  } catch {
    document.getElementById('stat-pending').textContent        = '3';
    document.getElementById('stat-approved').textContent       = '14';
    document.getElementById('stat-rejected').textContent       = '2';
    document.getElementById('stat-on-leave-today').textContent = '7';
  }
}

async function loadDeptFilter() {
  try {
    const depts = await API.departments.getAll();
    const sel = document.getElementById('dept-leave-filter');
    if (!sel) return;
    (Array.isArray(depts) ? depts : []).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  } catch {}
}

async function loadEmployeeSelect() {
  const sel = document.getElementById('leave-employee');
  if (!sel) return;
  try {
    const res  = await API.employees.getAll({ status: 'ACTIVE' });
    const list = Array.isArray(res) ? res : (res?.content || []);
    list.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.firstName} ${e.lastName}`;
      sel.appendChild(opt);
    });
  } catch {}
}

/* ── Events ─────────────────────────────────────────────── */
function bindEvents() {
  // Search
  document.getElementById('leave-search')?.addEventListener('input', debounce(() => renderLeaves(), 300));
  document.getElementById('leave-type-filter')?.addEventListener('change', () => renderLeaves());
  document.getElementById('dept-leave-filter')?.addEventListener('change', () => renderLeaves());
  document.getElementById('month-filter')?.addEventListener('change', () => renderLeaves());

  // Date range → calculate days
  ['start-date','end-date'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updateDaysPreview);
  });

  document.getElementById('apply-leave-submit-btn')?.addEventListener('click', submitLeaveForm);
}

function setDefaultMonthFilter() {
  const now = new Date();
  const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
  const el  = document.getElementById('month-filter');
  if (el) el.value = val;
}

/* ── Tab Switching ──────────────────────────────────────── */
window.switchTab = (tab) => {
  currentTab = tab;
  ['pending','approved','rejected','all'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
  });
  renderLeaves();
};

function updateTabCounts() {
  const counts = { pending: 0, approved: 0, rejected: 0, all: allLeaves.length };
  allLeaves.forEach(l => {
    const s = l.status?.toLowerCase();
    if (s === 'pending')  counts.pending++;
    if (s === 'approved') counts.approved++;
    if (s === 'rejected') counts.rejected++;
  });
  Object.entries(counts).forEach(([key, val]) => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = val;
  });
}

/* ── Render ─────────────────────────────────────────────── */
function getFilteredLeaves() {
  const q        = document.getElementById('leave-search')?.value.toLowerCase()    || '';
  const type     = document.getElementById('leave-type-filter')?.value             || '';
  const dept     = document.getElementById('dept-leave-filter')?.value             || '';
  const monthVal = document.getElementById('month-filter')?.value                  || '';

  return allLeaves.filter(l => {
    const name  = `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.toLowerCase();
    const status = l.status?.toLowerCase();

    const matchTab  = currentTab === 'all' || status === currentTab;
    const matchQ    = !q    || name.includes(q) || (l.reason || '').toLowerCase().includes(q);
    const matchType = !type || l.leaveType === type;
    const matchDept = !dept || l.employee?.department?.name === dept;
    const matchMonth = !monthVal || (l.startDate && l.startDate.startsWith(monthVal));

    return matchTab && matchQ && matchType && matchDept && matchMonth;
  });
}

function renderLeaves() {
  const container = document.getElementById('leave-list-container');
  if (!container) return;

  const leaves = getFilteredLeaves();
  updateTabCounts();

  if (!leaves.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-calendar-xmark"></i>
        <h3>No leave requests found</h3>
        <p>Try adjusting your filters or date range.</p>
      </div>`;
    return;
  }

  container.innerHTML = leaves.map(l => buildLeaveCard(l)).join('');
}

function buildLeaveCard(l) {
  const name     = `${l.employee?.firstName || 'Unknown'} ${l.employee?.lastName || ''}`;
  const initials = getInitials(name);
  const dept     = l.employee?.department?.name || l.employee?.departmentName || '—';
  const days     = workingDays(l.startDate, l.endDate);
  const typeLbl  = formatLeaveType(l.leaveType);

  const statusMap = {
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };
  const badgeCls = statusMap[l.status?.toLowerCase()] || 'badge-pending';
  const badge    = `<span class="badge ${badgeCls} badge-dot">${l.status}</span>`;

  const actions = l.status?.toLowerCase() === 'pending'
    ? `
        <button class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:var(--success);border:1px solid rgba(16,185,129,0.3);"
          onclick="approveLeave(${l.id})"><i class="fa-solid fa-check"></i> Approve</button>
        <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:var(--danger);border:1px solid rgba(239,68,68,0.25);"
          onclick="rejectLeave(${l.id})"><i class="fa-solid fa-xmark"></i> Reject</button>
      `
    : `<button class="btn btn-ghost btn-sm" onclick="viewLeaveDetail(${l.id})"><i class="fa-solid fa-eye"></i> View</button>`;

  return `
    <div class="leave-request-card" id="leave-card-${l.id}">
      <div class="emp-avatar">${initials}</div>
      <div class="emp-info">
        <h4>${name}</h4>
        <div class="meta">
          <span><i class="fa-solid fa-building"></i> ${dept}</span>
          <span><i class="fa-solid fa-tag"></i> ${typeLbl}</span>
          <span><i class="fa-solid fa-calendar"></i> ${formatDate(l.startDate)} – ${formatDate(l.endDate)}</span>
          ${l.reason ? `<span><i class="fa-solid fa-comment"></i> ${l.reason.substring(0,60)}${l.reason.length>60?'…':''}</span>` : ''}
        </div>
      </div>
      <div class="leave-duration">
        <div class="days">${days}</div>
        <div class="days-label">Day${days !== 1 ? 's' : ''}</div>
        <div style="margin-top:8px;">${badge}</div>
      </div>
      <div class="leave-actions">${actions}</div>
    </div>
  `;
}

/* ── Actions ─────────────────────────────────────────────── */
window.approveLeave = async (id) => {
  try {
    await API.leaves.approve(id, '');
    updateLeaveStatus(id, 'APPROVED');
    showToast('Leave request approved.', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to approve leave.', 'error');
  }
};

window.rejectLeave = async (id) => {
  const reason = prompt('Reason for rejection (optional):');
  if (reason === null) return; // cancelled
  try {
    await API.leaves.reject(id, reason);
    updateLeaveStatus(id, 'REJECTED');
    showToast('Leave request rejected.', 'info');
  } catch (err) {
    showToast(err.message || 'Failed to reject leave.', 'error');
  }
};

function updateLeaveStatus(id, status) {
  const leave = allLeaves.find(l => l.id === id);
  if (leave) leave.status = status;
  updateTabCounts();
  renderLeaves();
}

window.viewLeaveDetail = (id) => {
  const l = allLeaves.find(l => l.id === id);
  if (!l) return;

  const name  = `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`;
  const days  = workingDays(l.startDate, l.endDate);

  const statusMap = { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected' };
  const badgeCls  = statusMap[l.status?.toLowerCase()] || 'badge-pending';

  document.getElementById('leave-detail-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5);">
      <div class="emp-avatar" style="width:52px;height:52px;font-size:1.25rem;">${getInitials(name)}</div>
      <div>
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);">${name}</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);">${l.employee?.designation || ''} · ${l.employee?.department?.name || ''}</div>
      </div>
      <span class="badge ${badgeCls} badge-dot" style="margin-left:auto;">${l.status}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div><div class="form-label text-xs text-muted">Leave Type</div><div class="font-semibold">${formatLeaveType(l.leaveType)}</div></div>
      <div><div class="form-label text-xs text-muted">Duration</div><div class="font-semibold">${days} day${days!==1?'s':''}</div></div>
      <div><div class="form-label text-xs text-muted">From</div><div class="font-semibold">${formatDate(l.startDate)}</div></div>
      <div><div class="form-label text-xs text-muted">To</div><div class="font-semibold">${formatDate(l.endDate)}</div></div>
    </div>
    ${l.reason ? `<div class="divider"></div><div><div class="form-label text-xs text-muted">Reason</div><div style="color:var(--text-secondary);font-size:0.875rem;">${l.reason}</div></div>` : ''}
    ${l.rejectionReason ? `<div class="divider"></div><div><div class="form-label text-xs text-muted">Rejection Reason</div><div style="color:var(--danger);font-size:0.875rem;">${l.rejectionReason}</div></div>` : ''}
    <div class="divider"></div>
    <div class="text-xs text-muted">Applied: ${formatDate(l.appliedOn || l.createdAt)}</div>
  `;

  document.getElementById('leave-detail-actions').innerHTML = l.status?.toLowerCase() === 'pending'
    ? `
        <button class="btn btn-secondary" onclick="closeModal('leave-detail-modal')">Close</button>
        <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:var(--danger);border:1px solid rgba(239,68,68,0.25);"
          onclick="rejectLeave(${l.id});closeModal('leave-detail-modal')"><i class="fa-solid fa-xmark"></i> Reject</button>
        <button class="btn btn-primary btn-sm"
          onclick="approveLeave(${l.id});closeModal('leave-detail-modal')"><i class="fa-solid fa-check"></i> Approve</button>
      `
    : `<button class="btn btn-secondary" onclick="closeModal('leave-detail-modal')">Close</button>`;

  openModal('leave-detail-modal');
};

/* ── Apply Leave Modal ──────────────────────────────────── */
window.openApplyModal = () => {
  document.getElementById('apply-leave-form')?.reset();
  document.getElementById('days-preview').style.display = 'none';
  openModal('apply-leave-modal');
};

function updateDaysPreview() {
  const start = document.getElementById('start-date')?.value;
  const end   = document.getElementById('end-date')?.value;
  if (!start || !end) return;
  const days = workingDays(start, end);
  const preview = document.getElementById('days-preview');
  const count   = document.getElementById('days-count');
  if (preview) preview.style.display = days > 0 ? 'block' : 'none';
  if (count)   count.textContent     = days;
}

window.submitLeaveForm = async () => {
  const required = [
    { id:'leave-type',     msg:'Leave type is required.' },
    { id:'leave-employee', msg:'Employee is required.' },
    { id:'start-date',     msg:'Start date is required.' },
    { id:'end-date',       msg:'End date is required.' },
    { id:'leave-reason',   msg:'Reason is required.' },
  ];

  let valid = true;
  required.forEach(({ id, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-error`);
    if (!el?.value?.trim()) {
      el?.classList.add('error');
      if (err) err.textContent = msg;
      valid = false;
    } else {
      el?.classList.remove('error');
      if (err) err.textContent = '';
    }
  });
  if (!valid) return;

  const payload = {
    leaveType:   document.getElementById('leave-type')?.value,
    employeeId:  parseInt(document.getElementById('leave-employee')?.value),
    startDate:   document.getElementById('start-date')?.value,
    endDate:     document.getElementById('end-date')?.value,
    reason:      document.getElementById('leave-reason')?.value.trim(),
    status:      'PENDING',
  };

  const btn = document.getElementById('apply-leave-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…';

  try {
    await API.leaves.create(payload);
    showToast('Leave request submitted!', 'success');
    closeModal('apply-leave-modal');
    await loadLeaves();
  } catch (err) {
    showToast(err.message || 'Submission failed.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Request';
  }
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatLeaveType(type) {
  const map = { CASUAL:'Casual Leave', SICK:'Sick Leave', ANNUAL:'Annual Leave', MATERNITY:'Maternity Leave', PATERNITY:'Paternity Leave', UNPAID:'Unpaid Leave' };
  return map[type] || type || '—';
}

function getDemoLeaves() {
  return [
    { id:1, employee:{ firstName:'Rahul', lastName:'Mehta',  designation:'Marketing Manager', department:{ name:'Marketing'   }}, leaveType:'CASUAL',   startDate:'2025-07-01', endDate:'2025-07-03', reason:'Family function',   status:'PENDING',  appliedOn:'2025-06-25' },
    { id:2, employee:{ firstName:'Sneha', lastName:'Kapoor', designation:'HR Specialist',     department:{ name:'HR'          }}, leaveType:'SICK',     startDate:'2025-06-28', endDate:'2025-06-30', reason:'Fever and cold',    status:'PENDING',  appliedOn:'2025-06-27' },
    { id:3, employee:{ firstName:'Arjun', lastName:'Kumar',  designation:'Sales Executive',   department:{ name:'Sales'       }}, leaveType:'ANNUAL',   startDate:'2025-07-10', endDate:'2025-07-18', reason:'Vacation',          status:'PENDING',  appliedOn:'2025-06-20' },
    { id:4, employee:{ firstName:'Priya', lastName:'Sharma', designation:'Senior Engineer',   department:{ name:'Engineering' }}, leaveType:'CASUAL',   startDate:'2025-06-20', endDate:'2025-06-21', reason:'Personal work',     status:'APPROVED', appliedOn:'2025-06-18' },
    { id:5, employee:{ firstName:'Divya', lastName:'Singh',  designation:'Frontend Developer',department:{ name:'Engineering' }}, leaveType:'SICK',     startDate:'2025-06-15', endDate:'2025-06-16', reason:'Not feeling well',  status:'APPROVED', appliedOn:'2025-06-14' },
    { id:6, employee:{ firstName:'Kiran', lastName:'Patel',  designation:'Ops Manager',       department:{ name:'Operations'  }}, leaveType:'UNPAID',   startDate:'2025-06-10', endDate:'2025-06-12', reason:'Personal reasons',  status:'REJECTED', appliedOn:'2025-06-08', rejectionReason:'Insufficient leave balance.' },
  ];
}

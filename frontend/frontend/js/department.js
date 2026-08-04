/* ============================================================
   EMS - Department JS
   department.js
   ============================================================ */

'use strict';

let allDepts    = [];
let editingDeptId = null;
let pendingDeleteDeptId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.requireAuth()) return;
  await loadDepartments();
  bindEvents();
});

async function loadDepartments() {
  try {
    const res = await API.departments.getAll();
    allDepts = Array.isArray(res) ? res : getDemoDepts();
  } catch {
    allDepts = getDemoDepts();
  }
  renderDepts();
  renderDeptTable();
  renderStats();
}

function bindEvents() {
  const searchEl = document.getElementById('dept-search');
  searchEl?.addEventListener('input', debounce(() => {
    const q = searchEl.value.toLowerCase();
    const filtered = allDepts.filter(d => d.name.toLowerCase().includes(q));
    renderDepts(filtered);
    renderDeptTable(filtered);
  }, 250));

  document.getElementById('confirm-dept-delete-btn')?.addEventListener('click', async () => {
    if (!pendingDeleteDeptId) return;
    await deleteDept(pendingDeleteDeptId);
    closeModal('dept-delete-modal');
  });
}

/* ── Stats ──────────────────────────────────────────────── */
function renderStats() {
  const totalEmp = allDepts.reduce((s, d) => s + (d.employeeCount || 0), 0);
  const largest  = allDepts.reduce((m, d) => (d.employeeCount > (m?.employeeCount || 0) ? d : m), null);
  const avg      = allDepts.length ? Math.round(totalEmp / allDepts.length) : 0;

  document.getElementById('total-depts').textContent      = allDepts.length;
  document.getElementById('total-in-depts').textContent   = totalEmp;
  document.getElementById('largest-dept-count').textContent = largest?.employeeCount || 0;
  document.getElementById('avg-dept-size').textContent    = avg;
}

/* ── Cards ──────────────────────────────────────────────── */
const DEPT_ICONS = {
  Engineering: { icon: 'fa-laptop-code', class: 'icon-indigo' },
  Marketing:   { icon: 'fa-bullhorn',    class: 'icon-warning' },
  Finance:     { icon: 'fa-coins',       class: 'icon-success' },
  HR:          { icon: 'fa-people-group',class: 'icon-cyan' },
  Operations:  { icon: 'fa-gears',       class: 'icon-danger' },
  Sales:       { icon: 'fa-chart-line',  class: 'icon-warning' },
  IT:          { icon: 'fa-server',      class: 'icon-indigo' },
  Legal:       { icon: 'fa-scale-balanced', class: 'icon-cyan' },
};

function getDeptIcon(name) {
  return DEPT_ICONS[name] || { icon: 'fa-building', class: 'icon-indigo' };
}

function renderDepts(depts = allDepts) {
  const grid = document.getElementById('dept-grid');
  if (!grid) return;

  if (!depts.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-building"></i><h3>No departments found</h3></div>`;
    return;
  }

  grid.innerHTML = depts.map(d => {
    const { icon, class: cls } = getDeptIcon(d.name);
    const statusBadge = d.status === 'ACTIVE' || d.status == null
      ? '<span class="badge badge-active badge-dot">Active</span>'
      : '<span class="badge badge-inactive badge-dot">Inactive</span>';

    return `
      <div class="dept-card">
        <div class="dept-card-accent"></div>
        <div class="dept-card-body">
          <div class="dept-icon ${cls}"><i class="fa-solid ${icon}"></i></div>
          <div class="dept-name">${d.name}</div>
          <div class="dept-head"><i class="fa-solid fa-user-tie" style="margin-right:6px;opacity:0.5;"></i>${d.head || d.headName || 'Not assigned'}</div>
          <div style="margin-bottom:var(--space-2);">${statusBadge}</div>
          ${d.description ? `<div class="text-xs text-muted" style="margin-top:var(--space-2);">${d.description}</div>` : ''}
          <div class="dept-stats">
            <div class="dept-stat-item">
              <div class="val">${d.employeeCount ?? 0}</div>
              <div class="lbl">Employees</div>
            </div>
            ${d.location ? `<div class="dept-stat-item"><div class="val" style="font-size:0.875rem;">${d.location}</div><div class="lbl">Location</div></div>` : ''}
          </div>
        </div>
        <div class="dept-card-footer">
          <button class="btn btn-ghost btn-sm" onclick="openEditDeptModal(${d.id})">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="confirmDeleteDept(${d.id}, '${d.name}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Table ──────────────────────────────────────────────── */
function renderDeptTable(depts = allDepts) {
  const tbody = document.getElementById('dept-table-body');
  if (!tbody) return;

  if (!depts.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding:2rem;">No departments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = depts.map(d => {
    const statusBadge = d.status === 'ACTIVE' || d.status == null
      ? '<span class="badge badge-active badge-dot">Active</span>'
      : '<span class="badge badge-inactive badge-dot">Inactive</span>';

    return `
      <tr>
        <td class="td-primary">${d.name}</td>
        <td class="text-secondary">${d.head || d.headName || '—'}</td>
        <td class="text-secondary">${d.employeeCount ?? 0}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="table-action-btn action-edit" onclick="openEditDeptModal(${d.id})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="table-action-btn action-delete" onclick="confirmDeleteDept(${d.id}, '${d.name}')" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Modal Helpers ──────────────────────────────────────── */
window.openAddDeptModal = () => {
  editingDeptId = null;
  document.getElementById('dept-modal-title').textContent = 'New Department';
  document.getElementById('dept-form').reset();
  document.getElementById('dept-id').value = '';
  openModal('dept-modal');
};

window.openEditDeptModal = (id) => {
  const d = allDepts.find(d => d.id === id);
  if (!d) return;

  editingDeptId = id;
  document.getElementById('dept-modal-title').textContent = 'Edit Department';
  document.getElementById('dept-id').value          = d.id;
  document.getElementById('dept-name').value        = d.name || '';
  document.getElementById('dept-head-input').value  = d.head || d.headName || '';
  document.getElementById('dept-location').value    = d.location || '';
  document.getElementById('dept-description').value = d.description || '';
  document.getElementById('dept-status').value      = d.status || 'ACTIVE';
  openModal('dept-modal');
};

window.submitDeptForm = async () => {
  const name = document.getElementById('dept-name')?.value.trim();
  if (!name) {
    document.getElementById('dept-name')?.classList.add('error');
    document.getElementById('dept-name-error').textContent = 'Department name is required.';
    return;
  }
  document.getElementById('dept-name')?.classList.remove('error');
  document.getElementById('dept-name-error').textContent = '';

  const payload = {
    name,
    head:        document.getElementById('dept-head-input')?.value.trim() || null,
    location:    document.getElementById('dept-location')?.value.trim()   || null,
    description: document.getElementById('dept-description')?.value.trim() || null,
    status:      document.getElementById('dept-status')?.value || 'ACTIVE',
  };

  const btn = document.getElementById('dept-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

  try {
    if (editingDeptId) {
      await API.departments.update(editingDeptId, payload);
      showToast('Department updated successfully!', 'success');
    } else {
      await API.departments.create(payload);
      showToast('Department created successfully!', 'success');
    }
    closeModal('dept-modal');
    await loadDepartments();
  } catch (err) {
    showToast(err.message || 'Operation failed.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Department';
  }
};

window.confirmDeleteDept = (id, name) => {
  pendingDeleteDeptId = id;
  document.getElementById('delete-dept-name').textContent = name;
  openModal('dept-delete-modal');
};

async function deleteDept(id) {
  try {
    await API.departments.delete(id);
    allDepts = allDepts.filter(d => d.id !== id);
    renderDepts();
    renderDeptTable();
    renderStats();
    showToast('Department deleted.', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to delete department.', 'error');
  }
}

/* ── Demo Data ───────────────────────────────────────────── */
function getDemoDepts() {
  return [
    { id:1, name:'Engineering',  head:'Vikram Nair',    employeeCount:82, location:'Hyderabad', status:'ACTIVE', description:'Core product development & infrastructure.' },
    { id:2, name:'Marketing',    head:'Rahul Mehta',    employeeCount:35, location:'Mumbai',    status:'ACTIVE', description:'Brand, digital & content marketing.' },
    { id:3, name:'Finance',      head:'Meera Iyer',     employeeCount:28, location:'Bangalore', status:'ACTIVE', description:'Accounting, budgeting & financial reporting.' },
    { id:4, name:'HR',           head:'Sneha Kapoor',   employeeCount:24, location:'Hyderabad', status:'ACTIVE', description:'Talent acquisition & employee relations.' },
    { id:5, name:'Sales',        head:'Arjun Kumar',    employeeCount:45, location:'Delhi',     status:'ACTIVE', description:'B2B & enterprise sales.' },
    { id:6, name:'Operations',   head:'Kiran Patel',    employeeCount:34, location:'Pune',      status:'ACTIVE', description:'Supply chain, logistics & vendor management.' },
  ];
}

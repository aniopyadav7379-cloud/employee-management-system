/* ============================================================
   EMS - Employee JS
   employee.js — handles employees list, add, edit pages
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   Shared state
──────────────────────────────────────────────────────────── */
let allEmployees   = [];
let filteredEmployees = [];
let currentPage    = 1;
const PAGE_SIZE    = 10;
let pendingDeleteId = null;
let currentView    = 'table'; // 'table' | 'grid'

/* ── Page detection ─────────────────────────────────────── */
const isListPage   = !!document.getElementById('employees-tbody');
const isAddPage    = !!document.getElementById('add-employee-form');
const isEditPage   = !!document.getElementById('edit-employee-form');

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.requireAuth()) return;

  if (isListPage)  await initListPage();
  if (isAddPage)   await initAddPage();
  if (isEditPage)  await initEditPage();
});

/* ═══════════════════════════════════════════════════════════
   LIST PAGE
═══════════════════════════════════════════════════════════ */
async function initListPage() {
  await loadDeptFilterOptions();
  await loadEmployees();
  bindListEvents();
}

async function loadEmployees() {
  try {
    const res = await API.employees.getAll();
    allEmployees = Array.isArray(res) ? res : (res?.content || getDemoEmployees());
  } catch {
    allEmployees = getDemoEmployees();
  }
  applyFilters();
}

function bindListEvents() {
  // Search
  const searchIn = document.getElementById('emp-search');
  searchIn?.addEventListener('input', debounce(() => { currentPage = 1; applyFilters(); }, 300));

  // Filters
  ['dept-filter', 'status-filter', 'sort-by'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => { currentPage = 1; applyFilters(); });
  });

  // View toggle
  document.getElementById('view-table')?.addEventListener('click', () => switchView('table'));
  document.getElementById('view-grid')?.addEventListener('click',  () => switchView('grid'));

  // Select all checkbox
  document.getElementById('select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked);
  });

  // Delete confirm button
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    await deleteEmployee(pendingDeleteId);
    closeModal('delete-modal');
  });
}

function applyFilters() {
  const query  = document.getElementById('emp-search')?.value.toLowerCase() || '';
  const dept   = document.getElementById('dept-filter')?.value   || '';
  const status = document.getElementById('status-filter')?.value || '';
  const sortBy = document.getElementById('sort-by')?.value       || 'name';

  filteredEmployees = allEmployees.filter(emp => {
    const name   = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email  = (emp.email || '').toLowerCase();
    const id     = (emp.employeeId || '').toLowerCase();
    const deptName = emp.department?.name || emp.departmentName || '';

    const matchSearch = !query || name.includes(query) || email.includes(query) || id.includes(query);
    const matchDept   = !dept  || deptName === dept;
    const matchStatus = !status || emp.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  // Sort
  filteredEmployees.sort((a, b) => {
    if (sortBy === 'name')       return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sortBy === 'joinDate')   return new Date(b.joinDate) - new Date(a.joinDate);
    if (sortBy === 'department') return (a.department?.name || '').localeCompare(b.department?.name || '');
    return 0;
  });

  const countEl = document.getElementById('emp-count');
  if (countEl) countEl.textContent = `(${filteredEmployees.length})`;

  if (currentView === 'table') renderTable();
  else renderGrid();
}

function renderTable() {
  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  const start  = (currentPage - 1) * PAGE_SIZE;
  const page   = filteredEmployees.slice(start, start + PAGE_SIZE);

  if (!page.length) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state"><i class="fa-solid fa-users-slash"></i>
          <h3>No employees found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      </td></tr>`;
    renderPagination('pagination-info', 'pagination-controls');
    return;
  }

  tbody.innerHTML = page.map(emp => {
    const name    = `${emp.firstName} ${emp.lastName}`;
    const initials = getInitials(name);
    const deptName = emp.department?.name || emp.departmentName || '—';
    const statusBadge = emp.status === 'ACTIVE'
      ? '<span class="badge badge-active badge-dot">Active</span>'
      : '<span class="badge badge-inactive badge-dot">Inactive</span>';

    return `
      <tr>
        <td><input type="checkbox" class="row-checkbox" value="${emp.id}" /></td>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar">${initials}</div>
            <div>
              <div class="emp-name">${name}</div>
              <div class="emp-email">${emp.email || ''}</div>
            </div>
          </div>
        </td>
        <td class="text-secondary text-sm">${emp.employeeId || '—'}</td>
        <td class="text-secondary">${deptName}</td>
        <td class="text-secondary">${emp.designation || '—'}</td>
        <td class="text-secondary">${emp.phone || '—'}</td>
        <td class="text-secondary">${formatDate(emp.joinDate)}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <a href="edit-employee.html?id=${emp.id}" class="table-action-btn action-edit" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </a>
            <button class="table-action-btn action-delete" title="Delete"
              onclick="confirmDelete(${emp.id}, '${name}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('pagination-info', 'pagination-controls');
}

function renderGrid() {
  const grid = document.getElementById('employees-grid');
  if (!grid) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredEmployees.slice(start, start + PAGE_SIZE);

  if (!page.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-users-slash"></i><h3>No employees found</h3></div>`;
    return;
  }

  grid.innerHTML = page.map(emp => {
    const name     = `${emp.firstName} ${emp.lastName}`;
    const initials = getInitials(name);
    const deptName = emp.department?.name || emp.departmentName || '—';
    const statusBadge = emp.status === 'ACTIVE'
      ? '<span class="badge badge-active badge-dot">Active</span>'
      : '<span class="badge badge-inactive badge-dot">Inactive</span>';

    return `
      <div class="employee-card">
        <div class="emp-card-header">
          <div class="emp-card-actions">
            <a href="edit-employee.html?id=${emp.id}" class="table-action-btn action-edit"><i class="fa-solid fa-pen"></i></a>
            <button class="table-action-btn action-delete" onclick="confirmDelete(${emp.id}, '${name}')"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="emp-card-avatar">${initials}</div>
          <div class="emp-card-name">${name}</div>
          <div class="emp-card-role">${emp.designation || '—'}</div>
        </div>
        <div class="emp-card-body">
          <div class="emp-card-info">
            <div class="emp-info-row"><i class="fa-solid fa-building"></i>${deptName}</div>
            <div class="emp-info-row"><i class="fa-solid fa-envelope"></i>${emp.email || '—'}</div>
            <div class="emp-info-row"><i class="fa-solid fa-phone"></i>${emp.phone || '—'}</div>
          </div>
        </div>
        <div class="emp-card-footer">
          ${statusBadge}
          <span class="text-xs text-muted">${formatDate(emp.joinDate)}</span>
        </div>
      </div>
    `;
  }).join('');

  renderPagination('grid-pagination-info', 'grid-pagination-controls');
}

function renderPagination(infoId, controlsId) {
  const total    = filteredEmployees.length;
  const pages    = Math.ceil(total / PAGE_SIZE);
  const start    = (currentPage - 1) * PAGE_SIZE + 1;
  const end      = Math.min(currentPage * PAGE_SIZE, total);

  const infoEl  = document.getElementById(infoId);
  const ctrlEl  = document.getElementById(controlsId);

  if (infoEl) infoEl.textContent = total ? `Showing ${start}–${end} of ${total} employees` : 'No employees found';

  if (!ctrlEl) return;
  ctrlEl.innerHTML = '';

  // Prev
  const prev = makePageBtn('‹', currentPage === 1, () => { currentPage--; applyFilters(); });
  ctrlEl.appendChild(prev);

  // Page numbers (show max 5)
  const maxPages = Math.min(pages, 5);
  let startPage  = Math.max(1, currentPage - 2);
  let endPage    = Math.min(pages, startPage + maxPages - 1);
  if (endPage - startPage < maxPages - 1) startPage = Math.max(1, endPage - maxPages + 1);

  for (let i = startPage; i <= endPage; i++) {
    const btn = makePageBtn(i, false, () => { currentPage = i; applyFilters(); });
    if (i === currentPage) btn.classList.add('active');
    ctrlEl.appendChild(btn);
  }

  // Next
  const next = makePageBtn('›', currentPage >= pages, () => { currentPage++; applyFilters(); });
  ctrlEl.appendChild(next);
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled    = disabled;
  btn.addEventListener('click', onClick);
  return btn;
}

function switchView(view) {
  currentView = view;
  document.getElementById('table-view').style.display = view === 'table' ? 'block' : 'none';
  document.getElementById('grid-view').style.display  = view === 'grid'  ? 'block' : 'none';
  document.getElementById('view-table')?.classList.toggle('active', view === 'table');
  document.getElementById('view-grid')?.classList.toggle('active',  view === 'grid');
  applyFilters();
}

function confirmDelete(id, name) {
  pendingDeleteId = id;
  const nameEl = document.getElementById('delete-emp-name');
  if (nameEl) nameEl.textContent = name;
  openModal('delete-modal');
}

async function deleteEmployee(id) {
  try {
    await API.employees.delete(id);
    allEmployees = allEmployees.filter(e => e.id !== id);
    applyFilters();
    showToast('Employee deleted successfully.', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to delete employee.', 'error');
  }
}

async function loadDeptFilterOptions() {
  try {
    const depts = await API.departments.getAll();
    const sel   = document.getElementById('dept-filter');
    if (!sel || !depts?.length) return;
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  } catch {}
}

window.exportCSV = () => {
  const headers = ['ID','First Name','Last Name','Email','Department','Designation','Phone','Join Date','Status'];
  const rows = filteredEmployees.map(emp => [
    emp.employeeId, emp.firstName, emp.lastName, emp.email,
    emp.department?.name || emp.departmentName, emp.designation,
    emp.phone, emp.joinDate, emp.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'employees.csv';
  a.click();
  URL.revokeObjectURL(url);
};

window.confirmDelete = confirmDelete;

/* ═══════════════════════════════════════════════════════════
   ADD PAGE
═══════════════════════════════════════════════════════════ */
async function initAddPage() {
  await populateDeptSelect('department');
  await populateManagerSelect('manager');
  setDefaultJoinDate();
  generateEmployeeId();
  bindAvatarUpload();
  bindAddForm();

  // Name → initials preview
  ['first-name','last-name'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateAvatarInitials);
  });

  document.getElementById('save-employee-btn')?.addEventListener('click', () => {
    document.getElementById('add-employee-form')?.requestSubmit();
  });
}

function bindAddForm() {
  const form = document.getElementById('add-employee-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateEmployeeForm()) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

    try {
      const payload = buildEmployeePayload();
      await API.employees.create(payload);
      showToast('Employee added successfully!', 'success');
      setTimeout(() => { window.location.href = 'employees.html'; }, 1000);
    } catch (err) {
      showToast(err.message || 'Failed to add employee.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Employee';
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   EDIT PAGE
═══════════════════════════════════════════════════════════ */
async function initEditPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'employees.html'; return; }

  await populateDeptSelect('department');
  await populateManagerSelect('manager', id);

  try {
    const emp = await API.employees.getById(id);
    if (!emp) throw new Error('Employee not found');
    fillEditForm(emp);

    document.getElementById('form-loading').style.display  = 'none';
    document.getElementById('form-container').style.display = 'block';
    document.getElementById('edit-page-subtitle').textContent =
      `Editing: ${emp.firstName} ${emp.lastName}`;
  } catch (err) {
    showToast(err.message || 'Employee not found.', 'error');
    setTimeout(() => { window.location.href = 'employees.html'; }, 1500);
    return;
  }

  document.getElementById('edit-employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateEmployeeForm('edit')) return;

    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

    try {
      await API.employees.update(id, buildEmployeePayload());
      showToast('Employee updated successfully!', 'success');
      setTimeout(() => { window.location.href = 'employees.html'; }, 1000);
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
  });
}

function fillEditForm(emp) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };
  document.getElementById('emp-id').value = emp.id;
  set('first-name',       emp.firstName);
  set('last-name',        emp.lastName);
  set('email',            emp.email);
  set('phone',            emp.phone);
  set('dob',              emp.dob?.substring(0,10));
  set('gender',           emp.gender);
  set('address',          emp.address);
  set('employee-id',      emp.employeeId);
  set('department',       emp.department?.id || emp.departmentId);
  set('designation',      emp.designation);
  set('employment-type',  emp.employmentType);
  set('join-date',        emp.joinDate?.substring(0,10));
  set('status',           emp.status);
  set('salary',           emp.salary);
  set('manager',          emp.managerId);
  set('emergency-name',   emp.emergencyContactName);
  set('emergency-phone',  emp.emergencyContactPhone);
}

/* ── Shared Helpers ─────────────────────────────────────── */
function buildEmployeePayload() {
  const val = (id) => document.getElementById(id)?.value?.trim() || null;
  return {
    firstName:            val('first-name'),
    lastName:             val('last-name'),
    email:                val('email'),
    phone:                val('phone'),
    dob:                  val('dob'),
    gender:               val('gender'),
    address:              val('address'),
    employeeId:           val('employee-id'),
    departmentId:         val('department') ? parseInt(val('department')) : null,
    designation:          val('designation'),
    employmentType:       val('employment-type') || 'FULL_TIME',
    joinDate:             val('join-date'),
    status:               val('status') || 'ACTIVE',
    salary:               val('salary') ? parseFloat(val('salary')) : null,
    managerId:            val('manager') ? parseInt(val('manager')) : null,
    emergencyContactName: val('emergency-name'),
    emergencyContactPhone: val('emergency-phone'),
  };
}

function validateEmployeeForm(mode = 'add') {
  const required = [
    { id: 'first-name',  msg: 'First name is required.' },
    { id: 'last-name',   msg: 'Last name is required.' },
    { id: 'email',       msg: 'Email is required.' },
    { id: 'phone',       msg: 'Phone is required.' },
    { id: 'employee-id', msg: 'Employee ID is required.' },
    { id: 'department',  msg: 'Department is required.' },
    { id: 'designation', msg: 'Designation is required.' },
    { id: 'join-date',   msg: 'Join date is required.' },
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

  // Email format
  const emailEl  = document.getElementById('email');
  const emailErr = document.getElementById('email-error');
  if (emailEl?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('error');
    if (emailErr) emailErr.textContent = 'Enter a valid email address.';
    valid = false;
  }

  return valid;
}

async function populateDeptSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const depts = await API.departments.getAll();
    (Array.isArray(depts) ? depts : []).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  } catch {}
}

async function populateManagerSelect(selectId, excludeId = null) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const emps = await API.employees.getAll({ status: 'ACTIVE' });
    const list  = Array.isArray(emps) ? emps : (emps?.content || []);
    list.filter(e => String(e.id) !== String(excludeId)).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.firstName} ${e.lastName}`;
      sel.appendChild(opt);
    });
  } catch {}
}

function setDefaultJoinDate() {
  const el = document.getElementById('join-date');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}

function generateEmployeeId() {
  const el = document.getElementById('employee-id');
  if (el && !el.value) {
    el.value = `EMS-${String(Date.now()).slice(-4)}`;
  }
}

function updateAvatarInitials() {
  const first = document.getElementById('first-name')?.value || '';
  const last  = document.getElementById('last-name')?.value  || '';
  const name  = `${first} ${last}`.trim();
  const initEl = document.getElementById('avatar-initials');
  if (initEl) initEl.textContent = getInitials(name) || '?';
}

function bindAvatarUpload() {
  const fileIn  = document.getElementById('photo-upload');
  const preview = document.getElementById('avatar-img');
  const remove  = document.getElementById('remove-photo-btn');
  const initials = document.getElementById('avatar-initials');

  fileIn?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2 MB.', 'error'); return; }
    const url = URL.createObjectURL(file);
    if (preview) { preview.src = url; preview.style.display = 'block'; }
    if (initials) initials.style.display = 'none';
    if (remove) remove.style.display = 'inline-flex';
  });

  remove?.addEventListener('click', () => {
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (initials) initials.style.display = 'block';
    if (fileIn)  fileIn.value = '';
    remove.style.display = 'none';
  });
}

/* ── Demo data fallback ─────────────────────────────────── */
function getDemoEmployees() {
  return [
    { id:1, firstName:'Priya',  lastName:'Sharma',  email:'priya@ems.com',  employeeId:'EMS-001', department:{id:1,name:'Engineering'}, designation:'Senior Engineer',    phone:'+91 98765 43210', joinDate:'2023-01-15', status:'ACTIVE' },
    { id:2, firstName:'Rahul',  lastName:'Mehta',   email:'rahul@ems.com',  employeeId:'EMS-002', department:{id:2,name:'Marketing'},   designation:'Marketing Manager',  phone:'+91 91234 56789', joinDate:'2023-03-20', status:'ACTIVE' },
    { id:3, firstName:'Ananya', lastName:'Reddy',   email:'ananya@ems.com', employeeId:'EMS-003', department:{id:3,name:'Finance'},     designation:'Financial Analyst',  phone:'+91 87654 32109', joinDate:'2023-05-01', status:'ACTIVE' },
    { id:4, firstName:'Vikram', lastName:'Nair',    email:'vikram@ems.com', employeeId:'EMS-004', department:{id:1,name:'Engineering'}, designation:'Tech Lead',          phone:'+91 99887 65432', joinDate:'2022-11-10', status:'ACTIVE' },
    { id:5, firstName:'Sneha',  lastName:'Kapoor',  email:'sneha@ems.com',  employeeId:'EMS-005', department:{id:4,name:'HR'},          designation:'HR Specialist',      phone:'+91 76543 21098', joinDate:'2024-01-08', status:'ACTIVE' },
    { id:6, firstName:'Arjun',  lastName:'Kumar',   email:'arjun@ems.com',  employeeId:'EMS-006', department:{id:5,name:'Sales'},       designation:'Sales Executive',    phone:'+91 65432 10987', joinDate:'2023-08-14', status:'INACTIVE' },
    { id:7, firstName:'Divya',  lastName:'Singh',   email:'divya@ems.com',  employeeId:'EMS-007', department:{id:1,name:'Engineering'}, designation:'Frontend Developer', phone:'+91 54321 09876', joinDate:'2024-02-20', status:'ACTIVE' },
    { id:8, firstName:'Kiran',  lastName:'Patel',   email:'kiran@ems.com',  employeeId:'EMS-008', department:{id:6,name:'Operations'}, designation:'Operations Manager', phone:'+91 43210 98765', joinDate:'2022-07-05', status:'ACTIVE' },
    { id:9, firstName:'Meera',  lastName:'Iyer',    email:'meera@ems.com',  employeeId:'EMS-009', department:{id:3,name:'Finance'},     designation:'Accountant',         phone:'+91 32109 87654', joinDate:'2023-10-30', status:'ACTIVE' },
    { id:10,firstName:'Suresh', lastName:'Krishnan',email:'suresh@ems.com', employeeId:'EMS-010', department:{id:2,name:'Marketing'},   designation:'Content Strategist', phone:'+91 21098 76543', joinDate:'2024-04-12', status:'ACTIVE' },
  ];
}

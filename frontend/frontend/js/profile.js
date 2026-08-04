/* ============================================================
   EMS - Profile JS
   profile.js
   ============================================================ */

'use strict';

let profileData  = null;
let editMode     = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (!API.requireAuth()) return;
  await loadProfile();
  await loadMyLeaves();
  bindEvents();
});

async function loadProfile() {
  try {
    const res = await API.profile.get();
    profileData = res || getDemoProfile();
  } catch {
    profileData = getDemoProfile();
  }
  renderProfile();
}

function renderProfile() {
  const p = profileData;
  const name = `${p.firstName} ${p.lastName}`;
  const initials = getInitials(name);

  // Sidebar & topbar
  document.getElementById('profile-avatar-lg').textContent  = initials;
  document.getElementById('profile-name').textContent        = name;
  document.getElementById('profile-designation').textContent = p.designation || '—';
  document.getElementById('profile-dept-text').textContent   = p.department?.name || p.departmentName || '—';
  document.getElementById('profile-email').textContent       = p.email;
  document.getElementById('profile-phone').textContent       = p.phone || '—';
  document.getElementById('profile-emp-id').textContent      = p.employeeId || '—';
  document.getElementById('profile-join-date').textContent   = formatDate(p.joinDate);

  // View mode fields
  const setView = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  setView('view-first-name',  p.firstName);
  setView('view-last-name',   p.lastName);
  setView('view-email',       p.email);
  setView('view-phone',       p.phone);
  setView('view-department',  p.department?.name || p.departmentName);
  setView('view-designation', p.designation);
  setView('view-dob',         formatDate(p.dob));
  setView('view-gender',      formatGender(p.gender));
  setView('view-address',     p.address);

  // Populate edit form
  const setEdit = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setEdit('edit-first-name', p.firstName);
  setEdit('edit-last-name',  p.lastName);
  setEdit('edit-email',      p.email);
  setEdit('edit-phone',      p.phone);
  setEdit('edit-dob',        p.dob?.substring(0,10));
  setEdit('edit-gender',     p.gender);
  setEdit('edit-address',    p.address);
}

function bindEvents() {
  // Toggle edit mode
  document.getElementById('edit-profile-toggle')?.addEventListener('click', () => {
    editMode = !editMode;
    document.getElementById('view-mode').style.display = editMode ? 'none' : 'block';
    document.getElementById('edit-mode').style.display = editMode ? 'block' : 'none';
    document.getElementById('edit-profile-toggle').innerHTML = editMode
      ? '<i class="fa-solid fa-xmark"></i> Cancel'
      : '<i class="fa-solid fa-pen"></i> Edit Profile';
    if (!editMode) renderProfile(); // reset
  });

  // Profile form submit
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter || document.querySelector('#profile-form [type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

    const payload = {
      firstName: document.getElementById('edit-first-name')?.value.trim(),
      lastName:  document.getElementById('edit-last-name')?.value.trim(),
      email:     document.getElementById('edit-email')?.value.trim(),
      phone:     document.getElementById('edit-phone')?.value.trim(),
      dob:       document.getElementById('edit-dob')?.value || null,
      gender:    document.getElementById('edit-gender')?.value || null,
      address:   document.getElementById('edit-address')?.value.trim(),
    };

    try {
      const updated = await API.profile.update(payload);
      profileData = { ...profileData, ...payload };
      API.setUser({ ...API.getUser(), name: `${payload.firstName} ${payload.lastName}`, email: payload.email });
      initSidebarUser();

      editMode = false;
      document.getElementById('view-mode').style.display  = 'block';
      document.getElementById('edit-mode').style.display  = 'none';
      document.getElementById('edit-profile-toggle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
      renderProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
  });

  // Password form
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPwd  = document.getElementById('new-password')?.value;
    const confirm = document.getElementById('confirm-password')?.value;

    clearPwdErrors();

    let valid = true;
    if (!validatePassword(newPwd)) {
      document.getElementById('new-password-error').textContent = 'Password does not meet requirements.';
      valid = false;
    }
    if (newPwd !== confirm) {
      document.getElementById('confirm-password-error').textContent = 'Passwords do not match.';
      valid = false;
    }
    if (!valid) return;

    const btn = e.submitter;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating…';

    try {
      await API.profile.changePassword({
        currentPassword: document.getElementById('current-password')?.value,
        newPassword:     newPwd,
      });
      showToast('Password updated successfully!', 'success');
      document.getElementById('password-form').reset();
      resetPwdRequirements();
    } catch (err) {
      showToast(err.message || 'Password change failed.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-lock"></i> Update Password';
    }
  });

  // Live password requirements checker
  document.getElementById('new-password')?.addEventListener('input', (e) => {
    const val = e.target.value;
    checkReq('req-len',     val.length >= 8);
    checkReq('req-upper',   /[A-Z]/.test(val));
    checkReq('req-num',     /[0-9]/.test(val));
    checkReq('req-special', /[^a-zA-Z0-9]/.test(val));
  });
}

function checkReq(id, pass) {
  const el = document.getElementById(id);
  if (!el) return;
  const icon = el.querySelector('i');
  if (icon) icon.className = pass ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle';
  el.style.color = pass ? 'var(--success)' : 'var(--text-muted)';
}

function validatePassword(pwd) {
  return pwd && pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd);
}

function clearPwdErrors() {
  document.getElementById('new-password-error').textContent     = '';
  document.getElementById('confirm-password-error').textContent = '';
}

function resetPwdRequirements() {
  ['req-len','req-upper','req-num','req-special'].forEach(id => checkReq(id, false));
}

window.cancelEdit = () => {
  editMode = false;
  document.getElementById('view-mode').style.display  = 'block';
  document.getElementById('edit-mode').style.display  = 'none';
  document.getElementById('edit-profile-toggle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
  renderProfile();
};

/* ── Tab Switching ─────────────────────────────────────── */
window.switchProfileTab = (tab) => {
  ['info','security','leaves'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active',   t === tab);
    document.getElementById(`panel-${t}`)?.classList.toggle('active', t === tab);
  });
};

/* ── My Leaves ─────────────────────────────────────────── */
async function loadMyLeaves() {
  const tbody = document.getElementById('my-leaves-tbody');
  if (!tbody) return;

  let leaves;
  try {
    leaves = await API.leaves.getMy();
  } catch {
    leaves = getDemoMyLeaves();
  }

  if (!leaves?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="padding:2rem;"><i class="fa-solid fa-calendar"></i><br>No leave records.</td></tr>`;
    return;
  }

  tbody.innerHTML = leaves.map(l => {
    const days = workingDays(l.startDate, l.endDate);
    const statusMap = { PENDING:'badge-pending', APPROVED:'badge-approved', REJECTED:'badge-rejected' };
    const badge = `<span class="badge ${statusMap[l.status] || 'badge-pending'} badge-dot">${l.status}</span>`;
    return `
      <tr>
        <td class="td-primary">${formatLeaveType(l.leaveType)}</td>
        <td class="text-secondary">${formatDate(l.startDate)}</td>
        <td class="text-secondary">${formatDate(l.endDate)}</td>
        <td class="text-secondary">${days}</td>
        <td class="text-secondary text-sm">${l.reason || '—'}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

function formatLeaveType(type) {
  const map = { CASUAL:'Casual', SICK:'Sick', ANNUAL:'Annual', MATERNITY:'Maternity', PATERNITY:'Paternity', UNPAID:'Unpaid' };
  return map[type] || type || '—';
}

function formatGender(g) {
  const map = { MALE:'Male', FEMALE:'Female', OTHER:'Other', PREFER_NOT_TO_SAY:'Prefer not to say' };
  return map[g] || g || '—';
}

function getDemoProfile() {
  return {
    firstName:'Admin', lastName:'User', email:'admin@ems.com',
    phone:'+91 98765 43210', employeeId:'EMS-001',
    designation:'Administrator', department:{ name:'Management' },
    joinDate:'2022-01-01', dob:'1990-05-15', gender:'MALE',
    address:'123, MG Road, Bengaluru, Karnataka – 560001',
  };
}

function getDemoMyLeaves() {
  return [
    { leaveType:'CASUAL', startDate:'2025-05-12', endDate:'2025-05-13', reason:'Personal work',   status:'APPROVED' },
    { leaveType:'SICK',   startDate:'2025-04-01', endDate:'2025-04-02', reason:'Fever',            status:'APPROVED' },
    { leaveType:'ANNUAL', startDate:'2025-07-10', endDate:'2025-07-18', reason:'Family vacation',  status:'PENDING'  },
  ];
}

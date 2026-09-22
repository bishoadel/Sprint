/**
 * Toma el Rasol - Eftkad Visit Entry & Eftkad History Handler
 */

window.TomaEftkad = {
  servantsList: ['Bishoy', 'Mina', 'Joseph', 'George', 'Mark', 'Kirolos', 'Sameh'],

  init: async function () {
    this.populateChildSelect();
    this.renderServantCheckboxes();
    this.setDefaultDate();
    await this.renderEftkadHistory();
    this.setupEventListeners();
  },

  setDefaultDate: function () {
    const d = document.getElementById('eftkad-date');
    if (d) d.value = new Date().toISOString().split('T')[0];
  },

  populateChildSelect: async function () {
    const select = document.getElementById('eftkad-child-select');
    if (!select) return;

    const children = await TomaDB.getChildren();
    select.innerHTML = `<option value="">-- Select a Child --</option>` +
      children.map(c => `<option value="${c.id}">${c.name} (${c.child_code})</option>`).join('');
  },

  renderServantCheckboxes: function () {
    const container = document.getElementById('eftkad-servants-container');
    if (!container) return;

    container.innerHTML = this.servantsList.map(s => `
      <label style="display:inline-flex; align-items:center; gap:6px; background:#F8FAFC; padding:8px 14px; border-radius:8px; border:1px solid #E2E8F0; cursor:pointer;">
        <input type="checkbox" class="eftkad-servant-cb" value="${s}">
        <span style="font-weight:600; font-size:0.9rem; color:#0D2040;">${s}</span>
      </label>
    `).join('');
  },

  saveEftkad: async function (e) {
    e.preventDefault();

    const childId = document.getElementById('eftkad-child-select')?.value;
    const dateStr = document.getElementById('eftkad-date')?.value;

    if (!childId || !dateStr) {
      TomaUtils.showToast('Please select a child and visit date.', 'error');
      return;
    }

    const checkedServants = Array.from(document.querySelectorAll('.eftkad-servant-cb:checked')).map(cb => cb.value);

    if (checkedServants.length === 0) {
      TomaUtils.showToast('Please select at least one servant.', 'warning');
      return;
    }

    const user = TomaAuth.getCurrentUser();
    const adminUsername = user ? user.username : 'admin';

    try {
      await TomaDB.addEftkadRecord(childId, checkedServants, dateStr, adminUsername);
      const child = await TomaDB.getChildById(childId);

      TomaUtils.showToast(`Eftkad visit recorded for ${child ? child.name : 'child'}!`, 'success');

      // Reset Form
      document.getElementById('eftkad-child-select').value = '';
      document.querySelectorAll('.eftkad-servant-cb:checked').forEach(cb => cb.checked = false);

      await this.renderEftkadHistory();
    } catch (err) {
      TomaUtils.showToast(err.message || 'Failed to save Eftkad record.', 'error');
    }
  },

  renderEftkadHistory: async function () {
    const container = document.getElementById('eftkad-history-container');
    if (!container) return;

    const records = await TomaDB.getEftkadRecords();
    const children = await TomaDB.getChildren();
    const childMap = new Map(children.map(c => [c.id, c]));

    const searchQ = (document.getElementById('eftkad-search-input')?.value || '').toLowerCase();

    const filtered = records.filter(r => {
      const child = childMap.get(r.child_id);
      const childName = child ? child.name.toLowerCase() : '';
      const servantNames = (r.servants || []).join(' ').toLowerCase();
      return childName.includes(searchQ) || servantNames.includes(searchQ) || r.date.includes(searchQ);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No Eftkad records found.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Child Name</th>
              <th>Child ID</th>
              <th>Servants Involved</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(r => {
              const child = childMap.get(r.child_id);
              return `
                <tr>
                  <td><strong>${TomaUtils.formatDate(r.date)}</strong></td>
                  <td>${child ? child.name : 'Unknown'}</td>
                  <td><span class="child-code">${child ? child.child_code : 'N/A'}</span></td>
                  <td>${(r.servants || []).map(s => `<span class="badge badge-gold" style="margin-right:4px;">👤 ${s}</span>`).join('')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  setupEventListeners: function () {
    const form = document.getElementById('form-eftkad-entry');
    if (form) {
      form.addEventListener('submit', (e) => this.saveEftkad(e));
    }

    const searchInput = document.getElementById('eftkad-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderEftkadHistory());
    }
  }
};

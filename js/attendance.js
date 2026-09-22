/**
 * Toma el Rasol - Attendance Recorder & Attendance History Handler
 */

window.TomaAttendance = {
  currentCategory: 'sunday_school', // Default tab

  init: async function () {
    this.setDefaultDate();
    await this.renderAttendanceList();
    await this.renderAttendanceHistory();
    this.setupEventListeners();
  },

  setDefaultDate: function () {
    const dateInput = document.getElementById('att-date-picker');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  },

  switchCategory: function (catCode) {
    this.currentCategory = catCode;

    // Update active UI tabs
    document.querySelectorAll('.att-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === catCode);
    });

    this.renderAttendanceList();
  },

  renderAttendanceList: async function () {
    const listContainer = document.getElementById('attendance-children-list');
    if (!listContainer) return;

    const children = await TomaDB.getChildren();
    const searchVal = (document.getElementById('att-search-input')?.value || '').toLowerCase();

    const filtered = children.filter(c => c.name.toLowerCase().includes(searchVal) || c.child_code.toLowerCase().includes(searchVal));

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No matching children found.</div>`;
      return;
    }

    listContainer.innerHTML = filtered.map(child => `
      <div class="att-item" data-child-id="${child.id}" onclick="TomaAttendance.toggleSelectChild(this)">
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="checkbox" class="att-checkbox" value="${child.id}" onclick="event.stopPropagation()">
          <div>
            <strong style="display:block; color:#0D2040;">${child.name}</strong>
            <span style="font-size:0.8rem; color:#64748B;">${child.child_code}</span>
          </div>
        </div>
        <span class="badge badge-gold">⭐ Score</span>
      </div>
    `).join('');
  },

  toggleSelectChild: function (rowElem) {
    const cb = rowElem.querySelector('.att-checkbox');
    if (cb) {
      cb.checked = !cb.checked;
      rowElem.classList.toggle('selected', cb.checked);
    }
  },

  selectAll: function (selectBool) {
    document.querySelectorAll('.att-item').forEach(item => {
      const cb = item.querySelector('.att-checkbox');
      if (cb) {
        cb.checked = selectBool;
        item.classList.toggle('selected', selectBool);
      }
    });
  },

  // Save Attendance & Trigger Automatic Points
  saveAttendance: async function () {
    const dateStr = document.getElementById('att-date-picker')?.value;
    if (!dateStr) {
      TomaUtils.showToast('Please select a valid date.', 'error');
      return;
    }

    const checkedBoxes = document.querySelectorAll('.att-checkbox:checked');
    const selectedChildIds = Array.from(checkedBoxes).map(cb => cb.value);

    if (selectedChildIds.length === 0) {
      TomaUtils.showToast('Please select at least one child.', 'warning');
      return;
    }

    const user = TomaAuth.getCurrentUser();
    const adminUsername = user ? user.username : 'admin';

    try {
      const result = await TomaDB.recordBulkAttendance(
        selectedChildIds,
        this.currentCategory,
        dateStr,
        adminUsername
      );

      let msg = `Attendance recorded for ${result.addedCount} children on ${dateStr}.`;
      if (result.pointsPerChild > 0) {
        msg += ` (+${result.pointsPerChild} pts auto-awarded per child!)`;
      }

      TomaUtils.showToast(msg, 'success');

      // Refresh Kashf and History
      if (window.TomaChildren) window.TomaChildren.loadChildren();
      await this.renderAttendanceHistory();

      // Reset selection
      this.selectAll(false);
    } catch (err) {
      TomaUtils.showToast(err.message || 'Failed to save attendance', 'error');
    }
  },

  // Render Attendance History Grouped by Date & Type
  renderAttendanceHistory: async function () {
    const historyContainer = document.getElementById('attendance-history-container');
    if (!historyContainer) return;

    const records = await TomaDB.getAttendanceRecords();
    const children = await TomaDB.getChildren();
    const types = await TomaDB.getAttendanceTypes();

    const childMap = new Map(children.map(c => [c.id, c.name]));
    const typeMap = new Map(types.map(t => [t.id, t.name]));

    if (records.length === 0) {
      historyContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#64748B;">No attendance history recorded yet.</div>`;
      return;
    }

    // Group records by Date + Attendance Type
    const groups = {};
    records.forEach(r => {
      const key = `${r.attendance_date}___${r.attendance_type_id}`;
      if (!groups[key]) {
        groups[key] = {
          date: r.attendance_date,
          typeName: typeMap.get(r.attendance_type_id) || 'Attendance',
          childrenNames: []
        };
      }
      const cName = childMap.get(r.child_id);
      if (cName) groups[key].childrenNames.push(cName);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      return new Date(groups[b].date) - new Date(groups[a].date);
    });

    historyContainer.innerHTML = sortedGroupKeys.map(key => {
      const item = groups[key];
      return `
        <div style="background:white; border:1px solid #E2E8F0; border-radius:12px; padding:18px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:8px;">
            <h4 style="margin:0; color:#0D2040;">📅 ${TomaUtils.formatDate(item.date)} — ${item.typeName}</h4>
            <span class="badge badge-gold">${item.childrenNames.length} Present</span>
          </div>
          <p style="color:#334155; margin:0; line-height:1.6;">
            <strong>Present Children:</strong> ${item.childrenNames.join(', ')}
          </p>
        </div>
      `;
    }).join('');
  },

  setupEventListeners: function () {
    const searchInput = document.getElementById('att-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderAttendanceList());
    }

    const saveBtn = document.getElementById('btn-save-attendance');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAttendance());
    }
  }
};

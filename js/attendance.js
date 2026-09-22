/**
 * Toma el Rasol - Attendance Recorder & Attendance History Handler
 */

window.TomaAttendance = {
  currentCategory: 'sunday_school', // Default tab for recording
  historyCategory: 'all', // Default tab for history

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

    // Update active UI tabs for recording
    document.querySelectorAll('.att-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === catCode);
    });

    this.renderAttendanceList();
  },

  switchHistoryCategory: function (catCode) {
    this.historyCategory = catCode;

    // Update active UI tabs for history
    document.querySelectorAll('.att-history-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === catCode);
    });

    this.renderAttendanceHistory();
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

  // Render Attendance History Audit Log Table (like Score Audit Log in Manual Score tab)
  renderAttendanceHistory: async function () {
    const historyContainer = document.getElementById('attendance-history-container');
    if (!historyContainer) return;

    const records = await TomaDB.getAttendanceRecords();
    const children = await TomaDB.getChildren();
    const types = await TomaDB.getAttendanceTypes();

    const childMap = new Map();
    children.forEach(c => {
      if (c.id) childMap.set(String(c.id), c);
      if (c.child_code) childMap.set(String(c.child_code), c);
    });

    const typeCodeMap = new Map();
    const typeNameMap = new Map();
    types.forEach(t => {
      if (t.id) {
        typeCodeMap.set(String(t.id), t.code);
        typeNameMap.set(String(t.id), t.name);
      }
      if (t.code) {
        typeCodeMap.set(String(t.code), t.code);
        typeNameMap.set(String(t.code), t.name);
      }
    });

    if (!records || records.length === 0) {
      historyContainer.innerHTML = `
        <div style="text-align:center; padding:40px; background:white; border-radius:12px; border:1px solid #E2E8F0; color:#64748B;">
          No attendance records found in database yet.
        </div>
      `;
      return;
    }

    const searchQ = (document.getElementById('att-history-search-input')?.value || '').toLowerCase();
    const dateQ = document.getElementById('att-history-date-filter')?.value || '';

    // Filter records by category, search query, and date
    const filteredRecords = records.filter(r => {
      const typeCode = (r.attendance_types && r.attendance_types.code) || typeCodeMap.get(String(r.attendance_type_id)) || String(r.attendance_type_id);
      
      // Category filter
      if (this.historyCategory !== 'all' && typeCode !== this.historyCategory) {
        return false;
      }

      // Date filter
      if (dateQ && r.attendance_date !== dateQ) {
        return false;
      }

      // Search query filter
      const child = (r.children && r.children.name) ? r.children : childMap.get(String(r.child_id));
      const cName = child ? String(child.name).toLowerCase() : '';
      const cCode = child ? String(child.child_code).toLowerCase() : '';
      
      if (searchQ && !cName.includes(searchQ) && !cCode.includes(searchQ)) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date) || new Date(b.created_at || b.attendance_date) - new Date(a.created_at || a.attendance_date));

    if (filteredRecords.length === 0) {
      historyContainer.innerHTML = `
        <div style="text-align:center; padding:40px; background:white; border-radius:12px; border:1px solid #E2E8F0; color:#64748B;">
          No matching attendance audit logs found for the selected filters.
        </div>
      `;
      return;
    }

    const getCategoryBadgeClass = (code) => {
      switch (code) {
        case 'mass': return 'badge-navy';
        case 'sunday_school': return 'badge-gold';
        case 'hymns': return 'badge-success';
        case 'bible_study': return 'badge-primary';
        default: return 'badge-navy';
      }
    };

    const getCategoryEmoji = (code) => {
      switch (code) {
        case 'mass': return '⛪';
        case 'sunday_school': return '📖';
        case 'hymns': return '🎵';
        case 'bible_study': return '💡';
        default: return '📅';
      }
    };

    historyContainer.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Attendance Date</th>
              <th>Category Event</th>
              <th>Child Name</th>
              <th>Child Code / ID</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map(r => {
              const child = (r.children && r.children.name) ? r.children : childMap.get(String(r.child_id));
              const typeCode = (r.attendance_types && r.attendance_types.code) || typeCodeMap.get(String(r.attendance_type_id)) || 'attendance';
              const typeName = (r.attendance_types && r.attendance_types.name) || typeNameMap.get(String(r.attendance_type_id)) || typeCode.replace('_', ' ').toUpperCase();
              
              return `
                <tr>
                  <td><strong>📅 ${TomaUtils.formatDate(r.attendance_date)}</strong></td>
                  <td><span class="badge ${getCategoryBadgeClass(typeCode)}">${getCategoryEmoji(typeCode)} ${typeName}</span></td>
                  <td><strong>${child ? child.name : 'Child Record'}</strong></td>
                  <td><span class="child-code">${child ? child.child_code : 'N/A'}</span></td>
                  <td><span class="badge badge-navy">👤 ${r.recorded_by || 'admin'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  setupEventListeners: function () {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    const searchInput = document.getElementById('att-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderAttendanceList());
    }

    const saveBtn = document.getElementById('btn-save-attendance');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAttendance());
    }

    const historySearch = document.getElementById('att-history-search-input');
    if (historySearch) {
      historySearch.addEventListener('input', () => this.renderAttendanceHistory());
    }

    const historyDate = document.getElementById('att-history-date-filter');
    if (historyDate) {
      historyDate.addEventListener('change', () => this.renderAttendanceHistory());
    }
  }
};

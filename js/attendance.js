/**
 * Toma el Rasol - Attendance Recorder & Attendance History Handler
 */

window.TomaAttendance = {
  currentCategory: 'sunday_school', // Default tab for recording
  historyCategory: 'mass', // Default tab for history

  init: async function () {
    this.setDefaultDate();
    await this.renderAttendanceList();
    await this.renderAttendanceHistory();
    this.setupEventListeners();
  },

  setDefaultDate: function () {
    const dateInput = document.getElementById('att-date-picker');
    if (dateInput) {
      const todayStr = TomaUtils.getTodayDateString();
      dateInput.value = todayStr;
      dateInput.max = todayStr;
    }
    const historyDate = document.getElementById('att-history-date-filter');
    if (historyDate) {
      historyDate.max = TomaUtils.getTodayDateString();
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

    const filtered = children
      .filter(c => c.name.toLowerCase().includes(searchVal) || c.child_code.toLowerCase().includes(searchVal))
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));


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

  toggleDateCard: function (cardIndex) {
    const card = document.getElementById(`att-date-card-${cardIndex}`);
    if (card) {
      card.classList.toggle('open');
    }
  },

  deleteAttendanceRecordFromHistory: function (recordId, childId, dateStr, childName) {
    TomaUtils.showConfirmModal({
      title: 'Remove Attendance Record',
      message: `Are you sure you want to remove "${childName}" from attendance on ${dateStr}?`,
      icon: '🗑️',
      confirmText: 'Remove Entry',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await TomaDB.deleteAttendanceRecord(recordId, childId, dateStr);
          TomaUtils.showToast(`Removed ${childName} from attendance on ${dateStr}.`, 'success');
          await this.renderAttendanceHistory();
        } catch (err) {
          TomaUtils.showToast(err.message || 'Failed to delete attendance record', 'error');
        }
      }
    });
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

    const todayStr = TomaUtils.getTodayDateString();
    if (dateStr > todayStr) {
      TomaUtils.showToast('Cannot record attendance for future dates.', 'error');
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

  // Render Attendance History Grouped by Date for the Selected Category
  renderAttendanceHistory: async function () {
    const historyContainer = document.getElementById('attendance-history-container');
    if (!historyContainer) return;
    this.setupEventListeners();


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
      const rawTypeId = String(r.attendance_type_id || r.attendance_type || '');
      const rawTypeCode = (r.attendance_types && r.attendance_types.code) ? r.attendance_types.code : '';
      const mappedCode = typeCodeMap.get(rawTypeId) || typeCodeMap.get(String(r.attendance_type_id)) || rawTypeCode || rawTypeId;

      // Category filter
      if (this.historyCategory && this.historyCategory !== 'all') {
        const matchesCat = (
          mappedCode === this.historyCategory ||
          rawTypeCode === this.historyCategory ||
          rawTypeId === this.historyCategory
        );
        if (!matchesCat) return false;
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
          No matching attendance records found for the selected category or filters.
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

    // Group filtered records by attendance_date
    const groupedByDate = new Map();
    filteredRecords.forEach(r => {
      const dateKey = r.attendance_date || 'Unknown Date';
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey).push(r);
    });

    // Sort dates descending
    const sortedDateKeys = Array.from(groupedByDate.keys()).sort((a, b) => new Date(b) - new Date(a));

    let html = `<div class="att-grouped-wrapper">`;

    sortedDateKeys.forEach((dateStr, idx) => {
      const dateRecords = groupedByDate.get(dateStr);
      const formattedDate = TomaUtils.formatDate ? TomaUtils.formatDate(dateStr) : dateStr;

      html += `
        <div class="att-date-card ${idx === 0 ? 'open' : ''}" id="att-date-card-${idx}">
          <div class="att-date-header" onclick="TomaAttendance.toggleDateCard('${idx}')" style="cursor:pointer; user-select:none;">
            <div class="att-date-title-wrap">
              <span class="att-date-icon">📅</span>
              <div>
                <h4 class="att-date-heading">${formattedDate}</h4>
                <span class="att-date-subtext">Recorded Date: ${dateStr}</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="att-date-count-badge">
                👥 <strong>${dateRecords.length}</strong> ${dateRecords.length === 1 ? 'Child' : 'Children'} Recorded
              </div>
              <span class="att-accordion-arrow">▼</span>
            </div>
          </div>
          
          <div class="att-date-body">
            <div class="att-names-grid">
              ${[...dateRecords].sort((a, b) => {
        const nameA = (a.children && a.children.name) ? a.children.name : (childMap.get(String(a.child_id))?.name || '');
        const nameB = (b.children && b.children.name) ? b.children.name : (childMap.get(String(b.child_id))?.name || '');
        return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
      }).map(r => {
        const child = (r.children && r.children.name) ? r.children : childMap.get(String(r.child_id));
        const typeCode = (r.attendance_types && r.attendance_types.code) || typeCodeMap.get(String(r.attendance_type_id)) || 'attendance';
        const typeName = (r.attendance_types && r.attendance_types.name) || typeNameMap.get(String(r.attendance_type_id)) || typeCode.replace('_', ' ').toUpperCase();
        const childName = child ? child.name : 'Unknown Child';
        const childCode = child ? child.child_code : 'N/A';
        const initial = childName.charAt(0).toUpperCase();


        return `
                  <div class="att-child-chip">
                    <div class="att-child-avatar">${initial}</div>
                    <div class="att-child-info">
                      <strong class="att-child-name">${childName}</strong>
                      <div class="att-child-meta">
                        <span class="child-code">${childCode}</span>
                        ${this.historyCategory === 'all' ? `<span class="badge ${getCategoryBadgeClass(typeCode)}" style="font-size:0.7rem; padding:2px 6px;">${getCategoryEmoji(typeCode)} ${typeName}</span>` : ''}
                      </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <div class="att-status-check" title="Present">✓</div>
                      <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); TomaAttendance.deleteAttendanceRecordFromHistory('${r.id}', '${r.child_id}', '${dateStr}', '${childName.replace(/'/g, "\\'")}')" title="Delete record for this child on this date">🗑️ Delete</button>
                    </div>

                  </div>
                `;
      }).join('')}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    historyContainer.innerHTML = html;
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

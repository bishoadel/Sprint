/**
 * Toma el Rasol - Score (Manual Adjustments) & Points System (Rules Engine) Handler
 */

window.TomaPointsEngine = {
  initScoreTab: async function () {
    await this.renderScoreChildrenList();
    await this.renderScoreAuditTable();
    this.setupScoreEventListeners();
  },

  initRulesTab: async function () {
    await this.renderPointRulesTable();
    this.setupRulesEventListeners();
  },

  // MANUAL SCORE ADJUSTMENTS
  renderScoreChildrenList: async function () {
    const container = document.getElementById('score-children-list');
    if (!container) return;

    const children = await TomaDB.getAllChildrenScores();
    const searchQ = (document.getElementById('score-search-input')?.value || '').toLowerCase();

    const filtered = children.filter(c => c.name.toLowerCase().includes(searchQ) || c.child_code.toLowerCase().includes(searchQ));

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748B;">No children found.</div>`;
      return;
    }

    container.innerHTML = filtered.map(child => `
      <div class="att-item" data-child-id="${child.id}" onclick="TomaPointsEngine.toggleSelectChild(this)">
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="checkbox" class="score-child-cb" value="${child.id}" onclick="event.stopPropagation()">
          <div>
            <strong style="display:block; color:#0D2040;">${child.name}</strong>
            <span style="font-size:0.8rem; color:#64748B;">${child.child_code}</span>
          </div>
        </div>
        <span class="badge badge-gold">Current: ${child.total_points} Pts</span>
      </div>
    `).join('');
  },

  toggleSelectChild: function (rowElem) {
    const cb = rowElem.querySelector('.score-child-cb');
    if (cb) {
      cb.checked = !cb.checked;
      rowElem.classList.toggle('selected', cb.checked);
    }
  },

  selectAll: function (selectBool) {
    document.querySelectorAll('.score-child-cb').forEach(cb => {
      cb.checked = selectBool;
      cb.closest('.att-item')?.classList.toggle('selected', selectBool);
    });
  },

  applyManualPoints: async function () {
    const pointsInput = document.getElementById('score-points-value');
    const reasonInput = document.getElementById('score-reason-note');

    const pointsVal = Number(pointsInput?.value);
    if (isNaN(pointsVal) || pointsVal === 0) {
      TomaUtils.showToast('Please enter a valid non-zero points value (+20 or -10).', 'error');
      return;
    }

    const checkedBoxes = document.querySelectorAll('.score-child-cb:checked');
    const selectedChildIds = Array.from(checkedBoxes).map(cb => cb.value);

    if (selectedChildIds.length === 0) {
      TomaUtils.showToast('Please select at least one child.', 'warning');
      return;
    }

    const reason = reasonInput?.value.trim() || 'Manual score adjustment';
    const user = TomaAuth.getCurrentUser();
    const adminUser = user ? user.username : 'admin';

    for (const childId of selectedChildIds) {
      await TomaDB.addPointTransaction({
        child_id: childId,
        points: pointsVal,
        source_type: 'manual',
        description: reason,
        created_by: adminUser
      });
    }

    TomaUtils.showToast(`Applied ${pointsVal > 0 ? '+' : ''}${pointsVal} points to ${selectedChildIds.length} children.`, 'success');

    pointsInput.value = '';
    reasonInput.value = '';
    this.selectAll(false);

    await this.renderScoreChildrenList();
    await this.renderScoreAuditTable();
    if (window.TomaChildren) window.TomaChildren.loadChildren();
  },

  renderScoreAuditTable: async function () {
    const container = document.getElementById('score-audit-container');
    if (!container) return;

    const txs = await TomaDB.getPointTransactions();
    const children = await TomaDB.getChildren();
    const childMap = new Map(children.map(c => [c.id, c]));

    const sorted = [...txs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);

    if (sorted.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748B;">No point audit records yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Child Name</th>
              <th>Child ID</th>
              <th>Points Adjustment</th>
              <th>Reason / Event</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(t => {
              const child = childMap.get(t.child_id);
              const isPositive = Number(t.points) > 0;
              return `
                <tr>
                  <td>${TomaUtils.formatDate(t.created_at)}</td>
                  <td><strong>${child ? child.name : 'Unknown'}</strong></td>
                  <td><span class="child-code">${child ? child.child_code : 'N/A'}</span></td>
                  <td><strong style="color:${isPositive ? '#10B981' : '#EF4444'};">${isPositive ? '+' : ''}${t.points} Pts</strong></td>
                  <td>${t.description || 'Adjustment'}</td>
                  <td><span class="badge badge-navy">${t.created_by || 'admin'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // AUTOMATIC POINT RULES
  renderPointRulesTable: async function () {
    const container = document.getElementById('rules-table-container');
    if (!container) return;

    const rules = await TomaDB.getPointRules();

    if (rules.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No point rules defined yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Event / Rule Name</th>
              <th>Event Category</th>
              <th>Points Awarded</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rules.map(r => `
              <tr>
                <td><strong>${r.event_name}</strong></td>
                <td><span class="badge badge-navy">${r.event_type.toUpperCase()}</span></td>
                <td><strong style="color:var(--gold-dark); font-size:1.1rem;">+${r.points} Pts</strong></td>
                <td><span class="badge ${r.active ? 'badge-success' : 'badge-danger'}">${r.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>
                  <button class="btn btn-outline btn-sm btn-icon" title="Edit Rule" onclick="TomaPointsEngine.openEditRuleModal('${r.id}')">✏️</button>
                  <button class="btn btn-danger btn-sm btn-icon" title="Delete Rule" onclick="TomaPointsEngine.confirmDeleteRule('${r.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openAddRuleModal: function () {
    document.getElementById('rule-id').value = '';
    document.getElementById('rule-name').value = '';
    document.getElementById('rule-type').value = 'custom';
    document.getElementById('rule-points').value = '10';
    TomaUtils.openModal('modal-rule');
  },

  openEditRuleModal: async function (ruleId) {
    const rules = await TomaDB.getPointRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('rule-id').value = rule.id;
    document.getElementById('rule-name').value = rule.event_name;
    document.getElementById('rule-type').value = rule.event_type;
    document.getElementById('rule-points').value = rule.points;

    TomaUtils.openModal('modal-rule');
  },

  saveRuleForm: async function (e) {
    e.preventDefault();
    const id = document.getElementById('rule-id').value;
    const name = document.getElementById('rule-name').value.trim();
    const type = document.getElementById('rule-type').value;
    const points = document.getElementById('rule-points').value;

    if (!name || !points) {
      TomaUtils.showToast('Please enter Event Name and Points value.', 'error');
      return;
    }

    try {
      await TomaDB.savePointRule({
        id: id || undefined,
        event_name: name,
        event_type: type,
        points: Number(points)
      });

      TomaUtils.showToast('Point rule saved.', 'success');
      TomaUtils.closeModal('modal-rule');
      await this.renderPointRulesTable();
    } catch (err) {
      TomaUtils.showToast(err.message, 'error');
    }
  },

  confirmDeleteRule: function (ruleId) {
    if (confirm('Delete this point rule?')) {
      TomaDB.deletePointRule(ruleId).then(() => {
        TomaUtils.showToast('Rule deleted.', 'success');
        this.renderPointRulesTable();
      });
    }
  },

  setupScoreEventListeners: function () {
    const search = document.getElementById('score-search-input');
    if (search) {
      search.addEventListener('input', () => this.renderScoreChildrenList());
    }

    const applyBtn = document.getElementById('btn-apply-manual-points');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyManualPoints());
    }
  },

  setupRulesEventListeners: function () {
    const form = document.getElementById('form-rule');
    if (form) {
      form.addEventListener('submit', (e) => this.saveRuleForm(e));
    }
  }
};

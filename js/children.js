/**
 * Toma el Rasol - Children Management (Kashf) & Profile Handler
 */

window.TomaChildren = {
  allChildren: [],

  init: async function () {
    await this.loadChildren();
    this.setupEventListeners();
  },

  loadChildren: async function () {
    this.allChildren = await TomaDB.getAllChildrenScores();
    this.renderKashfGrid(this.allChildren);
  },

  renderKashfGrid: function (childrenList) {
    const grid = document.getElementById('kashf-children-grid');
    if (!grid) return;

    if (!childrenList || childrenList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px solid #E2E8F0;">
          <p style="font-size: 1.1rem; color: #64748B;">No children registered yet.</p>
          <button class="btn btn-gold btn-sm" style="margin-top: 12px;" onclick="TomaUtils.openModal('modal-add-child')">+ Add Child Manually</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = childrenList.map(child => `
      <div class="child-card" data-child-id="${child.id}">
        <div class="child-card-header">
          <div class="child-avatar">${child.name.charAt(0).toUpperCase()}</div>
          <span class="child-code">${child.child_code}</span>
        </div>
        <div class="child-name">${child.name}</div>
        <div class="child-dob">🎂 ${TomaUtils.formatDate(child.birth_date)} (${TomaUtils.getAge(child.birth_date)} yrs)</div>
        <div class="child-score-badge">
          <span>Total Score</span>
          <strong>⭐ ${child.total_points || 0} pts</strong>
        </div>
        <div class="child-card-actions">
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="TomaChildren.openProfileModal('${child.id}')">View Profile</button>
          <button class="btn btn-outline btn-sm btn-icon" title="Edit Child" onclick="TomaChildren.openEditModal('${child.id}')">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="Delete Child" onclick="TomaChildren.confirmDelete('${child.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  filterChildren: function (query) {
    const cleanQ = query.trim().toLowerCase();
    const filtered = this.allChildren.filter(c => 
      c.name.toLowerCase().includes(cleanQ) || c.child_code.toLowerCase().includes(cleanQ)
    );
    this.renderKashfGrid(filtered);
  },

  // Manual Add Child Handler
  handleAddChildForm: async function (e) {
    e.preventDefault();
    const nameInput = document.getElementById('input-child-name');
    const dobInput = document.getElementById('input-child-dob');

    if (!nameInput.value.trim() || !dobInput.value) {
      TomaUtils.showToast('Please enter both Name and Birthdate.', 'error');
      return;
    }

    try {
      const newChild = await TomaDB.createChild({
        name: nameInput.value.trim(),
        birth_date: dobInput.value
      });

      TomaUtils.showToast(`Child "${newChild.name}" added successfully (${newChild.child_code}).`, 'success');
      TomaUtils.closeModal('modal-add-child');
      nameInput.value = '';
      dobInput.value = '';
      await this.loadChildren();
    } catch (err) {
      TomaUtils.showToast(err.message || 'Failed to create child', 'error');
    }
  },

  // Open Child Profile Modal
  openProfileModal: async function (childId) {
    const child = await TomaDB.getChildById(childId);
    if (!child) return;

    const stats = await TomaStreaks.calculateChildStats(childId);
    const points = await TomaDB.getChildPoints(childId);

    document.getElementById('profile-child-name').textContent = child.name;
    document.getElementById('profile-child-code').textContent = child.child_code;
    document.getElementById('profile-child-dob').textContent = TomaUtils.formatDate(child.birth_date);
    document.getElementById('profile-child-age').textContent = TomaUtils.getAge(child.birth_date);
    document.getElementById('profile-child-points').textContent = `${points} Pts`;

    // Attendance Stats
    document.getElementById('profile-mass-pct').textContent = `${stats.massPercentage}%`;
    document.getElementById('profile-ss-pct').textContent = `${stats.sundaySchoolPercentage}%`;
    document.getElementById('profile-hymns-pct').textContent = `${stats.hymnsPercentage}%`;
    document.getElementById('profile-bible-pct').textContent = `${stats.bibleStudyPercentage}%`;

    // Last Attendance
    document.getElementById('profile-last-mass').textContent = stats.lastMassDate;
    document.getElementById('profile-last-ss').textContent = stats.lastSundaySchoolDate;

    // Streaks
    document.getElementById('profile-mass-streak').textContent = `${stats.massStreak} wks`;
    document.getElementById('profile-ss-streak').textContent = `${stats.sundaySchoolStreak} wks`;

    // Render QR Code
    TomaQR.renderQRCode('profile-qr-container', child.child_code, 160);
    document.getElementById('btn-download-qr').onclick = () => {
      TomaQR.downloadQR('profile-qr-container', child.child_code);
    };

    TomaUtils.openModal('modal-child-profile');
  },

  openEditModal: async function (childId) {
    const child = await TomaDB.getChildById(childId);
    if (!child) return;

    document.getElementById('edit-child-id').value = child.id;
    document.getElementById('edit-child-name').value = child.name;
    document.getElementById('edit-child-dob').value = child.birth_date;

    TomaUtils.openModal('modal-edit-child');
  },

  handleEditChildForm: async function (e) {
    e.preventDefault();
    const id = document.getElementById('edit-child-id').value;
    const name = document.getElementById('edit-child-name').value.trim();
    const dob = document.getElementById('edit-child-dob').value;

    try {
      await TomaDB.updateChild(id, { name, birth_date: dob });
      TomaUtils.showToast('Child updated successfully.', 'success');
      TomaUtils.closeModal('modal-edit-child');
      await this.loadChildren();
    } catch (err) {
      TomaUtils.showToast(err.message, 'error');
    }
  },

  confirmDelete: function (childId) {
    if (confirm('Are you sure you want to delete this child? All attendance and points history for this child will be removed.')) {
      TomaDB.deleteChild(childId).then(() => {
        TomaUtils.showToast('Child deleted successfully.', 'success');
        this.loadChildren();
      });
    }
  },

  setupEventListeners: function () {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    const searchInput = document.getElementById('kashf-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterChildren(e.target.value));
    }

    const addForm = document.getElementById('form-add-child');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleAddChildForm(e));
    }

    const editForm = document.getElementById('form-edit-child');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditChildForm(e));
    }
  }
};

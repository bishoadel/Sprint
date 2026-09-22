/**
 * Toma el Rasol - Admin Application Controller & Tab Router
 */

window.TomaAdminApp = {
  init: async function () {
    // Check Authentication
    if (!TomaAuth.isLoggedIn()) {
      TomaUtils.openModal('modal-login');
      this.setupLoginHandler();
    } else {
      this.onAuthSuccess();
    }
  },

  setupLoginHandler: function () {
    const form = document.getElementById('form-admin-login');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uInput = document.getElementById('login-username').value;
      const pInput = document.getElementById('login-password').value;

      try {
        await TomaAuth.login(uInput, pInput);
        TomaUtils.closeModal('modal-login');
        TomaUtils.showToast('Login successful! Welcome to Toma el Rasol.', 'success');
        this.onAuthSuccess();
      } catch (err) {
        TomaUtils.showToast(err.message || 'Login failed', 'error');
      }
    });
  },

  onAuthSuccess: async function () {
    TomaAuth.enforceRoleUI();
    this.setupTabNavigation();

    // Default tab based on role
    let defaultTab = 'kashf';
    if (TomaAuth.isAttendanceAdmin()) {
      defaultTab = 'attendance';
    } else if (TomaAuth.isTDashAdmin()) {
      defaultTab = 'score';
    }

    this.switchTab(defaultTab);
  },

  toggleMobileSidebar: function () {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  },

  closeMobileSidebar: function () {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  },

  setupTabNavigation: function () {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = item.getAttribute('data-tab');
        
        // Auto-close sidebar on mobile when a tab is clicked
        this.closeMobileSidebar();

        // Block unauthorized access for Attendance Admin
        if (TomaAuth.isAttendanceAdmin() && tabTarget !== 'attendance') {
          TomaUtils.showToast('Access restricted to Attendance Admin.', 'warning');
          return;
        }

        // Block unauthorized access for T-dash Admin
        if (TomaAuth.isTDashAdmin() && tabTarget !== 'score') {
          TomaUtils.showToast('Access restricted to T-dash Admin.', 'warning');
          return;
        }

        this.switchTab(tabTarget);
      });
    });
  },

  switchTab: async function (tabId) {
    // Auto-close mobile sidebar
    this.closeMobileSidebar();

    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Show target panel
    const targetPanel = document.getElementById(`tab-${tabId}`);
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    // Update Header Title
    const titleElem = document.getElementById('active-tab-title');
    if (titleElem && targetNav) {
      titleElem.textContent = targetNav.textContent.trim();
    }

    // Trigger tab specific data initializers
    switch (tabId) {
      case 'kashf':
        await TomaChildren.init();
        break;
      case 'leaderboard':
        await TomaLeaderboard.initAdmin();
        break;
      case 'score':
        await TomaPointsEngine.initScoreTab();
        break;
      case 'points_system':
        await TomaPointsEngine.initRulesTab();
        break;
      case 'attendance':
        await TomaAttendance.init();
        break;
      case 'attendance_history':
        await TomaAttendance.renderAttendanceHistory();
        break;
      case 'eftkad_entry':

        await TomaEftkad.init();
        break;
      case 'eftkad_history':
        await TomaEftkad.renderEftkadHistory();
        break;
      case 'birthdays':
        await TomaBirthdays.initAdmin();
        break;
      case 'notifications':
        await TomaNotifications.initAdmin();
        break;
      case 'store':
        await TomaStore.initAdmin();
        break;
    }
  }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  TomaAdminApp.init();
});

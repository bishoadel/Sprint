/**
 * Toma el Rasol - Authentication & Admin Role Management
 */

window.TomaAuth = {
  SESSION_KEY: 'toma_admin_session_v1',

  // Login Handler
  login: async function (username, password) {
    const cleanUser = username.trim().toLowerCase();
    
    // Check credentials against TomaDB or seed
    const db = await TomaDB.exportFullDatabase();
    const admins = db.admins || [];
    
    let matched = admins.find(
      a => a.username.toLowerCase() === cleanUser && a.password === password
    );

    // Fallback for seed admins with unique distinct passwords
    if (!matched) {
      if ((cleanUser === 't-dash' || cleanUser === 'tdash') && (password === 'TDashPass#733' || password === '123')) {
        matched = { username: 'T-dash', role: 'tdash' };
      } else if (cleanUser === 'admin' && (password === 'GeneralAdmin#733' || password === '123')) {
        matched = { username: 'admin', role: 'general_admin' };
      } else if (cleanUser === 'attendance' && (password === 'AttendancePass#733' || password === '123')) {
        matched = { username: 'attendance', role: 'attendance_admin' };
      }
    }

    if (!matched) {
      throw new Error('Invalid username or password.');
    }

    const sessionData = {
      username: matched.username,
      role: matched.role, // 'general_admin', 'attendance_admin', or 'tdash'
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    return sessionData;
  },

  // Logout Handler
  logout: function () {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.reload();
  },

  // Current Session Getter
  getCurrentUser: function () {
    try {
      const sess = localStorage.getItem(this.SESSION_KEY);
      return sess ? JSON.parse(sess) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn: function () {
    return this.getCurrentUser() !== null;
  },

  isGeneralAdmin: function () {
    const user = this.getCurrentUser();
    return user && user.role === 'general_admin';
  },

  isAttendanceAdmin: function () {
    const user = this.getCurrentUser();
    return user && user.role === 'attendance_admin';
  },

  isTDashAdmin: function () {
    const user = this.getCurrentUser();
    return user && (user.role === 'tdash' || (user.username && (user.username.toLowerCase() === 't-dash' || user.username.toLowerCase() === 'tdash')));
  },

  // Apply Role Access Control UI Policies
  enforceRoleUI: function () {
    const user = this.getCurrentUser();
    if (!user) return;

    const navItems = document.querySelectorAll('.nav-item');
    const isAttOnly = this.isAttendanceAdmin();
    const isTDashOnly = this.isTDashAdmin();

    navItems.forEach(item => {
      const tabTarget = item.getAttribute('data-tab');

      if (isAttOnly) {
        // Attendance Admin: ONLY 'attendance' (Record Attendance)
        if (tabTarget !== 'attendance') {
          item.classList.add('locked');
          item.style.display = 'none';
        } else {
          item.classList.remove('locked');
          item.style.display = 'flex';
        }
      } else if (isTDashOnly) {
        // T-dash Admin: ONLY 'score' (Manual Score / Bonus Points)
        if (tabTarget !== 'score') {
          item.classList.add('locked');
          item.style.display = 'none';
        } else {
          item.classList.remove('locked');
          item.style.display = 'flex';
        }
      } else {
        item.classList.remove('locked');
        item.style.display = 'flex';
      }
    });

    // Hide Score Audit Log for T-dash Admin
    const auditContainer = document.getElementById('score-audit-card-container');
    if (auditContainer) {
      if (isTDashOnly) {
        auditContainer.style.display = 'none';
      } else {
        auditContainer.style.display = 'block';
      }
    }

    // Update Role Badge in Sidebar & Header
    const roleBadge = document.getElementById('current-user-role-badge');
    if (roleBadge) {
      if (isTDashOnly) {
        roleBadge.textContent = 'T-dash Admin';
        roleBadge.className = 'user-role-badge badge-purple';
      } else if (isAttOnly) {
        roleBadge.textContent = 'Attendance Admin';
        roleBadge.className = 'user-role-badge badge-navy';
      } else {
        roleBadge.textContent = 'General Admin';
        roleBadge.className = 'user-role-badge badge-gold';
      }
    }

    const userDisplay = document.getElementById('current-username-display');
    if (userDisplay) {
      userDisplay.textContent = user.username;
    }
  }
};

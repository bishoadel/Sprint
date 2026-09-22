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
    
    const matched = admins.find(
      a => a.username.toLowerCase() === cleanUser && a.password === password
    );

    if (!matched) {
      throw new Error('Invalid username or password.');
    }

    const sessionData = {
      username: matched.username,
      role: matched.role, // 'general_admin' or 'attendance_admin'
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

  // Apply Role Access Control UI Policies
  enforceRoleUI: function () {
    const user = this.getCurrentUser();
    if (!user) return;

    const navItems = document.querySelectorAll('.nav-item');
    const isAttOnly = user.role === 'attendance_admin';

    navItems.forEach(item => {
      const tabTarget = item.getAttribute('data-tab');
      // Allowed tabs for Attendance Admin: ONLY 'attendance' (Record Attendance)
      const isAllowedForAttAdmin = ['attendance'].includes(tabTarget);

      if (isAttOnly && !isAllowedForAttAdmin) {
        item.classList.add('locked');
        item.style.display = 'none'; // Strictly hide unauthorized tabs from UI
      } else {
        item.classList.remove('locked');
        item.style.display = 'flex';
      }
    });

    // Update Role Badge in Sidebar & Header
    const roleBadge = document.getElementById('current-user-role-badge');
    if (roleBadge) {
      roleBadge.textContent = isAttOnly ? 'Attendance Admin' : 'General Admin';
      roleBadge.className = `user-role-badge ${isAttOnly ? 'badge-navy' : 'badge-gold'}`;
    }

    const userDisplay = document.getElementById('current-username-display');
    if (userDisplay) {
      userDisplay.textContent = user.username;
    }
  }
};

/**
 * Toma el Rasol - Child User Portal Application Controller
 */

window.TomaUserApp = {
  currentChild: null,

  init: async function () {
    const urlParams = new URLSearchParams(window.location.search);
    let childIdOrCode = urlParams.get('id');

    // If direct visit without ?id= parameter -> show Manual ID Entry Card
    if (!childIdOrCode) {
      this.showManualIdEntryCard();
      return;
    }

    // Try finding by Code first, then by ID
    let child = await TomaDB.getChildByCode(childIdOrCode);
    if (!child) {
      child = await TomaDB.getChildById(childIdOrCode);
    }
    
    if (!child) {
      TomaUtils.showToast(`Child ID "${childIdOrCode}" not found. Please log in with your Username & Password.`, 'error');
      this.showManualIdEntryCard();
      return;
    }

    this.showMainDashboard();
    this.currentChild = child;
    await this.loadChildPortal(child.id);
  },

  showManualIdEntryCard: function () {
    const entryCard = document.getElementById('user-id-entry-card');
    const mainDash = document.getElementById('user-main-dashboard');
    if (entryCard) entryCard.style.display = 'block';
    if (mainDash) mainDash.style.display = 'none';
  },

  showMainDashboard: function () {
    const entryCard = document.getElementById('user-id-entry-card');
    const mainDash = document.getElementById('user-main-dashboard');
    if (entryCard) entryCard.style.display = 'none';
    if (mainDash) mainDash.style.display = 'block';
  },

  togglePasswordVisibility: function () {
    const input = document.getElementById('input-child-password');
    const btn = document.getElementById('btn-toggle-password-visibility');
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  },

  handleManualLoginSubmit: async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const userInput = document.getElementById('input-child-username');
    const passInput = document.getElementById('input-child-password');

    const username = userInput ? userInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';

    if (!username || !password) {
      TomaUtils.showToast('Please enter both your Username and Password.', 'error');
      return;
    }

    const child = await TomaDB.getChildByCredentials(username, password);
    if (!child) {
      TomaUtils.showToast(`Invalid Username or Password. (e.g. username: kirolos.mina | password: kirolos-mina@tomaelrasol)`, 'error');
      return;
    }

    // Update URL parameter and load portal
    const targetCode = child.child_code || child.id;
    window.history.pushState({}, '', `?id=${encodeURIComponent(targetCode)}`);
    this.showMainDashboard();
    this.currentChild = child;
    await this.loadChildPortal(child.id);
    TomaUtils.showToast(`Welcome back, ${child.name}!`, 'success');
  },

  loadChildPortal: async function (childId) {
    const child = await TomaDB.getChildById(childId);
    if (!child) return;

    this.currentChild = child;

    // Header info
    document.getElementById('user-portal-child-name').textContent = child.name;
    document.getElementById('user-portal-child-code').textContent = child.child_code;
    document.getElementById('user-welcome-msg').textContent = `Keep up the great work, ${child.name.split(' ')[0]}!`;

    // Streaks & Milestone Bonus Points Engine
    const stats = await TomaStreaks.calculateChildStats(child.id);
    
    // Check and award +50 bonus points for milestones (10, 25, 50, 100, 150, 200)
    const newMilestones = await TomaStreaks.checkAndAwardStreakMilestones(child.id, stats.massStreak, stats.sundaySchoolStreak);
    
    // Update Points Counter (with any newly awarded bonus points)
    const points = await TomaDB.getChildPoints(child.id);
    this.animatePointsCounter('user-total-points', points);

    // Render Mass Flame Stage
    const massFlameInfo = TomaStreaks.getFlameStage(stats.massStreak);
    const massStreakElem = document.getElementById('mass-streak-count');
    const massFlame = document.getElementById('mass-flame');
    if (massStreakElem && massFlame) {
      massStreakElem.innerHTML = `
        ${stats.massStreak} ${stats.massStreak === 1 ? 'Week' : 'Weeks'}
        <div style="font-size:0.75rem; color:${massFlameInfo.glowColor}; font-weight:700; margin-top:2px;">${massFlameInfo.name}</div>
      `;
      massFlame.textContent = massFlameInfo.icon;
      massFlame.className = `flame-icon ${massFlameInfo.className}`;
    }

    // Render Sunday School Flame Stage
    const ssFlameInfo = TomaStreaks.getFlameStage(stats.sundaySchoolStreak);
    const ssStreakElem = document.getElementById('ss-streak-count');
    const ssFlame = document.getElementById('ss-flame');
    if (ssStreakElem && ssFlame) {
      ssStreakElem.innerHTML = `
        ${stats.sundaySchoolStreak} ${stats.sundaySchoolStreak === 1 ? 'Week' : 'Weeks'}
        <div style="font-size:0.75rem; color:${ssFlameInfo.glowColor}; font-weight:700; margin-top:2px;">${ssFlameInfo.name}</div>
      `;
      ssFlame.textContent = ssFlameInfo.icon;
      ssFlame.className = `flame-icon ${ssFlameInfo.className}`;
    }

    // Render Milestone Celebration Banner if milestone active or just unlocked
    this.renderStreakCelebrationBanner(child, stats.massStreak, stats.sundaySchoolStreak, newMilestones);

    // Leaderboard
    await TomaLeaderboard.renderUserLeaderboard('user-leaderboard-list', child.id);

    // User Store
    await TomaStore.initUser(child.id);

    // Birthday Mode Check
    this.checkBirthdayMode(child);
  },

  renderStreakCelebrationBanner: function (child, massStreak, ssStreak, newMilestones) {
    const bannerContainer = document.getElementById('streak-celebration-container') || document.getElementById('birthday-banner-container');
    if (!bannerContainer) return;

    const highestStreak = Math.max(massStreak, ssStreak);
    const flameInfo = TomaStreaks.getFlameStage(highestStreak);

    if (newMilestones && newMilestones.length > 0) {
      // Newly unlocked milestone!
      const first = newMilestones[0];
      const msg = first.flameInfo.celebrationMsg;

      const card = document.createElement('div');
      card.style.cssText = `
        background: linear-gradient(135deg, #1E1B4B 0%, #311042 100%);
        border: 2px solid ${first.flameInfo.glowColor};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${first.flameInfo.glowColor};
        animation: bannerSlideDown 0.5s ease-out;
      `;
      card.innerHTML = `
        <div style="font-size:2.5rem; margin-bottom:8px;">${first.flameInfo.icon} 🎉</div>
        <h3 style="color:#FFFFFF; margin:0 0 6px 0; font-size:1.3rem;">NEW STREAK MILESTONE UNLOCKED!</h3>
        <p style="color:#E2E8F0; margin:0 0 10px 0; font-weight:600; font-size:1.05rem;">${msg}</p>
        <span class="badge badge-gold" style="font-size:0.9rem; padding:6px 14px;">🎁 +50 BONUS POINTS AWARDED!</span>
      `;
      bannerContainer.prepend(card);

      // Launch Confetti Celebration
      setTimeout(() => TomaUtils.launchConfetti(), 300);
    } else if (flameInfo.stage >= 2 && flameInfo.celebrationMsg) {
      // Show active milestone badge
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(255, 255, 255, 0.06);
        border: 1px dashed ${flameInfo.glowColor};
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 14px;
      `;
      card.innerHTML = `
        <span style="font-size:2rem; filter:drop-shadow(0 0 10px ${flameInfo.glowColor});">${flameInfo.icon}</span>
        <div style="flex:1;">
          <strong style="color:#FFFFFF; font-size:1rem; display:block;">Active Milestone: ${flameInfo.name}</strong>
          <span style="color:rgba(255,255,255,0.8); font-size:0.88rem;">${flameInfo.celebrationMsg}</span>
        </div>
      `;
      bannerContainer.appendChild(card);
    }
  },

  animatePointsCounter: function (elementId, targetValue) {
    const elem = document.getElementById(elementId);
    if (!elem) return;

    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = targetValue / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetValue) {
        elem.textContent = targetValue;
        clearInterval(timer);
      } else {
        elem.textContent = Math.floor(start);
      }
    }, stepTime);
  },

  checkBirthdayMode: function (child) {
    const bannerContainer = document.getElementById('birthday-banner-container');
    if (!bannerContainer) return;

    const isBdayMonth = TomaUtils.isBirthMonth(child.birth_date);

    if (isBdayMonth) {
      bannerContainer.innerHTML = `
        <div class="birthday-banner">
          🎉 Happy Birthday ${child.name.split(' ')[0]}! 🎈
          <div style="font-size:0.85rem; font-weight:600; margin-top:4px;">
            Celebrating your birthday month with extra blessings & joy! 🥳
          </div>
        </div>
      `;

      // Launch Confetti
      setTimeout(() => TomaUtils.launchConfetti(), 500);
    } else {
      bannerContainer.innerHTML = '';
    }
  },

  switchTab: function (tabName) {
    document.querySelectorAll('.user-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.user-tab-btn').forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(`user-panel-${tabName}`);
    const targetBtn = document.querySelector(`.user-tab-btn[data-tab="${tabName}"]`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
  }
};

// Initialize User Portal on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  TomaUserApp.init();
});

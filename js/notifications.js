/**
 * Toma el Rasol - Automated Native Website & Phone Popup Notification Engine
 */

window.TomaNotifications = {
  swRegistration: null,

  initAdmin: async function () {
    this.registerServiceWorker();
    await this.renderTomorrowBirthdayAlerts();
    await this.renderTodayBirthdayAlerts();
    await this.renderMonthlyBirthdaySummary();
    this.setupPushNotificationBtn();
    
    // Run automated popup detector on page load
    this.checkAndTriggerAutomatedPopups();
  },

  // Register Service Worker for mobile & desktop popups
  registerServiceWorker: function () {
    if ('serviceWorker' in navigator) {
      const swPath = window.location.pathname.includes('/admin/') ? '../sw.js' : './sw.js';
      navigator.serviceWorker.register(swPath).then((reg) => {
        this.swRegistration = reg;
      }).catch((err) => {
        console.warn('Service worker registration note:', err);
      });
    }
  },

  // 1. TODAY'S BIRTHDAYS SCANNER
  getTodayBirthdays: async function () {
    const children = await TomaDB.getChildren();
    const today = new Date();
    const curMonth = today.getMonth();
    const curDay = today.getDate();

    return children.filter(child => {
      if (!child.birth_date) return false;
      const bDate = new Date(child.birth_date);
      return bDate.getMonth() === curMonth && bDate.getDate() === curDay;
    });
  },

  renderTodayBirthdayAlerts: async function () {
    const container = document.getElementById('today-birthdays-container');
    if (!container) return;

    const list = await this.getTodayBirthdays();

    if (list.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div style="background:#ECFDF5; border:2px solid #10B981; padding:20px; border-radius:14px; margin-bottom:16px; box-shadow:0 4px 14px rgba(16,185,129,0.18);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; color:#065F46; display:flex; align-items:center; gap:8px;">
            🎉 BIRTHDAY TODAY! (${list.length} Child)
          </h4>
          <span class="badge badge-success">TODAY</span>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${list.map(c => `
            <div style="background:white; padding:12px 16px; border-radius:10px; border:1px solid #A7F3D0; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#0D2040; font-size:1.1rem;">🥳 ${c.name}</strong>
                <span class="child-code" style="margin-left:6px;">${c.child_code}</span>
                <div style="font-size:0.85rem; color:#047857; margin-top:2px;">
                  Turns <strong>${TomaUtils.getAge(c.birth_date)}</strong> years old TODAY!
                </div>
              </div>
              <button class="btn btn-gold btn-sm" onclick="TomaNotifications.triggerSystemPopup('🎉 Happy Birthday Today!', 'It is ${c.name}\\'s birthday today! Wishing them a blessed year!')">
                🔔 Send Phone Popup
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 2. TOMORROW'S BIRTHDAYS SCANNER
  getTomorrowBirthdays: async function () {
    const children = await TomaDB.getChildren();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const targetMonth = tomorrow.getMonth();
    const targetDay = tomorrow.getDate();

    return children.filter(child => {
      if (!child.birth_date) return false;
      const bDate = new Date(child.birth_date);
      return bDate.getMonth() === targetMonth && bDate.getDate() === targetDay;
    });
  },

  renderTomorrowBirthdayAlerts: async function () {
    const container = document.getElementById('tomorrow-birthdays-container');
    if (!container) return;

    const list = await this.getTomorrowBirthdays();

    if (list.length === 0) {
      container.innerHTML = `
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; padding:16px; border-radius:12px; color:#166534; display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <span style="font-size:1.5rem;">🎉</span>
          <div>
            <strong>No birthdays tomorrow.</strong>
            <div style="font-size:0.85rem; color:#15803D;">The system automatically monitors birthdates to trigger popup phone notifications 1 day in advance.</div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="background:#FFFBEB; border:2px solid #F59E0B; padding:20px; border-radius:14px; margin-bottom:16px; box-shadow:0 4px 12px rgba(245,158,11,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; color:#B45309; display:flex; align-items:center; gap:8px;">
            ⏰ TOMORROW'S BIRTHDAY REMINDER (${list.length} Child)
          </h4>
          <span class="badge badge-gold">1 DAY IN ADVANCE</span>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
          ${list.map(c => `
            <div style="background:white; padding:12px 16px; border-radius:10px; border:1px solid #FCD34D; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#0D2040; font-size:1.05rem;">🎂 ${c.name}</strong>
                <span class="child-code" style="margin-left:6px;">${c.child_code}</span>
                <div style="font-size:0.85rem; color:#78350F; margin-top:2px;">
                  Turns <strong>${TomaUtils.getAge(c.birth_date) + 1}</strong> years old tomorrow!
                </div>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-gold btn-sm" onclick="TomaNotifications.triggerSystemPopup('🎂 Tomorrow Birthday Alert!', 'Tomorrow is ${c.name}\\'s birthday! Turning ${TomaUtils.getAge(c.birth_date) + 1} years old.')">
                  🔔 Send Phone Popup
                </button>
                <button class="btn btn-primary btn-sm" onclick="TomaEmailService.sendTomorrowReminderEmailNow([${JSON.stringify(c).replace(/"/g, '&quot;')}])">
                  📧 Send Email Reminder Now
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 3. MONTHLY BIRTHDAY SUMMARY
  getMonthlyBirthdays: async function () {
    const children = await TomaDB.getChildren();
    const currentMonth = new Date().getMonth();

    return children.filter(child => {
      if (!child.birth_date) return false;
      return new Date(child.birth_date).getMonth() === currentMonth;
    }).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());
  },

  renderMonthlyBirthdaySummary: async function () {
    const container = document.getElementById('monthly-birthdays-container');
    if (!container) return;

    const list = await this.getMonthlyBirthdays();
    const monthName = TomaBirthdays.MONTH_NAMES[new Date().getMonth()];

    if (list.length === 0) {
      container.innerHTML = `
        <div style="padding:20px; background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; text-align:center; color:#64748B;">
          No birthdays recorded for ${monthName}.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="background:white; border:1px solid #E2E8F0; padding:20px; border-radius:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <h4 style="margin:0; color:#0D2040;">
            📅 ${monthName} Birthday Roster (${list.length} Children)
          </h4>
          <button class="btn btn-gold btn-sm" onclick="TomaNotifications.triggerSystemPopup('🗓️ Monthly Birthday Alert', '${list.length} children celebrate birthdays in ${monthName}!')">
            🔔 Send Monthly Roster Popup
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
          ${list.map(c => `
            <div style="background:#FAF8F5; padding:12px; border-radius:10px; border:1px solid rgba(212,175,55,0.2);">
              <strong style="color:#0D2040; display:block;">🎈 ${c.name}</strong>
              <div style="font-size:0.85rem; color:#64748B; margin-top:2px;">
                Date: <strong>${TomaUtils.formatDate(c.birth_date)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  triggerManualEmailCheck: async function () {
    const tomorrowList = await this.getTomorrowBirthdays();
    const monthlyList = await this.getMonthlyBirthdays();
    const monthName = TomaBirthdays ? TomaBirthdays.MONTH_NAMES[new Date().getMonth()] : 'Current Month';

    if (tomorrowList.length > 0 && window.TomaEmailService) {
      await window.TomaEmailService.sendTomorrowReminderEmailNow(tomorrowList);
    } else if (monthlyList.length > 0 && window.TomaEmailService) {
      await window.TomaEmailService.sendMonthlyRosterEmailNow(monthName, monthlyList);
    } else {
      if (typeof TomaUtils !== 'undefined' && TomaUtils.showToast) {
        TomaUtils.showToast('No birthdays scheduled for tomorrow or this month to dispatch.', 'warning');
      }
    }
  },

  // 4. AUTOMATED PHONE & BROWSER POPUP TRIGGER (STRICTLY 1 DAY BEFORE BIRTHDATE)
  checkAndTriggerAutomatedPopups: async function () {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const todayStr = TomaUtils.getTodayDateString();
    const lastChecked = localStorage.getItem('toma_last_popup_check');

    // Prevent duplicate popups on the same day
    if (lastChecked === todayStr) {
      return;
    }

    // Check Tomorrow's Birthdays STRICTLY (1-Day Advance Reminder Only)
    const tomorrowList = await this.getTomorrowBirthdays();
    if (tomorrowList.length > 0) {
      tomorrowList.forEach(c => {
        this.triggerSystemPopup(
          `🎂 Tomorrow's Birthday Reminder! (1 Day Before)`,
          `Tomorrow is ${c.name}'s birthday (${c.child_code}). They will turn ${TomaUtils.getAge(c.birth_date) + 1} years old tomorrow!`
        );
      });
      if (window.TomaEmailService) {
        window.TomaEmailService.sendTomorrowReminderEmailNow(tomorrowList);
      }
    }

    localStorage.setItem('toma_last_popup_check', todayStr);
  },

  // 5. NATIVE PHONE & BROWSER SYSTEM POPUP GENERATOR
  setupPushNotificationBtn: function () {
    const btn = document.getElementById('btn-enable-push-notifications');
    if (!btn) return;

    const updateBtnState = () => {
      if (!("Notification" in window)) {
        btn.textContent = '🔔 Enable Phone & Browser Notifications';
        return;
      }
      if (Notification.permission === 'granted') {
        btn.textContent = '✅ Notifications Enabled & Active';
        btn.className = 'btn btn-outline btn-sm';
      } else {
        btn.textContent = '🔔 Enable Phone & Browser Notifications';
        btn.className = 'btn btn-gold btn-sm';
      }
    };

    updateBtnState();

    btn.onclick = async () => {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          TomaUtils.showToast('Phone & browser notifications enabled!', 'success');
          updateBtnState();
          await this.triggerSystemPopup('Toma el Rasol Activated', 'Website birthday popup notifications are now active!');
          this.checkAndTriggerAutomatedPopups();
        } else if (perm === 'denied') {
          TomaUtils.showToast('Notification permission was blocked in browser settings. Please allow notifications for this site.', 'error');
        }
      } else {
        TomaUtils.showToast('Notifications enabled in-app mode!', 'success');
        await this.triggerSystemPopup('Toma el Rasol Notifications', 'Birthday notification popups are active!');
      }
    };
  },

  triggerSystemPopup: async function (title, bodyMessage) {
    // 1. Always display guaranteed in-app notification popup banner
    this.showInAppNotificationBanner(title, bodyMessage);

    // 2. Request / check native Notification permission
    if (!("Notification" in window)) {
      return;
    }

    let perm = Notification.permission;
    if (perm !== "granted" && perm !== "denied") {
      try {
        perm = await Notification.requestPermission();
        this.setupPushNotificationBtn();
      } catch (e) {
        console.warn('Request notification permission failed:', e);
      }
    }

    // 3. Fire System / Mobile Push Notification Popup if granted
    if (perm === "granted") {
      try {
        const iconPath = window.location.pathname.includes('/admin/') ? '../assets/logo/logo.jpeg' : './assets/logo/logo.jpeg';
        
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body: bodyMessage,
            icon: iconPath,
            badge: iconPath,
            vibrate: [200, 100, 200, 100, 200],
            tag: 'birthday-alert-' + Date.now()
          });
        } else {
          new Notification(title, {
            body: bodyMessage,
            icon: iconPath
          });
        }
      } catch (err) {
        console.warn('System popup notification fallback:', err);
      }
    }
  },

  // Guaranteed Visual Floating Popup Banner (Simulates mobile notification banner on screen)
  showInAppNotificationBanner: function (title, bodyMessage) {
    let container = document.getElementById('phone-popup-banner-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.id = 'phone-popup-banner-wrapper';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 380px;
        width: calc(100% - 40px);
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const card = document.createElement('div');
    card.style.cssText = `
      pointer-events: auto;
      background: #0D2040;
      color: #FFFFFF;
      border: 2px solid #D4AF37;
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.4);
      margin-bottom: 12px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      animation: bannerSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const iconPath = window.location.pathname.includes('/admin/') ? '../assets/logo/logo.jpeg' : './assets/logo/logo.jpeg';

    card.innerHTML = `
      <img src="${iconPath}" alt="Logo" style="width:42px; height:42px; border-radius:50%; border:2px solid #D4AF37; flex-shrink:0; object-fit:cover;">
      <div style="flex:1;">
        <div style="font-size:0.75rem; color:#D4AF37; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2px;">Toma el Rasol • Birthday Alert</div>
        <strong style="font-size:1rem; color:#FFFFFF; display:block; margin-bottom:4px;">${title}</strong>
        <p style="font-size:0.88rem; color:rgba(255,255,255,0.85); margin:0; line-height:1.4;">${bodyMessage}</p>
      </div>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; color:rgba(255,255,255,0.6); font-size:1.3rem; cursor:pointer; padding:0; line-height:1;">×</button>
    `;

    container.appendChild(card);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (card && card.parentElement) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        card.style.transition = 'all 0.3s ease';
        setTimeout(() => card.remove(), 300);
      }
    }, 6000);
  }
};

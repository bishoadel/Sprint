/**
 * Toma el Rasol - Birthdays Organizer & Birthday Mode Handler
 */

window.TomaBirthdays = {
  MONTH_NAMES: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  initAdmin: async function () {
    await this.renderAdminBirthdays();
  },

  renderAdminBirthdays: async function () {
    const container = document.getElementById('admin-birthdays-container');
    if (!container) return;

    const children = await TomaDB.getChildren();
    const currentMonthIdx = new Date().getMonth();

    // Group children by month (0 - 11)
    const monthGroups = Array.from({ length: 12 }, () => []);

    children.forEach(c => {
      if (c.birth_date) {
        const m = new Date(c.birth_date).getMonth();
        if (!isNaN(m)) monthGroups[m].push(c);
      }
    });

    container.innerHTML = this.MONTH_NAMES.map((monthName, idx) => {
      const isCurrentMonth = idx === currentMonthIdx;
      const list = monthGroups[idx];

      return `
        <div style="background:white; border-radius:14px; border:${isCurrentMonth ? '2px solid var(--gold-primary)' : '1px solid #E2E8F0'}; padding:20px; margin-bottom:20px; box-shadow:${isCurrentMonth ? 'var(--shadow-gold)' : 'var(--shadow-sm)'};">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #F1F5F9; padding-bottom:10px; margin-bottom:14px;">
            <h3 style="margin:0; color:#0D2040; display:flex; align-items:center; gap:8px;">
              🎂 ${monthName}
              ${isCurrentMonth ? '<span class="badge badge-gold">CELEBRATING THIS MONTH 🎉</span>' : ''}
            </h3>
            <span class="badge badge-navy">${list.length} Children</span>
          </div>

          ${list.length === 0 ? '<p style="color:#94A3B8; font-size:0.9rem; margin:0;">No birthdays in this month.</p>' : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px;">
              ${list.map(c => `
                <div style="background:#FAF8F5; padding:12px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">
                  <strong style="color:#0D2040; display:block;">${c.name}</strong>
                  <span style="font-size:0.85rem; color:#64748B;">
                    📅 ${TomaUtils.formatDate(c.birth_date)} (${TomaUtils.getAge(c.birth_date)} yrs)
                  </span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }).join('');
  }
};

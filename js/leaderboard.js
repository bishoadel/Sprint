/**
 * Toma el Rasol - Dynamic Leaderboard Handler
 */

window.TomaLeaderboard = {
  initAdmin: async function () {
    await this.renderAdminLeaderboard();
    const search = document.getElementById('lb-search-input');
    if (search) {
      search.addEventListener('input', (e) => this.renderAdminLeaderboard(e.target.value));
    }
  },

  renderAdminLeaderboard: async function (searchQuery = '') {
    const container = document.getElementById('admin-leaderboard-container');
    if (!container) return;

    const rankedChildren = await TomaDB.getAllChildrenScores();
    const cleanQ = searchQuery.trim().toLowerCase();

    const filtered = rankedChildren.filter(c => 
      c.name.toLowerCase().includes(cleanQ) || c.child_code.toLowerCase().includes(cleanQ)
    );

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No matching children found.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Child Name</th>
              <th>Child ID</th>
              <th>Birthdate</th>
              <th>Total Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((child, index) => {
              const rank = index + 1;
              let medal = `#${rank}`;
              if (rank === 1) medal = '👑 #1 GOLD';
              if (rank === 2) medal = '🥈 #2 SILVER';
              if (rank === 3) medal = '🥉 #3 BRONZE';

              return `
                <tr style="${rank <= 3 ? 'font-weight:700; background:rgba(212,175,55,0.06);' : ''}">
                  <td><span class="badge ${rank === 1 ? 'badge-gold' : 'badge-navy'}">${medal}</span></td>
                  <td><strong>${child.name}</strong></td>
                  <td><span class="child-code">${child.child_code}</span></td>
                  <td>${TomaUtils.formatDate(child.birth_date)}</td>
                  <td><strong style="color:var(--gold-dark); font-size:1.1rem;">⭐ ${child.total_points} Pts</strong></td>
                  <td>
                    <button class="btn btn-outline-danger btn-sm" onclick="TomaLeaderboard.confirmResetChildScore('${child.id}', '${child.name.replace(/'/g, "\\'")}')" title="Reset score to 0">🔄 Reset Score</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  confirmResetChildScore: function (childId, childName) {
    TomaUtils.showConfirmModal({
      title: 'Reset Student Score',
      message: `Are you sure you want to reset the score of "${childName}" to 0 points?`,
      icon: '🔄',
      confirmText: 'Reset Score',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const user = TomaAuth.getCurrentUser();
          const adminUser = user ? user.username : 'admin';
          await TomaDB.resetChildScore(childId, adminUser);
          TomaUtils.showToast(`Score for ${childName} has been reset to 0.`, 'success');
          await this.renderAdminLeaderboard();
          if (window.TomaChildren) await TomaChildren.loadChildren();
        } catch (err) {
          TomaUtils.showToast(err.message || 'Failed to reset score', 'error');
        }
      }
    });
  },

  confirmResetAllScores: function () {
    TomaUtils.showConfirmModal({
      title: 'Reset All Scores to 0',
      message: '⚠️ Are you sure you want to reset ALL children\'s scores to 0? Everyone will start fresh from 0.',
      icon: '🔄',
      confirmText: 'Yes, Reset All Scores',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const user = TomaAuth.getCurrentUser();
          const adminUser = user ? user.username : 'admin';
          await TomaDB.resetAllScores(adminUser);
          TomaUtils.showToast('All student scores have been reset to 0 successfully!', 'success');
          await this.renderAdminLeaderboard();
          if (window.TomaChildren) await TomaChildren.loadChildren();
        } catch (err) {
          TomaUtils.showToast(err.message || 'Failed to reset all scores', 'error');
        }
      }
    });
  },



  renderUserLeaderboard: async function (containerId, currentChildId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rankedChildren = await TomaDB.getAllChildrenScores();

    container.innerHTML = rankedChildren.map((child, index) => {
      const rank = index + 1;
      const isYou = child.id === currentChildId;
      let rankDisplay = rank;
      if (rank === 1) rankDisplay = '👑';
      if (rank === 2) rankDisplay = '🥈';
      if (rank === 3) rankDisplay = '🥉';

      return `
        <div class="user-lb-item ${isYou ? 'current-user' : ''}">
          <div class="lb-left">
            <div class="lb-rank">${rankDisplay}</div>
            <div class="lb-name">
              ${child.name}
              ${isYou ? '<span class="you-badge">YOU</span>' : ''}
            </div>
          </div>
          <div class="lb-points">⭐ ${child.total_points}</div>
        </div>
      `;
    }).join('');
  }
};

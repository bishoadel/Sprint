/**
 * Toma el Rasol - General Utilities (Toast, Modals, Dates, Confetti)
 */

window.TomaUtils = {
  // Toast Notifications
  showToast: function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Custom UI Confirmation Modal
  showConfirmModal: function (options) {
    let modal = document.getElementById('modal-custom-confirm');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-custom-confirm';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const title = options.title || 'Confirm Action';
    const message = options.message || 'Are you sure you want to proceed?';
    const icon = options.icon || '⚠️';
    const confirmText = options.confirmText || 'Confirm';
    const confirmClass = options.confirmClass || 'btn-danger';
    const cancelText = options.cancelText || 'Cancel';

    modal.innerHTML = `
      <div class="modal-card" style="max-width:440px; text-align:center; padding:28px; background:#FFFFFF; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.2); border:1px solid #E2E8F0; animation: fadeIn 0.25s ease;">
        <div style="font-size:2.8rem; margin-bottom:12px;">${icon}</div>
        <h3 style="margin:0 0 10px 0; color:#0D2040; font-size:1.3rem; font-weight:700;">${title}</h3>
        <p style="color:#64748B; font-size:0.95rem; line-height:1.5; margin-bottom:24px;">${message}</p>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button class="btn btn-secondary" id="btn-custom-confirm-cancel" style="flex:1;">${cancelText}</button>
          <button class="btn ${confirmClass}" id="btn-custom-confirm-proceed" style="flex:1;">${confirmText}</button>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const cancelBtn = modal.querySelector('#btn-custom-confirm-cancel');
    const proceedBtn = modal.querySelector('#btn-custom-confirm-proceed');

    const closeModal = () => {
      modal.classList.remove('active');
    };

    cancelBtn.onclick = () => {
      closeModal();
    };

    proceedBtn.onclick = async () => {
      closeModal();
      if (typeof options.onConfirm === 'function') {
        await options.onConfirm();
      }
    };
  },

  // Modal Control
  openModal: function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeModal: function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },


  // Date Formatting
  getTodayDateString: function (d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatDate: function (dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  },

  getAge: function (birthDateStr) {
    if (!birthDateStr) return '';
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  },

  isBirthMonth: function (birthDateStr) {
    if (!birthDateStr) return false;
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    return today.getMonth() === birthDate.getMonth();
  },

  // Simple Confetti Trigger (Uses canvas-confetti CDN if loaded or CSS fallback)
  launchConfetti: function () {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }
};

/**
 * Toma el Rasol - Store & Presents Management & Purchasing Handler
 */

window.TomaStore = {
  initAdmin: async function () {
    await this.renderStoreStatusToggle();
    await this.renderAdminGiftsGrid();
    await this.renderAdminPurchasesTable();
    this.setupAdminEventListeners();
  },

  initUser: async function (childId) {
    await this.renderUserStore(childId);
  },

  renderStoreStatusToggle: async function () {
    const toggle = document.getElementById('store-active-toggle');
    const label = document.getElementById('store-status-label');
    if (!toggle) return;

    const isActive = await TomaDB.getStoreStatus();
    toggle.checked = isActive;
    if (label) {
      label.textContent = isActive ? 'STORE ONLINE (Purchasing Enabled)' : 'STORE OFFLINE (Purchasing Disabled)';
      label.style.color = isActive ? '#10B981' : '#EF4444';
    }
  },

  handleToggleStoreStatus: async function (checkedBool) {
    await TomaDB.setStoreStatus(checkedBool);
    await this.renderStoreStatusToggle();
    TomaUtils.showToast(`Store status updated: ${checkedBool ? 'ONLINE' : 'OFFLINE'}`, checkedBool ? 'success' : 'warning');
  },

  renderAdminGiftsGrid: async function () {
    const grid = document.getElementById('admin-gifts-grid');
    if (!grid) return;

    const gifts = await TomaDB.getGifts();
    if (gifts.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#64748B;">No gifts created yet.</div>`;
      return;
    }

    grid.innerHTML = gifts.map(gift => `
      <div class="child-card" style="border-top:3px solid var(--gold-primary);">
        <div style="height:120px; overflow:hidden; border-radius:8px; margin-bottom:10px; background:#F1F5F9;">
          <img src="${gift.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'}" alt="${gift.name}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <h4 style="margin:0 0 4px 0; color:#0D2040;">${gift.name}</h4>
        <p style="font-size:0.8rem; color:#64748B; margin-bottom:10px; flex:1;">${gift.description || 'No description'}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; background:#FAF8F5; padding:8px 12px; border-radius:8px; margin-bottom:10px;">
          <span style="font-size:0.85rem; font-weight:600;">Price</span>
          <strong style="color:var(--gold-dark); font-size:1.1rem;">🎁 ${gift.points_price} Pts</strong>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="TomaStore.openEditGiftModal('${gift.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="TomaStore.confirmDeleteGift('${gift.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  openAddGiftModal: function () {
    document.getElementById('gift-id').value = '';
    document.getElementById('gift-name').value = '';
    document.getElementById('gift-price').value = '';
    document.getElementById('gift-desc').value = '';
    document.getElementById('gift-image').value = '';
    TomaUtils.openModal('modal-gift');
  },

  openEditGiftModal: async function (giftId) {
    const gifts = await TomaDB.getGifts();
    const gift = gifts.find(g => String(g.id) === String(giftId));
    if (!gift) return;

    document.getElementById('gift-id').value = gift.id;
    document.getElementById('gift-name').value = gift.name;
    document.getElementById('gift-price').value = gift.points_price;
    document.getElementById('gift-desc').value = gift.description || '';
    document.getElementById('gift-image').value = gift.image_url || '';

    TomaUtils.openModal('modal-gift');
  },

  saveGiftForm: async function (e) {
    e.preventDefault();
    const id = document.getElementById('gift-id').value;
    const name = document.getElementById('gift-name').value.trim();
    const price = document.getElementById('gift-price').value;
    const desc = document.getElementById('gift-desc').value.trim();
    const image = document.getElementById('gift-image').value.trim();

    if (!name || !price) {
      TomaUtils.showToast('Please fill in Gift Name and Points Price.', 'error');
      return;
    }

    try {
      await TomaDB.saveGift({
        id: id || undefined,
        name,
        points_price: Number(price),
        description: desc,
        image_url: image || undefined
      });

      TomaUtils.showToast('Gift saved successfully.', 'success');
      TomaUtils.closeModal('modal-gift');
      await this.renderAdminGiftsGrid();
    } catch (err) {
      TomaUtils.showToast(err.message, 'error');
    }
  },

  confirmDeleteGift: function (giftId) {
    TomaUtils.showConfirmModal({
      title: 'Delete Gift Item',
      message: 'Are you sure you want to delete this gift item from the store?',
      confirmText: 'Yes, Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await TomaDB.deleteGift(giftId);
        TomaUtils.showToast('Gift deleted successfully.', 'success');
        await this.renderAdminGiftsGrid();
      }
    });
  },

  renderAdminPurchasesTable: async function () {
    const container = document.getElementById('admin-purchases-container');
    if (!container) return;

    const purchases = await TomaDB.getPurchases();
    const children = await TomaDB.getChildren();
    const gifts = await TomaDB.getGifts();

    const childMap = new Map(children.map(c => [String(c.id), c]));
    const giftMap = new Map(gifts.map(g => [String(g.id), g]));

    if (purchases.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748B;">No gift purchases made yet.</div>`;
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
              <th>Gift Item</th>
              <th>Points Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${purchases.map(p => {
              const child = childMap.get(String(p.child_id));
              const gift = giftMap.get(String(p.gift_id));
              const dateStr = p.created_at || p.purchased_at || new Date().toISOString();
              return `
                <tr>
                  <td>${TomaUtils.formatDate(dateStr)}</td>
                  <td><strong>${child ? child.name : 'Child ID #' + p.child_id}</strong></td>
                  <td><span class="child-code">${child ? child.child_code : 'N/A'}</span></td>
                  <td>🎁 ${gift ? gift.name : 'Gift Item #' + p.gift_id}</td>
                  <td><strong style="color:var(--gold-dark);">${p.points_price || (gift ? gift.points_price : 0)} Pts</strong></td>
                  <td><span class="badge badge-success">CLAIMED</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // USER STORE PORTAL RENDERER
  renderUserStore: async function (childId) {
    const container = document.getElementById('user-gifts-container');
    const banner = document.getElementById('user-store-status-banner');
    if (!container) return;

    const isStoreOn = await TomaDB.getStoreStatus();
    if (banner) {
      banner.style.display = isStoreOn ? 'none' : 'block';
    }

    const gifts = await TomaDB.getGifts();
    const purchases = await TomaDB.getPurchases();
    const childPoints = await TomaDB.getChildPoints(childId);

    const childPurchase = purchases.find(p => String(p.child_id) === String(childId));

    if (gifts.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:rgba(255,255,255,0.6);">No gifts available in store.</div>`;
      return;
    }

    container.innerHTML = gifts.map(gift => {
      const hasPurchasedThis = childPurchase && String(childPurchase.gift_id) === String(gift.id);
      const isAffordable = childPoints >= gift.points_price;

      let btnText = `BUY FOR ${gift.points_price} PTS`;
      let btnClass = 'btn-gold';
      let disabledAttr = '';

      if (!isStoreOn) {
        btnText = 'STORE OFFLINE';
        btnClass = 'btn-secondary';
        disabledAttr = 'disabled';
      } else if (hasPurchasedThis) {
        btnText = '✅ CLAIMED';
        btnClass = 'btn-gold';
        disabledAttr = 'disabled';
      } else if (childPurchase) {
        btnText = '1 GIFT LIMIT REACHED';
        btnClass = 'btn-secondary';
        disabledAttr = 'disabled';
      } else if (!isAffordable) {
        btnText = `NEED ${gift.points_price - childPoints} MORE PTS`;
        btnClass = 'btn-secondary';
        disabledAttr = 'disabled';
      }

      return `
        <div class="gift-card-user ${hasPurchasedThis ? 'purchased-highlight' : ''}">
          <div class="gift-image-wrap">
            <img src="${gift.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'}" alt="${gift.name}">
          </div>
          <div class="gift-title">${gift.name}</div>
          <div class="gift-desc">${gift.description || ''}</div>
          <div class="gift-price-row">
            <span class="price-tag">🎁 ${gift.points_price} Pts</span>
          </div>
          <button class="btn ${btnClass} btn-sm" style="width:100%;" ${disabledAttr} onclick="TomaStore.handleUserPurchase('${childId}', '${gift.id}')">
            ${btnText}
          </button>
        </div>
      `;
    }).join('');
  },

  handleUserPurchase: async function (childId, giftId) {
    try {
      await TomaDB.purchaseGift(childId, giftId);
      TomaUtils.showToast('🎉 Congratulations! Gift purchased successfully.', 'success');
      TomaUtils.launchConfetti();
      
      // Refresh User Store & User Points Counter
      if (window.TomaUserApp) {
        await window.TomaUserApp.loadChildPortal(childId);
      } else {
        await this.renderUserStore(childId);
      }
    } catch (err) {
      TomaUtils.showToast(err.message || 'Purchase failed', 'error');
    }
  },

  setupAdminEventListeners: function () {
    const toggle = document.getElementById('store-active-toggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => this.handleToggleStoreStatus(e.target.checked));
    }

    const giftForm = document.getElementById('form-gift');
    if (giftForm) {
      giftForm.addEventListener('submit', (e) => this.saveGiftForm(e));
    }
  }
};

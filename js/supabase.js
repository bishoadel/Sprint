/**
 * Toma el Rasol - Data Access Layer (Supabase + Offline Mock Fallback)
 */

(function () {
  const STORAGE_KEY = 'toma_el_rasol_db_v3';

  // Initial Database Schema with Pre-loaded Gifts Catalog
  const INITIAL_SEED = {
    children: [],
    admins: [
      { id: 'a1', username: 'admin', password: '123', role: 'general_admin' },
      { id: 'a2', username: 'attendance', password: '123', role: 'attendance_admin' }
    ],
    attendance_types: [
      { id: 'att_1', code: 'mass', name: 'Mass Attendance' },
      { id: 'att_2', code: 'sunday_school', name: 'Sunday School Attendance' },
      { id: 'att_3', code: 'hymns', name: 'Hymns Attendance' },
      { id: 'att_4', code: 'bible_study', name: 'Bible Study Attendance' }
    ],
    point_rules: [
      { id: 'pr_1', event_name: 'Mass Attendance', event_type: 'mass', points: 10, active: true },
      { id: 'pr_2', event_name: 'Sunday School Attendance', event_type: 'sunday_school', points: 10, active: true },
      { id: 'pr_3', event_name: 'Hymns Attendance', event_type: 'hymns', points: 5, active: true },
      { id: 'pr_4', event_name: 'Bible Study Attendance', event_type: 'bible_study', points: 8, active: true },
      { id: 'pr_5', event_name: 'Bible Competition', event_type: 'custom', points: 50, active: true },
      { id: 'pr_6', event_name: 'Helping Service', event_type: 'custom', points: 20, active: true }
    ],
    attendance_records: [],
    point_transactions: [],
    eftkad_records: [],
    gifts: [
      { id: 'g_1', name: 'Football', description: 'Official size 5 leather football', points_price: 250, active: true, image_url: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400' },
      { id: 'g_2', name: 'Backpack', description: 'Durable school backpack with laptop compartment', points_price: 400, active: true, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
      { id: 'g_3', name: 'Notebook Set', description: 'Hardcover spiral notebook with grid lines', points_price: 100, active: true, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
      { id: 'g_4', name: 'Pen Set', description: '12-pack multicolor gel pen set', points_price: 120, active: true, image_url: 'https://images.unsplash.com/photo-1585336261026-875a60a1c96b?w=400' },
      { id: 'g_5', name: 'Water Bottle', description: 'Insulated stainless steel water bottle', points_price: 300, active: true, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' },
      { id: 'g_6', name: 'Sports Cap', description: 'Adjustable athletic cotton cap', points_price: 250, active: true, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400' },
      { id: 'g_7', name: 'Metal Keychain', description: 'St. Thomas cross metal keychain', points_price: 80, active: true, image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400' },
      { id: 'g_8', name: 'Puzzle Game', description: '500-piece biblical stories puzzle', points_price: 200, active: true, image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400' },
      { id: 'g_9', name: 'Coloring Set', description: '50-piece art coloring marker set', points_price: 180, active: true, image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400' },
      { id: 'g_10', name: 'Ceramic Mug', description: 'Inspiring St. Thomas quote ceramic mug', points_price: 220, active: true, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400' },
      { id: 'g_11', name: 'Leather Bracelet', description: 'Handcrafted leather cross bracelet', points_price: 150, active: true, image_url: 'https://images.unsplash.com/photo-1611591475878-0118bc5e4c02?w=400' },
      { id: 'g_12', name: 'Bible Bookmark', description: 'Gold plated metallic Bible bookmark', points_price: 70, active: true, image_url: 'https://images.unsplash.com/photo-1544716278-e513176f20b5?w=400' },
      { id: 'g_13', name: 'Board Game', description: 'Family Bible Trivia board game', points_price: 500, active: true, image_url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400' },
      { id: 'g_14', name: 'Pencil Case', description: 'Double zippered canvas pencil case', points_price: 180, active: true, image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400' },
      { id: 'g_15', name: 'Bluetooth Speaker', description: 'Portable mini wireless speaker', points_price: 450, active: true, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
      { id: 'g_16', name: 'Sports Bottle', description: 'Squeeze sports gym water bottle', points_price: 350, active: true, image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400' },
      { id: 'g_17', name: 'Gift Box Surprise', description: 'Mystery Christian youth surprise box', points_price: 300, active: true, image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400' }
    ],
    purchases: [],
    system_settings: {
      store_active: 'true' // Default ON with full gift catalog
    }
  };

  // Helper to load or initialize LocalStorage
  function getDB() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
        return INITIAL_SEED;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('LocalStorage read error:', e);
      return INITIAL_SEED;
    }
  }

  function saveDB(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Unified Data Access API
  window.TomaDB = {
    // Check if live Supabase client exists
    isLiveSupabase: function () {
      return (
        typeof supabase !== 'undefined' &&
        window.APP_CONFIG &&
        window.APP_CONFIG.SUPABASE_URL &&
        window.APP_CONFIG.SUPABASE_URL.startsWith('https://') &&
        window.APP_CONFIG.SUPABASE_ANON_KEY &&
        window.APP_CONFIG.SUPABASE_ANON_KEY.length > 20
      );
    },

    // --- CHILDREN ---
    getChildren: async function () {
      const db = getDB();
      return db.children || [];
    },

    getChildByCode: async function (code) {
      const children = await this.getChildren();
      return children.find(c => c.child_code.toLowerCase() === code.toLowerCase()) || null;
    },

    getChildById: async function (id) {
      const children = await this.getChildren();
      return children.find(c => c.id === id) || null;
    },

    createChild: async function (childData) {
      const db = getDB();
      
      // Generate Unique 5-Digit Random Child Code (10000 - 99999)
      let childCode = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 1000) {
        attempts++;
        const randNum = Math.floor(10000 + Math.random() * 90000); // 5 digits
        childCode = String(randNum);

        // Verify no duplicate child_code exists
        const exists = db.children.some(c => c.child_code === childCode);
        if (!exists) {
          isUnique = true;
        }
      }

      const newChild = {
        id: 'child_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        child_code: childCode,
        name: childData.name.trim(),
        birth_date: childData.birth_date,
        created_at: new Date().toISOString()
      };

      db.children.push(newChild);
      saveDB(db);
      return newChild;
    },

    updateChild: async function (id, updatedData) {
      const db = getDB();
      const idx = db.children.findIndex(c => c.id === id);
      if (idx !== -1) {
        db.children[idx] = { ...db.children[idx], ...updatedData };
        saveDB(db);
        return db.children[idx];
      }
      throw new Error('Child not found');
    },

    deleteChild: async function (id) {
      const db = getDB();
      db.children = db.children.filter(c => c.id !== id);
      // Remove child transactions, attendance & purchases
      db.attendance_records = db.attendance_records.filter(a => a.child_id !== id);
      db.point_transactions = db.point_transactions.filter(p => p.child_id !== id);
      db.purchases = db.purchases.filter(pr => pr.child_id !== id);
      saveDB(db);
      return true;
    },

    // --- POINTS & TRANSACTIONS ---
    getPointTransactions: async function () {
      const db = getDB();
      return db.point_transactions || [];
    },

    getChildPoints: async function (childId) {
      const txs = await this.getPointTransactions();
      return txs
        .filter(t => t.child_id === childId)
        .reduce((sum, t) => sum + (Number(t.points) || 0), 0);
    },

    getAllChildrenScores: async function () {
      const children = await this.getChildren();
      const txs = await this.getPointTransactions();
      
      return children.map(child => {
        const totalPoints = txs
          .filter(t => t.child_id === child.id)
          .reduce((sum, t) => sum + (Number(t.points) || 0), 0);
        return { ...child, total_points: totalPoints };
      }).sort((a, b) => b.total_points - a.total_points);
    },

    addPointTransaction: async function (txData) {
      const db = getDB();
      const newTx = {
        id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        child_id: txData.child_id,
        points: Number(txData.points),
        source_type: txData.source_type || 'manual',
        source_id: txData.source_id || null,
        description: txData.description || 'Point adjustment',
        created_by: txData.created_by || 'admin',
        created_at: new Date().toISOString()
      };
      db.point_transactions.push(newTx);
      saveDB(db);
      return newTx;
    },

    // --- POINT RULES ---
    getPointRules: async function () {
      const db = getDB();
      return db.point_rules || [];
    },

    savePointRule: async function (ruleData) {
      const db = getDB();
      if (ruleData.id) {
        const idx = db.point_rules.findIndex(r => r.id === ruleData.id);
        if (idx !== -1) {
          db.point_rules[idx] = { ...db.point_rules[idx], ...ruleData };
        }
      } else {
        const newRule = {
          id: 'pr_' + Date.now(),
          event_name: ruleData.event_name,
          event_type: ruleData.event_type || 'custom',
          points: Number(ruleData.points),
          active: true,
          created_at: new Date().toISOString()
        };
        db.point_rules.push(newRule);
      }
      saveDB(db);
      return true;
    },

    deletePointRule: async function (ruleId) {
      const db = getDB();
      db.point_rules = db.point_rules.filter(r => r.id !== ruleId);
      saveDB(db);
      return true;
    },

    // --- ATTENDANCE ---
    getAttendanceTypes: async function () {
      const db = getDB();
      return db.attendance_types || [];
    },

    getAttendanceRecords: async function () {
      const db = getDB();
      return db.attendance_records || [];
    },

    recordBulkAttendance: async function (childIds, attendanceTypeCode, dateStr, adminUser) {
      const db = getDB();
      const attTypes = await this.getAttendanceTypes();
      const attType = attTypes.find(t => t.code === attendanceTypeCode);
      if (!attType) throw new Error('Invalid attendance type');

      const rules = await this.getPointRules();
      const matchingRule = rules.find(r => r.event_type === attendanceTypeCode && r.active);
      const pointsToAdd = matchingRule ? Number(matchingRule.points) : 0;

      let addedCount = 0;

      for (const childId of childIds) {
        // Prevent duplicate attendance for same child, date, and type
        const exists = db.attendance_records.some(
          a => a.child_id === childId && a.attendance_type_id === attType.id && a.attendance_date === dateStr
        );

        if (!exists) {
          const recId = 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          db.attendance_records.push({
            id: recId,
            child_id: childId,
            attendance_type_id: attType.id,
            attendance_date: dateStr,
            recorded_by: adminUser || 'admin',
            created_at: new Date().toISOString()
          });

          // Trigger Automatic Points Transaction
          if (pointsToAdd > 0) {
            db.point_transactions.push({
              id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              child_id: childId,
              points: pointsToAdd,
              source_type: 'attendance',
              source_id: recId,
              description: `${attType.name} (${dateStr})`,
              created_by: adminUser || 'admin',
              created_at: new Date().toISOString()
            });
          }
          addedCount++;
        }
      }

      saveDB(db);
      return { addedCount, pointsPerChild: pointsToAdd };
    },

    // --- EFTKAD ---
    getEftkadRecords: async function () {
      const db = getDB();
      return db.eftkad_records || [];
    },

    addEftkadRecord: async function (childId, servantsArray, dateStr, adminUser) {
      const db = getDB();
      const newRecord = {
        id: 'e_' + Date.now(),
        child_id: childId,
        date: dateStr,
        servants: servantsArray,
        created_by: adminUser || 'admin',
        created_at: new Date().toISOString()
      };
      db.eftkad_records.push(newRecord);
      saveDB(db);
      return newRecord;
    },

    // --- STORE & PURCHASES ---
    getGifts: async function () {
      const db = getDB();
      return db.gifts || [];
    },

    saveGift: async function (giftData) {
      const db = getDB();
      if (giftData.id) {
        const idx = db.gifts.findIndex(g => g.id === giftData.id);
        if (idx !== -1) {
          db.gifts[idx] = { ...db.gifts[idx], ...giftData };
        }
      } else {
        const newGift = {
          id: 'g_' + Date.now(),
          name: giftData.name,
          description: giftData.description || '',
          points_price: Number(giftData.points_price),
          image_url: giftData.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400',
          active: true,
          created_at: new Date().toISOString()
        };
        db.gifts.push(newGift);
      }
      saveDB(db);
      return true;
    },

    deleteGift: async function (giftId) {
      const db = getDB();
      db.gifts = db.gifts.filter(g => g.id !== giftId);
      saveDB(db);
      return true;
    },

    getPurchases: async function () {
      const db = getDB();
      return db.purchases || [];
    },

    purchaseGift: async function (childId, giftId) {
      const db = getDB();

      // Check Store Status
      const isStoreActive = db.system_settings.store_active === 'true';
      if (!isStoreActive) {
        throw new Error('Store is currently turned OFF by General Admin.');
      }

      // Check if child already purchased a gift
      const existingPurchase = db.purchases.find(p => p.child_id === childId);
      if (existingPurchase) {
        throw new Error('You have already purchased a gift during this session.');
      }

      // Check gift availability & price
      const gift = db.gifts.find(g => g.id === giftId && g.active);
      if (!gift) {
        throw new Error('Gift is not available.');
      }

      // Check child points
      const currentPoints = await this.getChildPoints(childId);
      if (currentPoints < gift.points_price) {
        throw new Error(`Insufficient points. You need ${gift.points_price} points, but have ${currentPoints}.`);
      }

      // Create Purchase Record
      const purchaseId = 'pur_' + Date.now();
      const newPurchase = {
        id: purchaseId,
        child_id: childId,
        gift_id: giftId,
        points_price: gift.points_price,
        status: 'purchased',
        purchased_at: new Date().toISOString()
      };
      db.purchases.push(newPurchase);

      // Deduct Points via negative Point Transaction
      db.point_transactions.push({
        id: 'pt_' + Date.now(),
        child_id: childId,
        points: -gift.points_price,
        source_type: 'purchase',
        source_id: purchaseId,
        description: `Purchased: ${gift.name}`,
        created_by: 'user',
        created_at: new Date().toISOString()
      });

      saveDB(db);
      return newPurchase;
    },

    // --- SYSTEM SETTINGS ---
    getStoreStatus: async function () {
      const db = getDB();
      return db.system_settings.store_active === 'true';
    },

    setStoreStatus: async function (activeBool) {
      const db = getDB();
      db.system_settings.store_active = activeBool ? 'true' : 'false';
      saveDB(db);
      return activeBool;
    },

    // --- BACKUP & RESTORE ---
    exportFullDatabase: async function () {
      return getDB();
    },

    restoreFullDatabase: async function (parsedJSON) {
      if (!parsedJSON || !parsedJSON.children || !parsedJSON.point_rules) {
        throw new Error('Invalid backup format. Required collections are missing.');
      }
      saveDB(parsedJSON);
      return true;
    }
  };
})();

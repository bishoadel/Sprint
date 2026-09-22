/**
 * Toma el Rasol - Data Access Layer (Live Supabase Backend + Offline LocalStorage Fallback)
 */

(function () {
  const STORAGE_KEY = 'toma_el_rasol_db_v3';

  // Initial Seed Schema for LocalStorage Fallback
  const INITIAL_SEED = {
    children: [
      { id: 'c1', child_code: '48291', name: 'Kirolos Mina', birth_date: '2015-05-14', created_at: new Date().toISOString() },
      { id: 'c2', child_code: '10429', name: 'Bishoy Adel', birth_date: '2014-09-22', created_at: new Date().toISOString() },
      { id: 'c3', child_code: '30482', name: 'Mary Sameh', birth_date: '2016-01-10', created_at: new Date().toISOString() },
      { id: 'c4', child_code: '88214', name: 'Mark Youssef', birth_date: '2015-11-04', created_at: new Date().toISOString() }
    ],
    admins: [
      { id: 'a1', username: 'admin', password: '123', role: 'general_admin' },
      { id: 'a2', username: 'attendance', password: '123', role: 'attendance_admin' },
      { id: 'a3', username: 'T-dash', password: '123', role: 'tdash' }
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
    attendance_records: [
      { id: 'ar_1', child_id: 'c1', attendance_type_id: 'att_1', attendance_date: '2026-09-22', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_2', child_id: 'c2', attendance_type_id: 'att_1', attendance_date: '2026-09-22', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_3', child_id: 'c3', attendance_type_id: 'att_1', attendance_date: '2026-09-22', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_4', child_id: 'c1', attendance_type_id: 'att_2', attendance_date: '2026-09-20', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_5', child_id: 'c4', attendance_type_id: 'att_2', attendance_date: '2026-09-20', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_6', child_id: 'c2', attendance_type_id: 'att_3', attendance_date: '2026-09-18', recorded_by: 'admin', created_at: new Date().toISOString() },
      { id: 'ar_7', child_id: 'c3', attendance_type_id: 'att_4', attendance_date: '2026-09-15', recorded_by: 'admin', created_at: new Date().toISOString() }
    ],
    point_transactions: [],
    eftkad_records: [],
    gifts: [
      { id: 'g_1', name: 'Football', description: 'Official size 5 leather football', points_price: 250, active: true, image_url: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400' },
      { id: 'g_2', name: 'Backpack', description: 'Durable school backpack with laptop compartment', points_price: 400, active: true, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
      { id: 'g_3', name: 'Notebook Set', description: 'Hardcover spiral notebook with grid lines', points_price: 100, active: true, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
      { id: 'g_4', name: 'Pen Set', description: '12-pack multicolor gel pen set', points_price: 120, active: true, image_url: 'https://images.unsplash.com/photo-1585336261026-875a60a1c96b?w=400' },
      { id: 'g_5', name: 'Water Bottle', description: 'Insulated stainless steel water bottle', points_price: 300, active: true, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' },
      { id: 'g_6', name: 'Sports Cap', description: 'Adjustable athletic cotton cap', points_price: 250, active: true, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400' }
    ],
    purchases: [],
    system_settings: {
      store_active: 'true'
    }
  };

  function getDB() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
        return INITIAL_SEED;
      }
      const db = JSON.parse(data);
      if (!db.children || db.children.length === 0) db.children = INITIAL_SEED.children;
      if (!db.attendance_records || db.attendance_records.length === 0) db.attendance_records = INITIAL_SEED.attendance_records;
      return db;
    } catch (e) {
      console.error('LocalStorage read error:', e);
      return INITIAL_SEED;
    }
  }

  function resolveGiftImageUrl(gift) {
    if (!gift) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
    if (gift.image_url && gift.image_url.trim().startsWith('http') && !gift.image_url.includes('example.com')) {
      return gift.image_url.trim();
    }
    const nameLower = (gift.name || '').toLowerCase();
    if (nameLower.includes('football') || nameLower.includes('ball')) {
      return 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400';
    }
    if (nameLower.includes('backpack') || nameLower.includes('bag')) {
      return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400';
    }
    if (nameLower.includes('notebook') || nameLower.includes('book')) {
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
    }
    if (nameLower.includes('pen') || nameLower.includes('pencil')) {
      return 'https://images.unsplash.com/photo-1585336261026-875a60a1c96b?w=400';
    }
    if (nameLower.includes('water') || nameLower.includes('bottle')) {
      return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400';
    }
    if (nameLower.includes('cap') || nameLower.includes('hat')) {
      return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400';
    }
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';
  }

  function saveDB(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Supabase Client Singleton
  let _supabaseClient = null;

  function getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;

    const config = window.APP_CONFIG;
    if (
      typeof supabase !== 'undefined' &&
      config &&
      config.SUPABASE_URL &&
      config.SUPABASE_URL.startsWith('https://') &&
      config.SUPABASE_ANON_KEY &&
      config.SUPABASE_ANON_KEY.length > 10
    ) {
      try {
        _supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        console.log('⚡ Connected to Live Supabase Backend:', config.SUPABASE_URL);
        return _supabaseClient;
      } catch (err) {
        console.warn('Supabase initialization failed:', err);
        return null;
      }
    }
    return null;
  }

  // Unified Data Access API
  window.TomaDB = {
    isLiveSupabase: function () {
      return getSupabaseClient() !== null;
    },

    // --- CHILDREN ---
    getChildren: async function () {
      let list = [];
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('children').select('*').order('name', { ascending: true });
          if (!error && data) list = data;
          else {
            const db = getDB();
            list = db.children || [];
          }
        } catch (e) {
          const db = getDB();
          list = db.children || [];
        }
      } else {
        const db = getDB();
        list = db.children || [];
      }
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', ['ar', 'en'], { sensitivity: 'base' }));
    },



    getChildByCode: async function (code) {
      const children = await this.getChildren();
      return children.find(c => String(c.child_code).toLowerCase() === String(code).toLowerCase()) || null;
    },

    getChildById: async function (id) {
      const children = await this.getChildren();
      return children.find(c => String(c.id) === String(id)) || null;
    },

    createChild: async function (childData) {
      const client = getSupabaseClient();
      const existing = await this.getChildren();

      // Generate Unique 5-Digit Random Child Code (10000 - 99999)
      let childCode = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 1000) {
        attempts++;
        const randNum = Math.floor(10000 + Math.random() * 90000);
        childCode = String(randNum);

        const exists = existing.some(c => String(c.child_code) === childCode);
        if (!exists) {
          isUnique = true;
        }
      }

      const payload = {
        child_code: childCode,
        name: childData.name.trim(),
        birth_date: childData.birth_date
      };

      if (client) {
        try {
          const { data, error } = await client.from('children').insert([payload]).select();
          if (!error && data && data.length > 0) {
            console.log('✅ Child record saved directly to Supabase cloud table:', data[0]);
            const db = getDB();
            db.children.push(data[0]);
            saveDB(db);
            return data[0];
          }
          console.error('Supabase createChild error:', error);
        } catch (e) {
          console.error('Supabase createChild exception:', e);
        }
      }

      // Offline / Fallback
      const db = getDB();
      const newChild = {
        id: 'child_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        ...payload,
        created_at: new Date().toISOString()
      };
      db.children.push(newChild);
      saveDB(db);
      return newChild;
    },

    updateChild: async function (id, updatedData) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('children').update(updatedData).eq('id', id).select();
          if (!error && data && data.length > 0) {
            const db = getDB();
            const idx = db.children.findIndex(c => c.id === id);
            if (idx !== -1) db.children[idx] = { ...db.children[idx], ...data[0] };
            saveDB(db);
            return data[0];
          }
        } catch (e) {}
      }

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
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('children').delete().eq('id', id);
        } catch (e) {}
      }

      const db = getDB();
      db.children = db.children.filter(c => c.id !== id);
      db.attendance_records = db.attendance_records.filter(a => a.child_id !== id);
      db.point_transactions = db.point_transactions.filter(p => p.child_id !== id);
      db.purchases = db.purchases.filter(pr => pr.child_id !== id);
      saveDB(db);
      return true;
    },

    // --- POINTS & TRANSACTIONS ---
    getPointTransactions: async function () {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('point_transactions').select('*').order('created_at', { ascending: false });
          if (!error && data) return data;
        } catch (e) {}
      }
      const db = getDB();
      return db.point_transactions || [];
    },

    getChildPoints: async function (childId) {
      const txs = await this.getPointTransactions();
      return txs
        .filter(t => String(t.child_id) === String(childId))
        .reduce((sum, t) => sum + (Number(t.points) || 0), 0);
    },

    getAllChildrenScores: async function () {
      const children = await this.getChildren();
      const txs = await this.getPointTransactions();
      
      return children.map(child => {
        const totalPoints = txs
          .filter(t => String(t.child_id) === String(child.id))
          .reduce((sum, t) => sum + (Number(t.points) || 0), 0);
        return { ...child, total_points: totalPoints };
      }).sort((a, b) => b.total_points - a.total_points);
    },

    addPointTransaction: async function (txData) {
      const client = getSupabaseClient();
      const payload = {
        child_id: txData.child_id,
        points: Number(txData.points),
        source_type: txData.source_type || 'manual',
        source_id: txData.source_id || null,
        description: txData.description || 'Point adjustment',
        created_by: txData.created_by || 'admin'
      };

      if (client) {
        try {
          const { data, error } = await client.from('point_transactions').insert([payload]).select();
          if (!error && data && data.length > 0) {
            const db = getDB();
            db.point_transactions.push(data[0]);
            saveDB(db);
            return data[0];
          }
        } catch (e) {}
      }

      const db = getDB();
      const newTx = {
        id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        ...payload,
        created_at: new Date().toISOString()
      };
      db.point_transactions.push(newTx);
      saveDB(db);
      return newTx;
    },

    resetChildScore: async function (childId, adminUser = 'admin') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('point_transactions').delete().eq('child_id', childId);
        } catch (e) {}
      }
      const db = getDB();
      db.point_transactions = (db.point_transactions || []).filter(t => String(t.child_id) !== String(childId));
      saveDB(db);
      return true;
    },

    resetAllScores: async function (adminUser = 'admin') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('point_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (e) {}
      }
      const db = getDB();
      db.point_transactions = [];
      saveDB(db);
      return true;
    },



    // --- POINT RULES ---
    getPointRules: async function () {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('point_rules').select('*');
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
      }
      const db = getDB();
      return db.point_rules || [];
    },

    savePointRule: async function (ruleData) {
      const client = getSupabaseClient();
      const payload = {
        event_name: ruleData.event_name,
        event_type: ruleData.event_type || 'custom',
        points: Number(ruleData.points),
        active: true
      };

      if (client) {
        try {
          if (ruleData.id) {
            await client.from('point_rules').update(payload).eq('id', ruleData.id);
          } else {
            await client.from('point_rules').insert([payload]);
          }
        } catch (e) {}
      }

      const db = getDB();
      if (ruleData.id) {
        const idx = db.point_rules.findIndex(r => r.id === ruleData.id);
        if (idx !== -1) {
          db.point_rules[idx] = { ...db.point_rules[idx], ...payload };
        }
      } else {
        const newRule = {
          id: 'pr_' + Date.now(),
          ...payload,
          created_at: new Date().toISOString()
        };
        db.point_rules.push(newRule);
      }
      saveDB(db);
      return true;
    },

    deletePointRule: async function (ruleId) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('point_rules').delete().eq('id', ruleId);
        } catch (e) {}
      }

      const db = getDB();
      db.point_rules = db.point_rules.filter(r => r.id !== ruleId);
      saveDB(db);
      return true;
    },

    // --- ATTENDANCE ---
    getAttendanceTypes: async function () {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('attendance_types').select('*');
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
      }
      const db = getDB();
      return db.attendance_types || [];
    },

    getAttendanceRecords: async function () {
      const db = getDB();
      const deletedSet = new Set((db.deleted_attendance_ids || []).map(String));
      const client = getSupabaseClient();

      if (client) {
        try {
          const { data, error } = await client.from('attendance_records').select('*, children(id, name, child_code), attendance_types(id, code, name)').order('created_at', { ascending: false });
          if (!error && data) {
            const localRecs = db.attendance_records || [];
            const mergedMap = new Map();
            data.forEach(r => {
              if (!deletedSet.has(String(r.id))) {
                mergedMap.set(String(r.id), r);
              }
            });
            localRecs.forEach(r => {
              if (r.id && !deletedSet.has(String(r.id)) && !mergedMap.has(String(r.id))) {
                mergedMap.set(String(r.id), r);
              }
            });
            return Array.from(mergedMap.values());
          }
        } catch (e) {}
      }
      return (db.attendance_records || []).filter(r => !deletedSet.has(String(r.id)));
    },

    deleteAttendanceRecord: async function (recordId, childId, dateStr) {
      const client = getSupabaseClient();
      if (client) {
        try {
          if (recordId) {
            await client.from('attendance_records').delete().eq('id', recordId);
          }
          if (childId && dateStr) {
            await client.from('attendance_records').delete().match({ child_id: childId, attendance_date: dateStr });
          }
        } catch (e) {
          console.warn('Supabase delete exception:', e);
        }
      }

      const db = getDB();
      if (!db.deleted_attendance_ids) db.deleted_attendance_ids = [];
      if (recordId) db.deleted_attendance_ids.push(String(recordId));

      db.attendance_records = (db.attendance_records || []).filter(r => {
        if (recordId && String(r.id) === String(recordId)) return false;
        if (childId && dateStr && String(r.child_id) === String(childId) && String(r.attendance_date) === String(dateStr)) return false;
        return true;
      });
      saveDB(db);
      return true;
    },




    recordBulkAttendance: async function (childIds, attendanceTypeCode, dateStr, adminUser) {
      const client = getSupabaseClient();
      const attTypes = await this.getAttendanceTypes();
      const attType = attTypes.find(t => t.code === attendanceTypeCode);
      if (!attType) throw new Error('Invalid attendance type');

      const rules = await this.getPointRules();
      const matchingRule = rules.find(r => r.event_type === attendanceTypeCode && r.active);
      const pointsToAdd = matchingRule ? Number(matchingRule.points) : 0;

      let addedCount = 0;
      const existing = await this.getAttendanceRecords();

      for (const childId of childIds) {
        const exists = existing.some(
          a => String(a.child_id) === String(childId) && String(a.attendance_type_id) === String(attType.id) && a.attendance_date === dateStr
        );

        if (!exists) {
          const payload = {
            child_id: childId,
            attendance_type_id: attType.id,
            attendance_date: dateStr,
            recorded_by: adminUser || 'admin'
          };

          if (client) {
            try {
              const { data, error } = await client.from('attendance_records').insert([payload]).select();
              if (!error && data && data.length > 0) {
                const rec = data[0];
                if (pointsToAdd > 0) {
                  await this.addPointTransaction({
                    child_id: childId,
                    points: pointsToAdd,
                    source_type: 'attendance',
                    source_id: rec.id,
                    description: `${attType.name} (${dateStr})`,
                    created_by: adminUser || 'admin'
                  });
                }
                addedCount++;
                continue;
              }
            } catch (e) {}
          }

          const db = getDB();
          const recId = 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          db.attendance_records.push({
            id: recId,
            ...payload,
            created_at: new Date().toISOString()
          });

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
          saveDB(db);
          addedCount++;
        }
      }

      return { addedCount, pointsPerChild: pointsToAdd };
    },

    // --- EFTKAD ---
    getEftkadRecords: async function () {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('eftkad_records').select('*, children(id, name, child_code)').order('created_at', { ascending: false });
          if (!error && data) return data;
        } catch (e) {}
      }
      const db = getDB();
      return db.eftkad_records || [];
    },

    addEftkadRecord: async function (childId, servantsArray, dateStr, adminUser) {
      const client = getSupabaseClient();
      const db = getDB();

      if (client) {
        try {
          // Check if record already exists for this child and date
          const { data: existing, error: findErr } = await client
            .from('eftkad_records')
            .select('*')
            .eq('child_id', childId)
            .eq('date', dateStr);

          if (!findErr && existing && existing.length > 0) {
            const currentRec = existing[0];
            const oldServants = Array.isArray(currentRec.servants) ? currentRec.servants : [];
            const mergedServants = Array.from(new Set([...oldServants, ...servantsArray]));

            const { data: updated, error: updateErr } = await client
              .from('eftkad_records')
              .update({ servants: mergedServants })
              .eq('id', currentRec.id)
              .select();

            if (!updateErr && updated && updated.length > 0) {
              const idx = (db.eftkad_records || []).findIndex(r => r.id === currentRec.id);
              if (idx !== -1) db.eftkad_records[idx] = updated[0];
              else db.eftkad_records.push(updated[0]);
              saveDB(db);
              return updated[0];
            }
          } else {
            const payload = {
              child_id: childId,
              date: dateStr,
              servants: servantsArray,
              created_by: adminUser || 'admin'
            };

            const { data, error } = await client.from('eftkad_records').insert([payload]).select();
            if (!error && data && data.length > 0) {
              db.eftkad_records.push(data[0]);
              saveDB(db);
              return data[0];
            }
          }
        } catch (e) {
          console.warn('Supabase addEftkadRecord error:', e);
        }
      }

      // Offline / LocalStorage Fallback
      const payload = {
        child_id: childId,
        date: dateStr,
        servants: servantsArray,
        created_by: adminUser || 'admin'
      };

      const existingIdx = (db.eftkad_records || []).findIndex(r => String(r.child_id) === String(childId) && r.date === dateStr);
      if (existingIdx !== -1) {
        const oldServants = Array.isArray(db.eftkad_records[existingIdx].servants) ? db.eftkad_records[existingIdx].servants : [];
        db.eftkad_records[existingIdx].servants = Array.from(new Set([...oldServants, ...servantsArray]));
        saveDB(db);
        return db.eftkad_records[existingIdx];
      }

      const newRecord = {
        id: 'e_' + Date.now(),
        ...payload,
        created_at: new Date().toISOString()
      };
      db.eftkad_records.push(newRecord);
      saveDB(db);
      return newRecord;
    },

    // --- STORE & PURCHASES ---
    getGifts: async function () {
      const client = getSupabaseClient();
      const db = getDB();

      let giftList = [];

      if (client) {
        try {
          const { data, error } = await client.from('gifts').select('*');
          if (!error && data) {
            // Auto-seed default gifts if Supabase gifts table is empty
            if (data.length === 0 && (db.gifts || []).length > 0) {
              const seedPayloads = db.gifts.map(g => ({
                name: g.name,
                description: g.description || '',
                image_url: resolveGiftImageUrl(g),
                points_price: Number(g.points_price),
                active: true
              }));
              const { data: insertedData, error: seedErr } = await client.from('gifts').insert(seedPayloads).select();
              if (!seedErr && insertedData && insertedData.length > 0) {
                giftList = insertedData;
              }
            } else {
              giftList = data;
            }
          }
        } catch (e) {
          console.warn('Supabase getGifts error:', e);
          giftList = db.gifts || [];
        }
      } else {
        giftList = db.gifts || [];
      }

      // Deduplicate gifts strictly by normalized name and ID, and ensure image_url is stored in DB
      const uniqueGifts = [];
      const seenKeys = new Set();

      for (const g of giftList) {
        if (!g || !g.name) continue;
        const nameKey = g.name.trim().toLowerCase();
        const idKey = String(g.id);

        if (!seenKeys.has(idKey) && !seenKeys.has(nameKey)) {
          seenKeys.add(idKey);
          seenKeys.add(nameKey);

          // Resolve valid image URL and update DB column if missing or empty
          const validImg = resolveGiftImageUrl(g);
          if (!g.image_url || g.image_url !== validImg) {
            g.image_url = validImg;
            if (client && g.id) {
              // Update image_url column in Supabase gifts table asynchronously
              client.from('gifts').update({ image_url: validImg }).eq('id', g.id).then(() => {}).catch(() => {});
            }
          }

          uniqueGifts.push(g);
        }
      }

      // Sort gifts from HIGHEST points price to LOWEST points price
      uniqueGifts.sort((a, b) => Number(b.points_price || 0) - Number(a.points_price || 0));

      db.gifts = uniqueGifts;
      saveDB(db);
      return uniqueGifts;
    },

    saveGift: async function (giftData) {
      const client = getSupabaseClient();
      const resolvedImg = resolveGiftImageUrl({ name: giftData.name, image_url: giftData.image_url });
      const payload = {
        name: giftData.name,
        description: giftData.description || '',
        points_price: Number(giftData.points_price),
        image_url: resolvedImg,
        active: giftData.active !== undefined ? giftData.active : true
      };

      const db = getDB();
      if (!db.gifts) db.gifts = [];

      let savedGiftId = giftData.id;

      if (client) {
        try {
          if (giftData.id) {
            const { error } = await client.from('gifts').update(payload).eq('id', giftData.id);
            if (error) console.error('Supabase update gift error:', error);
          } else {
            const { data, error } = await client.from('gifts').insert([payload]).select();
            if (!error && data && data.length > 0) {
              savedGiftId = data[0].id;
            }
          }
        } catch (e) {
          console.warn('Supabase saveGift exception:', e);
        }
      }

      if (savedGiftId) {
        const idx = db.gifts.findIndex(g => String(g.id) === String(savedGiftId));
        if (idx !== -1) {
          db.gifts[idx] = { ...db.gifts[idx], ...payload, id: savedGiftId };
        } else {
          db.gifts.push({ id: savedGiftId, ...payload, created_at: new Date().toISOString() });
        }
      } else {
        const newId = 'g_' + Date.now();
        db.gifts.push({
          id: newId,
          ...payload,
          created_at: new Date().toISOString()
        });
      }

      // Sort local gifts list from highest to lowest points price
      db.gifts.sort((a, b) => Number(b.points_price || 0) - Number(a.points_price || 0));

      saveDB(db);
      return true;
    },

    deleteGift: async function (giftId) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('gifts').delete().eq('id', giftId);
        } catch (e) {
          console.warn('Supabase deleteGift error:', e);
        }
      }

      const db = getDB();
      db.gifts = (db.gifts || []).filter(g => String(g.id) !== String(giftId));
      saveDB(db);
      return true;
    },

    getPurchases: async function () {
      const client = getSupabaseClient();
      const db = getDB();
      const localPurchases = (db.purchases || []).filter(p => p && p.child_id && p.gift_id);

      let fetchedPurchases = [];
      if (client) {
        try {
          let res = await client.from('purchases').select('*').order('purchased_at', { ascending: false });
          if (res.error) {
            res = await client.from('purchases').select('*').order('created_at', { ascending: false });
          }
          if (res.error) {
            res = await client.from('purchases').select('*');
          }
          if (!res.error && res.data) {
            fetchedPurchases = res.data.filter(p => p && p.child_id && p.gift_id);
          }
        } catch (e) {
          console.warn('Supabase getPurchases error:', e);
        }
      }

      // Merge Supabase fetched data with local purchases (prioritizing Supabase data)
      const combined = [...fetchedPurchases, ...localPurchases];
      const uniquePurchases = [];
      const seenIds = new Set();

      combined.forEach(p => {
        const idKey = String(p.id);
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          uniquePurchases.push(p);
        }
      });

      uniquePurchases.sort((a, b) => {
        const dA = new Date(a.purchased_at || a.created_at || 0);
        const dB = new Date(b.purchased_at || b.created_at || 0);
        return dB - dA;
      });

      db.purchases = uniquePurchases;
      saveDB(db);
      return uniquePurchases;
    },

    purchaseGift: async function (childId, giftId) {
      const isStoreActive = await this.getStoreStatus();
      if (!isStoreActive) {
        throw new Error('Store is currently turned OFF by General Admin.');
      }

      const purchases = await this.getPurchases();
      const existingPurchase = purchases.find(p => String(p.child_id) === String(childId));
      if (existingPurchase) {
        throw new Error('A gift has already been claimed for this child. 1 gift limit per child.');
      }

      const gifts = await this.getGifts();
      const gift = gifts.find(g => String(g.id) === String(giftId));
      if (!gift || gift.active === false) {
        throw new Error('Selected gift is not available.');
      }

      const currentPoints = await this.getChildPoints(childId);
      if (currentPoints < gift.points_price) {
        throw new Error(`Insufficient points. You need ${gift.points_price} points, but currently have ${currentPoints}.`);
      }

      const payload = {
        child_id: childId,
        gift_id: giftId,
        points_price: gift.points_price,
        status: 'purchased'
      };

      let pur = null;
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('purchases').insert([payload]).select();
          if (!error && data && data.length > 0) {
            pur = data[0];
          }
        } catch (e) {
          console.warn('Supabase purchase insert error:', e);
        }
      }

      const db = getDB();
      if (!pur) {
        const purchaseId = 'pur_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        pur = {
          id: purchaseId,
          ...payload,
          purchased_at: new Date().toISOString()
        };
      }

      if (!db.purchases) db.purchases = [];
      const existingIdx = db.purchases.findIndex(p => String(p.id) === String(pur.id));
      if (existingIdx !== -1) {
        db.purchases[existingIdx] = pur;
      } else {
        db.purchases.push(pur);
      }
      saveDB(db);

      // Deduct points from child balance via negative point transaction
      await this.addPointTransaction({
        child_id: childId,
        points: -gift.points_price,
        source_type: 'purchase',
        source_id: pur.id,
        description: `Purchased Gift: ${gift.name}`,
        created_by: 'user'
      });

      return pur;
    },

    deletePurchase: async function (purchaseId) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('purchases').delete().eq('id', purchaseId);
          await client.from('point_transactions').delete().eq('source_id', String(purchaseId));
        } catch (e) {
          console.warn('Supabase deletePurchase error:', e);
        }
      }

      const db = getDB();
      db.purchases = (db.purchases || []).filter(p => String(p.id) !== String(purchaseId));
      db.point_transactions = (db.point_transactions || []).filter(t => String(t.source_id) !== String(purchaseId));
      saveDB(db);
      return true;
    },

    // --- SYSTEM SETTINGS ---
    getStoreStatus: async function () {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client.from('system_settings').select('value').eq('key', 'store_active').single();
          if (!error && data) return data.value === 'true';
        } catch (e) {}
      }
      const db = getDB();
      return db.system_settings.store_active === 'true';
    },

    setStoreStatus: async function (activeBool) {
      const valStr = activeBool ? 'true' : 'false';
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('system_settings').upsert({ key: 'store_active', value: valStr });
        } catch (e) {}
      }

      const db = getDB();
      db.system_settings.store_active = valStr;
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

/**
 * Toma el Rasol - Attendance Statistics, Dynamic Flame Heat Engine & Streak Milestones
 */

window.TomaStreaks = {
  // Milestone numbers: 10, 25, 50, 100, 150, 200
  MILESTONES: [10, 25, 50, 100, 150, 200],

  /**
   * Determine Flame Heat Level, Icon, Colors & Celebration Messages based on Streak Count
   */
  getFlameStage: function (streakCount) {
    if (!streakCount || streakCount <= 0) {
      return {
        stage: 0,
        name: 'Extinguished Flame',
        icon: '🕯️',
        className: 'flame-extinguished',
        glowColor: '#64748B',
        celebrationMsg: null,
        nextMilestone: 10
      };
    } else if (streakCount < 10) {
      return {
        stage: 1,
        name: 'Warm Ember Flame',
        icon: '🔥',
        className: 'flame-warm',
        glowColor: '#FF4500',
        celebrationMsg: null,
        nextMilestone: 10
      };
    } else if (streakCount < 25) {
      return {
        stage: 2,
        name: 'Blaze Flame (Stage 1)',
        icon: '💥',
        className: 'flame-blaze',
        glowColor: '#FF2400',
        celebrationMsg: '🔥 Outstanding 10-Week Streak! You unlocked the Blaze Flame & +50 Bonus Points! 🎉',
        nextMilestone: 25
      };
    } else if (streakCount < 50) {
      return {
        stage: 3,
        name: 'Blue Plasma Flame (Stage 2)',
        icon: '💙',
        className: 'flame-plasma',
        glowColor: '#00BFFF',
        celebrationMsg: '⚡ Incredible 25-Week Streak! You unlocked the Blue Plasma Flame & +50 Bonus Points! 💙',
        nextMilestone: 50
      };
    } else if (streakCount < 100) {
      return {
        stage: 4,
        name: 'Purple Cosmic Flame (Stage 3)',
        icon: '💜',
        className: 'flame-cosmic',
        glowColor: '#9370DB',
        celebrationMsg: '🔮 Majestic 50-Week Streak! You unlocked the Purple Cosmic Flame & +50 Bonus Points! 💜',
        nextMilestone: 100
      };
    } else if (streakCount < 150) {
      return {
        stage: 5,
        name: 'Golden Divine Flame (Stage 4)',
        icon: '👑',
        className: 'flame-golden',
        glowColor: '#FFD700',
        celebrationMsg: '🏆 Legendary 100-Week Streak! You unlocked the Golden Divine Flame & +50 Bonus Points! 👑',
        nextMilestone: 150
      };
    } else if (streakCount < 200) {
      return {
        stage: 6,
        name: 'Solar Diamond Flame (Stage 5)',
        icon: '💎',
        className: 'flame-diamond',
        glowColor: '#FFFFFF',
        celebrationMsg: '☀️ Unstoppable 150-Week Streak! You unlocked the Solar Diamond Flame & +50 Bonus Points! 💎',
        nextMilestone: 200
      };
    } else {
      return {
        stage: 7,
        name: 'Ultimate Supernova Flame (Stage 6)',
        icon: '🌟',
        className: 'flame-supernova',
        glowColor: '#00FFFF',
        celebrationMsg: '⚡ GODLY 200-Week Streak! You unlocked the Ultimate Supernova Flame & +50 Bonus Points! 🌟',
        nextMilestone: null
      };
    }
  },

  /**
   * Calculate Attendance Statistics & Streaks for a Child
   */
  calculateChildStats: async function (childId) {
    const allAttendance = await TomaDB.getAttendanceRecords();
    const attTypes = await TomaDB.getAttendanceTypes();

    const childAtt = allAttendance.filter(a => a.child_id === childId);

    // Map types
    const massType = attTypes.find(t => t.code === 'mass');
    const ssType = attTypes.find(t => t.code === 'sunday_school');
    const hymnsType = attTypes.find(t => t.code === 'hymns');
    const bibleType = attTypes.find(t => t.code === 'bible_study');

    const massRecords = massType ? childAtt.filter(a => a.attendance_type_id === massType.id) : [];
    const ssRecords = ssType ? childAtt.filter(a => a.attendance_type_id === ssType.id) : [];
    const hymnsRecords = hymnsType ? childAtt.filter(a => a.attendance_type_id === hymnsType.id) : [];
    const bibleRecords = bibleType ? childAtt.filter(a => a.attendance_type_id === bibleType.id) : [];

    // Calculate Last Attendance Dates
    const getLastDate = (records) => {
      if (records.length === 0) return 'Never';
      const sorted = [...records].sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
      return sorted[0].attendance_date;
    };

    // Total distinct session dates per type across class for percentage calculation
    const getDistinctSessionDates = (typeId) => {
      const typeRecords = allAttendance.filter(a => a.attendance_type_id === typeId);
      const dates = new Set(typeRecords.map(r => r.attendance_date));
      return dates.size || 1;
    };

    const calcPercentage = (childRecords, totalSessions) => {
      if (totalSessions === 0) return 0;
      const pct = Math.round((childRecords.length / totalSessions) * 100);
      return Math.min(pct, 100);
    };

    const massSessionsTotal = massType ? getDistinctSessionDates(massType.id) : 1;
    const ssSessionsTotal = ssType ? getDistinctSessionDates(ssType.id) : 1;
    const hymnsSessionsTotal = hymnsType ? getDistinctSessionDates(hymnsType.id) : 1;
    const bibleSessionsTotal = bibleType ? getDistinctSessionDates(bibleType.id) : 1;

    /**
     * STREAK CALCULATION ENGINE
     * -------------------------------------------------------------------------
     * An active streak counts consecutive weekly attendances (7 to 10 days apart).
     * 
     * WHEN DOES A STREAK END?
     * 1. RECENCY CONDITION: If the child's last attendance was > 10 days ago from today,
     *    the active streak has ended and resets to 0 (flame extinguished).
     * 2. CONSECUTIVE WEEK CONDITION: The streak counts consecutive past weeks backwards.
     *    The moment the gap between two consecutive attendance dates exceeds 10 days,
     *    the streak ends for that block.
     */
    const computeWeeklyStreak = (records) => {
      if (!records || records.length === 0) return 0;
      
      const dates = records.map(r => r.attendance_date).sort((a, b) => new Date(b) - new Date(a));
      if (dates.length === 0) return 0;

      const today = new Date();
      const mostRecentDate = new Date(dates[0]);
      
      // Calculate days elapsed since most recent attendance
      const diffFromToday = Math.round((today - mostRecentDate) / (1000 * 60 * 60 * 24));

      // STREAK END RULE 1: If child hasn't attended in the last 10 days, active streak ends!
      if (diffFromToday > 10) {
        return 0;
      }

      let streak = 0;
      const dateObjs = dates.map(d => new Date(d));

      // STREAK END RULE 2: Loop backwards to count consecutive weekly attendances (gap <= 10 days)
      for (let i = 0; i < dateObjs.length; i++) {
        if (i === 0) {
          streak = 1;
        } else {
          const prevDate = dateObjs[i - 1];
          const currDate = dateObjs[i];
          const diffDays = Math.round((prevDate - currDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 6 && diffDays <= 10) {
            streak++;
          } else {
            break; // Gap > 10 days -> streak ended for previous block
          }
        }
      }
      return streak;
    };

    const massStreak = computeWeeklyStreak(massRecords);
    const sundaySchoolStreak = computeWeeklyStreak(ssRecords);

    return {
      massPercentage: calcPercentage(massRecords, massSessionsTotal),
      sundaySchoolPercentage: calcPercentage(ssRecords, ssSessionsTotal),
      hymnsPercentage: calcPercentage(hymnsRecords, hymnsSessionsTotal),
      bibleStudyPercentage: calcPercentage(bibleRecords, bibleSessionsTotal),

      lastMassDate: getLastDate(massRecords),
      lastSundaySchoolDate: getLastDate(ssRecords),
      lastHymnsDate: getLastDate(hymnsRecords),
      lastBibleStudyDate: getLastDate(bibleRecords),

      massStreak: massStreak,
      sundaySchoolStreak: sundaySchoolStreak
    };
  },

  /**
   * AUTOMATIC +50 BONUS POINTS AWARDING ON MILESTONES (10, 25, 50, 100, 150, 200)
   */
  checkAndAwardStreakMilestones: async function (childId, massStreak, ssStreak) {
    const existingTxs = await TomaDB.getPointTransactions();
    const childTxs = existingTxs.filter(t => t.child_id === childId);
    
    const awardedMilestones = [];

    const checkCategory = async (streakVal, categoryName) => {
      for (const milestone of this.MILESTONES) {
        if (streakVal >= milestone) {
          const sourceId = `streak_milestone_${childId}_${categoryName}_${milestone}`;
          
          // Check if +50 bonus points already awarded for this milestone
          const alreadyAwarded = childTxs.some(t => t.source_id === sourceId);
          
          if (!alreadyAwarded) {
            console.log(`🎉 Awarding +50 Bonus Points to child ${childId} for ${milestone}-Week ${categoryName} streak milestone!`);
            await TomaDB.addPointTransaction({
              child_id: childId,
              points: 50,
              source_type: 'custom_rule',
              source_id: sourceId,
              description: `🔥 ${milestone}-Week ${categoryName === 'mass' ? 'Mass' : 'Sunday School'} Streak Milestone Bonus (+50 pts)`,
              created_by: 'streak_engine'
            });

            const flameInfo = this.getFlameStage(milestone);
            awardedMilestones.push({
              milestone,
              category: categoryName === 'mass' ? 'Mass' : 'Sunday School',
              flameInfo
            });
          }
        }
      }
    };

    await checkCategory(massStreak, 'mass');
    await checkCategory(ssStreak, 'sunday_school');

    return awardedMilestones;
  }
};

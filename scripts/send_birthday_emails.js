/**
 * Toma el Rasol - 24/7 Automated Background Birthday Email Script
 * 
 * Runs automatically in background (cron schedule: 0 0 * * *).
 * 1. On 1st of month: Sends monthly birthday roster email to all emails in NOTIFICATION_EMAILS.
 * 2. Daily: Checks for birthdays TOMORROW (1 day in advance) and sends reminder emails to NOTIFICATION_EMAILS.
 */

const fs = require('fs');
const path = require('path');

// Load Email Configuration
const emailConfigPath = path.join(__dirname, '../js/email-config.js');
let NOTIFICATION_EMAILS = ['bishoyadel733@gmail.com'];

if (fs.existsSync(emailConfigPath)) {
  try {
    const configContent = fs.readFileSync(emailConfigPath, 'utf8');
    const match = configContent.match(/NOTIFICATION_EMAILS:\s*\[([\s\S]*?)\]/);
    if (match && match[1]) {
      const extractedEmails = match[1]
        .split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(s => s.length > 0 && s.includes('@'));
      if (extractedEmails.length > 0) {
        NOTIFICATION_EMAILS = extractedEmails;
      }
    }
  } catch (e) {
    console.log('Using default email config:', e.message);
  }
}

console.log('====================================================');
console.log('TOMA EL RASOL - 24/7 AUTOMATED BIRTHDAY EMAIL RUNNER');
console.log('Target Email Recipients:', NOTIFICATION_EMAILS);
console.log('Execution Timestamp:', new Date().toISOString());
console.log('====================================================');

async function runBirthdayEmailCheck() {
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const currentMonth = today.getMonth();
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowMonth = tomorrow.getMonth();
  const tomorrowDay = tomorrow.getDate();

  console.log(`Checking dates: Today = Month ${currentMonth + 1}, Day ${currentDayOfMonth} | Tomorrow = Month ${tomorrowMonth + 1}, Day ${tomorrowDay}`);

  // Fetch children data (from Supabase API if credentials present, or fallback schema/mock)
  let children = [];
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      console.log('Fetching children live from Supabase cloud database...');
      const response = await fetch(`${supabaseUrl}/rest/v1/children?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        children = await response.json();
        console.log(`Successfully fetched ${children.length} children from Supabase.`);
      } else {
        console.warn('Supabase fetch returned status:', response.status);
      }
    } catch (err) {
      console.warn('Could not fetch from Supabase Cloud API:', err.message);
    }
  } else {
    console.log('No SUPABASE_URL set in env. Running in dry-run / scheduled check mode.');
  }

  // 1. MONTHLY ROSTER CHECK (1st day of month)
  if (currentDayOfMonth === 1) {
    console.log('📆 Today is the 1st of the month! Preparing Monthly Birthday Digest Email...');
    const monthlyList = children.filter(c => {
      if (!c.birth_date) return false;
      const bd = new Date(c.birth_date);
      return bd.getMonth() === currentMonth;
    }).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

    console.log(`Found ${monthlyList.length} children celebrating birthdays this month.`);
    await sendMonthlyDigestEmail(monthlyList, NOTIFICATION_EMAILS);
  }

  // 2. TOMORROW'S BIRTHDAY CHECK (1 Day Advance Reminder)
  const tomorrowList = children.filter(c => {
    if (!c.birth_date) return false;
    const bd = new Date(c.birth_date);
    return bd.getMonth() === tomorrowMonth && bd.getDate() === tomorrowDay;
  });

  if (tomorrowList.length > 0) {
    console.log(`🎂 Found ${tomorrowList.length} children celebrating birthdays tomorrow!`);
    await sendTomorrowReminderEmail(tomorrowList, NOTIFICATION_EMAILS);
  } else {
    console.log('No birthdays occurring tomorrow.');
  }

  console.log('Automated birthday email check completed successfully.');
}

const TomaEmailService = require('../js/email-service.js');
const emailConfig = require('../js/email-config.js');

async function sendMonthlyDigestEmail(list, recipients) {
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });
  const emailPayload = TomaEmailService.buildMonthlyRosterEmail(monthName, list);
  console.log(`[EMAIL DISPATCH] Monthly Birthday Digest -> ${recipients.join(', ')}`);
  console.log(`[EMAIL SUBJECT] ${emailPayload.subject}`);
  
  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      console.log('Dispatching email payload to WEBHOOK API:', process.env.EMAIL_WEBHOOK_URL);
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      console.log('✅ Monthly Digest Webhook Dispatch Succeeded!');
    } catch (err) {
      console.warn('Webhook dispatch failed:', err.message);
    }
  } else {
    console.log('ℹ️ No EMAIL_WEBHOOK_URL specified. HTML payload built successfully:');
    console.log(emailPayload.html.substring(0, 300) + '...');
  }
}

async function sendTomorrowReminderEmail(list, recipients) {
  const emailPayload = TomaEmailService.buildTomorrowReminderEmail(list);
  console.log(`[EMAIL DISPATCH] Tomorrow Birthday Alert -> ${recipients.join(', ')}`);
  console.log(`[EMAIL SUBJECT] ${emailPayload.subject}`);

  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      console.log('Dispatching email payload to WEBHOOK API:', process.env.EMAIL_WEBHOOK_URL);
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      console.log('✅ Tomorrow Reminder Webhook Dispatch Succeeded!');
    } catch (err) {
      console.warn('Webhook dispatch failed:', err.message);
    }
  } else {
    console.log('ℹ️ No EMAIL_WEBHOOK_URL specified. HTML payload built successfully:');
    console.log(emailPayload.html.substring(0, 300) + '...');
  }
}

runBirthdayEmailCheck().catch(err => {
  console.error('Error during automated email runner execution:', err);
  process.exit(1);
});


/**
 * Toma el Rasol - Birthday Email Automation & Template Generator Engine
 */

const TomaEmailService = {
  /**
   * Helper to retrieve notification emails safely
   */
  getNotificationEmails: function() {
    if (typeof window !== 'undefined' && window.EMAIL_CONFIG && window.EMAIL_CONFIG.NOTIFICATION_EMAILS) {
      return window.EMAIL_CONFIG.NOTIFICATION_EMAILS;
    }
    try {
      const emailConfig = require('./email-config.js');
      if (emailConfig && emailConfig.NOTIFICATION_EMAILS) return emailConfig.NOTIFICATION_EMAILS;
    } catch (e) {}
    return ['bishoyadel733@gmail.com', 'Tonyandsandra.26@gmail.com'];
  },

  /**
   * Generates the Beginning of Month Birthday Roster HTML Email
   */
  buildMonthlyRosterEmail: function (monthName, birthdayChildren) {
    const emailList = this.getNotificationEmails();
    
    const childrenRows = birthdayChildren.length > 0 
      ? birthdayChildren.map((c, i) => `
          <tr style="background-color: ${i % 2 === 0 ? '#FFFFFF' : '#FAF8F5'};">
            <td style="padding:12px; border-bottom:1px solid #E2E8F0; font-weight:bold; color:#0D2040;">${c.name}</td>
            <td style="padding:12px; border-bottom:1px solid #E2E8F0; color:#475569;">${c.child_code || '-'}</td>
            <td style="padding:12px; border-bottom:1px solid #E2E8F0; color:#D4AF37; font-weight:bold;">${c.formatted_date || c.birth_date}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" style="padding:16px; text-align:center; color:#94A3B8;">No birthdays scheduled for ${monthName}.</td></tr>`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color:#F4F6F9; padding:20px; color:#333;">
        <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background:#0D2040; padding:24px; text-align:center; border-bottom:4px solid #D4AF37;">
            <h1 style="color:#FFFFFF; margin:0; font-size:22px;">🎂 ${monthName} Birthday Roster</h1>
            <p style="color:#D4AF37; margin:6px 0 0 0; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Toma el Rasol • Automated Monthly Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding:24px;">
            <p style="font-size:15px; color:#334155; line-height:1.6;">
              Hello Servant,
            </p>
            <p style="font-size:15px; color:#334155; line-height:1.6;">
              Here is the automated monthly birthday roster for <strong>${monthName}</strong>. Below are all children celebrating their birthdays this month:
            </p>
            
            <table style="width:100%; border-collapse:collapse; margin-top:16px; margin-bottom:20px;">
              <thead>
                <tr style="background:#0D2040; color:#FFFFFF;">
                  <th style="padding:10px; text-align:left; border-radius:4px 0 0 0;">Child Name</th>
                  <th style="padding:10px; text-align:left;">ID</th>
                  <th style="padding:10px; text-align:left; border-radius:0 4px 0 0;">Birthdate</th>
                </tr>
              </thead>
              <tbody>
                ${childrenRows}
              </tbody>
            </table>

            <div style="background:#FFFBEB; border-left:4px solid #F59E0B; padding:14px; border-radius:4px; font-size:13px; color:#92400E;">
              <strong>Note:</strong> The system will also automatically send a 1-day advance email reminder before each child's individual birthday date.
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background:#FAF8F5; padding:16px; text-align:center; border-top:1px solid #E2E8F0; font-size:12px; color:#64748B;">
            Sent automatically to: ${emailList.join(', ')}<br>
            © Toma el Rasol Church Class Management
          </div>
        </div>
      </div>
    `;

    return {
      subject: `🎂 [Toma_el_rasol] ${monthName} Monthly Birthday Roster (${birthdayChildren.length} Children)`,
      html: htmlBody,
      recipients: emailList
    };
  },

  /**
   * Generates Tomorrow's 1-Day Advance Birthday Reminder HTML Email
   */
  buildTomorrowReminderEmail: function (tomorrowChildren) {
    const emailList = this.getNotificationEmails();
    
    const childrenCards = tomorrowChildren.map(c => `
      <div style="background:#FAF8F5; border:1px solid #FCD34D; padding:16px; border-radius:8px; margin-bottom:12px;">
        <h3 style="margin:0 0 6px 0; color:#0D2040; font-size:18px;">🎈 ${c.name}</h3>
        <p style="margin:0; font-size:14px; color:#475569;">
          Child ID: <strong>${c.child_code || '-'}</strong> | Turning <strong>${c.upcoming_age || c.age || '—'}</strong> years old tomorrow!
        </p>
      </div>
    `).join('');

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color:#F4F6F9; padding:20px; color:#333;">
        <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background:#0D2040; padding:24px; text-align:center; border-bottom:4px solid #D4AF37;">
            <h1 style="color:#FFFFFF; margin:0; font-size:22px;">⏰ Tomorrow's Birthday Reminder!</h1>
            <p style="color:#D4AF37; margin:6px 0 0 0; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Toma_el_rasol • 1-Day Advance Alert</p>
          </div>
          
          <!-- Content -->
          <div style="padding:24px;">
            <p style="font-size:15px; color:#334155; line-height:1.6;">
              Hello Servant,
            </p>
            <p style="font-size:15px; color:#334155; line-height:1.6;">
              This is an automated reminder from <strong>Toma_el_rasol</strong> that tomorrow we celebrate the birthday of <strong>${tomorrowChildren.length}</strong> child(ren):
            </p>
            
            ${childrenCards}

            <p style="font-size:14px; color:#64748B; margin-top:20px;">
              Don't forget to send them birthday wishes and prepare their celebration!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background:#FAF8F5; padding:16px; text-align:center; border-top:1px solid #E2E8F0; font-size:12px; color:#64748B;">
            Sender: Toma_el_rasol<br>
            Sent automatically to: ${emailList.join(', ')}<br>
            © Toma_el_rasol Church Class Management
          </div>
        </div>
      </div>
    `;

    return {
      subject: `⏰ [Toma_el_rasol] Birthday Reminder: ${tomorrowChildren.map(c => c.name).join(', ')}`,
      html: htmlBody,
      recipients: emailList
    };
  },

  /**
   * Dispatch Tomorrow's Birthday Reminder Email Instantly
   */
  sendTomorrowReminderEmailNow: async function (tomorrowList) {
    if (!tomorrowList || tomorrowList.length === 0) return;
    const emailData = this.buildTomorrowReminderEmail(tomorrowList);
    return await this.dispatchEmail(emailData);
  },

  /**
   * Dispatch Monthly Birthday Roster Email Instantly
   */
  sendMonthlyRosterEmailNow: async function (monthName, list) {
    if (!list || list.length === 0) return;
    const emailData = this.buildMonthlyRosterEmail(monthName, list);
    return await this.dispatchEmail(emailData);
  },

  /**
   * Browser & API Email Dispatcher Engine
   */
  dispatchEmail: async function (emailData) {
    const recipients = emailData.recipients || this.getNotificationEmails();
    const recipientsStr = recipients.join(',');

    console.log('📧 Dispatching Birthday Email from Toma_el_rasol:', emailData.subject, 'To:', recipientsStr);

    if (typeof window !== 'undefined') {
      // Create plain text mailto body
      const bodyText = `From: Toma_el_rasol\nTo: ${recipientsStr}\nSubject: ${emailData.subject}\n\nThis is an automated birthday notification from Toma_el_rasol.\n\nPlease check your admin dashboard for full details.`;
      const mailtoUrl = `mailto:${encodeURIComponent(recipientsStr)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(bodyText)}`;
      try {
        window.location.href = mailtoUrl;
      } catch (e) {
        console.warn('Mailto link error:', e);
      }

      if (typeof TomaUtils !== 'undefined' && TomaUtils.showToast) {
        TomaUtils.showToast(`📧 Opening email reminder from Toma_el_rasol for ${recipients.join(', ')}!`, 'success');
      }
    } else {
      console.log('⚡ Server/Node.js Environment: HTML Email Generated Successfully.');
    }
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.TomaEmailService = TomaEmailService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TomaEmailService;
}


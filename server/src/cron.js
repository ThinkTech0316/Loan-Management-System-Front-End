import cron from 'node-cron';
import { masterPool } from './db/master.js';
import { getTenantPool } from './db/tenant.js';
import { sendSMS } from './sms.js';
import { tenantContext } from './database.js';

function isAnniversaryToday(startDateStr, durationMonths) {
  const today = new Date();
  const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
  
  const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
  
  if (monthsDiff > 0 && monthsDiff <= durationMonths) {
    const expectedAnniversary = new Date(startDate.getTime());
    expectedAnniversary.setMonth(startDate.getMonth() + monthsDiff);
    
    // Handle month-end overflows (e.g. Jan 31 -> Feb 28)
    if (expectedAnniversary.getDate() !== startDate.getDate()) {
      expectedAnniversary.setDate(0); 
    }
    
    return expectedAnniversary.getFullYear() === today.getFullYear() &&
           expectedAnniversary.getMonth() === today.getMonth() &&
           expectedAnniversary.getDate() === today.getDate();
  }
  return false;
}

const runDailyFDInterestSMS = async () => {
  console.log('[Cron] Starting daily FD interest SMS job...');
  try {
    // 1. Get all active tenants
    const { rows: tenants } = await masterPool.query("SELECT id, company_name FROM master_users WHERE status = 'active' AND role = 'admin'");
    
    for (const tenant of tenants) {
      try {
        const tenantPool = await getTenantPool(tenant.id);
        const tClient = await tenantPool.connect();
        
        try {
          const { rows: fds } = await tClient.query(`
            SELECT fd.*, b.name AS borrower_name, b.phone 
            FROM fixed_deposits fd
            JOIN borrowers b ON b.id = fd.borrower_id
            WHERE fd.status = 'active'
          `);

          for (const fd of fds) {
            // Check if today is the monthly anniversary date
            const startDateStr = fd.start_date.toISOString().split('T')[0];
            
            if (isAnniversaryToday(startDateStr, fd.duration_months)) {
              const principal = parseFloat(fd.principal_amount);
              const rate = parseFloat(fd.interest_rate);
              const monthlyInterest = principal * (rate / 100 / 12);
              
              const formattedInterest = Math.round(monthlyInterest).toLocaleString();
              const message = `Dear ${fd.borrower_name}, your Fixed Deposit of Rs. ${principal.toLocaleString()} has earned Rs. ${formattedInterest} interest this month. Thank you - ${tenant.company_name}`;
              
              // Send SMS within tenant context to accurately update SMS counts
              await new Promise((resolve) => {
                tenantContext.run(tenant.id, async () => {
                  try {
                    await sendSMS(fd.phone, message);
                  } catch (smsErr) {
                    console.error(`[Cron] SMS failed for FD ${fd.id}:`, smsErr);
                  }
                  resolve();
                });
              });
            }
          }
        } finally {
          tClient.release();
        }
      } catch (tenantErr) {
        console.error(`[Cron] Error processing tenant ${tenant.id}:`, tenantErr);
      }
    }
  } catch (err) {
    console.error('[Cron] Critical error in daily FD job:', err);
  }
  console.log('[Cron] Finished daily FD interest SMS job.');
};

export const initCronJobs = () => {
  // Schedule to run every day at 08:00 AM
  cron.schedule('0 8 * * *', runDailyFDInterestSMS, {
    scheduled: true,
    timezone: 'Asia/Colombo'
  });
  console.log('[Cron] Scheduled FD interest SMS job for 08:00 AM daily.');
};

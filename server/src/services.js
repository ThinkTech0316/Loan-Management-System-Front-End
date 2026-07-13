import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { sendSMS } from './sms.js';
import { sendWelcomeEmail } from './email.js';
import bcrypt from 'bcryptjs';
import { query, transaction, tenantContext, userContext } from './database.js';
import { badRequest, conflict, notFound, unauthorized } from './errors.js';
import {
  validateBorrowerPayload,
  validateFixedDepositPayload,
  validateLoanPayload,
  validateRepaymentPayload,
} from './validators.js';
import { config } from './config.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ID_TABLES = new Set(['borrowers', 'loans', 'repayments', 'fixed_deposits']);

const dbQuery = (db, text, params = []) => db.query(text, params);

const toNumber = (value) => Number(value ?? 0);

const toDateString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.split('T')[0];
  return value.toISOString().split('T')[0];
};

const addMonths = (dateString, months) => {
  const date = new Date(`${toDateString(dateString)}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toDateString(date);
};

const trimOptional = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapBorrower = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  nic: row.nic,
  district: row.district,
  address: row.address,
  status: row.status,
  createdAt: toDateString(row.created_at),
  ...(row.avatar ? { avatar: row.avatar } : {}),
  ...(row.is_deleted ? { isDeleted: true } : {}),
});

const mapLoan = (row) => ({
  id: row.id,
  borrowerId: row.borrower_id,
  borrowerName: row.borrower_name,
  amount: toNumber(row.amount),
  interestRate: toNumber(row.interest_rate),
  durationMonths: Number(row.duration_months),
  startDate: toDateString(row.start_date),
  status: row.status,
  repaymentFrequency: row.repayment_frequency,
  remainingBalance: toNumber(row.remaining_balance),
});

const mapRepayment = (row) => ({
  id: row.id,
  loanId: row.loan_id,
  amount: toNumber(row.amount),
  date: toDateString(row.payment_date),
  status: row.status,
  method: row.method,
  ...(row.reference ? { reference: row.reference } : {}),
});

const mapFixedDeposit = (row) => ({
  id: row.id,
  borrowerId: row.borrower_id,
  borrowerName: row.borrower_name,
  principalAmount: toNumber(row.principal_amount),
  interestRate: toNumber(row.interest_rate),
  durationMonths: Number(row.duration_months),
  startDate: toDateString(row.start_date),
  maturityDate: toDateString(row.maturity_date),
  maturityAmount: toNumber(row.maturity_amount),
  status: row.status,
});

const mapCollectionData = (row) => ({
  month: row.month,
  expected: toNumber(row.expected),
  actual: toNumber(row.actual),
});

const mapNotification = (row) => ({
  id: String(row.id),
  title: row.title,
  message: row.message,
  type: row.type,
  read: !row.is_unread,
  createdAt: row.created_at,
});

const nextId = async (db, table, prefix = '', base = 0) => {
  if (!ID_TABLES.has(table)) throw new Error(`Unsupported ID table: ${table}`);

  const { rows } = await dbQuery(db, `SELECT id FROM ${table}`);
  const values = rows
    .map((row) => {
      if (prefix && !row.id.startsWith(prefix)) return Number.NaN;
      const numericPart = prefix ? row.id.slice(prefix.length) : row.id;
      return Number(numericPart);
    })
    .filter((value) => Number.isInteger(value));

  const max = values.length > 0 ? Math.max(...values) : base;
  return `${prefix}${max + 1}`;
};

const getBorrowerRow = async (id, db = { query }) => {
  const { rows } = await dbQuery(db, 'SELECT * FROM borrowers WHERE id = $1', [id]);
  if (rows.length === 0) throw notFound('Borrower not found');
  return rows[0];
};

const getActiveBorrowerRow = async (id, db = { query }) => {
  const row = await getBorrowerRow(id, db);
  if (row.is_deleted) throw badRequest('Borrower is in the recycle bin and cannot be used for new records');
  return row;
};

const getLoanRow = async (id, db = { query }) => {
  const { rows } = await dbQuery(
    db,
    `SELECT l.*, b.name AS borrower_name
     FROM loans l
     JOIN borrowers b ON b.id = l.borrower_id
     WHERE l.id = $1`,
    [id],
  );
  if (rows.length === 0) throw notFound('Loan not found');
  return rows[0];
};

const getFixedDepositRow = async (id, db = { query }) => {
  const { rows } = await dbQuery(
    db,
    `SELECT fd.*, b.name AS borrower_name
     FROM fixed_deposits fd
     JOIN borrowers b ON b.id = fd.borrower_id
     WHERE fd.id = $1`,
    [id],
  );
  if (rows.length === 0) throw notFound('Fixed deposit not found');
  return rows[0];
};

const calculateMaturityAmount = ({ principalAmount, interestRate, durationMonths }) => Math.round(
  toNumber(principalAmount) + (toNumber(principalAmount) * (toNumber(interestRate) / 100) * (Number(durationMonths) / 12)),
);

const createNotification = async (db, title, message, type = 'info') => {
  await dbQuery(
    db,
    'INSERT INTO notifications (title, message, type, is_unread) VALUES ($1, $2, $3, TRUE)',
    [title, message, type],
  );
};

export const login = async (payload) => {
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (!email || !password) throw badRequest('Email and password are required');

  const { masterPool } = await import('./db/master.js');
  const { getTenantPool } = await import('./db/tenant.js');

  // 1. Check Master Users (Super Admin or Client Owners)
  const { rows: masterUsers } = await masterPool.query('SELECT * FROM master_users WHERE lower(email) = $1 AND status IN ($2, $3)', [email, 'active', 'suspended']);
  if (masterUsers.length > 0) {
    const user = masterUsers[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (passwordMatch) {
      const isSuperAdmin = user.role === 'superadmin';
      return {
        token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64url'),
        user: {
          id: user.id,
          name: isSuperAdmin ? 'Super Admin' : (user.company_name || 'Client Admin'),
          email: user.email,
          role: user.role,
          tenantId: isSuperAdmin ? null : user.id, // For clients, their master_users ID is the tenant ID
          companyName: isSuperAdmin ? 'SaaS Platform' : user.company_name,
          phone: user.phone,
          logoUrl: null,
          isReadOnly: user.status === 'suspended',
        },
      };
    }
  }

  // 2. Check Tenant Staff (Iterate through active clients)
  const { rows: clients } = await masterPool.query('SELECT * FROM master_users WHERE role = $1 AND status = $2', ['admin', 'active']);

  for (const client of clients) {
    try {
      const tenantPool = await getTenantPool(client.id);
      const { rows: users } = await tenantPool.query('SELECT * FROM users WHERE lower(email) = $1 AND is_active = TRUE', [email]);

      if (users.length > 0) {
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          return {
            token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64url'),
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              tenantId: client.id, // This is returned to frontend, which sets X-Tenant-Id
              companyName: client.company_name,
              phone: user.phone,
              logoUrl: null,
              isReadOnly: false, // tenant staff can only login if client is active, so not readonly by default
            },
          };
        }
      }
    } catch (e) {
      // Ignore errors from connecting to a specific tenant DB during search
      console.error(e);
    }
  }

  throw unauthorized('Invalid email or password');
};

export const requestPasswordReset = async (payload) => {
  const email = String(payload.email ?? '').trim().toLowerCase();
  if (!email || !/\S+@\S+\.\S+/.test(email)) throw badRequest('A valid email is required');

  const token = randomUUID();
  await query('INSERT INTO password_reset_requests (email, token) VALUES ($1, $2)', [email, token]);
  return { email, token, message: 'Password reset request recorded.' };
};

export const getStats = async () => {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*) FROM loans WHERE status = 'active') AS total_active_loans,
      COALESCE((SELECT SUM(remaining_balance) FROM loans WHERE status <> 'completed'), 0) AS total_outstanding,
      COALESCE((SELECT SUM(amount) FROM repayments WHERE status = 'paid'), 0) AS total_collected,
      (SELECT COUNT(*) FROM loans WHERE status = 'overdue') AS overdue_count,
      (SELECT COUNT(*) FROM fixed_deposits WHERE status = 'active') AS total_active_fds,
      COALESCE((SELECT SUM(principal_amount) FROM fixed_deposits), 0) AS total_deposits
  `);

  const row = rows[0];
  return {
    totalActiveLoans: Number(row.total_active_loans),
    totalOutstanding: toNumber(row.total_outstanding),
    totalCollected: toNumber(row.total_collected),
    overdueCount: Number(row.overdue_count),
    monthlyGrowth: 15.4,
    totalActiveFDs: Number(row.total_active_fds),
    totalDeposits: toNumber(row.total_deposits),
  };
};

export const getCollectionData = async () => {
  const orderCase = MONTHS.map((month, index) => `WHEN '${month}' THEN ${index + 1}`).join(' ');
  const { rows } = await query(`SELECT * FROM collection_data ORDER BY CASE month ${orderCase} ELSE 13 END, month`);
  return rows.map(mapCollectionData);
};

export const listBorrowers = async ({ deleted = false } = {}) => {
  const { rows } = await query(
    `SELECT * FROM borrowers
     WHERE is_deleted = $1
     ORDER BY created_at DESC, id DESC`,
    [deleted],
  );
  return rows.map(mapBorrower);
};

export const listDeletedBorrowers = () => listBorrowers({ deleted: true });

export const getBorrower = async (id) => mapBorrower(await getBorrowerRow(id));

export const addBorrower = async (payload) => {
  validateBorrowerPayload(payload);

  const { rows } = await query('SELECT id FROM borrowers WHERE lower(email) = lower($1)', [payload.email.trim()]);
  if (rows.length > 0) throw conflict('A borrower with this email already exists');

  const id = await nextId({ query }, 'borrowers');
  const status = payload.status ?? 'active';
  const createdAt = payload.createdAt ?? toDateString(new Date());

  await query(
    `INSERT INTO borrowers (id, name, email, phone, nic, district, address, status, avatar, is_deleted, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10)`,
    [
      id,
      payload.name.trim(),
      payload.email.trim(),
      payload.phone.trim(),
      payload.nic.trim(),
      payload.district.trim(),
      payload.address.trim(),
      status,
      trimOptional(payload.avatar),
      createdAt,
    ],
  );

  await createNotification({ query }, 'New Borrower Registered', `${payload.name.trim()} was added to the borrower directory.`, 'info');
  return getBorrower(id);
};

export const updateBorrower = async (id, payload) => {
  validateBorrowerPayload(payload, true);
  await getBorrowerRow(id);

  const allowedFields = {
    name: ['name', (value) => value.trim()],
    email: ['email', (value) => value.trim()],
    phone: ['phone', (value) => value.trim()],
    nic: ['nic', (value) => value.trim()],
    district: ['district', (value) => value.trim()],
    address: ['address', (value) => value.trim()],
    status: ['status', (value) => value],
    avatar: ['avatar', trimOptional],
    isDeleted: ['is_deleted', (value) => value],
  };

  const sets = [];
  const values = [];
  for (const [field, [column, normalizer]] of Object.entries(allowedFields)) {
    if (payload[field] !== undefined) {
      values.push(normalizer(payload[field]));
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getBorrower(id);

  values.push(id);
  await query(`UPDATE borrowers SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
  return getBorrower(id);
};

export const deleteBorrower = async (id) => {
  await getBorrowerRow(id);
  await query('UPDATE borrowers SET is_deleted = TRUE WHERE id = $1', [id]);
  return true;
};

export const restoreBorrower = async (id) => {
  await getBorrowerRow(id);
  await query('UPDATE borrowers SET is_deleted = FALSE WHERE id = $1', [id]);
  return true;
};

export const permanentlyDeleteBorrower = async (id) => transaction(async (client) => {
  await getBorrowerRow(id, client);

  await client.query(
    `DELETE FROM repayments
     WHERE loan_id IN (SELECT id FROM loans WHERE borrower_id = $1)`,
    [id],
  );
  await client.query('DELETE FROM loans WHERE borrower_id = $1', [id]);
  await client.query('DELETE FROM fixed_deposits WHERE borrower_id = $1', [id]);
  await client.query('DELETE FROM borrowers WHERE id = $1', [id]);
  return true;
});

export const listLoans = async ({ status } = {}) => {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = 'WHERE l.status = $1';
  }

  const { rows } = await query(
    `SELECT l.*, b.name AS borrower_name
     FROM loans l
     JOIN borrowers b ON b.id = l.borrower_id
     ${where}
     ORDER BY l.created_at DESC, l.id DESC`,
    params,
  );
  return rows.map(mapLoan);
};

export const getLoan = async (id) => mapLoan(await getLoanRow(id));

export const createLoan = async (payload) => {
  validateLoanPayload(payload);
  const borrower = await getActiveBorrowerRow(payload.borrowerId);
  const id = await nextId({ query }, 'loans', 'L', 1000);

  await query(
    `INSERT INTO loans (id, borrower_id, amount, interest_rate, duration_months, start_date, status, repayment_frequency, remaining_balance)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)`,
    [
      id,
      payload.borrowerId,
      payload.amount,
      payload.interestRate,
      payload.durationMonths,
      payload.startDate,
      payload.repaymentFrequency,
      payload.amount,
    ],
  );

  await createNotification({ query }, 'New Loan Disbursed', `Rs. ${payload.amount.toLocaleString()} loan created for ${borrower.name}.`, 'info');

  // Send SMS notification to borrower
  const firstDueDate = new Date(`${payload.startDate}T00:00:00`);
  if (payload.repaymentFrequency === 'weekly') {
    firstDueDate.setDate(firstDueDate.getDate() + 7);
  } else {
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
  }
  const dueDateStr = firstDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  sendSMS(
    borrower.phone,
    `Dear ${borrower.name}, your loan of Rs. ${Number(payload.amount).toLocaleString()} has been disbursed. Duration: ${payload.durationMonths} months. First repayment due: ${dueDateStr}. Thank you - VanniLoan`
  ).catch(() => { });

  return getLoan(id);
};

export const updateLoan = async (id, payload) => {
  validateLoanPayload(payload, true);
  await getLoanRow(id);

  if (payload.borrowerId !== undefined) await getActiveBorrowerRow(payload.borrowerId);

  const allowedFields = {
    borrowerId: ['borrower_id', (value) => value],
    amount: ['amount', (value) => value],
    interestRate: ['interest_rate', (value) => value],
    durationMonths: ['duration_months', (value) => value],
    startDate: ['start_date', (value) => value],
    status: ['status', (value) => value],
    repaymentFrequency: ['repayment_frequency', (value) => value],
    remainingBalance: ['remaining_balance', (value) => value],
  };

  const sets = [];
  const values = [];
  for (const [field, [column, normalizer]] of Object.entries(allowedFields)) {
    if (payload[field] !== undefined) {
      values.push(normalizer(payload[field]));
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getLoan(id);

  values.push(id);
  await query(`UPDATE loans SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`, values);
  return getLoan(id);
};

export const deleteLoan = async (id) => transaction(async (client) => {
  const loanResult = await client.query('SELECT * FROM loans WHERE id = $1', [id]);
  if (loanResult.rows.length === 0) throw notFound('Loan not found');

  // Delete all repayments associated with this loan first
  await client.query('DELETE FROM repayments WHERE loan_id = $1', [id]);
  await client.query('DELETE FROM loans WHERE id = $1', [id]);

  await createNotification(client, 'Loan Deleted', `Loan #${id} has been permanently deleted.`, 'warning');
  return true;
});

export const listRepayments = async ({ loanId } = {}) => {
  const params = [];
  let where = '';
  if (loanId) {
    params.push(loanId);
    where = 'WHERE loan_id = $1';
  }
  const { rows } = await query(
    `SELECT * FROM repayments
     ${where}
     ORDER BY payment_date DESC, created_at DESC, id DESC`,
    params,
  );
  return rows.map(mapRepayment);
};

export const getRepayment = async (id) => {
  const { rows } = await query('SELECT * FROM repayments WHERE id = $1', [id]);
  if (rows.length === 0) throw notFound('Repayment not found');
  return mapRepayment(rows[0]);
};

export const recordRepayment = async (payload) => {
  validateRepaymentPayload(payload);

  return transaction(async (client) => {
    const loanResult = await client.query('SELECT * FROM loans WHERE id = $1 FOR UPDATE', [payload.loanId]);
    const loan = loanResult.rows[0];
    if (!loan) throw notFound('Loan not found');
    if (toNumber(loan.remaining_balance) <= 0) throw badRequest('This loan has no outstanding balance');
    if (payload.amount > toNumber(loan.remaining_balance)) {
      throw badRequest('Repayment amount cannot exceed the outstanding loan balance', {
        remainingBalance: toNumber(loan.remaining_balance),
      });
    }

    const repaymentId = await nextId(client, 'repayments', 'R', 2000);
    const newRemainingBalance = Math.max(0, toNumber(loan.remaining_balance) - payload.amount);
    const newStatus = newRemainingBalance === 0 ? 'completed' : (loan.status === 'pending' ? 'active' : loan.status);

    await client.query(
      `INSERT INTO repayments (id, loan_id, amount, payment_date, status, method, reference)
       VALUES ($1, $2, $3, $4, 'paid', $5, $6)`,
      [repaymentId, payload.loanId, payload.amount, payload.date, payload.method, trimOptional(payload.reference)],
    );

    await client.query(
      'UPDATE loans SET remaining_balance = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [newRemainingBalance, newStatus, payload.loanId],
    );

    const monthName = MONTHS[new Date(`${payload.date}T00:00:00`).getMonth()];
    await client.query(
      `INSERT INTO collection_data (month, expected, actual)
       VALUES ($1, $2, $3)
       ON CONFLICT (month) DO UPDATE SET actual = collection_data.actual + EXCLUDED.actual`,
      [monthName, Math.round(payload.amount * 1.05), payload.amount],
    );

    await createNotification(client, 'Repayment Received', `Rs. ${payload.amount.toLocaleString()} received for Loan #${payload.loanId}.`, 'success');

    const { rows } = await client.query('SELECT * FROM repayments WHERE id = $1', [repaymentId]);
    return mapRepayment(rows[0]);
  });
};

export const deleteRepayment = async (id) => transaction(async (client) => {
  const repaymentResult = await client.query('SELECT * FROM repayments WHERE id = $1 FOR UPDATE', [id]);
  const repayment = repaymentResult.rows[0];
  if (!repayment) throw notFound('Repayment not found');

  const loanResult = await client.query('SELECT * FROM loans WHERE id = $1 FOR UPDATE', [repayment.loan_id]);
  const loan = loanResult.rows[0];
  if (loan) {
    const restoredBalance = Math.min(toNumber(loan.amount), toNumber(loan.remaining_balance) + toNumber(repayment.amount));
    const restoredStatus = loan.status === 'completed' && restoredBalance > 0 ? 'active' : loan.status;
    await client.query(
      'UPDATE loans SET remaining_balance = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [restoredBalance, restoredStatus, repayment.loan_id],
    );
  }

  const monthName = MONTHS[new Date(`${toDateString(repayment.payment_date)}T00:00:00`).getMonth()];
  await client.query(
    `UPDATE collection_data
     SET actual = GREATEST(0, actual - $2)
     WHERE month = $1`,
    [monthName, repayment.amount],
  );

  await client.query('DELETE FROM repayments WHERE id = $1', [id]);
  return true;
});

export const getRepaymentSchedule = async (loanId) => {
  const loan = await getLoan(loanId);
  const repayments = await listRepayments({ loanId });

  const isWeekly = loan.repaymentFrequency === 'weekly';
  const installmentCount = isWeekly ? loan.durationMonths * 4 : loan.durationMonths;
  const rate = loan.interestRate / (isWeekly ? 52 : 12) / 100;
  const totalPaid = repayments
    .filter((repayment) => repayment.status === 'paid')
    .reduce((sum, repayment) => sum + repayment.amount, 0);

  let installmentAmount = 0;
  if (rate === 0) {
    installmentAmount = loan.amount / installmentCount;
  } else {
    installmentAmount = (loan.amount * rate * Math.pow(1 + rate, installmentCount)) / (Math.pow(1 + rate, installmentCount) - 1);
  }

  const schedule = [];
  let remainingPrincipal = loan.amount;
  const startDate = new Date(`${loan.startDate}T00:00:00.000Z`);

  for (let i = 1; i <= installmentCount; i += 1) {
    const dueDate = new Date(startDate);
    if (isWeekly) {
      dueDate.setUTCDate(startDate.getUTCDate() + (i * 7));
    } else {
      dueDate.setUTCMonth(startDate.getUTCMonth() + i);
    }

    const interest = remainingPrincipal * rate;
    const principal = Math.max(0, installmentAmount - interest);
    remainingPrincipal = Math.max(0, remainingPrincipal - principal);

    let status = 'pending';
    const expectedPaid = installmentAmount * i;
    if (totalPaid >= expectedPaid - 10) {
      status = 'paid';
    } else if (dueDate.getTime() < Date.now()) {
      status = 'overdue';
    }

    schedule.push({
      installmentNumber: i,
      dueDate: toDateString(dueDate),
      amount: Math.round(installmentAmount),
      principal: Math.round(principal),
      interest: Math.round(interest),
      status,
    });
  }

  return schedule;
};

export const listFixedDeposits = async ({ status } = {}) => {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = 'WHERE fd.status = $1';
  }
  const { rows } = await query(
    `SELECT fd.*, b.name AS borrower_name
     FROM fixed_deposits fd
     JOIN borrowers b ON b.id = fd.borrower_id
     ${where}
     ORDER BY fd.created_at DESC, fd.id DESC`,
    params,
  );
  return rows.map(mapFixedDeposit);
};

export const getFixedDeposit = async (id) => mapFixedDeposit(await getFixedDepositRow(id));

export const createFixedDeposit = async (payload) => {
  const normalized = {
    ...payload,
    maturityDate: payload.maturityDate ?? addMonths(payload.startDate, payload.durationMonths),
    maturityAmount: payload.maturityAmount ?? calculateMaturityAmount(payload),
  };
  validateFixedDepositPayload(normalized);

  const borrower = await getActiveBorrowerRow(normalized.borrowerId);
  const id = await nextId({ query }, 'fixed_deposits', 'FD', 3000);

  await query(
    `INSERT INTO fixed_deposits
       (id, borrower_id, principal_amount, interest_rate, duration_months, start_date, maturity_date, maturity_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
    [
      id,
      normalized.borrowerId,
      normalized.principalAmount,
      normalized.interestRate,
      normalized.durationMonths,
      normalized.startDate,
      normalized.maturityDate,
      normalized.maturityAmount,
    ],
  );

  await createNotification({ query }, 'Fixed Deposit Created', `Rs. ${normalized.principalAmount.toLocaleString()} fixed deposit created for ${borrower.name}.`, 'success');

  // Send SMS notification to borrower
  const matDateStr = new Date(`${normalized.maturityDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  sendSMS(
    borrower.phone,
    `Dear ${borrower.name}, your Fixed Deposit of Rs. ${Number(normalized.principalAmount).toLocaleString()} has been created. Maturity date: ${matDateStr}. Maturity amount: Rs. ${Number(normalized.maturityAmount).toLocaleString()}. Thank you - VanniLoan`
  ).catch(() => { });

  return getFixedDeposit(id);
};

export const updateFixedDeposit = async (id, payload) => {
  validateFixedDepositPayload(payload, true);
  const existing = await getFixedDeposit(id);

  if (payload.borrowerId !== undefined) await getActiveBorrowerRow(payload.borrowerId);

  const merged = { ...existing, ...payload };
  const shouldRecalculateMaturity = ['principalAmount', 'interestRate', 'durationMonths'].some((field) => payload[field] !== undefined);
  if (payload.maturityDate === undefined && payload.durationMonths !== undefined) {
    merged.maturityDate = addMonths(merged.startDate, merged.durationMonths);
  }
  if (payload.maturityAmount === undefined && shouldRecalculateMaturity) {
    merged.maturityAmount = calculateMaturityAmount(merged);
  }

  validateFixedDepositPayload(merged);

  await query(
    `UPDATE fixed_deposits
     SET borrower_id = $1,
         principal_amount = $2,
         interest_rate = $3,
         duration_months = $4,
         start_date = $5,
         maturity_date = $6,
         maturity_amount = $7,
         status = $8,
         updated_at = NOW()
     WHERE id = $9`,
    [
      merged.borrowerId,
      merged.principalAmount,
      merged.interestRate,
      merged.durationMonths,
      merged.startDate,
      merged.maturityDate,
      merged.maturityAmount,
      merged.status,
      id,
    ],
  );

  return getFixedDeposit(id);
};

export const deleteFixedDeposit = async (id) => {
  const { rows } = await query('SELECT * FROM fixed_deposits WHERE id = $1', [id]);
  if (rows.length === 0) throw notFound('Fixed deposit not found');

  await query('DELETE FROM fixed_deposits WHERE id = $1', [id]);

  await createNotification({ query }, 'Fixed Deposit Deleted', `Fixed Deposit #${id} has been permanently deleted.`, 'warning');
  return true;
};

export const getFDEarningsSchedule = async (fdId) => {
  const fd = await getFixedDeposit(fdId);
  const schedule = [];
  const monthlyInterest = fd.principalAmount * (fd.interestRate / 100 / 12);
  const date = new Date(`${fd.startDate}T00:00:00.000Z`);
  let accruedInterest = 0;

  for (let month = 1; month <= fd.durationMonths; month += 1) {
    accruedInterest += monthlyInterest;
    const dueDate = new Date(date);
    dueDate.setUTCMonth(date.getUTCMonth() + month);

    schedule.push({
      month,
      date: toDateString(dueDate),
      accruedInterest: Math.round(accruedInterest),
      totalValue: Math.round(fd.principalAmount + accruedInterest),
    });
  }

  return schedule;
};

export const listNotifications = async () => {
  const { rows } = await query('SELECT * FROM notifications ORDER BY created_at DESC, id DESC');
  return rows.map(mapNotification);
};

export const markNotificationRead = async (id) => {
  const { rowCount } = await query('UPDATE notifications SET is_unread = FALSE WHERE id = $1', [id]);
  if (rowCount === 0) throw notFound('Notification not found');
  return true;
};

export const markAllNotificationsRead = async () => {
  await query('UPDATE notifications SET is_unread = FALSE');
  return true;
};

export const deleteNotification = async (id) => {
  const { rowCount } = await query('DELETE FROM notifications WHERE id = $1', [id]);
  if (rowCount === 0) throw notFound('Notification not found');
  return true;
};

export const listSettings = async () => {
  const { rows } = await query('SELECT "key", value FROM settings ORDER BY "key"');
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
};

export const getSetting = async (key) => {
  const tenantId = tenantContext.getStore();
  if (!tenantId) {
    if (key === 'profile') return { firstName: 'Super', lastName: 'Admin', role: 'superadmin' };
    if (key === 'organization') return { orgName: 'SaaS Platform' };
    return null;
  }

  const { rows } = await query('SELECT value FROM settings WHERE "key" = $1', [key]);
  if (rows.length === 0) {
    if (key === 'profile') return { firstName: '', lastName: '', role: 'admin' };
    if (key === 'organization') return { orgName: 'VanniLoan' };
    throw notFound('Setting not found');
  }
  return rows[0].value;
};

export const upsertSetting = async (key, value) => {
  if (!key || typeof key !== 'string') throw badRequest('Setting key is required');
  await query(
    `INSERT INTO settings ("key", value)
     VALUES ($1, $2)
     ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value ?? {})],
  );

  if (key === 'organization') {
    const tenantId = tenantContext.getStore();
    if (tenantId) {
      const { masterPool } = await import('./db/master.js');
      await masterPool.query(
        `UPDATE master_users SET company_name = $1 WHERE id = $2`,
        [value.orgName || 'VanniLoan', tenantId]
      );
    }
  }

  return getSetting(key);
};

export const changePassword = async (payload) => {
  const { currentPassword, newPassword } = payload;
  if (!currentPassword || !newPassword) throw badRequest('Current password and new password are required');
  if (String(newPassword).length < 6) throw badRequest('New password must be at least 6 characters');

  const userId = userContext.getStore();
  if (!userId) throw unauthorized('User not authenticated');

  const tenantId = tenantContext.getStore();
  let user;
  let isMasterUser = false;

  if (tenantId) {
    const { masterPool } = await import('./db/master.js');
    const { rows: masterRows } = await masterPool.query('SELECT * FROM master_users WHERE id = $1', [userId]);
    if (masterRows.length > 0) {
      user = masterRows[0];
      isMasterUser = true;
    } else {
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
      user = rows[0];
    }
  } else {
    const { masterPool } = await import('./db/master.js');
    const { rows } = await masterPool.query('SELECT * FROM master_users WHERE id = $1', [userId]);
    user = rows[0];
    isMasterUser = true;
  }

  if (!user) throw notFound('User not found');

  const passwordHash = isMasterUser ? user.password_hash : user.password;

  if (passwordHash !== currentPassword) {
    const match = await bcrypt.compare(currentPassword, passwordHash);
    if (!match) throw unauthorized('Current password is incorrect');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  if (isMasterUser) {
    const { masterPool } = await import('./db/master.js');
    await masterPool.query('UPDATE master_users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, userId]);
    if (tenantId) {
      await query('UPDATE users SET password = $1 WHERE lower(email) = $2', [hashedNewPassword, user.email.toLowerCase()]);
    }
  } else {
    const { masterPool } = await import('./db/master.js');
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
    await masterPool.query('UPDATE master_users SET password_hash = $1 WHERE lower(email) = $2', [hashedNewPassword, user.email.toLowerCase()]);
  }
  return { message: 'Password changed successfully' };
};

// Removed invalid import
import { rootPool, masterPool } from './db/master.js';
import { getTenantPool } from './db/tenant.js';

export const createTenant = async (payload) => {
  const { name, companyName, email, password, phone } = payload;
  if (!name || !companyName || !email || !password || !phone) throw badRequest('Missing required fields');

  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const dbName = `loan_tenant_${safeName}_${Date.now()}`;
  const dbUser = `user_${safeName}_${Date.now()}`;

  // Generate random password for the DB user (in a real app, use a strong generator)
  const dbPass = `pass_${randomUUID().replace(/-/g, '')}`;

  // 1. Create DB and User using Root Pool (Requires superuser privileges)
  const rootClient = await rootPool.connect();
  try {
    await rootClient.query(`CREATE DATABASE "${dbName}"`);
    await rootClient.query(`CREATE ROLE "${dbUser}" WITH LOGIN PASSWORD '${dbPass}'`);
    await rootClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`);
  } catch (e) {
    rootClient.release();
    throw badRequest(`Failed to provision database: ${e.message}`);
  } finally {
    rootClient.release();
  }

  // We need to connect to the new database as SUPERUSER to set schema permissions and extensions
  const newDbUrl = new URL(config.rootDbUrl);
  newDbUrl.pathname = `/${dbName}`;
  const newDbSuperClient = new pg.Client({ connectionString: newDbUrl.toString() });
  await newDbSuperClient.connect();

  try {
    await newDbSuperClient.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
    await newDbSuperClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  } finally {
    await newDbSuperClient.end();
  }

  // 2. Register Tenant in Master Database
  const masterClient = await masterPool.connect();
  let tenantId;
  try {
    const res = await masterClient.query(
      `INSERT INTO master_users (company_name, email, password_hash, db_name, db_user, db_password, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin') RETURNING id`,
      [companyName, email.trim().toLowerCase(), await bcrypt.hash(password, 10), dbName, dbUser, dbPass, phone]
    );
    tenantId = res.rows[0].id;
  } finally {
    masterClient.release();
  }

  // 3. Run Migrations and Seed Admin User on New Tenant Database
  const tenantPool = await getTenantPool(tenantId);
  const tClient = await tenantPool.connect();
  try {
    const { tenantSchemaSql } = await import('./schema.js');
    const statements = tenantSchemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.includes('CREATE EXTENSION')); // skip extension

    for (const stmt of statements) {
      await tClient.query(stmt);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await tClient.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
      [name || 'Admin User', email, hashedPassword, phone, 'admin']
    );

    // Seed settings for company name
    await tClient.query(
      `INSERT INTO settings ("key", value) VALUES ($1, $2)`,
      ['organization', JSON.stringify({ orgName: companyName })]
    );

  } finally {
    tClient.release();
  }

  sendWelcomeEmail(email.trim(), name || 'Admin User', password, 'Admin', companyName).catch(err => {
    console.error('Failed to send welcome email:', err);
  });

  return { tenantId, dbName, companyName };
};

// --- User Management (Super Admin only) ---

// tenantContext and userContext are imported at the top of this file

const getTenantIdFromContext = async () => {
  const schemaName = tenantContext.getStore();
  if (!schemaName) throw badRequest('Tenant context missing');
  // Need to query the public schema for tenants
  // Because query wrapper might prepend schema name if we are not careful
  // But wait, the query wrapper `const query = ...` does it use schema?
  // Let's just use the query since it should work across schemas or prefix with public
  const { rows } = await query('SELECT id FROM tenants WHERE schema_name = $1', [schemaName]);
  if (rows.length === 0) throw notFound('Tenant not found');
  return rows[0].id;
};

export const getTenantUsers = async () => {
  const tenantId = tenantContext.getStore();
  if (!tenantId) {
    // Super Admin: list all client organizations (Admins)
    const { masterPool } = await import('./db/master.js');
    const { rows } = await masterPool.query(
      'SELECT id, company_name, email, phone, status, created_at FROM master_users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );
    return rows.map(row => ({
      id: row.id,
      name: row.company_name,
      email: row.email,
      phone: row.phone,
      role: 'admin',
      isActive: row.status === 'active',
      createdAt: row.created_at,
    }));
  }

  const { rows } = await query(
    'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
};

export const getTenantStats = async (targetTenantId) => {
  const { masterPool } = await import('./db/master.js');
  const { getTenantPool } = await import('./db/tenant.js');

  const { rows: masterUsers } = await masterPool.query('SELECT sms_count FROM master_users WHERE id = $1', [targetTenantId]);
  const smsCount = masterUsers[0]?.sms_count || 0;

  try {
    const tenantPool = await getTenantPool(targetTenantId);
    const { rows: borrowers } = await tenantPool.query('SELECT COUNT(*) as count FROM borrowers WHERE is_deleted = FALSE');
    const { rows: loans } = await tenantPool.query('SELECT COUNT(*) as count FROM loans WHERE status = $1 OR status = $2', ['active', 'overdue']);
    const { rows: fds } = await tenantPool.query('SELECT COUNT(*) as count FROM fixed_deposits WHERE status = $1', ['active']);

    return {
      borrowers: parseInt(borrowers[0].count, 10),
      activeLoans: parseInt(loans[0].count, 10),
      activeFDs: parseInt(fds[0].count, 10),
      smsCount: smsCount
    };
  } catch (err) {
    return { borrowers: 0, activeLoans: 0, activeFDs: 0, smsCount };
  }
};

export const getTenantBorrowers = async (targetTenantId) => {
  const { getTenantPool } = await import('./db/tenant.js');
  try {
    const pool = await getTenantPool(targetTenantId);
    const { rows } = await pool.query('SELECT * FROM borrowers WHERE is_deleted = FALSE ORDER BY created_at DESC, id DESC');
    return rows.map(mapBorrower);
  } catch (e) { return []; }
};

export const getTenantLoans = async (targetTenantId) => {
  const { getTenantPool } = await import('./db/tenant.js');
  try {
    const pool = await getTenantPool(targetTenantId);
    const { rows } = await pool.query(`SELECT l.*, b.name AS borrower_name FROM loans l JOIN borrowers b ON b.id = l.borrower_id WHERE l.status IN ('active', 'overdue') ORDER BY l.created_at DESC, l.id DESC`);
    return rows.map(mapLoan);
  } catch (e) { return []; }
};

export const getTenantFixedDeposits = async (targetTenantId) => {
  const { getTenantPool } = await import('./db/tenant.js');
  try {
    const pool = await getTenantPool(targetTenantId);
    const { rows } = await pool.query(`SELECT fd.*, b.name AS borrower_name FROM fixed_deposits fd JOIN borrowers b ON b.id = fd.borrower_id WHERE fd.status = 'active' ORDER BY fd.created_at DESC, fd.id DESC`);
    return rows.map(mapFixedDeposit);
  } catch (e) { return []; }
};

export const createTenantUser = async (payload) => {
  const tenantId = tenantContext.getStore();
  const { name, email, password, role, phone } = payload;
  if (!name || !email || !password || !phone) throw badRequest('Missing required fields');

  if (!tenantId) {
    // Super Admin creating a new client organization (Admin)
    const result = await createTenant({
      name: name,
      companyName: name,
      email: email,
      password: password,
      phone: phone,
    });
    return { id: result.tenantId, name: name, email: email, phone: phone, role: 'admin' };
  }

  // Organization admin creating staff within their own org
  const userRole = 'admin';

  const { rows } = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email.trim()]);
  if (rows.length > 0) throw conflict('A user with this email already exists in this organization');

  const hashedPassword = await bcrypt.hash(password, 10);

  const res = await query(
    'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name.trim(), email.trim(), hashedPassword, phone.trim(), userRole]
  );

  const userId = res.rows[0].id;
  const companyName = await getSetting('organization').then(s => s?.orgName).catch(() => 'VanniLoan');

  sendWelcomeEmail(email.trim(), name.trim(), password, 'Admin', companyName).catch(err => {
    console.error('Failed to send welcome email:', err);
  });

  return { id: userId, name, email, phone, role: userRole };
};

export const updateTenantUser = async (userId, payload) => {
  const tenantId = tenantContext.getStore();
  const { name, email, phone, password } = payload;

  if (!tenantId) {
    // Super Admin updating a client organization (Admin)
    const { masterPool } = await import('./db/master.js');
    const sets = [];
    const values = [];
    if (name) { values.push(name); sets.push(`company_name = $${values.length}`); }
    if (email) { values.push(email); sets.push(`email = $${values.length}`); }
    if (phone) { values.push(phone); sets.push(`phone = $${values.length}`); }
    if (password) {
      values.push(await bcrypt.hash(password, 10));
      sets.push(`password_hash = $${values.length}`);
    }

    if (sets.length === 0) return { message: 'No changes provided' };

    values.push(userId);
    await masterPool.query(`UPDATE master_users SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
    return { id: userId, name, email, phone };
  }

  // Organization admin updating staff within their own org
  const sets = [];
  const values = [];
  if (name) { values.push(name); sets.push(`name = $${values.length}`); }
  if (email) { values.push(email); sets.push(`email = $${values.length}`); }
  if (phone) { values.push(phone); sets.push(`phone = $${values.length}`); }
  if (password) {
    values.push(await bcrypt.hash(password, 10));
    sets.push(`password = $${values.length}`);
  }

  if (sets.length === 0) return { message: 'No changes provided' };

  values.push(userId);
  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
  return { id: userId, name, email, phone };
};

export const deleteTenantUser = async (userId) => {
  const tenantId = tenantContext.getStore();

  if (!tenantId) {
    // Super Admin suspending/deleting a client organization
    const { masterPool } = await import('./db/master.js');
    const { rows } = await masterPool.query('SELECT id, company_name, status FROM master_users WHERE id = $1 AND role = $2', [userId, 'admin']);
    if (rows.length === 0) throw notFound('Organization not found');

    // Toggle status: active -> suspended, suspended -> active
    if (rows[0].status === 'active') {
      await masterPool.query('UPDATE master_users SET status = $1 WHERE id = $2', ['suspended', userId]);
      return { message: `Organization "${rows[0].company_name}" has been suspended` };
    } else {
      await masterPool.query('UPDATE master_users SET status = $1 WHERE id = $2', ['active', userId]);
      return { message: `Organization "${rows[0].company_name}" has been reactivated` };
    }
  }

  const { rows } = await query('SELECT role FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) throw notFound('User not found');

  if (rows[0].role === 'superadmin') throw badRequest('Cannot delete the primary owner account');

  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { message: 'User deleted successfully' };
};

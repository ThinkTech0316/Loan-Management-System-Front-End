import { randomUUID } from 'node:crypto';
import { sendSMS } from './sms.js';
import { sendWelcomeEmail } from './email.js';
import bcrypt from 'bcryptjs';
import { query, transaction } from './database.js';
import { badRequest, conflict, notFound, unauthorized } from './errors.js';
import {
  validateBorrowerPayload,
  validateFixedDepositPayload,
  validateLoanPayload,
  validateRepaymentPayload,
} from './validators.js';

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

  const { rows } = await query('SELECT * FROM global_users WHERE lower(email) = $1 AND is_active = TRUE', [email]);
  const user = rows[0];
  if (!user) throw unauthorized('Invalid email or password');

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw unauthorized('Invalid email or password');

  const { rows: tenantRows } = await query('SELECT * FROM tenants WHERE id = $1', [user.tenant_id]);
  const tenant = tenantRows[0];
  if (!tenant) throw unauthorized('Tenant not found');

  return {
    token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64url'),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenant.schema_name, // Send schema_name as tenantId for X-Tenant-Id header
      companyName: tenant.company_name,
      logoUrl: tenant.logo_url,
    },
  };
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
  ).catch(() => {});

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
  ).catch(() => {});

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
  const { rows } = await query('SELECT value FROM settings WHERE "key" = $1', [key]);
  if (rows.length === 0) throw notFound('Setting not found');
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
    const tenantSchema = tenantContext.getStore();
    if (tenantSchema) {
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE tenants SET company_name = $1, logo_url = $2 WHERE schema_name = $3`,
          [value.orgName || 'VanniLoan', value.logoUrl || null, tenantSchema]
        );
      } finally {
        client.release();
      }
    }
  }

  return getSetting(key);
};

export const changePassword = async (payload) => {
  const { currentPassword, newPassword } = payload;
  if (!currentPassword || !newPassword) throw badRequest('Current password and new password are required');
  if (String(newPassword).length < 6) throw badRequest('New password must be at least 6 characters');

  // Need a way to identify current user, defaulting to first active user in global_users for demo
  const { rows } = await query('SELECT * FROM global_users WHERE is_active = TRUE LIMIT 1');
  const user = rows[0];
  if (!user) throw notFound('No active user found');
  if (user.password !== currentPassword) {
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw unauthorized('Current password is incorrect');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await query('UPDATE global_users SET password = $1 WHERE id = $2', [hashedNewPassword, user.id]);
  return { message: 'Password changed successfully' };
};

import { getTenantSchemaSql } from './schema.js';

export const createTenant = async (payload) => {
  const { name, companyName, email, password } = payload;
  if (!name || !companyName || !email || !password) throw badRequest('Missing required fields');

  const schemaName = `tenant_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const tenantId = `T${Date.now()}`;
  const userId = `U${Date.now()}`;

  await transaction(async (client) => {
    await client.query(
      'INSERT INTO tenants (id, name, company_name, schema_name) VALUES ($1, $2, $3, $4)',
      [tenantId, name, companyName, schemaName]
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      'INSERT INTO global_users (id, tenant_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, tenantId, 'Admin User', email, hashedPassword, 'superadmin']
    );

    const statements = getTenantSchemaSql(schemaName)
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await client.query(stmt);
    }
  });

  return { tenantId, schemaName, companyName };
};

// --- User Management (Super Admin only) ---

import { tenantContext } from './database.js';

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
  const tenantId = await getTenantIdFromContext();
  const { rows } = await query(
    'SELECT id, name, email, role, is_active, created_at FROM global_users WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
};

export const createTenantUser = async (payload) => {
  const tenantId = await getTenantIdFromContext();
  const { name, email, password, role } = payload;
  if (!name || !email || !password) throw badRequest('Missing required fields');
  
  // Enforce role to be strictly 'admin' since SuperAdmins cannot be created via UI
  const userRole = 'admin';

  // Check email exists
  const { rows } = await query('SELECT id FROM global_users WHERE lower(email) = lower($1)', [email.trim()]);
  if (rows.length > 0) throw conflict('A user with this email already exists');

  const userId = `U${Date.now()}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  await query(
    'INSERT INTO global_users (id, tenant_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, tenantId, name.trim(), email.trim(), hashedPassword, userRole]
  );

  // Fetch company name for the email
  const { rows: tenantRows } = await query('SELECT company_name FROM tenants WHERE id = $1', [tenantId]);
  const companyName = tenantRows[0]?.company_name || 'VanniLoan';

  // Send the welcome email with credentials
  sendWelcomeEmail(email.trim(), name.trim(), password, 'Admin', companyName).catch(err => {
    console.error('Failed to send welcome email (async):', err);
  });

  return { id: userId, name, email, role: userRole };
};

export const deleteTenantUser = async (userId) => {
  const tenantId = await getTenantIdFromContext();
  // Ensure the user doesn't delete themselves (this check is typically in the route, but good here too)
  const { rows } = await query('SELECT role FROM global_users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
  if (rows.length === 0) throw notFound('User not found');
  
  await query('DELETE FROM global_users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
  return { message: 'User deleted successfully' };
};
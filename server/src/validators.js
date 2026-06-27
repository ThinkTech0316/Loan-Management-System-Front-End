import { badRequest } from './errors.js';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isValidDateString = (value) => isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

export const validateBorrowerPayload = (payload, partial = false) => {
  const errors = {};
  const allowedStatuses = ['active', 'inactive'];

  if (!partial || payload.name !== undefined) {
    if (!isNonEmptyString(payload.name)) errors.name = 'Name is required';
  }
  if (!partial || payload.email !== undefined) {
    if (!isNonEmptyString(payload.email) || !/\S+@\S+\.\S+/.test(payload.email)) errors.email = 'Valid email is required';
  }
  if (!partial || payload.phone !== undefined) {
    if (!isNonEmptyString(payload.phone) || payload.phone.trim().length < 10) errors.phone = 'Valid phone number is required';
  }
  if (!partial || payload.address !== undefined) {
    if (!isNonEmptyString(payload.address)) errors.address = 'Address is required';
  }
  if (!partial || payload.district !== undefined) {
    if (!isNonEmptyString(payload.district)) errors.district = 'District / area is required';
  }
  if (!partial || payload.nic !== undefined) {
    if (!isNonEmptyString(payload.nic)) errors.nic = 'NIC number is required';
  }
  if (payload.status !== undefined && !allowedStatuses.includes(payload.status)) {
    errors.status = 'Status must be active or inactive';
  }
  if (payload.isDeleted !== undefined && typeof payload.isDeleted !== 'boolean') {
    errors.isDeleted = 'isDeleted must be a boolean';
  }

  if (Object.keys(errors).length > 0) throw badRequest('Borrower validation failed', errors);
};

export const validateLoanPayload = (payload, partial = false) => {
  const errors = {};
  const allowedStatuses = ['pending', 'active', 'completed', 'overdue'];
  const allowedFrequencies = ['weekly', 'monthly'];

  if (!partial || payload.borrowerId !== undefined) {
    if (!isNonEmptyString(payload.borrowerId)) errors.borrowerId = 'Borrower ID is required';
  }
  if (!partial || payload.amount !== undefined) {
    if (!isPositiveNumber(payload.amount)) errors.amount = 'Amount must be a positive number';
  }
  if (!partial || payload.interestRate !== undefined) {
    if (typeof payload.interestRate !== 'number' || payload.interestRate < 0) errors.interestRate = 'Interest rate must be a non-negative number';
  }
  if (!partial || payload.durationMonths !== undefined) {
    if (!Number.isInteger(payload.durationMonths) || payload.durationMonths <= 0) errors.durationMonths = 'Duration must be a positive integer';
  }
  if (!partial || payload.startDate !== undefined) {
    if (!isValidDateString(payload.startDate)) errors.startDate = 'Valid start date is required';
  }
  if (!partial || payload.repaymentFrequency !== undefined) {
    if (!allowedFrequencies.includes(payload.repaymentFrequency)) errors.repaymentFrequency = 'Repayment frequency must be weekly or monthly';
  }
  if (payload.status !== undefined && !allowedStatuses.includes(payload.status)) {
    errors.status = 'Invalid loan status';
  }
  if (payload.remainingBalance !== undefined && (typeof payload.remainingBalance !== 'number' || payload.remainingBalance < 0)) {
    errors.remainingBalance = 'Remaining balance must be a non-negative number';
  }

  if (Object.keys(errors).length > 0) throw badRequest('Loan validation failed', errors);
};

export const validateRepaymentPayload = (payload) => {
  const errors = {};
  const allowedMethods = ['cash', 'bank_transfer', 'mobile_wallet'];

  if (!isNonEmptyString(payload.loanId)) errors.loanId = 'Loan ID is required';
  if (!isPositiveNumber(payload.amount)) errors.amount = 'Amount must be a positive number';
  if (!isValidDateString(payload.date)) errors.date = 'Valid repayment date is required';
  if (!allowedMethods.includes(payload.method)) errors.method = 'Method must be cash, bank_transfer, or mobile_wallet';
  if (payload.reference !== undefined && typeof payload.reference !== 'string') errors.reference = 'Reference must be a string';

  if (Object.keys(errors).length > 0) throw badRequest('Repayment validation failed', errors);
};

export const validateFixedDepositPayload = (payload, partial = false) => {
  const errors = {};
  const allowedStatuses = ['active', 'matured', 'withdrawn'];

  if (!partial || payload.borrowerId !== undefined) {
    if (!isNonEmptyString(payload.borrowerId)) errors.borrowerId = 'Borrower ID is required';
  }
  if (!partial || payload.principalAmount !== undefined) {
    if (!isPositiveNumber(payload.principalAmount)) errors.principalAmount = 'Principal amount must be a positive number';
  }
  if (!partial || payload.interestRate !== undefined) {
    if (typeof payload.interestRate !== 'number' || payload.interestRate < 0) errors.interestRate = 'Interest rate must be a non-negative number';
  }
  if (!partial || payload.durationMonths !== undefined) {
    if (!Number.isInteger(payload.durationMonths) || payload.durationMonths <= 0) errors.durationMonths = 'Duration must be a positive integer';
  }
  if (!partial || payload.startDate !== undefined) {
    if (!isValidDateString(payload.startDate)) errors.startDate = 'Valid start date is required';
  }
  if (!partial || payload.maturityDate !== undefined) {
    if (!isValidDateString(payload.maturityDate)) errors.maturityDate = 'Valid maturity date is required';
  }
  if (payload.maturityAmount !== undefined && (typeof payload.maturityAmount !== 'number' || payload.maturityAmount < 0)) {
    errors.maturityAmount = 'Maturity amount must be a non-negative number';
  }
  if (payload.status !== undefined && !allowedStatuses.includes(payload.status)) {
    errors.status = 'Invalid fixed deposit status';
  }

  if (Object.keys(errors).length > 0) throw badRequest('Fixed deposit validation failed', errors);
};
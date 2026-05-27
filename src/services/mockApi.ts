import type { Borrower, Loan, Repayment, DashboardStats, CollectionData } from '../types';

export interface Installment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'paid' | 'pending' | 'overdue';
}

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const initialStats: DashboardStats = {
  totalActiveLoans: 2,
  totalOutstanding: 117000,
  totalCollected: 9700,
  overdueCount: 0,
  monthlyGrowth: 15.4,
};

export const initialCollectionData: CollectionData[] = [
  { month: 'Jan', expected: 40000, actual: 38000 },
  { month: 'Feb', expected: 42000, actual: 41000 },
  { month: 'Mar', expected: 45000, actual: 44500 },
  { month: 'Apr', expected: 48000, actual: 46000 },
  { month: 'May', expected: 50000, actual: 49000 },
  { month: 'Jun', expected: 55000, actual: 53000 },
];

export const initialBorrowers: Borrower[] = [
  {
    id: '1',
    name: 'Anjali Kumar',
    email: 'anjali@example.com',
    phone: '+91 98765 43210',
    address: 'Chennai, Tamil Nadu',
    status: 'active',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    name: 'Rajesh Raman',
    email: 'rajesh@example.com',
    phone: '+91 98765 43211',
    address: 'Coimbatore, Tamil Nadu',
    status: 'active',
    createdAt: '2023-11-20',
  },
  {
    id: '3',
    name: 'Priya Mani',
    email: 'priya@example.com',
    phone: '+91 98765 43212',
    address: 'Madurai, Tamil Nadu',
    status: 'inactive',
    createdAt: '2023-09-05',
  },
];

export const initialLoans: Loan[] = [
  {
    id: 'L1001',
    borrowerId: '1',
    borrowerName: 'Anjali Kumar',
    amount: 50000,
    interestRate: 12,
    durationMonths: 12,
    startDate: '2024-01-10',
    status: 'active',
    repaymentFrequency: 'monthly',
    remainingBalance: 35000,
  },
  {
    id: 'L1002',
    borrowerId: '2',
    borrowerName: 'Rajesh Raman',
    amount: 100000,
    interestRate: 10,
    durationMonths: 24,
    startDate: '2023-12-01',
    status: 'active',
    repaymentFrequency: 'monthly',
    remainingBalance: 82000,
  },
];

export const initialRepayments: Repayment[] = [
  {
    id: 'R2001',
    loanId: 'L1001',
    amount: 4500,
    date: '2024-05-10',
    status: 'paid',
    method: 'upi',
  },
  {
    id: 'R2002',
    loanId: 'L1002',
    amount: 5200,
    date: '2024-05-01',
    status: 'paid',
    method: 'bank_transfer',
  },
];

export const getStats = (): DashboardStats => {
  const loans = getLocalStorage<Loan[]>('vl_loans', initialLoans);
  const repayments = getLocalStorage<Repayment[]>('vl_repayments', initialRepayments);
  
  const totalActiveLoans = loans.filter(l => l.status === 'active').length;
  const totalOutstanding = loans.reduce((sum, l) => l.status !== 'completed' ? sum + l.remainingBalance : sum, 0);
  const totalCollected = repayments.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = loans.filter(l => l.status === 'overdue').length;
  
  return {
    totalActiveLoans,
    totalOutstanding,
    totalCollected,
    overdueCount,
    monthlyGrowth: 15.4,
  };
};

export const apiService = {
  getStats: () => Promise.resolve(getStats()),
  getCollectionData: () => Promise.resolve(getLocalStorage<CollectionData[]>('vl_collectionData', initialCollectionData)),
  getBorrowers: () => Promise.resolve(getLocalStorage<Borrower[]>('vl_borrowers', initialBorrowers)),
  getLoans: () => Promise.resolve(getLocalStorage<Loan[]>('vl_loans', initialLoans)),
  getRepayments: () => Promise.resolve(getLocalStorage<Repayment[]>('vl_repayments', initialRepayments)),
  
  addBorrower: (borrower: Omit<Borrower, 'id' | 'createdAt' | 'status'>) => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers', initialBorrowers);
    const newBorrower: Borrower = {
      ...borrower,
      id: String(borrowers.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    borrowers.unshift(newBorrower);
    setLocalStorage('vl_borrowers', borrowers);
    return Promise.resolve(newBorrower);
  },
  
  createLoan: (loanData: Omit<Loan, 'id' | 'remainingBalance' | 'status' | 'borrowerName'>) => {
    const loans = getLocalStorage<Loan[]>('vl_loans', initialLoans);
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers', initialBorrowers);
    
    const borrower = borrowers.find(b => b.id === loanData.borrowerId);
    const borrowerName = borrower ? borrower.name : 'Unknown Borrower';
    
    const newId = `L${1000 + loans.length + 1}`;
    const newLoan: Loan = {
      ...loanData,
      borrowerName,
      id: newId,
      remainingBalance: loanData.amount,
      status: 'active'
    };
    loans.unshift(newLoan);
    setLocalStorage('vl_loans', loans);
    
    // Trigger side effect for stats
    getStats();
    
    return Promise.resolve(newLoan);
  },
  
  recordRepayment: (repaymentData: Omit<Repayment, 'id' | 'status'>) => {
    const repayments = getLocalStorage<Repayment[]>('vl_repayments', initialRepayments);
    const loans = getLocalStorage<Loan[]>('vl_loans', initialLoans);
    
    const newId = `R${2000 + repayments.length + 1}`;
    const newRepayment: Repayment = {
      ...repaymentData,
      id: newId,
      status: 'paid'
    };
    
    // Deduct remaining balance from loan
    const loanIndex = loans.findIndex(l => l.id === repaymentData.loanId);
    if (loanIndex !== -1) {
      const loan = loans[loanIndex];
      loan.remainingBalance = Math.max(0, loan.remainingBalance - repaymentData.amount);
      if (loan.remainingBalance === 0) {
        loan.status = 'completed';
      }
      loans[loanIndex] = loan;
      setLocalStorage('vl_loans', loans);
    }
    
    repayments.unshift(newRepayment);
    setLocalStorage('vl_repayments', repayments);
    
    // Update chart
    const collectionData = getLocalStorage<CollectionData[]>('vl_collectionData', initialCollectionData);
    const date = new Date(repaymentData.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    
    const monthIndex = collectionData.findIndex(c => c.month === monthName);
    if (monthIndex !== -1) {
      collectionData[monthIndex].actual += repaymentData.amount;
    } else {
      collectionData.push({
        month: monthName,
        expected: Math.round(repaymentData.amount * 1.05),
        actual: repaymentData.amount
      });
    }
    setLocalStorage('vl_collectionData', collectionData);
    
    return Promise.resolve(newRepayment);
  },
  
  getRepaymentSchedule: (loanId: string): Promise<Installment[]> => {
    const loans = getLocalStorage<Loan[]>('vl_loans', initialLoans);
    const repayments = getLocalStorage<Repayment[]>('vl_repayments', initialRepayments);
    
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return Promise.resolve([]);
    
    const duration = loan.durationMonths;
    const rate = loan.interestRate / 12 / 100;
    
    // Calculate monthly EMI
    let emi = 0;
    if (rate === 0) {
      emi = loan.amount / duration;
    } else {
      emi = (loan.amount * rate * Math.pow(1 + rate, duration)) / (Math.pow(1 + rate, duration) - 1);
    }
    
    const totalPaid = repayments
      .filter(r => r.loanId === loanId && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const schedule: Installment[] = [];
    const startDate = new Date(loan.startDate);
    let remainingPrincipal = loan.amount;
    
    for (let i = 1; i <= duration; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);
      
      const interest = remainingPrincipal * rate;
      const principal = emi - interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - principal);
      
      let status: 'paid' | 'pending' | 'overdue' = 'pending';
      const expectedPaidUpToHere = emi * i;
      
      if (totalPaid >= expectedPaidUpToHere - 10) {
        status = 'paid';
      } else if (dueDate.getTime() < Date.now()) {
        status = 'overdue';
      }
      
      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: Math.round(emi),
        principal: Math.round(principal),
        interest: Math.round(interest),
        status
      });
    }
    
    return Promise.resolve(schedule);
  }
};

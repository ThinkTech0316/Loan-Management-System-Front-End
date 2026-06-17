import type { Borrower, Loan, Repayment, DashboardStats, CollectionData, FixedDeposit, FDEarning } from '../types';

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
  totalActiveFDs: 2,
  totalDeposits: 1500000,
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
    phone: '+94 77 123 4567',
    nic: '199012345678',
    district: 'Yogapuram',
    address: 'Main Road, Yogapuram',
    status: 'active',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    name: 'Rajesh Raman',
    email: 'rajesh@example.com',
    phone: '+94 71 987 6543',
    nic: '881234567V',
    district: 'Anichchayankullam',
    address: 'Temple Road, Anichchayankullam',
    status: 'active',
    createdAt: '2023-11-20',
  },
  {
    id: '3',
    name: 'Priya Mani',
    email: 'priya@example.com',
    phone: '+94 76 555 4321',
    nic: '951234567V',
    district: 'Vadakaadu',
    address: 'School Lane, Vadakaadu',
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
    method: 'mobile_wallet',
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

export const initialFixedDeposits: FixedDeposit[] = [
  {
    id: 'FD3001',
    borrowerId: '1',
    borrowerName: 'Anjali Kumar',
    principalAmount: 500000,
    interestRate: 8.5,
    durationMonths: 12,
    startDate: '2024-01-15',
    maturityDate: '2025-01-15',
    maturityAmount: 542500,
    status: 'active',
  },
  {
    id: 'FD3002',
    borrowerId: '2',
    borrowerName: 'Rajesh Raman',
    principalAmount: 1000000,
    interestRate: 9.0,
    durationMonths: 24,
    startDate: '2023-06-01',
    maturityDate: '2025-06-01',
    maturityAmount: 1180000,
    status: 'active',
  }
];

export const getStats = (): DashboardStats => {
  const loans = getLocalStorage<Loan[]>('vl_loans_v2', initialLoans);
  const repayments = getLocalStorage<Repayment[]>('vl_repayments_v2', initialRepayments);
  const fds = getLocalStorage<FixedDeposit[]>('vl_fixed_deposits_v2', initialFixedDeposits);
  
  const totalActiveLoans = loans.filter(l => l.status === 'active').length;
  const totalOutstanding = loans.reduce((sum, l) => l.status !== 'completed' ? sum + l.remainingBalance : sum, 0);
  const totalCollected = repayments.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = loans.filter(l => l.status === 'overdue').length;

  const totalActiveFDs = fds.filter(fd => fd.status === 'active').length;
  const totalDeposits = fds.reduce((sum, fd) => sum + fd.principalAmount, 0);
  
  return {
    totalActiveLoans,
    totalOutstanding,
    totalCollected,
    overdueCount,
    monthlyGrowth: 15.4,
    totalActiveFDs,
    totalDeposits,
  };
};

export const apiService = {
  getStats: () => Promise.resolve(getStats()),
  getCollectionData: () => Promise.resolve(getLocalStorage<CollectionData[]>('vl_collectionData_v2', initialCollectionData)),
  getBorrowers: () => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    return Promise.resolve(borrowers.filter(b => !b.isDeleted));
  },
  getDeletedBorrowers: () => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    return Promise.resolve(borrowers.filter(b => b.isDeleted));
  },
  deleteBorrower: (id: string) => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    const index = borrowers.findIndex(b => b.id === id);
    if (index !== -1) {
      borrowers[index].isDeleted = true;
      setLocalStorage('vl_borrowers_v2', borrowers);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },
  restoreBorrower: (id: string) => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    const index = borrowers.findIndex(b => b.id === id);
    if (index !== -1) {
      borrowers[index].isDeleted = false;
      setLocalStorage('vl_borrowers_v2', borrowers);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },
  permanentlyDeleteBorrower: (id: string) => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    const filtered = borrowers.filter(b => b.id !== id);
    setLocalStorage('vl_borrowers_v2', filtered);
    return Promise.resolve(true);
  },
  getLoans: () => Promise.resolve(getLocalStorage<Loan[]>('vl_loans_v2', initialLoans)),
  getRepayments: () => Promise.resolve(getLocalStorage<Repayment[]>('vl_repayments_v2', initialRepayments)),
  getFixedDeposits: () => Promise.resolve(getLocalStorage<FixedDeposit[]>('vl_fixed_deposits_v2', initialFixedDeposits)),
  
  addBorrower: (borrower: Omit<Borrower, 'id' | 'createdAt' | 'status'>) => {
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    const newBorrower: Borrower = {
      ...borrower,
      id: String(borrowers.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    borrowers.unshift(newBorrower);
    setLocalStorage('vl_borrowers_v2', borrowers);
    return Promise.resolve(newBorrower);
  },
  
  createLoan: (loanData: Omit<Loan, 'id' | 'remainingBalance' | 'status' | 'borrowerName'>) => {
    const loans = getLocalStorage<Loan[]>('vl_loans_v2', initialLoans);
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    
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
    setLocalStorage('vl_loans_v2', loans);
    
    // Trigger side effect for stats
    getStats();
    
    return Promise.resolve(newLoan);
  },
  
  createFixedDeposit: (fdData: Omit<FixedDeposit, 'id' | 'maturityAmount' | 'status' | 'borrowerName'>) => {
    const fds = getLocalStorage<FixedDeposit[]>('vl_fixed_deposits_v2', initialFixedDeposits);
    const borrowers = getLocalStorage<Borrower[]>('vl_borrowers_v2', initialBorrowers);
    
    const borrower = borrowers.find(b => b.id === fdData.borrowerId);
    const borrowerName = borrower ? borrower.name : 'Unknown Borrower';
    
    const newId = `FD${3000 + fds.length + 1}`;
    
    // Calculate simple interest maturity amount
    const maturityAmount = fdData.principalAmount + (fdData.principalAmount * (fdData.interestRate / 100) * (fdData.durationMonths / 12));
    
    const newFD: FixedDeposit = {
      ...fdData,
      borrowerName,
      id: newId,
      maturityAmount: Math.round(maturityAmount),
      status: 'active'
    };
    fds.unshift(newFD);
    setLocalStorage('vl_fixed_deposits_v2', fds);
    
    return Promise.resolve(newFD);
  },
  
  recordRepayment: (repaymentData: Omit<Repayment, 'id' | 'status'>) => {
    const repayments = getLocalStorage<Repayment[]>('vl_repayments_v2', initialRepayments);
    const loans = getLocalStorage<Loan[]>('vl_loans_v2', initialLoans);
    
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
      setLocalStorage('vl_loans_v2', loans);
    }
    
    repayments.unshift(newRepayment);
    setLocalStorage('vl_repayments_v2', repayments);
    
    // Update chart
    const collectionData = getLocalStorage<CollectionData[]>('vl_collectionData_v2', initialCollectionData);
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
    setLocalStorage('vl_collectionData_v2', collectionData);
    
    return Promise.resolve(newRepayment);
  },
  
  deleteRepayment: (repaymentId: string) => {
    const repayments = getLocalStorage<Repayment[]>('vl_repayments_v2', initialRepayments);
    const loans = getLocalStorage<Loan[]>('vl_loans_v2', initialLoans);
    
    const repaymentIndex = repayments.findIndex(r => r.id === repaymentId);
    if (repaymentIndex === -1) return Promise.resolve(false);
    
    const repayment = repayments[repaymentIndex];
    
    // Add remaining balance back to loan
    const loanIndex = loans.findIndex(l => l.id === repayment.loanId);
    if (loanIndex !== -1) {
      const loan = loans[loanIndex];
      loan.remainingBalance += repayment.amount;
      if (loan.status === 'completed' && loan.remainingBalance > 0) {
        loan.status = 'active'; // Or overdue if applicable
      }
      loans[loanIndex] = loan;
      setLocalStorage('vl_loans_v2', loans);
    }
    
    // Remove from array
    repayments.splice(repaymentIndex, 1);
    setLocalStorage('vl_repayments_v2', repayments);
    
    // Optional: Reverse chart stats
    const collectionData = getLocalStorage<CollectionData[]>('vl_collectionData_v2', initialCollectionData);
    const date = new Date(repayment.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    
    const monthIndex = collectionData.findIndex(c => c.month === monthName);
    if (monthIndex !== -1) {
      collectionData[monthIndex].actual -= repayment.amount;
      setLocalStorage('vl_collectionData_v2', collectionData);
    }
    
    // Trigger global update if needed, or simply let component re-fetch
    return Promise.resolve(true);
  },
  
  getRepaymentSchedule: (loanId: string): Promise<Installment[]> => {
    const loans = getLocalStorage<Loan[]>('vl_loans_v2', initialLoans);
    const repayments = getLocalStorage<Repayment[]>('vl_repayments_v2', initialRepayments);
    
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
  },

  getFDEarningsSchedule: (fdId: string): Promise<FDEarning[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fds = getLocalStorage<FixedDeposit[]>('vl_fixed_deposits_v2', initialFixedDeposits);
        const fd = fds.find(f => f.id === fdId);
        
        if (!fd) {
          resolve([]);
          return;
        }

        const schedule: FDEarning[] = [];
        const monthlyInterestRate = fd.interestRate / 100 / 12;
        let accruedInterest = 0;
        let currentDate = new Date(fd.startDate);

        for (let i = 1; i <= fd.durationMonths; i++) {
          const monthlyInterest = fd.principalAmount * monthlyInterestRate;
          accruedInterest += monthlyInterest;
          currentDate.setMonth(currentDate.getMonth() + 1);

          schedule.push({
            month: i,
            date: currentDate.toISOString().split('T')[0],
            accruedInterest: Math.round(accruedInterest),
            totalValue: Math.round(fd.principalAmount + accruedInterest)
          });
        }

        resolve(schedule);
      }, 400);
    });
  }
};


export interface Borrower {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  nic: string;
  status: 'active' | 'inactive';
  createdAt: string;
  avatar?: string;
  isDeleted?: boolean;
}

export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  status: 'pending' | 'active' | 'completed' | 'overdue';
  repaymentFrequency: 'weekly' | 'monthly';
  remainingBalance: number;
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
  method: 'cash' | 'bank_transfer' | 'mobile_wallet';
  reference?: string;
}

export interface FixedDeposit {
  id: string;
  borrowerId: string;
  borrowerName: string;
  principalAmount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  status: 'active' | 'matured' | 'withdrawn';
}

export interface DashboardStats {
  totalActiveLoans: number;
  totalOutstanding: number;
  totalCollected: number;
  overdueCount: number;
  monthlyGrowth: number;
  totalActiveFDs: number;
  totalDeposits: number;
}

export interface CollectionData {
  month: string;
  expected: number;
  actual: number;
}

export interface FDEarning {
  month: number;
  date: string;
  accruedInterest: number;
  totalValue: number;
}

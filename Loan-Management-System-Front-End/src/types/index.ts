
export interface Borrower {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
  avatar?: string;
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
  method: 'cash' | 'bank_transfer' | 'upi';
}

export interface DashboardStats {
  totalActiveLoans: number;
  totalOutstanding: number;
  totalCollected: number;
  overdueCount: number;
  monthlyGrowth: number;
}

export interface CollectionData {
  month: string;
  expected: number;
  actual: number;
}

import type { Borrower, Loan, Repayment, DashboardStats, CollectionData, FixedDeposit, FDEarning } from '../types';

export interface Installment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'paid' | 'pending' | 'overdue';
}

const API_BASE = '/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
  }
  const json = await response.json();
  return json.data as T;
};

export const apiService = {
  // Upload
  uploadImage: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => handleResponse<{ url: string }>(res));
  },

  // Auth
  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => handleResponse<{ token: string; user: { id: string; name: string; email: string; role: string } }>(res)),

  forgotPassword: (email: string) =>
    fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(res => handleResponse<{ email: string; token: string; message: string }>(res)),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(res => handleResponse<{ message: string }>(res)),

  // Stats
  getStats: () =>
    fetch(`${API_BASE}/stats`).then(res => handleResponse<DashboardStats>(res)),

  // Collection Data
  getCollectionData: () =>
    fetch(`${API_BASE}/collection-data`).then(res => handleResponse<CollectionData[]>(res)),

  // Borrowers
  getBorrowers: () =>
    fetch(`${API_BASE}/borrowers`).then(res => handleResponse<Borrower[]>(res)),

  getDeletedBorrowers: () =>
    fetch(`${API_BASE}/borrowers/deleted`).then(res => handleResponse<Borrower[]>(res)),

  getBorrower: (id: string) =>
    fetch(`${API_BASE}/borrowers/${id}`).then(res => handleResponse<Borrower>(res)),

  addBorrower: (borrower: Omit<Borrower, 'id' | 'createdAt' | 'status'>) =>
    fetch(`${API_BASE}/borrowers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrower),
    }).then(res => handleResponse<Borrower>(res)),

  updateBorrower: (id: string, data: Partial<Borrower>) =>
    fetch(`${API_BASE}/borrowers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<Borrower>(res)),

  deleteBorrower: (id: string) =>
    fetch(`${API_BASE}/borrowers/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  restoreBorrower: (id: string) =>
    fetch(`${API_BASE}/borrowers/${id}/restore`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  permanentlyDeleteBorrower: (id: string) =>
    fetch(`${API_BASE}/borrowers/${id}/permanent`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Loans
  getLoans: (status?: string) => {
    const url = status ? `${API_BASE}/loans?status=${status}` : `${API_BASE}/loans`;
    return fetch(url).then(res => handleResponse<Loan[]>(res));
  },

  getLoan: (id: string) =>
    fetch(`${API_BASE}/loans/${id}`).then(res => handleResponse<Loan>(res)),

  createLoan: (loanData: Omit<Loan, 'id' | 'remainingBalance' | 'status' | 'borrowerName'>) =>
    fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loanData),
    }).then(res => handleResponse<Loan>(res)),

  updateLoan: (id: string, data: Partial<Loan>) =>
    fetch(`${API_BASE}/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<Loan>(res)),

  getRepaymentSchedule: (loanId: string) =>
    fetch(`${API_BASE}/loans/${loanId}/schedule`).then(res => handleResponse<Installment[]>(res)),

  // Repayments
  getRepayments: (loanId?: string) => {
    const url = loanId ? `${API_BASE}/repayments?loanId=${loanId}` : `${API_BASE}/repayments`;
    return fetch(url).then(res => handleResponse<Repayment[]>(res));
  },

  getRepayment: (id: string) =>
    fetch(`${API_BASE}/repayments/${id}`).then(res => handleResponse<Repayment>(res)),

  recordRepayment: (repaymentData: Omit<Repayment, 'id' | 'status'>) =>
    fetch(`${API_BASE}/repayments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repaymentData),
    }).then(res => handleResponse<Repayment>(res)),

  deleteRepayment: (id: string) =>
    fetch(`${API_BASE}/repayments/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Fixed Deposits
  getFixedDeposits: (status?: string) => {
    const url = status ? `${API_BASE}/fixed-deposits?status=${status}` : `${API_BASE}/fixed-deposits`;
    return fetch(url).then(res => handleResponse<FixedDeposit[]>(res));
  },

  getFixedDeposit: (id: string) =>
    fetch(`${API_BASE}/fixed-deposits/${id}`).then(res => handleResponse<FixedDeposit>(res)),

  createFixedDeposit: (fdData: Omit<FixedDeposit, 'id' | 'maturityAmount' | 'status' | 'borrowerName'>) =>
    fetch(`${API_BASE}/fixed-deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fdData),
    }).then(res => handleResponse<FixedDeposit>(res)),

  updateFixedDeposit: (id: string, data: Partial<FixedDeposit>) =>
    fetch(`${API_BASE}/fixed-deposits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<FixedDeposit>(res)),

  getFDEarningsSchedule: (fdId: string) =>
    fetch(`${API_BASE}/fixed-deposits/${fdId}/earnings`).then(res => handleResponse<FDEarning[]>(res)),

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`).then(res => handleResponse<Notification[]>(res)),

  markNotificationRead: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  deleteNotification: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Settings
  getSettings: () =>
    fetch(`${API_BASE}/settings`).then(res => handleResponse<Record<string, unknown>>(res)),

  getSetting: (key: string) =>
    fetch(`${API_BASE}/settings/${key}`).then(res => handleResponse<unknown>(res)),

  updateSetting: (key: string, value: unknown) =>
    fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    }).then(res => handleResponse<unknown>(res)),
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}

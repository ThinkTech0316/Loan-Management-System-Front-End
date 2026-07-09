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

const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
  const tenantId = localStorage.getItem('tenant_id');
  const userStr = localStorage.getItem('user');
  const headers = new Headers(options.headers || {});
  if (tenantId) {
    headers.set('X-Tenant-Id', tenantId);
  }
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) headers.set('X-User-Id', user.id);
    } catch (e) {
      // Ignore parse error
    }
  }
  return fetch(url, { ...options, headers });
};

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
    return fetchWithTenant(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => handleResponse<{ url: string }>(res));
  },

  // Auth
  login: (email: string, password: string) =>
    fetchWithTenant(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => handleResponse<{ token: string; user: { id: string; name: string; email: string; role: string; tenantId?: string } }>(res)),

  forgotPassword: (email: string) =>
    fetchWithTenant(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(res => handleResponse<{ email: string; token: string; message: string }>(res)),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchWithTenant(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(res => handleResponse<{ message: string }>(res)),

  // Stats
  getStats: () =>
    fetchWithTenant(`${API_BASE}/stats`).then(res => handleResponse<DashboardStats>(res)),

  // Collection Data
  getCollectionData: () =>
    fetchWithTenant(`${API_BASE}/collection-data`).then(res => handleResponse<CollectionData[]>(res)),

  // Borrowers
  getBorrowers: () =>
    fetchWithTenant(`${API_BASE}/borrowers`).then(res => handleResponse<Borrower[]>(res)),

  getDeletedBorrowers: () =>
    fetchWithTenant(`${API_BASE}/borrowers/deleted`).then(res => handleResponse<Borrower[]>(res)),

  getBorrower: (id: string) =>
    fetchWithTenant(`${API_BASE}/borrowers/${id}`).then(res => handleResponse<Borrower>(res)),

  addBorrower: (borrower: Omit<Borrower, 'id' | 'createdAt' | 'status'>) =>
    fetchWithTenant(`${API_BASE}/borrowers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrower),
    }).then(res => handleResponse<Borrower>(res)),

  updateBorrower: (id: string, data: Partial<Borrower>) =>
    fetchWithTenant(`${API_BASE}/borrowers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<Borrower>(res)),

  deleteBorrower: (id: string) =>
    fetchWithTenant(`${API_BASE}/borrowers/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  restoreBorrower: (id: string) =>
    fetchWithTenant(`${API_BASE}/borrowers/${id}/restore`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  permanentlyDeleteBorrower: (id: string) =>
    fetchWithTenant(`${API_BASE}/borrowers/${id}/permanent`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Loans
  getLoans: (status?: string) => {
    const url = status ? `${API_BASE}/loans?status=${status}` : `${API_BASE}/loans`;
    return fetchWithTenant(url).then(res => handleResponse<Loan[]>(res));
  },

  getLoan: (id: string) =>
    fetchWithTenant(`${API_BASE}/loans/${id}`).then(res => handleResponse<Loan>(res)),

  createLoan: (loanData: Omit<Loan, 'id' | 'remainingBalance' | 'status' | 'borrowerName'>) =>
    fetchWithTenant(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loanData),
    }).then(res => handleResponse<Loan>(res)),

  updateLoan: (id: string, data: Partial<Loan>) =>
    fetchWithTenant(`${API_BASE}/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<Loan>(res)),

  deleteLoan: (id: string) =>
    fetchWithTenant(`${API_BASE}/loans/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  getRepaymentSchedule: (loanId: string) =>
    fetchWithTenant(`${API_BASE}/loans/${loanId}/schedule`).then(res => handleResponse<Installment[]>(res)),

  // Repayments
  getRepayments: (loanId?: string) => {
    const url = loanId ? `${API_BASE}/repayments?loanId=${loanId}` : `${API_BASE}/repayments`;
    return fetchWithTenant(url).then(res => handleResponse<Repayment[]>(res));
  },

  getRepayment: (id: string) =>
    fetchWithTenant(`${API_BASE}/repayments/${id}`).then(res => handleResponse<Repayment>(res)),

  recordRepayment: (repaymentData: Omit<Repayment, 'id' | 'status'>) =>
    fetchWithTenant(`${API_BASE}/repayments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repaymentData),
    }).then(res => handleResponse<Repayment>(res)),

  deleteRepayment: (id: string) =>
    fetchWithTenant(`${API_BASE}/repayments/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Fixed Deposits
  getFixedDeposits: (status?: string) => {
    const url = status ? `${API_BASE}/fixed-deposits?status=${status}` : `${API_BASE}/fixed-deposits`;
    return fetchWithTenant(url).then(res => handleResponse<FixedDeposit[]>(res));
  },

  getFixedDeposit: (id: string) =>
    fetchWithTenant(`${API_BASE}/fixed-deposits/${id}`).then(res => handleResponse<FixedDeposit>(res)),

  createFixedDeposit: (fdData: Omit<FixedDeposit, 'id' | 'maturityAmount' | 'status' | 'borrowerName'>) =>
    fetchWithTenant(`${API_BASE}/fixed-deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fdData),
    }).then(res => handleResponse<FixedDeposit>(res)),

  updateFixedDeposit: (id: string, data: Partial<FixedDeposit>) =>
    fetchWithTenant(`${API_BASE}/fixed-deposits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<FixedDeposit>(res)),

  deleteFixedDeposit: (id: string) =>
    fetchWithTenant(`${API_BASE}/fixed-deposits/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  getFDEarningsSchedule: (fdId: string) =>
    fetchWithTenant(`${API_BASE}/fixed-deposits/${fdId}/earnings`).then(res => handleResponse<FDEarning[]>(res)),

  // Notifications
  getNotifications: () =>
    fetchWithTenant(`${API_BASE}/notifications`).then(res => handleResponse<Notification[]>(res)),

  markNotificationRead: (id: string) =>
    fetchWithTenant(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  markAllNotificationsRead: () =>
    fetchWithTenant(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => handleResponse<boolean>(res)),

  deleteNotification: (id: string) =>
    fetchWithTenant(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<boolean>(res)),

  // Settings
  getSettings: () =>
    fetchWithTenant(`${API_BASE}/settings`).then(res => handleResponse<Record<string, unknown>>(res)),

  getSetting: (key: string) =>
    fetchWithTenant(`${API_BASE}/settings/${key}`).then(res => handleResponse<unknown>(res)),

  updateSetting: (key: string, value: unknown) =>
    fetchWithTenant(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    }).then(res => handleResponse<unknown>(res)),

  // Users Management
  getUsers: () =>
    fetchWithTenant(`${API_BASE}/users`).then(res => handleResponse<any[]>(res)),

  createUser: (data: any) =>
    fetchWithTenant(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  deleteUser: (id: string) =>
    fetchWithTenant(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    }).then(res => handleResponse<any>(res)),

  getUserStats: (id: string) =>
    fetchWithTenant(`${API_BASE}/users/${id}/stats`).then(res => handleResponse<any>(res)),
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}

import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { 
  FileSpreadsheet, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  PieChart,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { apiService } from '../services/api';
import type { Loan, Repayment } from '../types';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString()}`;

// CSV generation and download utility
const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// PDF generation via print window
const downloadPDF = (title: string, htmlContent: string) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    toast.error('Please allow pop-ups to generate PDF reports.');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
        .header h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
        .header p { color: #64748b; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background-color: #0f172a; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        tr:hover { background-color: #f1f5f9; }
        .summary-box { margin-top: 25px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
        .summary-box h3 { font-size: 14px; color: #166534; margin-bottom: 8px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .summary-label { color: #64748b; }
        .summary-value { font-weight: 600; color: #0f172a; }
        .status { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-overdue { background: #fef2f2; color: #991b1b; }
        .status-pending { background: #fef9c3; color: #854d0e; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString()}</p>
        <p>This is a system-generated report.</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

const Reports: React.FC = () => {
  const [collectionData, setCollectionData] = React.useState<any[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [repayments, setRepayments] = React.useState<Repayment[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = React.useState(false);
  const [isLoadingOverdue, setIsLoadingOverdue] = React.useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadData = async () => {
    try {
      const [collData, loansData, repaymentsData] = await Promise.all([
        apiService.getCollectionData(),
        apiService.getLoans(),
        apiService.getRepayments(),
      ]);
      setCollectionData(collData);
      setLoans(loansData);
      setRepayments(repaymentsData);
    } catch {
      toast.error('Failed to load report data');
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Report data refreshed!');
  };

  // Portfolio data from real loan statuses
  const portfolioData = React.useMemo(() => {
    if (loans.length === 0) return [
      { name: 'Active', value: 0 },
      { name: 'Completed', value: 0 },
      { name: 'Pending', value: 0 },
      { name: 'Overdue', value: 0 },
    ];

    const active = loans.filter(l => l.status === 'active').length;
    const completed = loans.filter(l => l.status === 'completed').length;
    const pending = loans.filter(l => l.status === 'pending').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;
    const total = loans.length;

    return [
      { name: 'Active', value: Math.round((active / total) * 100), count: active },
      { name: 'Completed', value: Math.round((completed / total) * 100), count: completed },
      { name: 'Pending', value: Math.round((pending / total) * 100), count: pending },
      { name: 'Overdue', value: Math.round((overdue / total) * 100), count: overdue },
    ];
  }, [loans]);

  // ── Financial Statement Export (CSV/Excel) ──
  const handleFinancialStatement = async () => {
    setIsLoadingFinancial(true);
    try {
      const headers = [
        'Loan ID', 'Borrower', 'Loan Amount', 'Interest Rate (%)', 'Duration (Months)',
        'Start Date', 'Remaining Balance', 'Status', 'Total Repaid'
      ];

      const rows = loans.map(loan => {
        const loanRepayments = repayments.filter(r => r.loanId === loan.id && r.status === 'paid');
        const totalRepaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
        return [
          loan.id,
          loan.borrowerName,
          loan.amount.toString(),
          loan.interestRate.toString(),
          loan.durationMonths.toString(),
          loan.startDate,
          loan.remainingBalance.toString(),
          loan.status.toUpperCase(),
          totalRepaid.toString()
        ];
      });

      // Add summary rows
      rows.push([]);
      rows.push(['SUMMARY', '', '', '', '', '', '', '', '']);
      rows.push(['Total Loans', loans.length.toString(), '', '', '', '', '', '', '']);
      rows.push(['Total Disbursed', '', formatCurrency(loans.reduce((s, l) => s + l.amount, 0)), '', '', '', '', '', '']);
      rows.push(['Total Outstanding', '', '', '', '', '', formatCurrency(loans.reduce((s, l) => s + l.remainingBalance, 0)), '', '']);
      rows.push(['Total Collected', '', '', '', '', '', '', '', formatCurrency(repayments.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0))]);

      downloadCSV(headers, rows, `Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Financial Statement downloaded as Excel (CSV)!');
    } catch {
      toast.error('Failed to generate Financial Statement');
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  // ── Overdue Report (PDF) ──
  const handleOverdueReport = async () => {
    setIsLoadingOverdue(true);
    try {
      const overdueLoans = loans.filter(l => l.status === 'overdue');
      
      const tableRows = overdueLoans.map(loan => {
        const loanRepayments = repayments.filter(r => r.loanId === loan.id && r.status === 'paid');
        const totalRepaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
        const outstanding = loan.remainingBalance;
        const startDate = new Date(loan.startDate);
        const now = new Date();
        const daysOverdue = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) - (loan.durationMonths * 30));
        const penalty = Math.round(outstanding * 0.02); // 2% penalty estimate

        return `
          <tr>
            <td>${loan.id}</td>
            <td><strong>${loan.borrowerName}</strong></td>
            <td style="text-align: right">${formatCurrency(loan.amount)}</td>
            <td style="text-align: right">${formatCurrency(totalRepaid)}</td>
            <td style="text-align: right; color: #dc2626; font-weight: 600">${formatCurrency(outstanding)}</td>
            <td style="text-align: center">${daysOverdue > 0 ? daysOverdue + ' days' : 'Recent'}</td>
            <td style="text-align: right; color: #ea580c">${formatCurrency(penalty)}</td>
          </tr>
        `;
      }).join('');

      const totalOverdueAmount = overdueLoans.reduce((s, l) => s + l.remainingBalance, 0);
      const totalPenalty = Math.round(totalOverdueAmount * 0.02);

      const htmlContent = `
        <div class="header">
          <h1>Overdue Loans Report</h1>
          <p>Defaulting borrowers with aging analysis and penalty calculations</p>
        </div>

        ${overdueLoans.length === 0 ? `
          <div style="text-align: center; padding: 60px 0; color: #64748b;">
            <p style="font-size: 18px; font-weight: 600;">No Overdue Loans</p>
            <p>All loans are in good standing. No defaulting borrowers found.</p>
          </div>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Borrower</th>
                <th style="text-align: right">Loan Amount</th>
                <th style="text-align: right">Total Repaid</th>
                <th style="text-align: right">Outstanding</th>
                <th style="text-align: center">Days Overdue</th>
                <th style="text-align: right">Est. Penalty (2%)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary-box">
            <h3>Overdue Summary</h3>
            <div class="summary-row">
              <span class="summary-label">Total Overdue Loans:</span>
              <span class="summary-value">${overdueLoans.length}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Outstanding Amount:</span>
              <span class="summary-value" style="color: #dc2626">${formatCurrency(totalOverdueAmount)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Estimated Total Penalty:</span>
              <span class="summary-value" style="color: #ea580c">${formatCurrency(totalPenalty)}</span>
            </div>
          </div>
        `}
      `;

      downloadPDF('Overdue Loans Report', htmlContent);
      toast.success('Overdue Report generated! Use Print > Save as PDF to download.');
    } catch {
      toast.error('Failed to generate Overdue Report');
    } finally {
      setIsLoadingOverdue(false);
    }
  };

  // ── Portfolio Summary (PDF) ──
  const handlePortfolioSummary = async () => {
    setIsLoadingPortfolio(true);
    try {
      const activeLoans = loans.filter(l => l.status === 'active');
      const completedLoans = loans.filter(l => l.status === 'completed');
      const overdueLoans = loans.filter(l => l.status === 'overdue');
      const pendingLoans = loans.filter(l => l.status === 'pending');

      const totalDisbursed = loans.reduce((s, l) => s + l.amount, 0);
      const totalOutstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);
      const totalCollected = repayments.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
      const collectionRate = totalDisbursed > 0 ? ((totalCollected / totalDisbursed) * 100).toFixed(1) : '0';

      const loanTableRows = loans.map(loan => {
        const statusClass = `status status-${loan.status}`;
        return `
          <tr>
            <td>${loan.id}</td>
            <td><strong>${loan.borrowerName}</strong></td>
            <td style="text-align: right">${formatCurrency(loan.amount)}</td>
            <td style="text-align: center">${loan.interestRate}%</td>
            <td style="text-align: center">${loan.durationMonths} mo</td>
            <td style="text-align: right">${formatCurrency(loan.remainingBalance)}</td>
            <td style="text-align: center"><span class="${statusClass}">${loan.status}</span></td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <div class="header">
          <h1>Portfolio Summary Report</h1>
          <p>Executive summary of loan performance and portfolio health</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
            <div style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: 600;">Active Loans</div>
            <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${activeLoans.length}</div>
            <div style="font-size: 12px; color: #64748b;">${formatCurrency(activeLoans.reduce((s, l) => s + l.remainingBalance, 0))} outstanding</div>
          </div>
          <div style="padding: 16px; background: #dbeafe; border-radius: 8px; border: 1px solid #bfdbfe;">
            <div style="font-size: 11px; color: #1e40af; text-transform: uppercase; font-weight: 600;">Completed</div>
            <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${completedLoans.length}</div>
            <div style="font-size: 12px; color: #64748b;">${formatCurrency(completedLoans.reduce((s, l) => s + l.amount, 0))} total</div>
          </div>
          <div style="padding: 16px; background: #fef9c3; border-radius: 8px; border: 1px solid #fde68a;">
            <div style="font-size: 11px; color: #854d0e; text-transform: uppercase; font-weight: 600;">Pending</div>
            <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${pendingLoans.length}</div>
            <div style="font-size: 12px; color: #64748b;">Awaiting disbursement</div>
          </div>
          <div style="padding: 16px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
            <div style="font-size: 11px; color: #991b1b; text-transform: uppercase; font-weight: 600;">Overdue</div>
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${overdueLoans.length}</div>
            <div style="font-size: 12px; color: #64748b;">${formatCurrency(overdueLoans.reduce((s, l) => s + l.remainingBalance, 0))} at risk</div>
          </div>
        </div>

        <div class="summary-box" style="margin-bottom: 20px;">
          <h3>Financial Overview</h3>
          <div class="summary-row">
            <span class="summary-label">Total Loans:</span>
            <span class="summary-value">${loans.length}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Disbursed:</span>
            <span class="summary-value">${formatCurrency(totalDisbursed)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Collected:</span>
            <span class="summary-value" style="color: #16a34a">${formatCurrency(totalCollected)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Outstanding:</span>
            <span class="summary-value" style="color: #dc2626">${formatCurrency(totalOutstanding)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Collection Rate:</span>
            <span class="summary-value">${collectionRate}%</span>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #0f172a; margin-bottom: 12px;">All Loans Detail</h3>
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Borrower</th>
              <th style="text-align: right">Amount</th>
              <th style="text-align: center">Rate</th>
              <th style="text-align: center">Duration</th>
              <th style="text-align: right">Balance</th>
              <th style="text-align: center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${loanTableRows}
          </tbody>
        </table>
      `;

      downloadPDF('Portfolio Summary Report', htmlContent);
      toast.success('Portfolio Summary generated! Use Print > Save as PDF to download.');
    } catch {
      toast.error('Failed to generate Portfolio Summary');
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Comprehensive insights into your lending business.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} isLoading={isRefreshing}>
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </Button>
        </div>
      </div>

      {/* Report Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-primary" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
          
          <div className="icon-3d icon-3d-primary h-12 w-12 mb-4 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="h-6 w-6 text-white relative z-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Financial Statement</h3>
          <p className="text-sm text-slate-500 mb-2">Detailed ledger of all disbursements, repayments, and accrued interest.</p>
          <p className="text-xs text-slate-400 mb-6 flex items-center gap-1">
            <Download className="h-3 w-3" />
            Downloads as CSV (opens in Excel)
          </p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-primary/5 hover:border-primary/30 group/btn"
            onClick={handleFinancialStatement}
            isLoading={isLoadingFinancial}
          >
            Generate Excel
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Card>

        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors pointer-events-none" />
          
          <div className="icon-3d icon-3d-amber h-12 w-12 mb-4 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-6 w-6 text-white relative z-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Overdue Report</h3>
          <p className="text-sm text-slate-500 mb-2">List of all defaulting borrowers with aging analysis and penalty calculations.</p>
          <p className="text-xs text-slate-400 mb-6 flex items-center gap-1">
            <Download className="h-3 w-3" />
            {loans.filter(l => l.status === 'overdue').length} overdue loan{loans.filter(l => l.status === 'overdue').length !== 1 ? 's' : ''} found
          </p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-amber-500/5 hover:border-amber-500/30 group/btn"
            onClick={handleOverdueReport}
            isLoading={isLoadingOverdue}
          >
            Generate PDF
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Card>

        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-500" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
          
          <div className="icon-3d icon-3d-blue h-12 w-12 mb-4 group-hover:scale-110 transition-transform">
            <PieChart className="h-6 w-6 text-white relative z-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Portfolio Summary</h3>
          <p className="text-sm text-slate-500 mb-2">High-level executive summary of loan performance and portfolio health.</p>
          <p className="text-xs text-slate-400 mb-6 flex items-center gap-1">
            <Download className="h-3 w-3" />
            {loans.length} total loans across all statuses
          </p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-blue-500/5 hover:border-blue-500/30 group/btn"
            onClick={handlePortfolioSummary}
            isLoading={isLoadingPortfolio}
          >
            Generate PDF
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        {/* Bar Chart */}
        <Card className="p-6">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-indigo-500" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Monthly Revenue</h3>
              <p className="text-sm text-slate-500">Interest and principal collected</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            {collectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `Rs. ${(value/1000).toFixed(0)}k`} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.95)' }}
                    formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Collected']}
                  />
                  <Bar dataKey="actual" fill="url(#colorBar)" radius={[4, 4, 0, 0]}>
                    {
                      collectionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === collectionData.length - 1 ? '#6366f1' : '#c7d2fe'} />
                      ))
                    }
                  </Bar>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No collection data available. Record repayments to see revenue.
              </div>
            )}
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-500" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Portfolio Health</h3>
              <p className="text-sm text-slate-500">Distribution of loan statuses ({loans.length} total)</p>
            </div>
          </div>
          <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
            {loans.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <RechartsPieChart>
                    <Pie
                      data={portfolioData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {portfolioData.filter(d => d.value > 0).map((entry) => {
                        const colorIndex = ['Active', 'Completed', 'Pending', 'Overdue'].indexOf(entry.name);
                        return <Cell key={`cell-${entry.name}`} fill={COLORS[colorIndex >= 0 ? colorIndex : 0]} />;
                      })}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: any) => [`${value}%`, name]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4">
                  {portfolioData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {entry.name} ({(entry as any).count ?? entry.value}{(entry as any).count !== undefined ? '' : '%'})
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Center Text */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">{loans.length}</span>
                  <p className="text-xs text-slate-400 font-medium">Loans</p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No loan data available. Create loans to see portfolio health.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

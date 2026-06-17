import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { 
  FileSpreadsheet, 
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  PieChart,
  ArrowRight
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
import { apiService } from '../services/mockApi';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

const Reports: React.FC = () => {
  const [collectionData, setCollectionData] = React.useState<any[]>([]);
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    apiService.getCollectionData().then(setCollectionData);
  }, []);

  const handleExport = (type: string) => {
    setIsExporting(true);
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`${type} report generated successfully.`);
    }, 1500);
  };

  const portfolioData = [
    { name: 'Active Loans', value: 65 },
    { name: 'Completed', value: 25 },
    { name: 'Pending', value: 7 },
    { name: 'Overdue', value: 3 },
  ];

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
          <Button variant="outline">
            <Calendar className="h-4 w-4" />
            Last 6 Months
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filters
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
          <p className="text-sm text-slate-500 mb-6">Detailed ledger of all disbursements, repayments, and accrued interest.</p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-primary/5 hover:border-primary/30 group/btn"
            onClick={() => handleExport('Financial Statement')}
            isLoading={isExporting}
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
          <p className="text-sm text-slate-500 mb-6">List of all defaulting borrowers with aging analysis and penalty calculations.</p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-amber-500/5 hover:border-amber-500/30 group/btn"
            onClick={() => handleExport('Overdue Report')}
            isLoading={isExporting}
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
          <p className="text-sm text-slate-500 mb-6">High-level executive summary of loan performance and portfolio health.</p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-blue-500/5 hover:border-blue-500/30 group/btn"
            onClick={() => handleExport('Portfolio Summary')}
            isLoading={isExporting}
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `Rs. ${(value/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.95)' }}
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Amount']}
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
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-500" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Portfolio Health</h3>
              <p className="text-sm text-slate-500">Distribution of loan statuses</p>
            </div>
          </div>
          <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="80%">
              <RechartsPieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {portfolioData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value}%`, 'Share']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4">
              {portfolioData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
            
            {/* Center Text */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">100%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

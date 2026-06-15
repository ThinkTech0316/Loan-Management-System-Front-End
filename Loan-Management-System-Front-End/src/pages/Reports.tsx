
import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { 
  TrendingUp, 
  Download, 
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiService } from '../services/mockApi';
import type { CollectionData } from '../types';

const Reports: React.FC = () => {
  const [chartData, setChartData] = React.useState<CollectionData[]>([]);

  React.useEffect(() => {
    apiService.getCollectionData().then(setChartData);
  }, []);

  const pieData = [
    { name: 'Active', value: 75, color: '#10b981' },
    { name: 'Overdue', value: 15, color: '#f59e0b' },
    { name: 'Completed', value: 10, color: '#6366f1' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Financial Reports</h1>
          <p className="text-slate-500 mt-1">Analyze your portfolio performance and collection trends.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Net Profit</p>
            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none">
              <TrendingUp className="h-3 w-3 mr-1" /> 18%
            </Badge>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹8.45L</h3>
          <p className="text-xs text-slate-400 mt-2">Fiscal Year 2024</p>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Total Interest</p>
            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none">
              <TrendingUp className="h-3 w-3 mr-1" /> 12%
            </Badge>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹12.20L</h3>
          <p className="text-xs text-slate-400 mt-2">Accrued Interest</p>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">PAR (30+ Days)</p>
            <Badge variant="error" className="bg-red-50 text-red-600 border-none">
              <ArrowUpRight className="h-3 w-3 mr-1" /> 2.4%
            </Badge>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">4.8%</h3>
          <p className="text-xs text-slate-400 mt-2">Portfolio at Risk</p>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Active Borrowers</p>
            <Badge variant="info" className="bg-indigo-50 text-indigo-600 border-none">
              <TrendingUp className="h-3 w-3 mr-1" /> 5%
            </Badge>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">1,248</h3>
          <p className="text-xs text-slate-400 mt-2">Total Customer Base</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Collection Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Portfolio Distribution</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">145</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest">Loans</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

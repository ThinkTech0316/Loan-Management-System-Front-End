 import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { apiService } from '../services/mockApi';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.login(email, password);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-up">
      <div className="space-y-2 text-center md:text-left relative z-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
          Welcome back
        </h2>
        <p className="text-slate-500 font-medium">Enter your credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5 relative z-10">
        <div className="space-y-2 group">
          <Input 
            label="Email Address" 
            placeholder="name@company.com" 
            type="email" 
            required 
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Mail className="absolute left-3 top-9 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        </div>
        <div className="space-y-2 group">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">Password</label>
            <Link to="/forgot-password" title="Forgot password?" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input 
              placeholder="••••••••" 
              type="password" 
              required 
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
        </div>

        {errors.form && (
          <div className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900">
            {errors.form}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" />
          <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">Remember me for 30 days</label>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-bold shadow-glow-primary hover:-translate-y-1" isLoading={isLoading}>
          Sign In to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="relative z-10">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1 font-bold tracking-widest text-slate-400 rounded-full border border-slate-200 dark:border-slate-800">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <Button variant="outline" className="w-full h-11 hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5">
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c3.11 0 5.72-1.03 7.63-2.77l-3.57-2.77c-.99.66-2.23 1.06-4.06 1.06-3.12 0-5.76-2.11-6.71-4.94H1.61v2.83C3.51 20.38 7.47 23 12 23z" fill="#34A853" />
            <path d="M5.29 13.58c-.24-.73-.38-1.51-.38-2.33s.14-1.61.38-2.33V6.1H1.61C.58 8.16 0 10.46 0 12.75s.58 4.59 1.61 6.65l3.68-2.82z" fill="#FBBC05" />
            <path d="M12 4.75c1.69 0 3.21.58 4.41 1.71l3.3-3.3C17.72 1.19 15.11 0 12 0 7.47 0 3.51 2.62 1.61 6.1l3.68 2.82c.95-2.83 3.59-4.94 6.71-4.94z" fill="#EA4335" />
          </svg>
          Google
        </Button>
        <Button variant="outline" className="w-full h-11 hover:border-[#1877F2]/30 hover:bg-[#1877F2]/5 hover:-translate-y-0.5">
          <svg className="h-5 w-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
          Facebook
        </Button>
      </div>
    </div>
  );
};

export default Login;

import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { ArrowLeft, Send, Mail } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

const ForgotPassword: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await apiService.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Password reset request sent!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset request';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 animate-scale-in text-center relative z-10">
        <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-400 to-primary rounded-full flex items-center justify-center text-white mb-8 shadow-glow-primary animate-pulse-3d">
          <Send className="h-10 w-10 relative z-10 -ml-1 mt-1" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">Check your email</h2>
        <p className="text-slate-500 font-medium">
          We've sent a secure password reset link to<br/>
          <span className="font-bold text-slate-900 dark:text-white text-lg mt-2 inline-block">{email}</span>
        </p>
        <div className="pt-8">
          <Link to="/login">
            <Button variant="outline" className="w-full h-12 hover:-translate-y-1">
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in-up relative z-10">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">Reset password</h2>
        <p className="text-slate-500 font-medium">Enter your email and we'll send you a secure link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <Input 
            label="Registered Email Address" 
            placeholder="name@company.com" 
            type="email" 
            required 
            className="pl-10 h-12 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Mail className="absolute left-3 top-10 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
        </div>
        
        <Button type="submit" className="w-full h-12 text-base font-bold shadow-glow-primary hover:-translate-y-1" isLoading={isLoading}>
          Send Recovery Link
          <Send className="h-4 w-4 ml-1" />
        </Button>
      </form>

      <div className="text-center pt-4">
        <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-primary flex items-center justify-center gap-2 transition-colors group">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to secure login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;


import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { ArrowLeft, Send } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 text-center">
        <div className="mx-auto h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-6">
          <Send className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Check your email</h2>
        <p className="text-slate-500">
          We've sent a password reset link to <span className="font-semibold text-slate-900 dark:text-white">arun@example.com</span>
        </p>
        <div className="pt-6">
          <Link to="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Reset password</h2>
        <p className="text-slate-500">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Email Address" 
          placeholder="name@company.com" 
          type="email" 
          required 
        />
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>

      <div className="text-center">
        <Link to="/login" className="text-sm text-slate-500 hover:text-primary flex items-center justify-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

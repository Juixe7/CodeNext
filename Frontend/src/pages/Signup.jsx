import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser, clearError } from '../authSlice';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';

const signupSchema = z.object({
  firstName: z.string().min(3, "Name must be at least 3 characters"),
  emailId: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
});

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Very Weak', color: 'bg-error' };
  if (score === 2) return { score, label: 'Weak', color: 'bg-warning' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-success' };
  return { score, label: 'Very Strong', color: 'bg-success' };
};

const PasswordRule = ({ met, text }) => (
  <div className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? 'text-success' : 'text-base-content/50'}`}>
    {met ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
    <span>{text}</span>
  </div>
);

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const watchedPassword = watch('password', '');

  useEffect(() => {
    setPasswordValue(watchedPassword);
  }, [watchedPassword]);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/');
    }
  }, [dispatch, isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(clearError());
    dispatch(registerUser(data));
  };

  const strength = getPasswordStrength(passwordValue);
  const strengthPercent = (strength.score / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 animate-fade-in-down">
        <ThemeToggle size="sm" />
      </div>

      {/* Back to home */}
      <div className="absolute top-4 left-4 animate-fade-in-down">
        <NavLink to="/" className="btn btn-ghost btn-sm gap-2 opacity-70 hover:opacity-100 transition-opacity">
          ← Home
        </NavLink>
      </div>
      
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 animate-fade-in-up">
        <div className="card-body p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full shadow-lg ring-4 ring-primary/5 hover:ring-primary/20 transition-all duration-300">
                <img 
                  src={logoRoadCode} 
                  alt="RoadCode Logo" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-base-content mb-2">Join RoadCode</h1>
            <p className="text-base-content/70">Start your DSA journey today — it's free!</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6 animate-fade-in-up shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`input input-bordered w-full pl-10 transition-all duration-200 focus:shadow-md ${errors.firstName ? 'input-error' : 'focus:border-primary'}`} 
                  {...register('firstName')}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
              </div>
              {errors.firstName && (
                <label className="label animate-fade-in-up">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.firstName.message}
                  </span>
                </label>
              )}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`input input-bordered w-full pl-10 transition-all duration-200 focus:shadow-md ${errors.emailId ? 'input-error' : 'focus:border-primary'}`}
                  {...register('emailId')}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
              </div>
              {errors.emailId && (
                <label className="label animate-fade-in-up">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.emailId.message}
                  </span>
                </label>
              )}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
                {passwordValue && (
                  <span className={`label-text-alt font-semibold text-xs ${
                    strength.score >= 4 ? 'text-success' : strength.score >= 3 ? 'text-warning' : 'text-error'
                  }`}>
                    {strength.label}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={`input input-bordered w-full pl-10 pr-10 transition-all duration-200 focus:shadow-md ${errors.password ? 'input-error' : 'focus:border-primary'}`}
                  {...register('password')}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {passwordValue && (
                <div className="mt-2 animate-fade-in-up">
                  <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Rules */}
              <div className="mt-2 p-3 bg-base-200 rounded-lg space-y-1.5">
                <p className="text-xs font-semibold text-base-content/60 mb-1">Password requirements:</p>
                <PasswordRule met={passwordValue.length >= 8} text="At least 8 characters" />
                <PasswordRule met={/[A-Z]/.test(passwordValue)} text="One uppercase letter (A-Z)" />
                <PasswordRule met={/[0-9]/.test(passwordValue)} text="One number (0-9)" />
                <PasswordRule met={/[^A-Za-z0-9]/.test(passwordValue)} text="Special character (optional, improves strength)" />
              </div>

              {errors.password && (
                <label className="label animate-fade-in-up">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.password.message}
                  </span>
                </label>
              )}
            </div>

            {/* Submit */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <div className="divider text-base-content/40">OR</div>
            <p className="text-base-content/70">
              Already have an account?{' '}
              <NavLink to="/login" className="link link-primary font-semibold hover:link-hover">
                Sign in here
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
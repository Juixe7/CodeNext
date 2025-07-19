import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router'; 
import { loginUser, clearError } from "../authSlice";
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, User } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';

const loginSchema = z.object({
  emailId: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters") 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const watchedEmail = watch('emailId', '');

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/');
    }
  }, [dispatch, isAuthenticated, navigate]);

  const onSubmit = (data) => {
    setAttemptedEmail(data.emailId);
    dispatch(clearError());
    dispatch(loginUser(data));
  };

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
            <h1 className="text-3xl font-bold text-base-content mb-2">Welcome Back</h1>
            <p className="text-base-content/70">Sign in to continue your coding journey</p>
          </div>

          {/* Error Alert with user context */}
          {error && (
            <div className="alert alert-error mb-6 animate-fade-in-up shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{error}</span>
                {attemptedEmail && (
                  <span className="text-xs opacity-80 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Attempted as: <strong>{attemptedEmail}</strong>
                  </span>
                )}
                <span className="text-xs opacity-70 mt-1">
                  💡 Make sure your password is at least 8 characters with a mix of letters and numbers.
                </span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  className={`input input-bordered w-full pl-10 transition-all duration-200 focus:shadow-md ${errors.emailId ? 'input-error' : 'focus:border-primary'}`} 
                  {...register('emailId')}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
              </div>
              {errors.emailId && (
                <label className="label animate-fade-in-up">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.emailId.message}
                  </span>
                </label>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password (min. 8 characters)"
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
              {errors.password && (
                <label className="label animate-fade-in-up">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  🔒 Must be at least 8 characters
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <div className="divider text-base-content/40">OR</div>
            <p className="text-base-content/70">
              Don't have an account?{' '}
              <NavLink to="/signup" className="link link-primary font-semibold hover:link-hover">
                Create one free
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
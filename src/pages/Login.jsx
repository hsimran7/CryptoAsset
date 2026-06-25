import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, LogIn, User, Lock, Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { loginUser, resendVerificationEmail } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleResendVerification = async () => {
    let email = username.trim();
    if (!email || !email.includes('@')) {
      setError('Please enter your email address in the field above to resend verification.');
      return;
    }

    setResending(true);
    setError('');
    setResendSuccess('');
    try {
      const res = await resendVerificationEmail(email);
      setResendSuccess(res.message || 'Verification email resent successfully! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errType = params.get('error');
    if (errType === 'GoogleAuthFailed' || errType === 'OAuthFailed') {
      setError('Google authentication failed. Please try again.');
    } else if (errType === 'ServerError') {
      setError('Internal server error. Please try again later.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await loginUser(username, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const validationMsg = err.errors.map(e => e.message).join(', ');
        setError(validationMsg);
      } else {
        setError(err.message || 'Invalid credentials or unverified email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const autofill = (type) => {
    if (type === 'admin') {
      setUsername('CryptoAdmin');
      setPassword('admin123');
    } else {
      setUsername('TraderJoe');
      setPassword('trader123');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 animated-bg-mesh terminal-grid relative flex items-center justify-center p-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 md:p-8 relative z-10 shadow-3xl text-left">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center neon-border-indigo mb-3.5">
            <Eye className="w-6 h-6 text-white" />
          </Link>
          <h2 className="font-display font-extrabold text-2xl text-white">Welcome back</h2>
          <p className="text-slate-400 text-xs mt-1">Enter your terminal details to log in</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes('verified') && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-1 self-start text-[10px] bg-white/5 hover:bg-white/10 text-indigo-300 py-1.5 px-3 rounded font-bold transition-all border border-indigo-500/20 active:scale-95"
                disabled={resending}
              >
                {resending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {/* Resend success message */}
        {resendSuccess && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{resendSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Username or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-wider">or</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Google Login Button */}
        <a
          href="http://localhost:5000/api/v1/auth/google"
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-all duration-200 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign In with Google
        </a>

        {/* Quick autofills for testing */}
        <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Quick testing credentials (requires DB seed)</div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => autofill('user')}
              className="text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Standard User
            </button>
            <button
              onClick={() => autofill('admin')}
              className="text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Admin User
            </button>
          </div>
        </div>

        {/* Sign up Redirect */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

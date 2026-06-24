import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, UserPlus, User, Mail, Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { registerUser } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agree) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await registerUser(username, email, password);
      setSuccess(true);
      setSuccessMessage(res.message || 'Registration successful. Please check your email to verify your account.');
    } catch (err) {
      setError(err.message || 'Registration failed. Email or Username may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 animated-bg-mesh terminal-grid relative flex items-center justify-center p-4">
      {/* Decorative blur elements */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 md:p-8 relative z-10 shadow-3xl text-left">
        {/* Brand logo header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center neon-border-indigo mb-3.5">
            <Eye className="w-6 h-6 text-white" />
          </Link>
          <h2 className="font-display font-extrabold text-2xl text-white">Create your account</h2>
          <p className="text-slate-400 text-xs mt-1">Unlock AI-driven fintech terminal insights</p>
        </div>

        {/* Display input errors */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-5 text-center">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h3 className="font-display font-bold text-white text-lg">Account Registered!</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 mb-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Pick a username"
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/10 bg-dark-900 focus:ring-indigo-500 text-indigo-600"
                  disabled={loading}
                />
                <label htmlFor="agree-terms" className="text-[11px] text-slate-400 leading-normal select-none">
                  I agree to the{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 hover:underline">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account
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

            {/* Google Signup Button */}
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
              Sign Up with Google
            </a>

            {/* Redirect back to Login */}
            <div className="text-center mt-6 text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

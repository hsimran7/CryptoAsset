import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Eye, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 animated-bg-mesh terminal-grid relative flex items-center justify-center p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 md:p-8 relative z-10 shadow-3xl text-left">
        {/* Logo and header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center neon-border-indigo mb-3.5">
            <Eye className="w-6 h-6 text-white" />
          </Link>
          <h2 className="font-display font-extrabold text-2xl text-white">Forgot Password</h2>
          <p className="text-slate-400 text-xs mt-1">We will email you a link to reset your password</p>
        </div>

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
            <p className="text-slate-200 text-xs leading-relaxed">
              If that email address exists in our database, we have sent a secure password reset link. Please check your inbox.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
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
                  placeholder="Enter your email address"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to login links */}
            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

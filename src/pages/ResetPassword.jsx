import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Eye, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiRequest(`/auth/reset-password/${token}`, {
        method: 'PUT',
        body: { password }
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
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
          <h2 className="font-display font-extrabold text-2xl text-white">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1">Please enter your new security credentials</p>
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
            <h3 className="font-display font-bold text-white text-lg">Password Changed!</h3>
            <p className="text-slate-400 text-xs">
              Your password has been successfully updated. Redirecting to login in a few seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">New Password</label>
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Password...
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Eye, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await apiRequest(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.message || 'Your email address has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Email verification failed. The link may have expired or is invalid.');
      }
    };

    if (token) {
      verifyToken();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-950 animated-bg-mesh terminal-grid relative flex items-center justify-center p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 md:p-8 relative z-10 shadow-3xl text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center neon-border-indigo">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>

        {status === 'verifying' && (
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-xl text-white">Verifying your account</h2>
            <div className="flex justify-center py-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
            <p className="text-slate-400 text-xs">Connecting to the verification server, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="w-16 h-16 animate-pulse" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">Email Verified!</h2>
            <p className="text-slate-300 text-xs leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-2 font-bold"
              >
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="flex justify-center text-rose-500">
              <XCircle className="w-16 h-16" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">Verification Failed</h2>
            <p className="text-rose-400/90 text-xs leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                to="/register"
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs py-3 px-4 rounded-xl font-bold transition-all inline-block"
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Loader2 } from 'lucide-react';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        console.error('No OAuth token provided in callback URL.');
        navigate('/login?error=OAuthFailed');
        return;
      }

      try {
        // Save token to localStorage first
        localStorage.setItem('cv_token', token);

        // Fetch user profile to populate AppContext
        const response = await apiRequest('/auth/me');
        const userData = response.data;

        // Populate context state
        userData.role = userData.role ? userData.role.toUpperCase() : 'USER';
        
        // Save user profile state
        localStorage.setItem('cv_user', JSON.stringify(userData));
        window.location.href = '/dashboard'; // Hard reload to initialize socket/timers or navigate
      } catch (err) {
        console.error('OAuth profile loading failed:', err);
        localStorage.removeItem('cv_token');
        localStorage.removeItem('cv_user');
        navigate('/login?error=OAuthFailed');
      }
    };

    handleOAuthSuccess();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-center">
          <p className="font-display font-bold text-xs tracking-wider text-slate-200">AUTHENTICATING</p>
          <p className="text-[10px] text-slate-500 mt-1">Retrieving Google Profile credentials...</p>
        </div>
      </div>
    </div>
  );
}

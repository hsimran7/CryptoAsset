import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Key, 
  ShieldCheck, 
  Fingerprint, 
  Mail, 
  Plus, 
  Check, 
  Eye, 
  EyeOff,
  Copy
} from 'lucide-react';

export default function Profile() {
  const { user } = useApp();
  
  // API Keys manager state
  const [apiKeys, setApiKeys] = useState([
    { id: 'k1', name: 'Binance Read-Only feed', key: 'cv_bin_8123******781a', secret: '••••••••••••••••••••', date: '2026-05-10' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showSecretId, setShowSecretId] = useState(null);

  // Security preferences state
  const [toggles, setToggles] = useState({
    tfa: true,
    biometric: false,
    alertsEmail: true
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddAPIKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomKey = 'cv_api_' + Math.random().toString(36).substring(2, 8) + '******' + Math.random().toString(36).substring(2, 6);
    const randomSecret = 'cv_secret_' + Math.random().toString(36).substring(2, 15);

    const newKey = {
      id: 'key-' + Date.now(),
      name: newKeyName,
      key: randomKey,
      secret: randomSecret,
      date: new Date().toISOString().split('T')[0]
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          User Profile &amp; Settings
        </h1>
        <p className="text-slate-400 text-xs mt-1">Configure verification tiers, maintain biometric security, and manage API keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col items-center text-center space-y-4">
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'} 
            alt="User avatar" 
            className="w-24 h-24 rounded-full border-2 border-indigo-500/30 neon-border-indigo" 
          />
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-white font-display">{user?.username || 'Guest Trader'}</h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-sans">
              VIP Tier 2 investor
            </span>
          </div>

          <div className="w-full border-t border-white/5 pt-4 space-y-3 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-300 font-sans">{user?.email || 'guest@cryptovision.ai'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role level:</span>
              <span className="text-slate-300 capitalize">{user?.role ? user.role.toLowerCase() : 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Joined date:</span>
              <span className="text-slate-300">{user?.joinedDate || '2026-06-10'}</span>
            </div>
          </div>
        </div>

        {/* Security and Biometrics Preferences (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Security Credentials
            </h3>
            <p className="text-[11px] text-slate-400">Configure terminal protection rules and login keys.</p>
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5 flex-1">
            {/* TFA Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Two-Factor Authentication (2FA)</span>
                <span className="text-[10px] text-slate-400">Adds an extra layer of protection using authenticator tokens.</span>
              </div>
              <button 
                onClick={() => handleToggle('tfa')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {toggles.tfa ? (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded">ENABLED</span>
                ) : (
                  <span className="text-xs text-slate-500 font-bold bg-white/5 px-2.5 py-1 rounded">DISABLED</span>
                )}
              </button>
            </div>

            {/* Biometric Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block flex items-center gap-1">
                  <Fingerprint className="w-4 h-4 text-violet-400" /> Biometric FaceID / TouchID
                </span>
                <span className="text-[10px] text-slate-400">Allows instant local unlock via secure OS keys.</span>
              </div>
              <button 
                onClick={() => handleToggle('biometric')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {toggles.biometric ? (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded">ENABLED</span>
                ) : (
                  <span className="text-xs text-slate-500 font-bold bg-white/5 px-2.5 py-1 rounded">DISABLED</span>
                )}
              </button>
            </div>

            {/* Alerts Email notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Email Alerts Sync</span>
                <span className="text-[10px] text-slate-400">Receives alert notifications directly to email boxes.</span>
              </div>
              <button 
                onClick={() => handleToggle('alertsEmail')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {toggles.alertsEmail ? (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded">ENABLED</span>
                ) : (
                  <span className="text-xs text-slate-500 font-bold bg-white/5 px-2.5 py-1 rounded">DISABLED</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. API KEYS MANAGER GRID */}
      <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" /> External API Keys Manager
          </h3>
        </div>

        {/* Add API key form */}
        <form onSubmit={handleAddAPIKey} className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            type="text"
            placeholder="Label (e.g. Binance Read Only)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-sans"
          />
          <button
            type="submit"
            className="btn-premium-indigo text-xs py-2.5 px-5 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create API Key
          </button>
        </form>

        {/* API keys list table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full border-collapse text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                <th className="pb-2">Label</th>
                <th className="pb-2">API Key</th>
                <th className="pb-2">Secret Key</th>
                <th className="pb-2">Date Configured</th>
                <th className="pb-2 text-center">Secret</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.01]">
                  <td className="py-3 font-semibold text-white font-sans">{k.name}</td>
                  <td className="py-3 text-slate-400">{k.key}</td>
                  <td className="py-3 text-slate-400">
                    {showSecretId === k.id ? k.secret : '••••••••••••••••••••'}
                  </td>
                  <td className="py-3 text-slate-500">{k.date}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => setShowSecretId(showSecretId === k.id ? null : k.id)}
                      className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      {showSecretId === k.id ? <EyeOff className="w-4 h-4 mx-auto" /> : <Eye className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

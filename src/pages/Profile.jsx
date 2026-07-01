import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Key, 
  ShieldCheck, 
  Fingerprint, 
  Plus, 
  Eye, 
  EyeOff,
  User,
  Mail,
  Camera,
  Layers,
  HelpCircle,
  Keyboard,
  Globe,
  Sun,
  Moon,
  Check
} from 'lucide-react';

export default function Profile() {
  const { 
    user, 
    updateProfile, 
    theme, 
    toggleTheme, 
    mode, 
    toggleMode, 
    language, 
    changeLanguage, 
    t,
    addToast 
  } = useApp();

  // Profile forms state
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInputRef = useRef(null);

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
    addToast('Security setting updated.', 'info');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: keep it under 1.5MB for base64 efficiency
    if (file.size > 1.5 * 1024 * 1024) {
      addToast('Image size must be less than 1.5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        addToast('Avatar uploaded successfully! Click save below to persist.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      addToast('Username and Email are required', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        name,
        username,
        email,
        avatar
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
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
    addToast('API Key generated.', 'success');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          {t('profile')} &amp; Preferences
        </h1>
        <p className="text-slate-400 text-xs mt-1">Configure verification tiers, maintain biometric security, and customize user experience settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Settings Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="glass-panel rounded-xl border border-white/5 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-white/5">
              {/* Avatar Uploader */}
              <div onClick={handleAvatarClick} className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500/30 neon-border-indigo flex-shrink-0">
                <img 
                  src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'} 
                  alt="User avatar" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all"
                />
                <div className="absolute inset-0 bg-dark-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-bold text-lg text-white font-display">{name || user?.username || 'Guest Trader'}</h3>
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-sans">
                  VIP Tier 2 investor
                </span>
                <p className="text-[10px] text-slate-500 font-mono">Joined: {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : '2026-06-10'}</p>
              </div>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter full display name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Experience customization */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Experience Settings</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Language Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-teal-400" /> Choose Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full p-2.5 text-xs glass-input focus:ring-indigo-500"
                  >
                    <option value="en">English (EN)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>

                {/* Theme Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />} Theme Mode
                  </label>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full py-2.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs font-semibold text-slate-200 text-left flex items-center justify-between"
                  >
                    <span className="capitalize">{theme} Theme</span>
                    <Check className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>

                {/* Beginner / Pro Mode Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-rose-400" /> User Profile Mode
                  </label>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="w-full py-2.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs font-semibold text-slate-200 text-left flex items-center justify-between"
                  >
                    <span className="capitalize">{mode === 'beginner' ? 'Beginner' : 'Pro'} Mode</span>
                    <Check className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full btn-premium-indigo py-3 text-xs flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
            >
              {savingProfile ? 'Saving profile changes...' : 'Save Profile Preferences'}
            </button>
          </form>

          {/* Security and Biometrics Preferences */}
          <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Security Credentials
              </h3>
              <p className="text-[11px] text-slate-400">Configure terminal protection rules and login keys.</p>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/5 flex-1">
              {/* TFA Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-bold text-white block">Two-Factor Authentication (2FA)</span>
                  <span className="text-[10px] text-slate-400">Adds an extra layer of protection using authenticator tokens.</span>
                </div>
                <button 
                  type="button"
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
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-bold text-white block flex items-center gap-1">
                    <Fingerprint className="w-4 h-4 text-violet-400" /> Biometric FaceID / TouchID
                  </span>
                  <span className="text-[10px] text-slate-400">Allows instant local unlock via secure OS keys.</span>
                </div>
                <button 
                  type="button"
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
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-bold text-white block">Email Alerts Sync</span>
                  <span className="text-[10px] text-slate-400">Receives alert notifications directly to email boxes.</span>
                </div>
                <button 
                  type="button"
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

        {/* Keyboard Shortcuts Sheet (1/3 width) */}
        <div className="space-y-6">
          <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Keyboard className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Keyboard Shortcuts</h3>
            </div>

            <div className="space-y-3.5 text-xs text-left font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Command Palette</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Toggle Theme</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + L</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Toggle User Mode</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + B</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Go to Dashboard</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Go to Market Feed</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + M</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Go to Portfolio</span>
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/10 text-[10px]">Ctrl + P</kbd>
              </div>
            </div>
            
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 text-[10px] text-indigo-300 leading-normal">
              <HelpCircle className="w-4 h-4 mb-1 text-indigo-400 inline-block mr-1.5 align-middle" />
              <span>
                Use global keys at any section to fast-navigate the trading app, customize displays, or search assets.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* API KEYS MANAGER */}
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
                      type="button"
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

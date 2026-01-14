import React, { useState, useEffect } from 'react';
import { Cloud, Lock, ArrowRight, AlertTriangle, Plus, Trash2, Key, Save, Check, User } from 'lucide-react';
import { SalesforceCredentials, loginToSalesforce } from '../services/salesforceService';

interface LoginProps {
  onLogin: (username: string, session: any) => void;
}

interface SavedAccount {
    id: string;
    alias: string;
    username: string;
    token: string;
    env: 'prod' | 'sandbox';
    password?: string; // Storing password for demo purposes (Force.com logins style)
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [env, setEnv] = useState<'prod' | 'sandbox'>('prod');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Saved Accounts State
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newAccountAlias, setNewAccountAlias] = useState('');

  useEffect(() => {
      const stored = localStorage.getItem('flowsense_accounts');
      if (stored) {
          try {
              setSavedAccounts(JSON.parse(stored));
          } catch(e) { console.error("Failed to load accounts", e); }
      }
  }, []);

  const saveAccountsToStorage = (accounts: SavedAccount[]) => {
      localStorage.setItem('flowsense_accounts', JSON.stringify(accounts));
      setSavedAccounts(accounts);
  };

  const handleSaveAccount = () => {
      if (!username || !password) return;
      const newAccount: SavedAccount = {
          id: Date.now().toString(),
          alias: newAccountAlias || username.split('@')[0],
          username,
          password,
          token,
          env
      };
      saveAccountsToStorage([...savedAccounts, newAccount]);
      setShowSaveForm(false);
      setNewAccountAlias('');
  };

  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedAccounts.filter(acc => acc.id !== id);
      saveAccountsToStorage(updated);
  };

  const loadAccount = (acc: SavedAccount) => {
      setUsername(acc.username);
      setPassword(acc.password || '');
      setToken(acc.token);
      setEnv(acc.env);
      // Optional: Auto-login
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsConnecting(true);

    const loginUrl = env === 'prod' 
        ? 'https://login.salesforce.com' 
        : 'https://test.salesforce.com';

    const creds: SalesforceCredentials = {
        username,
        password,
        token,
        loginUrl
    };

    try {
        const session = await loginToSalesforce(creds);
        onLogin(username, session);
    } catch (err: any) {
        console.error(err);
        // Determine if it's a network/CORS error or Auth error
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
            setError("Connection blocked. Please ensure this is running as a Chrome Extension or CORS is disabled.");
        } else {
            setError(err.message || "Invalid credentials or security token.");
        }
    } finally {
        setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto">
        <div className="mt-4 mb-6 text-center">
            <div className="w-12 h-12 bg-sf-blue rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <Cloud className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Connect Salesforce</h2>
            <p className="text-gray-500 text-xs px-4">Enter credentials or select a saved account.</p>
        </div>

        <div className="flex gap-6 w-full max-w-4xl mx-auto h-full items-start justify-center">
            
            {/* Left Column: Login Form */}
            <form onSubmit={handleLogin} className="space-y-3 w-full max-w-xs shrink-0">
                {/* Environment Toggle */}
                <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
                    <button 
                        type="button"
                        onClick={() => setEnv('prod')}
                        className={`text-xs font-medium py-1.5 rounded-md transition-all ${env === 'prod' ? 'bg-white text-sf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Production
                    </button>
                    <button 
                        type="button"
                        onClick={() => setEnv('sandbox')}
                        className={`text-xs font-medium py-1.5 rounded-md transition-all ${env === 'sandbox' ? 'bg-white text-sf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sandbox
                    </button>
                </div>

                {error && (
                    <div className="text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                    <input 
                        type="email" 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sf-blue"
                        placeholder="user@company.com"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sf-blue"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Security Token</label>
                    <input 
                        type="text" 
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sf-blue"
                        placeholder="Optional if IP restricted"
                    />
                </div>

                <div className="flex items-center justify-between pt-1">
                    {!showSaveForm ? (
                        <button 
                            type="button" 
                            onClick={() => setShowSaveForm(true)}
                            className="text-xs text-sf-blue hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Save these credentials
                        </button>
                    ) : (
                         <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-1">
                             <input 
                                type="text" 
                                value={newAccountAlias}
                                onChange={(e) => setNewAccountAlias(e.target.value)}
                                placeholder="Alias (e.g., Prod Admin)"
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-sf-blue outline-none"
                             />
                             <button 
                                type="button"
                                onClick={handleSaveAccount}
                                disabled={!username || !password}
                                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                                title="Save"
                             >
                                 <Check className="w-3.5 h-3.5" />
                             </button>
                             <button 
                                type="button"
                                onClick={() => setShowSaveForm(false)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Cancel"
                             >
                                 <XIcon className="w-3.5 h-3.5" />
                             </button>
                         </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full bg-sf-blue text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait"
                >
                    {isConnecting ? (
                        <span className="flex items-center gap-2 text-sm">
                             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Authenticating...
                        </span>
                    ) : (
                        <>
                            Log In
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Right Column: Saved Accounts (if any) */}
            {savedAccounts.length > 0 && (
                <div className="w-full max-w-xs border-l border-gray-200 pl-6 h-full flex flex-col">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Key className="w-3 h-3" /> Saved Accounts
                     </h3>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar max-h-[400px]">
                         {savedAccounts.map(acc => (
                             <div 
                                key={acc.id} 
                                onClick={() => loadAccount(acc)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all group relative ${username === acc.username ? 'bg-blue-50 border-sf-blue' : 'bg-white border-gray-200 hover:border-sf-blue/50 hover:shadow-sm'}`}
                             >
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="font-bold text-sm text-gray-800 truncate pr-6">{acc.alias}</span>
                                     <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${acc.env === 'prod' ? 'bg-blue-100 text-sf-blue border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                         {acc.env === 'prod' ? 'PROD' : 'SANDBOX'}
                                     </span>
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                                     <User className="w-3 h-3" />
                                     <span className="truncate">{acc.username}</span>
                                 </div>

                                 <button 
                                     onClick={(e) => handleDeleteAccount(acc.id, e)}
                                     className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                     title="Delete Saved Account"
                                 >
                                     <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="flex flex-col items-center gap-1 text-center mt-6">
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                <span>SSL Encrypted Connection</span>
            </div>
        </div>
    </div>
  );
};

// Helper component for icon
const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Login;
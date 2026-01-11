import React, { useState } from 'react';
import { Cloud, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { SalesforceCredentials, loginToSalesforce } from '../services/salesforceService';

interface LoginProps {
  onLogin: (username: string, session: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [env, setEnv] = useState<'prod' | 'sandbox'>('prod');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex flex-col h-full bg-white p-8 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto">
        <div className="mt-8 mb-6 text-center">
            <div className="w-16 h-16 bg-sf-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                <Cloud className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Salesforce</h2>
            <p className="text-gray-500 text-sm px-4">Enter your credentials to fetch real-time metadata.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 max-w-xs mx-auto w-full">
            {/* Environment Toggle */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
                <button 
                    type="button"
                    onClick={() => setEnv('prod')}
                    className={`text-sm font-medium py-1.5 rounded-md transition-all ${env === 'prod' ? 'bg-white text-sf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Production
                </button>
                <button 
                    type="button"
                    onClick={() => setEnv('sandbox')}
                    className={`text-sm font-medium py-1.5 rounded-md transition-all ${env === 'sandbox' ? 'bg-white text-sf-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sf-blue"
                    placeholder="Reset via Settings > My Personal Information"
                />
            </div>

            <button
                type="submit"
                disabled={isConnecting}
                className="w-full bg-sf-blue text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-wait mt-4"
            >
                {isConnecting ? (
                    <span className="flex items-center gap-2">
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

            <div className="flex flex-col items-center gap-1 text-center mt-4">
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>SSL Encrypted Connection</span>
                </div>
            </div>
        </form>
    </div>
  );
};

export default Login;
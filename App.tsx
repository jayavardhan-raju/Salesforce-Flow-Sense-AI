import React, { useState, useEffect } from 'react';
import { AppView, GraphData, ProcessMiningConfig } from './types';
import Tutorial from './components/Tutorial';
import Login from './components/Login';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import ProcessDiagramViewer from './components/ProcessDiagramViewer';
import { Settings, User, Moon, LogOut, Sun } from 'lucide-react';
import { MOCK_GRAPH_DATA, MOCK_PROCESS_DATA } from './constants';
import { SalesforceSession } from './services/salesforceService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.TUTORIAL);
  const [username, setUsername] = useState<string>('');
  const [session, setSession] = useState<SalesforceSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // State for the graph data
  const [graphData, setGraphData] = useState<GraphData>(MOCK_GRAPH_DATA);
  
  // State for Process Mining Output
  const [processConfig, setProcessConfig] = useState<ProcessMiningConfig | null>(null);
  const [processData, setProcessData] = useState<GraphData>(MOCK_PROCESS_DATA);

  // Initialize Dark Mode from LocalStorage or System Preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  const handleTutorialComplete = () => {
    setCurrentView(AppView.LOGIN);
  };

  const handleLoginComplete = (user: string, sess: SalesforceSession) => {
      setUsername(user);
      setSession(sess);
      setCurrentView(AppView.SCANNING);
  };

  const handleScanComplete = (data: GraphData) => {
    setGraphData(data);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleProcessMineComplete = (config: ProcessMiningConfig) => {
      setProcessConfig(config);
      // In a real app, we would fetch/generate new data here.
      // For mock purposes, we use MOCK_PROCESS_DATA defined in constants.
      setProcessData(MOCK_PROCESS_DATA);
      setCurrentView(AppView.PROCESS_DIAGRAM);
  };

  const handleLogout = () => {
      setSession(null);
      setUsername('');
      setCurrentView(AppView.LOGIN);
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-slate-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200">
        
        {/* Web App Header - Hide in Process Diagram View to match screenshot (or keep if desired, but screenshot shows different header) */}
        {currentView !== AppView.PROCESS_DIAGRAM && (
            <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm shrink-0 z-50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-sf-blue rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Salesforce FlowSense AI</h1>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-sf-blue dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">Enterprise</span>
                </div>
                
                <div className="flex items-center space-x-3">
                    {/* Username Display */}
                    {username && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-full border border-gray-200 dark:border-slate-600">
                            <div className="w-5 h-5 bg-sf-blue/10 dark:bg-blue-500/20 text-sf-blue dark:text-blue-300 rounded-full flex items-center justify-center">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{username}</span>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors relative"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    
                    {username && (
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
            {currentView === AppView.TUTORIAL && (
                <div className="w-full h-full overflow-hidden">
                    <Tutorial 
                        onComplete={handleTutorialComplete} 
                        onSkip={() => setCurrentView(AppView.LOGIN)}
                    />
                </div>
            )}

            {currentView === AppView.LOGIN && (
                <div className="max-w-4xl mx-auto w-full h-full flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">
                        <Login onLogin={handleLoginComplete} />
                    </div>
                </div>
            )}

            {currentView === AppView.SCANNING && (
                <div className="max-w-4xl mx-auto w-full h-full flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700 p-6">
                        <Scanner 
                            onComplete={handleScanComplete} 
                            username={username}
                            session={session}
                        />
                    </div>
                </div>
            )}

            {currentView === AppView.DASHBOARD && (
                <Dashboard 
                    data={graphData}
                    // Web app is always "maximized" in context of previous logic
                    isMaximized={true}
                    session={session}
                    onProcessMineComplete={handleProcessMineComplete}
                />
            )}

            {currentView === AppView.PROCESS_DIAGRAM && processConfig && (
                <ProcessDiagramViewer
                    data={processData}
                    config={processConfig}
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />
            )}
        </main>
        
        {/* Settings Modal Overlay */}
        {showSettings && (
            <div className="absolute top-16 right-6 z-[60] animate-in fade-in zoom-in-95 duration-100">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-64 overflow-hidden border border-gray-200 dark:border-slate-600">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Settings</h3>
                    </div>
                    <div className="p-2">
                        <button 
                            onClick={toggleDarkMode}
                            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                {darkMode ? (
                                    <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-sf-blue dark:group-hover:text-yellow-400"/>
                                ) : (
                                    <Moon className="w-4 h-4 text-gray-500 group-hover:text-sf-blue"/>
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${darkMode ? 'bg-sf-blue' : 'bg-gray-200 dark:bg-slate-600'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${darkMode ? 'translate-x-3.5' : 'translate-x-0.5'}`}></div>
                            </div>
                        </button>
                    </div>
                </div>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowSettings(false)}></div>
            </div>
        )}
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { AppView, GraphData } from './types';
import Tutorial from './components/Tutorial';
import Login from './components/Login';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import MockSalesforcePage from './components/MockSalesforcePage';
import { Settings, ChevronRight, Pin, PanelLeftClose, X, Moon, Shield, Database, Bell, Maximize2, Minimize2, User } from 'lucide-react';
import { MOCK_GRAPH_DATA } from './constants';
import { SalesforceSession } from './services/salesforceService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.TUTORIAL);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [analysisQuery, setAnalysisQuery] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [session, setSession] = useState<SalesforceSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // State for the graph data, initialized with Mock but replaced by Real scan
  const [graphData, setGraphData] = useState<GraphData>(MOCK_GRAPH_DATA);
  
  // State for record view in background
  const [viewedRecord, setViewedRecord] = useState<{ type: string; data: any } | null>(null);

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

  const toggleCollapse = () => {
    if (isMaximized) setIsMaximized(false);
    setIsCollapsed(!isCollapsed);
  };

  const toggleMaximize = () => {
    if (isCollapsed) setIsCollapsed(false);
    setIsMaximized(!isMaximized);
  };

  const handleExternalAnalyze = (query: string) => {
    setIsCollapsed(false);
    if (isMaximized) setIsMaximized(false); // Restore if analyzing from external
    if (currentView === AppView.TUTORIAL || currentView === AppView.LOGIN) {
        // If external trigger happens before login, we ideally prompt login
        // For smoother UX in this demo flow, we jump to login
        setCurrentView(AppView.LOGIN);
    } else {
        setCurrentView(AppView.DASHBOARD);
    }
    setAnalysisQuery(query); 
  };
  
  const handleViewRecord = (record: any, objectType: string) => {
      setViewedRecord({ type: objectType, data: record });
  };

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden relative">
      
      {/* Background Application (Simulated Salesforce) */}
      <div className="absolute inset-0 z-0">
         <MockSalesforcePage onAnalyze={handleExternalAnalyze} session={session} viewedRecord={viewedRecord} />
      </div>

      {/* Sidebar Extension */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col font-sans text-gray-800 transition-all duration-300 ${isCollapsed ? 'w-[40px]' : isMaximized ? 'w-full md:w-[90vw]' : 'w-[400px] md:w-[25vw] min-w-[350px]'}`}
      >
        {isCollapsed ? (
             <div 
                className="h-full flex flex-col items-center py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={toggleCollapse}
                title="Expand FlowSense AI"
             >
                <div className="transform rotate-90 origin-center whitespace-nowrap mt-12 font-bold text-sf-blue tracking-wider text-sm">
                FLOWSENSE
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-4" />
            </div>
        ) : (
            <>
                {/* Top Toolbar */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-sf-blue rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <h1 className="font-bold text-gray-900 text-sm tracking-tight">FlowSense AI</h1>
                        {isPinned && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-2">Pinned</span>}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        {/* Username Display */}
                        {username && (
                            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-gray-50 rounded-full border border-gray-100 animate-in fade-in">
                                <div className="w-4 h-4 bg-sf-blue/10 text-sf-blue rounded-full flex items-center justify-center">
                                    <User className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 truncate max-w-[100px] hidden sm:block">{username}</span>
                            </div>
                        )}

                        <button 
                            onClick={toggleMaximize}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title={isMaximized ? "Restore" : "Maximize Screen"}
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        <button 
                            onClick={() => setIsPinned(!isPinned)}
                            className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${isPinned ? 'text-sf-blue' : 'text-gray-400'}`}
                            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                        >
                            <Pin className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={toggleCollapse}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative flex flex-col">
                    {currentView === AppView.TUTORIAL && (
                        <Tutorial 
                            onComplete={handleTutorialComplete} 
                            onSkip={() => setCurrentView(AppView.LOGIN)}
                        />
                    )}

                    {currentView === AppView.LOGIN && (
                        <Login onLogin={handleLoginComplete} />
                    )}

                    {currentView === AppView.SCANNING && (
                        <Scanner 
                            onComplete={handleScanComplete} 
                            username={username}
                            session={session}
                        />
                    )}

                    {currentView === AppView.DASHBOARD && (
                        <Dashboard 
                            externalQuery={analysisQuery} 
                            data={graphData}
                            isMaximized={isMaximized}
                            onToggleMaximize={toggleMaximize}
                            session={session}
                            onViewRecord={handleViewRecord}
                        />
                    )}
                </main>

                {/* Footer / Status Bar - Only show if not maximized to save space, or keep consistent */}
                {currentView === AppView.DASHBOARD && !isMaximized && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between items-center shrink-0">
                        <span className="truncate max-w-[150px]" title={username}>User: {username || 'Not Connected'}</span>
                        <span>v1.0.5</span>
                    </div>
                )}
                
                {/* Settings Modal Overlay */}
                {showSettings && (
                    <div className="absolute inset-0 bg-black/20 z-[60] backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> Settings
                                </h3>
                                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded text-gray-600"><Moon className="w-4 h-4"/></div>
                                        <span className="text-sm font-medium text-gray-700">Dark Mode</span>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                {/* ... other settings ... */}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                <button onClick={() => setShowSettings(false)} className="text-xs text-sf-blue font-medium hover:underline">
                                    Restore Defaults
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default App;
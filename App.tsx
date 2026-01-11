import React, { useState } from 'react';
import { AppView } from './types';
import Tutorial from './components/Tutorial';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import MockSalesforcePage from './components/MockSalesforcePage';
import { Settings, X, ChevronRight, Pin, PanelLeftClose } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.TUTORIAL);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [analysisQuery, setAnalysisQuery] = useState<string>('');

  const handleTutorialComplete = () => {
    setCurrentView(AppView.SCANNING);
  };

  const handleScanComplete = () => {
    setCurrentView(AppView.DASHBOARD);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleExternalAnalyze = (query: string) => {
    setIsCollapsed(false);
    // If not scanned yet, we might want to scan first, but for demo let's assume valid state or force dashboard
    // If user is in tutorial, maybe we skip it? Let's force Dashboard for smooth "demo" feel.
    if (currentView === AppView.TUTORIAL) {
        // Quick skip for demo purposes
        setCurrentView(AppView.DASHBOARD);
    } else if (currentView === AppView.SCANNING) {
        // Let scanning finish, but queue query? For now, just switch.
        // Actually, better to let scan finish, but for this specific "Right Click" interaction, 
        // the user expects immediate result.
        setCurrentView(AppView.DASHBOARD);
    } else {
        setCurrentView(AppView.DASHBOARD);
    }
    
    // Create a new string object or use timestamp to ensure effect triggers if query is same
    setAnalysisQuery(query); 
  };

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden relative">
      
      {/* Background Application (Simulated Salesforce) */}
      <div className="absolute inset-0 z-0">
         <MockSalesforcePage onAnalyze={handleExternalAnalyze} />
      </div>

      {/* Sidebar Extension */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col font-sans text-gray-800 transition-all duration-300 ${isCollapsed ? 'w-[40px]' : 'w-[400px] md:w-[25vw] min-w-[350px]'}`}
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
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-sf-blue rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <h1 className="font-bold text-gray-900 text-sm tracking-tight">FlowSense AI</h1>
                        {isPinned && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-2">Pinned</span>}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <button 
                            onClick={() => setIsPinned(!isPinned)}
                            className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${isPinned ? 'text-sf-blue' : 'text-gray-400'}`}
                            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                        >
                            <Pin className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={toggleCollapse}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Collapse"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {currentView === AppView.TUTORIAL && (
                        <Tutorial 
                            onComplete={handleTutorialComplete} 
                            onSkip={() => setCurrentView(AppView.SCANNING)}
                        />
                    )}

                    {currentView === AppView.SCANNING && (
                        <Scanner onComplete={handleScanComplete} />
                    )}

                    {currentView === AppView.DASHBOARD && (
                        <Dashboard externalQuery={analysisQuery} />
                    )}
                </main>

                {/* Footer / Status Bar */}
                {currentView === AppView.DASHBOARD && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between items-center">
                        <span>Org: ProD-NA01</span>
                        <span>v1.0.4</span>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default App;
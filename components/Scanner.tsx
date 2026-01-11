import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, UserCircle, AlertTriangle } from 'lucide-react';
import { ScanStep, GraphData } from '../types';
import { fetchOrgGraphData, SalesforceSession } from '../services/salesforceService';
import { MOCK_GRAPH_DATA } from '../constants';

interface ScannerProps {
  onComplete: (data: GraphData) => void;
  username?: string;
  session?: SalesforceSession | null;
}

const Scanner: React.FC<ScannerProps> = ({ onComplete, username, session }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ScanStep[]>([
    { id: '1', label: 'Initializing Session...', status: 'pending' },
    { id: '2', label: 'Fetching Objects', status: 'pending', count: 0 },
    { id: '3', label: 'Analyzing Flows', status: 'pending', count: 0 },
    { id: '4', label: 'Mapping Triggers', status: 'pending', count: 0 },
    { id: '5', label: 'Scanning Apex & Components', status: 'pending', count: 0 },
    { id: '6', label: 'Scanning Validation Rules', status: 'pending', count: 0 },
    { id: '7', label: 'Building Dependency Graph', status: 'pending' },
  ]);

  useEffect(() => {
    runScan();
  }, []);

  const runScan = async () => {
        if (!session) {
            // Should not happen in real login flow unless bypassed
            setError("No active session found.");
            return;
        }

        setError(null);
        setProgress(0);
        setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

        try {
            updateStep('1', 'scanning');
            // Add slight delay for visual UX
            await new Promise(r => setTimeout(r, 500));
            updateStep('1', 'completed');
            setProgress(10);

            const data = await fetchOrgGraphData(session, (msg) => {
                // Determine which step corresponds to the message
                if (msg.includes('Objects')) { updateStep('2', 'scanning'); setProgress(20); }
                if (msg.includes('Flows')) { updateStep('2', 'completed'); updateStep('3', 'scanning'); setProgress(35); }
                if (msg.includes('Triggers')) { updateStep('3', 'completed'); updateStep('4', 'scanning'); setProgress(50); }
                if (msg.includes('Apex') || msg.includes('LWC') || msg.includes('Aura')) { updateStep('4', 'completed'); updateStep('5', 'scanning'); setProgress(65); }
                if (msg.includes('Validation') || msg.includes('Rules')) { updateStep('5', 'completed'); updateStep('6', 'scanning'); setProgress(80); }
                if (msg.includes('Mapping Fields')) { updateStep('6', 'completed'); updateStep('7', 'scanning'); setProgress(90); }
            });

            // Mark all as complete
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
            setProgress(100);
            
            setTimeout(() => {
                onComplete(data);
            }, 800);

        } catch (err: any) {
            console.error("Scan failed", err);
            setError(err.message || "Failed to fetch metadata. Check CORS or Permissions.");
        }
    };

    const updateStep = (id: string, status: 'pending' | 'scanning' | 'completed') => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    const handleLoadDemo = () => {
        onComplete(MOCK_GRAPH_DATA);
    };

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
              <div className="bg-red-100 p-4 rounded-full mb-4 shadow-sm">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Scan Failed</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{error}</p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button 
                    onClick={runScan} 
                    className="w-full bg-sf-blue text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors font-medium"
                  >
                      Try Again
                  </button>
                  
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-gray-400">Unable to connect?</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button 
                    onClick={handleLoadDemo} 
                    className="w-full bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                      Load Demo Data (Offline Mode)
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
      
      {/* Connected User Badge */}
      {username && (
         <div className="mb-8 flex items-center gap-2 bg-blue-50 text-sf-blue px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <UserCircle className="w-3.5 h-3.5" />
            <span>Scanning as {username}</span>
         </div>
      )}

      <div className="relative mb-8">
        {/* Circular Progress */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="transparent"
            stroke="#0176D3"
            strokeWidth="8"
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-sf-text">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-3 text-sm">
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : step.status === 'scanning' ? (
              <Loader2 className="w-5 h-5 text-sf-blue animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
            )}
            
            <span className={`${step.status === 'pending' ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanner;
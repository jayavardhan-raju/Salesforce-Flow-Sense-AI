import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ScanStep } from '../types';

interface ScannerProps {
  onComplete: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ScanStep[]>([
    { id: '1', label: 'Connecting to Salesforce APIs...', status: 'pending' },
    { id: '2', label: 'Fetching Objects', status: 'pending', count: 0 },
    { id: '3', label: 'Analyzing Flows', status: 'pending', count: 0 },
    { id: '4', label: 'Mapping Triggers', status: 'pending', count: 0 },
    { id: '5', label: 'Scanning Validation Rules', status: 'pending', count: 0 },
    { id: '6', label: 'Building Dependency Graph', status: 'pending' },
  ]);

  useEffect(() => {
    // Simulate scanning process
    const totalDuration = 4000; // 4 seconds for demo
    const intervalTime = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalTime;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(pct);

      // Update steps based on progress
      setSteps(prev => prev.map((step, idx) => {
        const stepThreshold = (idx + 1) * (100 / prev.length);
        if (pct >= stepThreshold) {
          return { ...step, status: 'completed', count: step.count ? step.count : Math.floor(Math.random() * 50) + 10 };
        } else if (pct >= stepThreshold - 15) {
          return { ...step, status: 'scanning' };
        }
        return step;
      }));

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setTimeout(onComplete, 500); // Slight delay before finishing
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
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
              {step.label} {step.status === 'completed' && step.count ? `(${step.count} found)` : ''}
            </span>
          </div>
        ))}
      </div>
      
      <p className="mt-8 text-xs text-gray-500 animate-pulse">Est. time remaining: {Math.max(0, 4 - Math.floor((progress / 100) * 4))}s</p>
    </div>
  );
};

export default Scanner;
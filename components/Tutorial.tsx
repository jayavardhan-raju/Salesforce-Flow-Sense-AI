import React from 'react';
import { ChevronRight, Database, MessageSquare, Activity, Scan, GitMerge, Network } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  
  const getIcon = (iconName: string) => {
      switch(iconName) {
          case 'Scan': return Scan;
          case 'GitMerge': return GitMerge;
          case 'Network': return Network;
          default: return Database;
      }
  }

  return (
    <div className="flex flex-col h-full bg-white p-8 overflow-y-auto">
      {/* Header */}
      <div className="mt-4 mb-8 text-center">
        <div className="w-12 h-12 bg-sf-blue rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">F</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to FlowSense AI</h1>
        <p className="text-gray-500 max-w-lg mx-auto">Your AI-powered Salesforce Architect assistant. Visualize, analyze, and optimize your org's metadata in minutes.</p>
      </div>

      {/* Grid of Steps */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto w-full">
        {TUTORIAL_STEPS.map((step, idx) => {
            const Icon = getIcon(step.icon);
            return (
                <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-sf-blue/30 hover:shadow-md transition-all group flex flex-col">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        <Icon className="w-6 h-6 text-sf-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                        {step.description}
                    </p>
                </div>
            );
        })}
      </div>

      {/* Controls */}
      <div className="mt-auto max-w-md mx-auto w-full">
        <button
          onClick={onComplete}
          className="w-full bg-sf-blue text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center group text-lg"
        >
          Got It, Let's Scan!
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
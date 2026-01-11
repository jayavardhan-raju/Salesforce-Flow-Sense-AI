import React, { useState } from 'react';
import { ChevronRight, Database, MessageSquare, Activity } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(0);

  const icons = [Database, MessageSquare, Activity];
  const CurrentIcon = icons[step];

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-8">
      {/* Header */}
      <div className="mt-8 mb-8 text-center">
        <div className="w-16 h-16 bg-sf-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CurrentIcon className="w-8 h-8 text-sf-blue animate-bounce-subtle" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{TUTORIAL_STEPS[step].title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed px-4">{TUTORIAL_STEPS[step].description}</p>
      </div>

      {/* Visual Placeholder (Mock Animation Area) */}
      <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center mb-8 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {step === 0 && (
            <div className="flex flex-col gap-2 opacity-50">
                <div className="h-2 w-32 bg-gray-200 rounded"></div>
                <div className="h-2 w-24 bg-gray-200 rounded"></div>
                <div className="h-2 w-28 bg-gray-200 rounded"></div>
            </div>
        )}
        {step === 1 && (
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 max-w-[180px]">
                <div className="h-2 w-full bg-gray-100 rounded mb-2"></div>
                <div className="h-2 w-2/3 bg-sf-blue/20 rounded"></div>
            </div>
        )}
        {step === 2 && (
             <div className="relative w-24 h-24">
                <div className="absolute top-0 left-10 w-3 h-3 bg-sf-blue rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-orange-400 rounded-sm"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 rounded-full"></div>
                <svg className="absolute inset-0 w-full h-full">
                    <line x1="46" y1="6" x2="6" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="54" y1="6" x2="90" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
             </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto">
        <div className="flex justify-center space-x-2 mb-6">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-sf-blue' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-sf-blue text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center group"
        >
          {step === TUTORIAL_STEPS.length - 1 ? "Got It, Let's Scan!" : "Next"}
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <button
          onClick={onSkip}
          className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 font-medium py-2 transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
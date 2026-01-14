import React from 'react';
import { ChevronRight, Database, Scan, GitMerge, Network, ArrowRight, Zap, Layers } from 'lucide-react';
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
    <div className="h-full w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-y-auto relative">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col h-full justify-center min-h-[600px]">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 text-sf-blue dark:text-blue-300 border border-blue-100 dark:border-blue-700 shadow-sm text-xs font-bold uppercase tracking-wider mb-8">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Next-Gen Salesforce Architecture</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                Turn Metadata into <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sf-blue to-purple-600">Architectural Clarity</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
                Visualize dependencies, mine business processes, and perform AI-driven impact analysis across your entire Salesforce Org.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={onComplete}
                    className="px-8 py-4 bg-sf-blue text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 group"
                >
                    Launch Salesforce FlowSense AI
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                     onClick={() => window.open('https://admin.salesforce.com', '_blank')}
                     className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-lg font-bold rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                    View Documentation
                </button>
            </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            {TUTORIAL_STEPS.map((step, idx) => {
                const Icon = getIcon(step.icon);
                return (
                    <div 
                        key={idx} 
                        className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="w-7 h-7 text-sf-blue dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-sf-blue transition-colors">
                            {step.title}
                        </h3>
                        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                );
            })}
        </div>

        {/* Stats / Trust Banner */}
        <div className="mt-20 pt-10 border-t border-gray-200/60 dark:border-slate-700 flex flex-wrap justify-center gap-12 md:gap-24 opacity-70 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                 </div>
                 <div>
                     <div className="text-sm font-bold text-gray-900 dark:text-white">Metadata API</div>
                     <div className="text-xs text-gray-500">Full Coverage</div>
                 </div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <GitMerge className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                 </div>
                 <div>
                     <div className="text-sm font-bold text-gray-900 dark:text-white">Process Mining</div>
                     <div className="text-xs text-gray-500">Auto-Discovery</div>
                 </div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Network className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                 </div>
                 <div>
                     <div className="text-sm font-bold text-gray-900 dark:text-white">Gemini 1.5 Pro</div>
                     <div className="text-xs text-gray-500">AI Powered</div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Tutorial;
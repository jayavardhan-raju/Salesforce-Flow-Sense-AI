import React, { useState } from 'react';
import { ExecutionPath, ExecutionStep } from '../types';
import { X, PlayCircle, GitBranch, ArrowDown, Database, Code, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface ExecutionPathViewerProps {
    path: ExecutionPath;
    onClose: () => void;
}

const ExecutionPathViewer: React.FC<ExecutionPathViewerProps> = ({ path, onClose }) => {
    const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null);

    const getIcon = (type: ExecutionStep['type']) => {
        switch (type) {
            case 'Start': return <PlayCircle className="w-5 h-5 text-green-600" />;
            case 'Decision': return <GitBranch className="w-5 h-5 text-orange-500" />;
            case 'RecordUpdate': return <Database className="w-5 h-5 text-blue-600" />;
            case 'ApexAction': return <Code className="w-5 h-5 text-slate-600" />;
            case 'SubFlow': return <Zap className="w-5 h-5 text-purple-600" />;
            case 'End': return <CheckCircle className="w-5 h-5 text-gray-400" />;
            default: return <ArrowRight className="w-5 h-5 text-gray-500" />;
        }
    };

    const StepNode: React.FC<{ step: ExecutionStep, isLast?: boolean }> = ({ step, isLast }) => (
        <div className="flex flex-col items-center relative group">
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute top-10 bottom-[-24px] w-0.5 bg-gray-200 z-0"></div>
            )}
            
            <div 
                onClick={() => setSelectedStep(step)}
                className={`
                    relative z-10 w-64 bg-white border rounded-lg shadow-sm p-3 cursor-pointer transition-all duration-200
                    ${selectedStep?.id === step.id ? 'border-sf-blue ring-1 ring-sf-blue shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow'}
                    ${step.issues && step.issues.length > 0 ? 'border-l-4 border-l-red-400' : ''}
                `}
            >
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 bg-gray-50 p-1.5 rounded-md">
                        {getIcon(step.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{step.label}</h4>
                            {step.outcome && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium ml-1 shrink-0">
                                    {step.outcome}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{step.description}</p>
                        {step.issues && step.issues.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-red-600 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{step.issues.length} Issue(s) Detected</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Down Arrow */}
            {!isLast && (
                <div className="h-6 flex items-center justify-center relative z-10">
                    <ArrowDown className="w-4 h-4 text-gray-300" />
                </div>
            )}
        </div>
    );

    // Simple renderer for a linear path (mock data is mostly linear for simplicity)
    // A real implementation would traverse the graph recursively.
    // Here we just map the mock steps in order for the demo.
    const renderPath = () => {
        return (
            <div className="flex flex-col items-center py-8 space-y-0">
                {path.steps.map((step, idx) => {
                    // Logic to handle simple branching display for the mock
                    // If we were fully parsing 'next', we'd need a recursive tree renderer.
                    // For the prompt's request of "detailed visualization", a linear representation of the "happy path" or "trace" is often used in debug logs.
                    // We will render the linear sequence provided in the mock.
                    return (
                        <StepNode 
                            key={step.id} 
                            step={step} 
                            isLast={idx === path.steps.length - 1} 
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-slate-50 z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Zap className="w-4 h-4" />
                        <span>Execution Path Reconstruction</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{path.flowName}</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Visualization Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20 relative">
                     {/* Background Grid Pattern */}
                     <div className="absolute inset-0 opacity-[0.03]" 
                          style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                     </div>
                     
                     {renderPath()}
                </div>

                {/* Right Detail Panel */}
                <div className={`w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto transition-transform duration-300 ${selectedStep ? 'translate-x-0' : 'translate-x-full hidden md:block'}`}>
                    {selectedStep ? (
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 text-sf-blue rounded-lg">
                                    {getIcon(selectedStep.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedStep.label}</h3>
                                    <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">{selectedStep.type}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                                        {selectedStep.description}
                                    </p>
                                </div>

                                {selectedStep.meta && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Configuration</h4>
                                        <div className="bg-gray-50 rounded-md border border-gray-100 overflow-hidden">
                                            {Object.entries(selectedStep.meta).map(([key, val]) => (
                                                <div key={key} className="flex border-b border-gray-100 last:border-0">
                                                    <div className="w-1/3 bg-gray-100/50 p-2 text-xs font-medium text-gray-500 border-r border-gray-100 truncate">
                                                        {key}
                                                    </div>
                                                    <div className="w-2/3 p-2 text-xs font-mono text-gray-700 break-all">
                                                        {JSON.stringify(val).replace(/"/g, '')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedStep.issues && selectedStep.issues.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-right-2">
                                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Potential Issues
                                        </h4>
                                        <div className="bg-red-50 border border-red-100 rounded-md p-3 space-y-2">
                                            {selectedStep.issues.map((issue, i) => (
                                                <div key={i} className="flex gap-2 text-xs text-red-800">
                                                    <span className="shrink-0">•</span>
                                                    <span>{issue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Next Steps</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedStep.next && selectedStep.next.length > 0 ? (
                                            selectedStep.next.map(nextId => (
                                                <span key={nextId} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                                    {nextId}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">End of path</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <GitBranch className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Select a step in the execution path to view configuration details and potential issues.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExecutionPathViewer;
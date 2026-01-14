import React, { useState } from 'react';
import { ProcessMiningConfig } from '../types';
import { WIZARD_OBJECTS, WIZARD_RECORD_TYPES, WIZARD_PICKLISTS } from '../constants';
import { ArrowRight, Check, Search, GitMerge, Loader2, Database, ListFilter, Sliders } from 'lucide-react';

interface ProcessMiningWizardProps {
    onComplete: (config: ProcessMiningConfig) => void;
    onCancel: () => void;
}

const ProcessMiningWizard: React.FC<ProcessMiningWizardProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<ProcessMiningConfig>({
        question: '',
        diagramName: '',
        selectedObject: '',
        recordType: '',
        picklistField: ''
    });
    const [isMining, setIsMining] = useState(false);
    const [miningStatus, setMiningStatus] = useState('');

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleGenerate = async () => {
        setIsMining(true);
        // Simulate the analysis steps mentioned in the PDF
        const statuses = [
            "Analyzing Object Configuration...",
            "Traversing Metadata Relationships...",
            "Identifying Record-Triggered Flows...",
            "Mapping Validation Rules to Stages...",
            "Inferring User Roles from Permissions...",
            "Generating Business Process Diagram..."
        ];

        for (const status of statuses) {
            setMiningStatus(status);
            await new Promise(r => setTimeout(r, 800)); // Simulate work
        }

        onComplete(config);
    };

    const renderStep1 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata Dictionary</label>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" disabled>
                    <option>Current Org (Salesforce Production)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">You are analyzing the currently connected environment.</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Natural Language Question</label>
                <textarea 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-sf-blue focus:border-transparent min-h-[80px]"
                    placeholder="e.g., How do we manage sales opportunities? or What is the case resolution process?"
                    value={config.question}
                    onChange={(e) => setConfig({...config, question: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagram Name</label>
                <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-sf-blue focus:border-transparent"
                    placeholder="e.g., Opportunity Sales Process"
                    value={config.diagramName}
                    onChange={(e) => setConfig({...config, diagramName: e.target.value})}
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start gap-3">
                <Search className="w-5 h-5 text-sf-blue shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-sf-blue">AI Suggestion</h4>
                    <p className="text-xs text-gray-700 mt-1">Based on your question "{config.question}", we identified <strong>Opportunity</strong> as the most likely object to analyze.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Core Object</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {WIZARD_OBJECTS.map(obj => (
                        <div 
                            key={obj}
                            onClick={() => setConfig({...config, selectedObject: obj})}
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all ${config.selectedObject === obj ? 'bg-sf-blue text-white border-sf-blue shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4" />
                                <span className="text-sm font-medium">{obj}</span>
                            </div>
                            {config.selectedObject === obj && <Check className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <p className="text-sm text-gray-600">
                Narrow the generated process to a specific record type. This ensures the diagram accurately reflects status transitions and automations specific to that type.
            </p>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Record Type</label>
                 <div className="grid grid-cols-1 gap-2">
                    {WIZARD_RECORD_TYPES.map(rt => (
                        <div 
                            key={rt}
                            onClick={() => setConfig({...config, recordType: rt})}
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all ${config.recordType === rt ? 'bg-sf-blue text-white border-sf-blue shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <ListFilter className="w-4 h-4" />
                                <span className="text-sm font-medium">{rt}</span>
                            </div>
                            {config.recordType === rt && <Check className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-yellow-700">Lifecycle Driver</h4>
                    <p className="text-xs text-yellow-800 mt-1">Select the controlling picklist field you would like to use as the basis for the lifecycle analysis (e.g., Stage, Status).</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Picklist Field</label>
                <div className="grid grid-cols-1 gap-2">
                    {WIZARD_PICKLISTS.map(field => (
                        <div 
                            key={field}
                            onClick={() => setConfig({...config, picklistField: field})}
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all ${config.picklistField === field ? 'bg-sf-blue text-white border-sf-blue shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs">{field}</span>
                            </div>
                            {config.picklistField === field && <Check className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (isMining) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-sf-blue rounded-full border-t-transparent animate-spin"></div>
                        <GitMerge className="absolute inset-0 m-auto text-sf-blue w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Mining Business Process</h3>
                    <p className="text-sm text-gray-500 min-h-[20px]">{miningStatus}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <GitMerge className="w-5 h-5 text-sf-blue" />
                            Mine Business Process
                        </h2>
                        <p className="text-xs text-gray-500">Auto-generate object lifecycle diagrams from configuration.</p>
                    </div>
                    <div className="text-xs font-bold text-gray-400">Step {step} of 4</div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    
                    <div className="flex gap-3">
                         {step > 1 && (
                            <button 
                                onClick={() => setStep(prev => prev - 1)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                         )}
                         <button 
                            onClick={step === 4 ? handleGenerate : handleNext}
                            disabled={(step === 1 && !config.question) || (step === 2 && !config.selectedObject) || (step === 3 && !config.recordType) || (step === 4 && !config.picklistField)}
                            className="px-6 py-2 text-sm font-bold text-white bg-sf-blue rounded shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            {step === 4 ? 'Generate Diagram' : 'Next'}
                            {step !== 4 && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessMiningWizard;
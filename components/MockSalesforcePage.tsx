import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit, Search, Save, AlertCircle, X } from 'lucide-react';

interface MockSalesforcePageProps {
  onAnalyze: (query: string) => void;
}

const MockSalesforcePage: React.FC<MockSalesforcePageProps> = ({ onAnalyze }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldLabel: string; fieldValue: string } | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, label: string, value: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fieldLabel: label,
      fieldValue: value
    });
  };

  const handleAnalyzeClick = () => {
    if (contextMenu) {
      onAnalyze(`Analyze the impact of modifying the ${contextMenu.fieldLabel} field on ${contextMenu.fieldValue}`);
      setContextMenu(null);
    }
  };

  const handleSave = () => {
    // Simulate a validation error
    setShowError(true);
  };

  const handleExplainError = () => {
    onAnalyze("Explain why the validation rule 'Close_Date_Rule' is failing for this record.");
    // Don't close error immediately so user sees context, or close it? Let's keep it.
  };

  const Field: React.FC<{ label: string; value: string; isLink?: boolean }> = ({ label, value, isLink }) => (
    <div 
      className="p-1 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-default transition-colors group relative"
      onContextMenu={(e) => handleContextMenu(e, label, value)}
    >
      <div className="text-[11px] text-gray-500 mb-0.5">{label}</div>
      <div className={`text-sm ${isLink ? 'text-sf-blue hover:underline cursor-pointer' : 'text-gray-900'} font-normal border-b border-gray-300 pb-0.5 border-dashed group-hover:border-solid`}>
        {value}
        <Edit className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#f3f3f3] p-4 overflow-y-auto" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Error Banner Simulation */}
      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-lg w-full flex items-start gap-3 animate-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
                <h3 className="text-sm font-bold">We hit a snag.</h3>
                <p className="text-sm mt-1">Review the errors on this page.</p>
                <div className="mt-2 text-sm bg-white/50 p-2 rounded border border-red-100">
                    <span className="font-semibold">Close Date:</span> Validation Rule "Close_Date_Rule" failed. Date cannot be in the past.
                </div>
                <button 
                    onClick={handleExplainError}
                    className="mt-2 text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 font-medium flex items-center gap-2"
                >
                    <Search className="w-3 h-3" />
                    Explain with FlowSense
                </button>
            </div>
            <button onClick={() => setShowError(false)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
            </button>
        </div>
      )}

      {/* Salesforce-style Header */}
      <div className="bg-white border border-gray-200 rounded-t-lg p-4 shadow-sm mb-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Opportunity</div>
              <h1 className="text-xl font-bold text-gray-900">Edge Installation</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-white border border-gray-300 text-sf-blue text-sm font-medium rounded hover:bg-gray-50">Edit</button>
            <button className="px-4 py-1.5 bg-white border border-gray-300 text-sf-blue text-sm font-medium rounded hover:bg-gray-50">Clone</button>
            <button 
                onClick={handleSave}
                className="px-4 py-1.5 bg-sf-blue text-white border border-transparent text-sm font-medium rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
                <Save className="w-4 h-4" /> Save
            </button>
            <button className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
                <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Highlights Panel */}
        <div className="flex gap-8 mt-6 pb-2">
             <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Account Name</div>
                <div className="text-sm text-sf-blue hover:underline cursor-pointer">Edge Communications</div>
             </div>
             <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Close Date</div>
                <div className="text-sm text-gray-900">12/25/2025</div>
             </div>
             <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Amount</div>
                <div className="text-sm text-gray-900">$125,000.00</div>
             </div>
             <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Stage</div>
                <div className="text-sm text-gray-900">Negotiation/Review</div>
             </div>
             <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Owner</div>
                <div className="text-sm text-sf-blue hover:underline cursor-pointer">Sarah Admin</div>
             </div>
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[500px]">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
            <h2 className="text-sm font-bold text-gray-800">Details</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6">
            <Field label="Opportunity Name" value="Edge Installation" />
            <Field label="Amount" value="$125,000.00" />
            
            <Field label="Account Name" value="Edge Communications" isLink />
            <Field label="Close Date" value="12/25/2025" />
            
            <Field label="Stage" value="Negotiation/Review" />
            <Field label="Probability (%)" value="90%" />
            
            <Field label="Type" value="New Customer" />
            <Field label="Lead Source" value="Web" />

            <Field label="Next Step" value="Call to finalize" />
            <Field label="Expected Revenue" value="$112,500.00" />
            
            <div className="col-span-2 border-t border-gray-100 my-2"></div>
            
            <Field label="Order Number" value="ORD-00123" />
            <Field label="Tracking Number" value="TRK-998877" />
            
            <Field label="Installation Status" value="Pending" />
            <Field label="Delivery Date" value="12/30/2025" />
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
            className="fixed z-[100] bg-white border border-gray-200 shadow-xl rounded-md py-1 w-56 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-medium truncate">
                Field: {contextMenu.fieldLabel}
            </div>
            <button 
                onClick={handleAnalyzeClick}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors"
            >
                <Search className="w-4 h-4" />
                Analyze with FlowSense
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Inspect Element
            </button>
        </div>
      )}
    </div>
  );
};

export default MockSalesforcePage;
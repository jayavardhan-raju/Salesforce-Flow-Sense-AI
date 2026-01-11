import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit, Search, Save, AlertCircle, X, ExternalLink, Sparkles, Users, Briefcase, FileText, Layout, GitMerge, Clock } from 'lucide-react';
import { SalesforceSession } from '../services/salesforceService';

interface MockSalesforcePageProps {
  onAnalyze: (query: string) => void;
  session?: SalesforceSession | null;
  viewedRecord?: { type: string; data: any } | null;
}

const MockSalesforcePage: React.FC<MockSalesforcePageProps> = ({ onAnalyze, session, viewedRecord }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldLabel: string; fieldValue: string; apiName?: string } | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, label: string, value: string, apiName?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fieldLabel: label,
      fieldValue: value,
      apiName
    });
  };

  const handleAnalyzeClick = () => {
    if (contextMenu) {
      const fieldName = contextMenu.apiName || contextMenu.fieldLabel.replace(/\s+/g, '');
      const objectName = viewedRecord ? viewedRecord.type : 'Opportunity';
      onAnalyze(`Analyze the dependencies and impact of modifying the '${fieldName}' field on the '${objectName}' object.`);
      setContextMenu(null);
    }
  };

  const handleSave = () => {
    setShowError(true);
  };

  const handleExplainError = () => {
    onAnalyze("Explain why the validation rule 'Close_Date_Rule' is failing on Opportunity.");
  };

  const getObjectSetupLink = (objName: string) => {
      if (!session) return '#';
      return `${session.instanceUrl}/lightning/setup/ObjectManager/${objName}/Details/view`;
  };

  const getFieldSetupLink = (objName: string, fieldApiName: string) => {
      if (!session) return '#';
      return `${session.instanceUrl}/lightning/setup/ObjectManager/${objName}/FieldsAndRelationships/${fieldApiName}/view`;
  };

  const Field: React.FC<{ label: string; value: string; apiName?: string; isLink?: boolean }> = ({ label, value, apiName, isLink }) => {
    const objectName = viewedRecord ? viewedRecord.type : 'Opportunity';
    const inferredApiName = apiName || label.replace(/\s+/g, ''); 
    const setupLink = getFieldSetupLink(objectName, inferredApiName);

    return (
        <div 
        className="p-1 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-default transition-colors group relative"
        onContextMenu={(e) => handleContextMenu(e, label, value, inferredApiName)}
        >
        <div className="flex justify-between items-center mb-0.5">
            <div className="text-[11px] text-gray-500 truncate" title={label}>{label}</div>
            {session && (
                <a 
                    href={setupLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-sf-blue transition-opacity"
                    title="Open Field in Setup"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}
        </div>
        <div className={`text-sm ${isLink ? 'text-sf-blue hover:underline cursor-pointer' : 'text-gray-900'} font-normal border-b border-gray-300 pb-0.5 border-dashed group-hover:border-solid relative truncate min-h-[20px]`}>
            {value}
            <Edit className="w-3 h-3 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none" />
        </div>
        </div>
    );
  };

  // Generate Summary Narrative
  const getSummaryNarrative = () => {
      const type = viewedRecord?.type || 'Opportunity';
      const data = viewedRecord?.data || {};
      const name = data.Name || (type === 'Opportunity' ? 'Edge Installation' : 'Record');
      
      // Simulate discovering related data
      if (type === 'Opportunity') {
          return (
              <span>
                  <strong>{name}</strong> is a high-value opportunity linked to the <strong>Edge Communications</strong> account. 
                  It is currently in the <strong>{data.StageName || 'Negotiation'}</strong> stage. 
                  <br/><br/>
                  This record is related to <strong>2 Projects</strong> and has <strong>3 Open Cases</strong> (including 1 critical billing issue). 
                  Data dependencies indicate downstream impacts on <strong>Revenue Forecasts</strong>.
              </span>
          );
      } 
      if (type === 'Account') {
          return (
              <span>
                  <strong>{name}</strong> is a strategic account with <strong>5 Related Opportunities</strong> and <strong>12 Active Contacts</strong>. 
                  <br/><br/>
                  Recent activity logs show frequent interactions regarding <strong>SLA renewals</strong>. 
                  This record is a parent to <strong>3 Subsidiary Accounts</strong>.
              </span>
          );
      }
      return (
          <span>
              <strong>{name}</strong> is a <strong>{type}</strong> record. 
              <br/><br/>
              It has direct relationships with <strong>4 other objects</strong> and is referenced by <strong>2 Apex Triggers</strong>.
              Check related lists for specific case and contact details.
          </span>
      );
  };

  // Render logic for dynamic record
  const renderRecordContent = () => {
      if (viewedRecord) {
          const { data } = viewedRecord;
          // Flatten simple nested objects for display if needed, or just iterate top keys
          const entries = Object.entries(data).filter(([key]) => key !== 'attributes');
          
          return (
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 {entries.map(([key, val]) => {
                     let displayVal = String(val);
                     if (typeof val === 'object' && val !== null) {
                        displayVal = '[Complex Object]'; 
                        // Simple check for standard relationship name
                        if ('Name' in val) displayVal = (val as any).Name;
                     }
                     return (
                         <Field key={key} label={key} value={displayVal} apiName={key} isLink={key.toLowerCase().endsWith('id')} />
                     );
                 })}
             </div>
          );
      }

      // Default Static Layout
      return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <Field label="Opportunity Name" value="Edge Installation" apiName="Name" />
            <Field label="Amount" value="$125,000.00" apiName="Amount" />
            
            <Field label="Account Name" value="Edge Communications" apiName="AccountId" isLink />
            <Field label="Close Date" value="12/25/2025" apiName="CloseDate" />
            
            <Field label="Stage" value="Negotiation/Review" apiName="StageName" />
            <Field label="Probability (%)" value="90%" apiName="Probability" />
            
            <Field label="Type" value="New Customer" apiName="Type" />
            <Field label="Lead Source" value="Web" apiName="LeadSource" />

            <Field label="Next Step" value="Call to finalize" apiName="NextStep" />
            <Field label="Expected Revenue" value="$112,500.00" apiName="ExpectedRevenue" />
            
            <div className="col-span-2 border-t border-gray-100 my-2"></div>
            
            <Field label="Order Number" value="ORD-00123" apiName="OrderNumber__c" />
            <Field label="Tracking Number" value="TRK-998877" apiName="TrackingNumber__c" />
            
            <Field label="Installation Status" value="Pending" apiName="InstallationStatus__c" />
            <Field label="Delivery Date" value="12/30/2025" apiName="DeliveryDate__c" />
        </div>
      );
  };

  const getTitle = () => {
      if (viewedRecord) {
          return viewedRecord.data.Name || viewedRecord.data.Id || 'Record Detail';
      }
      return 'Edge Installation';
  };

  const getIconPath = () => {
      if (viewedRecord?.type === 'Account') return "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"; // Building
      if (viewedRecord?.type === 'Contact') return "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"; // People
      return "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"; // Default building/opp-like
  };

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
            <div className={`w-10 h-10 ${viewedRecord ? 'bg-sf-blue' : 'bg-orange-500'} rounded flex items-center justify-center shadow-sm`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath()} /></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                  {viewedRecord ? viewedRecord.type : 'Opportunity'}
                  {session && (
                      <a href={getObjectSetupLink(viewedRecord ? viewedRecord.type : 'Opportunity')} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sf-blue" title="Go to Object Manager">
                          <ExternalLink className="w-3 h-3" />
                      </a>
                  )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{getTitle()}</h1>
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
        
        {/* Highlights Panel - Simplified for generic view */}
        <div className="flex gap-8 mt-6 pb-2 overflow-x-auto">
             {viewedRecord ? (
                 // Dynamically show first few fields as highlights
                 Object.entries(viewedRecord.data).slice(0, 5).map(([k, v]) => (
                    <div key={k} className="flex-shrink-0">
                        <div className="text-xs text-gray-500 uppercase tracking-wide truncate max-w-[150px]">{k}</div>
                        <div className="text-sm text-gray-900 truncate max-w-[150px]">{String(v)}</div>
                    </div>
                 ))
             ) : (
                <>
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
                </>
             )}
        </div>
      </div>

      {/* Main Content Grid: Details + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[500px]">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
                    <h2 className="text-sm font-bold text-gray-800">Details</h2>
                </div>
                {renderRecordContent()}
            </div>
        </div>

        {/* Right Column: Relationship Summary */}
        <div className="lg:col-span-1 space-y-4">
             <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> 
                        Relationship Summary
                    </h3>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-700 leading-relaxed mb-6">
                        {getSummaryNarrative()}
                    </p>

                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <GitMerge className="w-3 h-3" /> Related Data
                    </h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-orange-500" />
                                <span className="text-sm text-gray-700 group-hover:text-sf-blue">Cases</span>
                             </div>
                             <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">3 Open</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-sf-blue" />
                                <span className="text-sm text-gray-700 group-hover:text-sf-blue">Contacts</span>
                             </div>
                             <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">5 Active</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-700 group-hover:text-sf-blue">Projects</span>
                             </div>
                             <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">2 Pending</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700 group-hover:text-sf-blue">Files</span>
                             </div>
                             <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">8 Attached</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Recent Activity
                        </h4>
                        <div className="space-y-3 relative before:absolute before:left-1.5 before:top-1 before:bottom-0 before:w-px before:bg-gray-200">
                             <div className="relative pl-5">
                                 <div className="absolute left-0 top-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                 <div className="text-xs font-medium text-gray-800">Email sent to Jane Doe</div>
                                 <div className="text-[10px] text-gray-500">Today, 9:45 AM</div>
                             </div>
                             <div className="relative pl-5">
                                 <div className="absolute left-0 top-1.5 w-3 h-3 bg-sf-blue rounded-full border-2 border-white"></div>
                                 <div className="text-xs font-medium text-gray-800">Stage changed to Negotiation</div>
                                 <div className="text-[10px] text-gray-500">Yesterday, 4:20 PM</div>
                             </div>
                              <div className="relative pl-5">
                                 <div className="absolute left-0 top-1.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                                 <div className="text-xs font-medium text-gray-800">New Task: Follow up call</div>
                                 <div className="text-[10px] text-gray-500">Dec 12, 11:00 AM</div>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
            className="fixed z-[100] bg-white border border-gray-200 shadow-xl rounded-md py-1 w-64 animate-in fade-in zoom-in-95 duration-100"
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
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Graph from './Graph';
import ChatInterface from './ChatInterface';
import QueryInspector from './QueryInspector';
import ExecutionPathViewer from './ExecutionPathViewer';
import ProcessMiningWizard from './ProcessMiningWizard';
import { GraphData, GraphNode, ExecutionPath, ProcessMiningConfig } from '../types';
import { SalesforceSession } from '../services/salesforceService';
import { MOCK_EXECUTION_PATH } from '../constants';
import { Box, Workflow, Zap, Search, Activity, X, Info, MessageSquare, ChevronUp, ChevronDown, ExternalLink, List, FileText, Database, GripVertical, GripHorizontal, GitMerge, Layout, Settings2 } from 'lucide-react';

interface DashboardProps {
    externalQuery?: string;
    data: GraphData;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
    session?: SalesforceSession | null;
    onViewRecord?: (record: any, objectType: string) => void;
    onProcessMineComplete: (config: ProcessMiningConfig) => void; // Added prop
}

// Define trigger type for chat
interface ChatTrigger {
    text: string;
    id: number;
}

const Dashboard: React.FC<DashboardProps> = ({ externalQuery, data, session, onViewRecord, onProcessMineComplete }) => {
  // State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [chatQuery, setChatQuery] = useState<ChatTrigger | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  
  const [showProcessWizard, setShowProcessWizard] = useState(false);
  
  // Execution Path Viewer State
  const [executionPath, setExecutionPath] = useState<ExecutionPath | null>(null);

  // Graph Context Menu
  const [graphContextMenu, setGraphContextMenu] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  
  // Inspector Query State
  const [inspectorQuery, setInspectorQuery] = useState<string | undefined>(undefined);
  
  // Layout State (Resizable Panels)
  const [activePanel, setActivePanel] = useState<'inspector' | 'chat'>('chat');
  
  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(300);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  // Refs for resizing
  const containerRef = useRef<HTMLDivElement>(null);

  // Handling Resizing Events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingBottom && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate height from bottom
        const newHeight = Math.max(100, Math.min(containerRect.height - 100, containerRect.bottom - e.clientY));
        setBottomHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingBottom(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingSidebar || isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingBottom]);

  // Compute stats
  const groupStats = useMemo(() => {
    const stats: Record<string, number> = {};
    data.nodes.forEach(node => {
        stats[node.group] = (stats[node.group] || 0) + 1;
    });
    return stats;
  }, [data]);

  const availableGroups = useMemo(() => Object.keys(groupStats).sort(), [groupStats]);

  // Sync external query
  useEffect(() => {
    if (externalQuery) {
        setChatQuery({ text: externalQuery, id: Date.now() });
        setActivePanel('chat');
    }
  }, [externalQuery]);

  // Close context menu
  useEffect(() => {
    const closeMenu = () => setGraphContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
  };
  
  const handleNodeContextMenu = (event: React.MouseEvent, node: GraphNode) => {
      setGraphContextMenu({
          x: event.clientX,
          y: event.clientY,
          node: node
      });
  };

  const handleAnalyzeNode = (node: GraphNode = selectedNode!) => {
    if (node) {
        setChatQuery({ 
            text: `Analyze the impact of modifying ${node.label} (${node.group})`,
            id: Date.now() 
        });
        setActivePanel('chat');
    }
  };

  const handleTraceExecution = (node: GraphNode) => {
      setExecutionPath({
          ...MOCK_EXECUTION_PATH,
          flowName: node.label
      });
      setChatQuery({
          text: `Analyzing execution path for ${node.label}... reconstructed execution sequence displayed.`,
          id: Date.now()
      });
      setActivePanel('chat');
  };

  const handleStartProcessMining = () => {
      setShowProcessWizard(true);
  };

  const handleWizardComplete = (config: ProcessMiningConfig) => {
      setShowProcessWizard(false);
      onProcessMineComplete(config);
  };
  
  const handleQueryRecords = (node: GraphNode) => {
      if (node.group === 'Object') {
          const apiName = node.metadata?.apiName || node.label;
          const query = `SELECT Id, Name, CreatedDate, CreatedBy.Name FROM ${apiName} ORDER BY CreatedDate DESC LIMIT 10`;
          setInspectorQuery(query);
          setActivePanel('inspector');
      }
  };

  const handleInspectorAnalyze = (queryText: string) => {
      setChatQuery({ text: queryText, id: Date.now() });
      setActivePanel('chat');
  };

  const handleCategoryClick = (group: string) => {
      if (viewingCategory === group) {
          setViewingCategory(null);
      } else {
          setViewingCategory(group);
          setCategorySearchQuery('');
      }
  };

  const getSalesforceLink = (node: GraphNode): string => {
      if (!session) return '#';
      const { instanceUrl } = session;
      const { metadata } = node;
      if (node.group === 'Object') return `${instanceUrl}/lightning/setup/ObjectManager/${metadata?.apiName}/Details/view`;
      return '#';
  };

  // Helper for Category Card Styling
  const getCategoryStyle = (group: string) => {
      switch(group) {
          case 'Object': return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-sf-blue', icon: Box };
          case 'Flow': return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', icon: Workflow };
          case 'State': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-600', icon: GitMerge };
          case 'Action': return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-600', icon: Zap };
          default: return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', icon: Box };
      }
  };
  
  const filteredCategoryNodes = viewingCategory 
    ? data.nodes.filter(n => n.group === viewingCategory && n.label.toLowerCase().includes(categorySearchQuery.toLowerCase()))
    : [];
    
  // Export Logic Stub
  const exportNodeDetails = (type: 'pdf' | 'word') => {}; 

  return (
    <div ref={containerRef} className="flex h-full w-full bg-slate-50 overflow-hidden relative font-sans">
      
      {/* 1. Left Sidebar (Overview) - Resizable */}
      <div 
        className="flex flex-col bg-white border-r border-gray-200 z-20 shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-sf-blue" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Metadata Explorer</h2>
            </div>
            <div className="flex gap-1">
                 <button onClick={() => {}} className="p-1 hover:bg-gray-200 rounded text-gray-400"><Settings2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-2">
                {availableGroups.map(group => {
                    const style = getCategoryStyle(group);
                    const Icon = style.icon;
                    const isSelected = viewingCategory === group;
                    return (
                        <div 
                            key={group}
                            onClick={() => handleCategoryClick(group)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between hover:shadow-sm ${isSelected ? `${style.bg} ${style.border} shadow-inner` : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white/50' : 'bg-gray-50'} ${style.text}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate">{group}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-800 bg-white/50 px-2 py-0.5 rounded-full">{groupStats[group]}</span>
                        </div>
                    );
                })}
            </div>

            {/* Expanded List Details */}
            {viewingCategory && (
                <div className="mt-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <List className="w-3 h-3" /> {viewingCategory} List
                        </h3>
                        <button onClick={() => setViewingCategory(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="relative mb-2">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 focus:bg-white focus:outline-none focus:border-sf-blue transition-colors"
                            placeholder="Filter items..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        {filteredCategoryNodes.map(node => (
                             <div 
                                key={node.id} 
                                onClick={() => handleNodeClick(node)}
                                className="group p-2 rounded border border-transparent hover:border-gray-200 hover:bg-white cursor-pointer transition-all"
                             >
                                 <div className="text-xs font-medium text-gray-700 truncate group-hover:text-sf-blue">{node.label}</div>
                                 <div className="text-[10px] text-gray-400 truncate">{node.metadata?.apiName}</div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
             <button 
                 onClick={handleStartProcessMining} 
                 className="text-xs w-full py-2 rounded-md font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors shadow-sm"
             >
                 <GitMerge className="w-3.5 h-3.5" /> 
                 Mine Business Process
             </button>
        </div>
      </div>

      {/* Sidebar Resizer Handle */}
      <div 
        className="w-1 hover:w-1.5 bg-gray-200 hover:bg-sf-blue cursor-col-resize z-30 transition-colors flex items-center justify-center group"
        onMouseDown={() => { setIsResizingSidebar(true); document.body.style.cursor = 'col-resize'; }}
      >
          <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
      </div>

      {/* 2. Main Content Area (Graph + Bottom Panel) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* Top: Graph Visualization */}
          <div className="flex-1 relative overflow-hidden bg-slate-50/30">
                <Graph 
                    data={data} 
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                    width={containerRef.current ? containerRef.current.offsetWidth - sidebarWidth : 800} 
                    height={containerRef.current ? containerRef.current.offsetHeight - bottomHeight : 500}
                    activeFilters={availableGroups} 
                    onToggleFilter={() => {}}
                    onExport={() => {}}
                    onTraceExecution={handleTraceExecution}
               />
               
               {/* Context Info Overlay */}
               <div className="absolute top-4 left-4 z-10 pointer-events-none">
                   <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                       System Dependency Graph
                   </h1>
                   <p className="text-xs text-gray-500">
                       Analyzing {data.nodes.length} components
                   </p>
               </div>
          </div>

          {/* Bottom Resizer Handle */}
          <div 
            className="h-1 hover:h-1.5 bg-gray-200 hover:bg-sf-blue cursor-row-resize z-30 transition-colors flex items-center justify-center group shrink-0"
            onMouseDown={() => { setIsResizingBottom(true); document.body.style.cursor = 'row-resize'; }}
          >
              <GripHorizontal className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
          </div>

          {/* Bottom: Tabs (Inspector / Chat) */}
          <div style={{ height: bottomHeight }} className="flex flex-col bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
               {/* Tab Header */}
               <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActivePanel('chat')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-2 border-r border-gray-200 transition-colors ${activePanel === 'chat' ? 'bg-white text-sf-blue border-t-2 border-t-sf-blue' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" /> AI Assistant
                    </button>
                    <button 
                        onClick={() => setActivePanel('inspector')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-2 border-r border-gray-200 transition-colors ${activePanel === 'inspector' ? 'bg-white text-sf-blue border-t-2 border-t-sf-blue' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <Database className="w-3.5 h-3.5" /> SOQL Inspector
                    </button>
                    <div className="flex-1 flex justify-end items-center pr-2">
                        <button onClick={() => setBottomHeight(30)} className="p-1 text-gray-400 hover:text-gray-600" title="Collapse"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setBottomHeight(600)} className="p-1 text-gray-400 hover:text-gray-600" title="Expand"><ChevronUp className="w-3.5 h-3.5" /></button>
                    </div>
               </div>

               {/* Tab Content */}
               <div className="flex-1 overflow-hidden relative">
                    {activePanel === 'chat' ? (
                        <ChatInterface 
                            initialQuery={chatQuery} 
                            graphData={data} 
                        />
                    ) : (
                        <QueryInspector 
                            session={session} 
                            onAnalyze={handleInspectorAnalyze} 
                            initialQuery={inspectorQuery}
                            graphData={data}
                        />
                    )}
               </div>
          </div>
      </div>

      {/* 3. Floating Overlays (Context Menu, Modals) */}
      {graphContextMenu && (
            <div 
                className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-md py-1 w-56 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: graphContextMenu.y, left: graphContextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                    {graphContextMenu.node.label}
                </div>
                {(graphContextMenu.node.group === 'Flow' || graphContextMenu.node.group === 'ApexClass') && (
                    <button 
                        onClick={() => { handleTraceExecution(graphContextMenu.node); setGraphContextMenu(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors border-b border-gray-100"
                    >
                        <Zap className="w-4 h-4 text-purple-600" />
                        Trace Execution Path
                    </button>
                )}
                <button 
                    onClick={() => { handleAnalyzeNode(graphContextMenu.node); setGraphContextMenu(null); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors"
                >
                    <Activity className="w-4 h-4" />
                    Analyze Impact
                </button>
                {graphContextMenu.node.group === 'Object' && (
                    <button 
                        onClick={() => { handleQueryRecords(graphContextMenu.node); setGraphContextMenu(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sf-light hover:text-sf-blue flex items-center gap-2 transition-colors"
                    >
                        <Database className="w-4 h-4" />
                        Query Records
                    </button>
                )}
                <button 
                    onClick={() => { handleNodeClick(graphContextMenu.node); setGraphContextMenu(null); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Info className="w-4 h-4" />
                    View Details
                </button>
            </div>
      )}

      {selectedNode && showNodeDetails && (
            <div className="absolute top-4 right-4 bottom-[calc(300px+2rem)] w-80 bg-white shadow-2xl border border-gray-200 rounded-lg z-40 animate-in slide-in-from-right duration-300 flex flex-col pointer-events-auto">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-md ${selectedNode.group === 'Object' ? 'bg-blue-100 text-sf-blue' : 'bg-gray-100 text-gray-600'}`}>
                             <Info className="w-3.5 h-3.5" /> 
                         </div>
                         <h3 className="font-bold text-xs text-gray-800">Component Details</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => exportNodeDetails('word')} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><FileText className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowNodeDetails(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedNode.group === 'Object' ? 'bg-blue-100 text-sf-blue' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedNode.group}
                        </span>
                        <h2 className="text-lg font-bold text-gray-900 mt-2 leading-tight break-words">{selectedNode.label}</h2>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="bg-slate-50 p-2.5 rounded border border-gray-100">
                            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">API Name</div>
                            <div className="text-xs font-mono text-gray-700 break-all select-all">{selectedNode.metadata?.apiName || selectedNode.id}</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        {session && (
                            <a href={getSalesforceLink(selectedNode)} target="_blank" rel="noopener noreferrer" className="w-full bg-white border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded shadow-sm hover:bg-gray-50 hover:text-sf-blue hover:border-blue-200 flex items-center justify-center gap-2 transition-all">
                                <ExternalLink className="w-3.5 h-3.5" /> Open in Salesforce
                            </a>
                        )}
                        {(selectedNode.group === 'Flow' || selectedNode.group === 'ApexClass') && (
                             <button onClick={() => handleTraceExecution(selectedNode)} className="w-full bg-white border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded shadow-sm hover:bg-gray-50 hover:text-sf-blue hover:border-blue-200 flex items-center justify-center gap-2 transition-all group">
                                <Zap className="w-3.5 h-3.5 text-purple-500" /> Trace Execution
                             </button>
                        )}
                        <button onClick={() => handleAnalyzeNode()} className="w-full bg-sf-blue text-white text-xs font-medium py-2 rounded shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-all">
                            <MessageSquare className="w-3.5 h-3.5" /> Analyze Impact
                        </button>
                    </div>
                </div>
            </div>
      )}

      {/* Process Mining Wizard Modal */}
      {showProcessWizard && (
          <ProcessMiningWizard 
            onComplete={handleWizardComplete}
            onCancel={() => setShowProcessWizard(false)}
          />
      )}

      {executionPath && (
             <ExecutionPathViewer 
                path={executionPath} 
                onClose={() => setExecutionPath(null)} 
             />
      )}

      {showImpactModal && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-sf-blue" /> Impact Analysis</h3>
                  <button onClick={() => setShowImpactModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                 {/* Impact Content Placeholder */}
                  {selectedNode ? (
                      <div className="text-center p-8">
                        <h2 className="text-xl font-bold text-gray-800">{selectedNode.label}</h2>
                        <p className="text-gray-500">Analysis visualization would appear here.</p>
                      </div>
                  ) : <div className="text-center text-gray-400 p-8">Select a node first.</div>}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
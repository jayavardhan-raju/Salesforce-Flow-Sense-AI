import React, { useState, useEffect, useRef, useMemo } from 'react';
import Graph from './Graph';
import ChatInterface from './ChatInterface';
import QueryInspector from './QueryInspector';
import { GraphData, GraphNode } from '../types';
import { SalesforceSession } from '../services/salesforceService';
import { Box, Workflow, Zap, AlertTriangle, Search, Activity, ArrowRight, X, Info, MessageSquare, ChevronUp, ChevronDown, ExternalLink, List, Maximize2, Minimize2, FileText, Printer, Download, Database, Code, Layers, FileCode, Component } from 'lucide-react';

interface DashboardProps {
    externalQuery?: string;
    data: GraphData;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
    session?: SalesforceSession | null;
    onViewRecord?: (record: any, objectType: string) => void;
}

// Define trigger type for chat
interface ChatTrigger {
    text: string;
    id: number;
}

type SectionType = 'overview' | 'graph' | 'chat' | 'inspector';

const Dashboard: React.FC<DashboardProps> = ({ externalQuery, data, isMaximized = false, onToggleMaximize, session, onViewRecord }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [chatQuery, setChatQuery] = useState<ChatTrigger | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  
  // Section Expansion State
  const [expandedSection, setExpandedSection] = useState<SectionType | null>(null);
  const [wasMaximizedBeforeExpand, setWasMaximizedBeforeExpand] = useState(false);

  // Compute stats and available groups
  const groupStats = useMemo(() => {
    const stats: Record<string, number> = {};
    data.nodes.forEach(node => {
        stats[node.group] = (stats[node.group] || 0) + 1;
    });
    return stats;
  }, [data]);

  const availableGroups = useMemo(() => Object.keys(groupStats).sort(), [groupStats]);

  // Lifted Filter State - Dynamic based on data
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Initialize filters when data changes
  useEffect(() => {
     setActiveFilters(availableGroups);
  }, [availableGroups]);
  
  // Responsive dimensions for graph
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 350, height: 500 }); 

  // Update dimensions when maximization changes or on resize
  useEffect(() => {
      const updateDimensions = () => {
          if (containerRef.current) {
              const width = containerRef.current.offsetWidth;
              // If graph is expanded section, use full window height approx, else dynamic
              const height = expandedSection === 'graph' 
                    ? (window.innerHeight - 50) 
                    : (isMaximized ? Math.min(window.innerHeight * 0.6, 600) : 500);
              setGraphDimensions({ width, height });
          }
      };

      // Initial update with a small delay for transition
      const timer = setTimeout(updateDimensions, 310);
      window.addEventListener('resize', updateDimensions);
      
      return () => {
          window.removeEventListener('resize', updateDimensions);
          clearTimeout(timer);
      };
  }, [isMaximized, expandedSection]);

  // Sync external query (from right-click)
  useEffect(() => {
    if (externalQuery) {
        setChatQuery({ text: externalQuery, id: Date.now() });
        // Ensure chat is visible if queried externally
        if (expandedSection === 'overview' || expandedSection === 'graph' || expandedSection === 'inspector') {
            setExpandedSection(null);
        }
    }
  }, [externalQuery]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
  };

  const handleAnalyzeNode = () => {
    if (selectedNode) {
        setChatQuery({ 
            text: `Analyze the impact of modifying ${selectedNode.label} (${selectedNode.group})`,
            id: Date.now() 
        });
        // Collapse graph if expanded to see chat
        if (expandedSection === 'graph') {
            handleToggleExpand('graph'); 
        }
    }
  };

  const handleInspectorAnalyze = (queryText: string) => {
      setChatQuery({ text: queryText, id: Date.now() });
      // Switch view to chat to show results, which might close Inspector but that is desired flow
      handleToggleExpand('chat');
  };

  const openImpactAnalysis = () => {
      setShowImpactModal(true);
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleCategoryClick = (group: string) => {
      // If already viewing this category, toggle it off
      if (viewingCategory === group) {
          setViewingCategory(null);
      } else {
          setViewingCategory(group);
          setCategorySearchQuery('');
          // If the section isn't expanded, ensure it's visible enough (optional logic)
          setIsStatsExpanded(true);
      }
  };

  // Section Expansion Logic
  const handleToggleExpand = (section: SectionType) => {
      if (expandedSection === section) {
          // Minimizing
          setExpandedSection(null);
          // Restore sidebar state if it wasn't maximized before
          if (onToggleMaximize && !wasMaximizedBeforeExpand && isMaximized) {
              onToggleMaximize(); 
          }
      } else {
          // Expanding
          setWasMaximizedBeforeExpand(!!isMaximized);
          setExpandedSection(section);
          // Force maximize sidebar if not already
          if (onToggleMaximize && !isMaximized) {
              onToggleMaximize();
          }
          // Ensure stats are expanded if overview is selected
          if (section === 'overview') {
              setIsStatsExpanded(true);
          }
      }
  };

  // Export Utility (Truncated for brevity, reusing logic)
  const handleExport = (type: 'pdf' | 'word', title: string, contentHtml: string) => {
     // ... (reusing existing export logic logic)
      const fullHtml = `<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head><body><h1>${title}</h1>${contentHtml}</body></html>`;
     if (type === 'pdf') {
         const printWindow = window.open('', '_blank');
         printWindow?.document.write(fullHtml);
         printWindow?.print();
     } else {
         const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = 'report.doc';
         link.click();
     }
  };

  const exportOverview = (type: 'pdf' | 'word') => {
      let content = `<h2>Summary Statistics</h2><table><tr><th>Component Type</th><th>Count</th></tr>`;
      availableGroups.forEach(group => {
          content += `<tr><td>${group}</td><td>${groupStats[group]}</td></tr>`;
      });
      content += `</table>`;

      if (viewingCategory) {
          content += `<h2>${viewingCategory} List</h2><table><thead><tr><th>Label</th><th>API Name</th></tr></thead><tbody>`;
          filteredCategoryNodes.forEach(node => {
              content += `<tr><td>${node.label}</td><td>${node.metadata?.apiName || node.id}</td></tr>`;
          });
          content += `</tbody></table>`;
      }
      handleExport(type, 'FlowSense Org Overview', content);
  };
  
  // Reusing existing export functions
  const exportNodeDetails = (type: 'pdf' | 'word') => handleExport(type, 'Node Details', `<p>Details for ${selectedNode?.label}</p>`);
  const exportGraphDetails = (type: 'pdf' | 'word') => handleExport(type, 'Graph Analysis', `<p>Graph overview...</p>`);

  const getSalesforceLink = (node: GraphNode): string => {
      if (!session) return '#';
      const { instanceUrl } = session;
      const { metadata } = node;

      if (node.group === 'Object') return `${instanceUrl}/lightning/setup/ObjectManager/${metadata?.apiName}/Details/view`;
      if (node.group === 'Flow') return `${instanceUrl}/builder_platform_interaction/flowBuilder.app?flowId=${metadata?.recordId}`;
      if (node.group === 'Trigger') return `${instanceUrl}/lightning/setup/ApexTriggers/page?address=%2F${metadata?.recordId}`;
      if (node.group === 'ValidationRule') { 
          if (metadata?.parentApiName) return `${instanceUrl}/lightning/setup/ObjectManager/${metadata.parentApiName}/ValidationRules/${metadata.recordId}/view`;
      }
      if (node.group === 'ApexClass') return `${instanceUrl}/lightning/setup/ApexClasses/page?address=%2F${metadata?.recordId}`;
      if (node.group === 'Visualforce') return `${instanceUrl}/lightning/setup/ApexPages/page?address=%2F${metadata?.recordId}`;
      
      return '#';
  };

  const getDependencies = (nodeId: string | undefined) => {
      if (!nodeId) return [];
      return data.links
        .filter(l => {
            const link = l as any;
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === nodeId || targetId === nodeId;
        })
        .map(l => {
             const link = l as any;
             const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
             
             const isSource = sourceId === nodeId;
             const targetId = isSource 
                ? (typeof link.target === 'object' ? link.target.id : link.target)
                : sourceId;
             
             const targetNode = data.nodes.find(n => n.id === targetId);
             return { node: targetNode, type: l.type, direction: isSource ? 'outgoing' : 'incoming' };
        });
  };

  const dependencies = selectedNode ? getDependencies(selectedNode.id) : [];

  // Filtered nodes for category list
  const filteredCategoryNodes = viewingCategory 
    ? data.nodes
        .filter(n => n.group === viewingCategory)
        .filter(n => 
            n.label.toLowerCase().includes(categorySearchQuery.toLowerCase()) || 
            (n.metadata?.apiName || '').toLowerCase().includes(categorySearchQuery.toLowerCase())
        )
    : [];
    
  // Helper for Category Card Styling
  const getCategoryStyle = (group: string) => {
      switch(group) {
          case 'Object': return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-sf-blue', icon: Box };
          case 'Flow': return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', icon: Workflow };
          case 'Trigger': return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-600', icon: Zap };
          case 'ValidationRule': return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-600', icon: AlertTriangle };
          case 'Field': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-600', icon: Database };
          case 'ApexClass': return { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-700', icon: Code };
          case 'LWC': return { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', icon: Component };
          case 'Aura': return { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', icon: Layers };
          case 'Visualforce': return { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700', icon: FileCode };
          default: return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', icon: Box };
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Top Section: Organization Overview & Combined Category List */}
      <div 
        className={`bg-white border-b border-gray-200 shadow-sm z-10 shrink-0 transition-all duration-300 flex flex-col ${expandedSection && expandedSection !== 'overview' ? 'hidden' : ''} ${expandedSection === 'overview' ? 'flex-1 h-full overflow-hidden' : ''}`}
        style={{ maxHeight: (expandedSection === 'overview' ? '100%' : (viewingCategory ? '60vh' : 'auto')) }}
      >
        {/* Header */}
        <div 
            className="px-4 py-3 flex justify-between items-center bg-white sticky top-0 z-20"
        >
             <div 
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
             >
                 <h2 className="text-sm font-semibold text-sf-text">Organization Overview</h2>
                 {isStatsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
             </div>

             <div className="flex items-center gap-2">
                 <div className="flex items-center border-r border-gray-200 pr-2 mr-1 gap-1">
                     <button onClick={(e) => { e.stopPropagation(); exportOverview('word'); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><FileText className="w-4 h-4" /></button>
                     <button onClick={(e) => { e.stopPropagation(); exportOverview('pdf'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Printer className="w-4 h-4" /></button>
                 </div>
                 {onToggleMaximize && (
                     <button onClick={(e) => { e.stopPropagation(); handleToggleExpand('overview'); }} className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors">
                         {expandedSection === 'overview' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                     </button>
                 )}
                 {!isStatsExpanded && !expandedSection && (
                     <div className="flex gap-3 text-xs text-gray-400 animate-in fade-in">
                         <span className="text-gray-600 font-medium">{availableGroups.length} Categories</span>
                     </div>
                 )}
                 <div className="flex gap-1 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleExpand('inspector'); }} className={`text-xs px-2 py-1.5 rounded font-medium border flex items-center gap-1 transition-colors ${expandedSection === 'inspector' ? 'bg-sf-blue text-white border-sf-blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Database className="w-3 h-3" /> Data</button>
                    <button onClick={(e) => { e.stopPropagation(); openImpactAnalysis(); }} className="text-xs bg-sf-light text-sf-blue px-3 py-1.5 rounded font-medium border border-blue-100 hover:bg-blue-100 flex items-center gap-1 transition-colors"><Activity className="w-3 h-3" /> Analysis</button>
                 </div>
             </div>
        </div>
        
        {/* Scrollable Content Area for Stats + List */}
        <div className="overflow-y-auto flex-1 pb-4">
            {isStatsExpanded && (
                <div className={`px-4 pb-2 grid gap-3 ${isMaximized || expandedSection === 'overview' ? 'grid-cols-4' : 'grid-cols-2'} animate-in slide-in-from-top-2`}>
                    {availableGroups.map(group => {
                        const style = getCategoryStyle(group);
                        const Icon = style.icon;
                        const isSelected = viewingCategory === group;
                        
                        return (
                            <div 
                                key={group}
                                onClick={() => handleCategoryClick(group)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group flex items-center space-x-3 hover:shadow-md ${isSelected ? `${style.bg} ${style.border} shadow-inner` : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'}`}
                            >
                                <div className={`p-2 rounded-md ${isSelected ? 'bg-white/50' : 'bg-gray-50'} ${style.text}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xl font-bold text-gray-800">{groupStats[group]}</div>
                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1 truncate">
                                        {group}s <ArrowRight className={`w-3 h-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Combined Category List */}
            {viewingCategory && (
                <div className="mt-2 mx-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-sf-blue" />
                            <h3 className="font-semibold text-sm text-gray-800">
                                {viewingCategory} List
                            </h3>
                            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-1.5 rounded-full">
                                {filteredCategoryNodes.length}
                            </span>
                        </div>
                        <button onClick={() => setViewingCategory(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Search Bar for Category */}
                    <div className="px-3 py-2 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={`Search ${viewingCategory}...`}
                                className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sf-blue focus:border-sf-blue transition-shadow placeholder:text-gray-400"
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                autoFocus
                            />
                            {categorySearchQuery && (
                                <button 
                                    onClick={() => setCategorySearchQuery('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredCategoryNodes.map((node) => (
                            <div key={node.id} className="p-2 border border-gray-100 rounded hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex justify-between items-start">
                                <div className="min-w-0 flex-1 mr-2">
                                    <div className="text-sm font-medium text-gray-800 break-words">{node.label}</div>
                                    <div className="text-[10px] text-gray-400 font-mono break-all truncate">
                                        {node.metadata?.apiName || node.id}
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button 
                                        onClick={() => { handleNodeClick(node); }}
                                        className="p-1.5 text-gray-400 hover:text-sf-blue hover:bg-white rounded border border-transparent hover:border-blue-100 transition-colors"
                                        title="View Details"
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                    {session && (
                                        <a 
                                            href={getSalesforceLink(node)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-400 hover:text-sf-blue hover:bg-white rounded border border-transparent hover:border-blue-100 transition-colors"
                                            title="Open Record"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredCategoryNodes.length === 0 && (
                            <div className="text-center text-gray-400 py-6 text-xs flex flex-col items-center gap-2">
                                <Search className="w-6 h-6 opacity-20" />
                                <span>No components match your search.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Query Inspector Section */}
      <div 
        className={`transition-all duration-300 bg-white border-b border-gray-200 flex flex-col ${expandedSection && expandedSection !== 'inspector' ? 'hidden' : ''} ${expandedSection === 'inspector' ? 'flex-1 h-full' : 'h-0 hidden'}`}
      >
        <QueryInspector session={session} onAnalyze={handleInspectorAnalyze} onViewRecord={onViewRecord} />
      </div>

      {/* Middle: Graph Visualization */}
      <div 
        ref={containerRef}
        className={`relative border-b border-gray-200 overflow-hidden transition-all duration-300 bg-slate-50/50 ${expandedSection && expandedSection !== 'graph' ? 'hidden' : ''}`}
        style={{ 
            flex: expandedSection === 'graph' ? '1 1 auto' : (isMaximized ? '1 1 auto' : '0 0 auto'), 
            height: expandedSection === 'graph' ? '100%' : (isMaximized ? 'auto' : '500px') 
        }}
      >
        <Graph 
            data={data} 
            onNodeClick={handleNodeClick}
            width={graphDimensions.width} 
            height={graphDimensions.height}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            isExpanded={expandedSection === 'graph'}
            onToggleExpand={onToggleMaximize ? () => handleToggleExpand('graph') : undefined}
            onExport={exportGraphDetails}
        />
        
        {/* Helper Hint */}
        {!selectedNode && !viewingCategory && expandedSection !== 'inspector' && (
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 shadow-sm flex items-center gap-2 pointer-events-auto">
                    <Search className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-500 font-medium">
                        Click graph nodes to explore details
                    </span>
                </div>
            </div>
        )}

        {/* Node Details Modal Panel */}
        {selectedNode && showNodeDetails && (
            <div className="absolute top-2 right-2 bottom-2 w-80 bg-white shadow-2xl border border-gray-200 rounded-lg z-30 animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-md ${selectedNode.group === 'Object' ? 'bg-blue-100 text-sf-blue' : 'bg-gray-100 text-gray-600'}`}>
                             <Info className="w-4 h-4" /> 
                         </div>
                         <h3 className="font-bold text-sm text-gray-800">Component Details</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => exportNodeDetails('word')} className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"><FileText className="w-4 h-4" /></button>
                        <button onClick={() => setShowNodeDetails(false)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto">
                    <div className="mb-6">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedNode.group === 'Object' ? 'bg-blue-100 text-sf-blue' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedNode.group}
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 mt-2 leading-tight break-words">{selectedNode.label}</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                            <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">API Name / ID</div>
                            <div className="text-xs font-mono text-gray-700 break-all select-all">{selectedNode.metadata?.apiName || selectedNode.id}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Status</div>
                                <div className="text-xs font-medium text-green-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></span> Active
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Connections</div>
                                <div className="text-xs font-bold text-gray-700">{dependencies.length} Links</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        {session && (
                            <a href={getSalesforceLink(selectedNode)} target="_blank" rel="noopener noreferrer" className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg shadow-sm hover:bg-gray-50 hover:text-sf-blue hover:border-blue-200 flex items-center justify-center gap-2 transition-all group">
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-sf-blue" /> Open in Salesforce Setup
                            </a>
                        )}
                        <button onClick={handleAnalyzeNode} className="w-full bg-sf-blue text-white text-sm font-medium py-2.5 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg flex items-center justify-center gap-2 transition-all">
                            <MessageSquare className="w-4 h-4" /> Ask AI to Analyze
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Bottom: Chat Interface */}
      <div 
        className={`transition-all duration-300 ${expandedSection && expandedSection !== 'chat' ? 'hidden' : ''} ${expandedSection === 'chat' ? 'flex-1 h-full' : (isMaximized ? 'h-[300px]' : 'h-[400px] flex-1')}`}
        style={{ minHeight: expandedSection === 'chat' ? 'auto' : '300px' }}
      >
        <ChatInterface 
            initialQuery={chatQuery} 
            graphData={data} 
            isExpanded={expandedSection === 'chat'}
            onToggleExpand={onToggleMaximize ? () => handleToggleExpand('chat') : undefined}
        />
      </div>

      {/* Impact Analysis Modal */}
      {showImpactModal && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-sf-blue" /> Impact Analysis</h3>
                  <button onClick={() => setShowImpactModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                  {selectedNode ? (
                      <div className="space-y-6">
                          <div className="bg-sf-light/50 p-4 rounded-lg border border-blue-100">
                              <h4 className="text-sm font-semibold text-sf-blue mb-1">Target Component</h4>
                              <p className="text-xl font-bold text-gray-900">{selectedNode.label}</p>
                              <span className="text-xs uppercase tracking-wide text-gray-500">{selectedNode.group}</span>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Direct Dependencies ({dependencies.length})</h4>
                              {dependencies.length > 0 ? (
                                  <div className="space-y-2">
                                      {dependencies.map((dep, idx) => (
                                          <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                              {dep.direction === 'incoming' ? <ArrowRight className="w-4 h-4 text-orange-400 rotate-180" /> : <ArrowRight className="w-4 h-4 text-green-500" />}
                                              <div>
                                                  <div className="text-sm font-medium text-gray-800">{dep.node?.label}</div>
                                                  <div className="text-[10px] text-gray-400 uppercase">{dep.node?.group} • {dep.type}</div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-sm text-gray-500 italic">No direct dependencies found in graph.</p>
                              )}
                          </div>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8"><Search className="w-12 h-12 mb-4 opacity-20" /><p>Select a node in the graph first to run a detailed impact analysis.</p></div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
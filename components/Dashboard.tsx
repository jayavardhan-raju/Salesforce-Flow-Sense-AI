import React, { useState, useEffect } from 'react';
import Graph from './Graph';
import ChatInterface from './ChatInterface';
import { MOCK_GRAPH_DATA } from '../constants';
import { GraphNode } from '../types';
import { Box, Workflow, Zap, AlertTriangle, Maximize2, Search, Activity, ArrowRight, X } from 'lucide-react';

interface DashboardProps {
    externalQuery?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ externalQuery }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [showImpactModal, setShowImpactModal] = useState(false);

  // Sync external query (from right-click)
  useEffect(() => {
    if (externalQuery) {
        setChatQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    // Auto-populate chat but don't auto-send unless user wants? 
    // The previous behavior was nice. Let's keep it but also offer Impact button.
    setChatQuery(`Analyze the impact of modifying ${node.label} (${node.group})`);
  };

  const openImpactAnalysis = () => {
      setShowImpactModal(true);
  };

  // Quick helper to find dependencies for the selected node (if any), or just show a summary
  const getDependencies = (nodeId: string | undefined) => {
      if (!nodeId) return [];
      return MOCK_GRAPH_DATA.links
        .filter(l => (typeof l.source === 'object' ? (l.source as any).id : l.source) === nodeId || (typeof l.target === 'object' ? (l.target as any).id : l.target) === nodeId)
        .map(l => {
             const isSource = (typeof l.source === 'object' ? (l.source as any).id : l.source) === nodeId;
             const targetId = isSource ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : (typeof l.source === 'object' ? (l.source as any).id : l.source);
             const targetNode = MOCK_GRAPH_DATA.nodes.find(n => n.id === targetId);
             return { node: targetNode, type: l.type, direction: isSource ? 'outgoing' : 'incoming' };
        });
  };

  const dependencies = selectedNode ? getDependencies(selectedNode.id) : [];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Top Section: Stats Summary */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex justify-between items-center mb-3">
             <h2 className="text-lg font-semibold text-sf-text">Organization Overview</h2>
             <button 
                onClick={openImpactAnalysis}
                className="text-xs bg-sf-light text-sf-blue px-3 py-1.5 rounded font-medium border border-blue-100 hover:bg-blue-100 flex items-center gap-1 transition-colors"
             >
                <Activity className="w-3 h-3" /> Impact Analysis
             </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition-shadow group">
                <div className="p-2 bg-blue-100 rounded-md group-hover:bg-blue-200 text-sf-blue">
                    <Box className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-gray-800">150</div>
                    <div className="text-xs text-gray-500 font-medium">Objects</div>
                </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition-shadow group">
                <div className="p-2 bg-purple-100 rounded-md group-hover:bg-purple-200 text-purple-600">
                    <Workflow className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-gray-800">42</div>
                    <div className="text-xs text-gray-500 font-medium">Flows</div>
                </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition-shadow group">
                <div className="p-2 bg-orange-100 rounded-md group-hover:bg-orange-200 text-orange-600">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-gray-800">18</div>
                    <div className="text-xs text-gray-500 font-medium">Triggers</div>
                </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition-shadow group">
                <div className="p-2 bg-green-100 rounded-md group-hover:bg-green-200 text-green-600">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-gray-800">27</div>
                    <div className="text-xs text-gray-500 font-medium">Rules</div>
                </div>
            </div>
        </div>
      </div>

      {/* Middle: Graph Visualization */}
      <div className="flex-1 relative min-h-[300px] border-b border-gray-200">
        <Graph 
            data={MOCK_GRAPH_DATA} 
            onNodeClick={handleNodeClick}
            width={window.innerWidth > 500 ? window.innerWidth * 0.25 : 350} // Approx sidebar width
            height={350}
        />
        <div className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50" title="Expand Graph">
            <Maximize2 className="w-4 h-4 text-gray-500" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
             <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 truncate">
                    {selectedNode ? `Selected: ${selectedNode.label}` : 'Click a node to analyze...'}
                </span>
             </div>
        </div>
      </div>

      {/* Bottom: Chat Interface */}
      <div className="h-[400px]">
        <ChatInterface initialQuery={chatQuery} />
      </div>

      {/* Impact Analysis Modal */}
      {showImpactModal && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-5">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sf-blue" />
                      Impact Analysis
                  </h3>
                  <button onClick={() => setShowImpactModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                  </button>
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
                                              {dep.direction === 'incoming' ? (
                                                  <ArrowRight className="w-4 h-4 text-orange-400 rotate-180" />
                                              ) : (
                                                  <ArrowRight className="w-4 h-4 text-green-500" />
                                              )}
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
                          
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                              <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" /> Risk Assessment
                              </h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                  Modifying <strong>{selectedNode.label}</strong> has a <span className="font-bold text-orange-600">Medium Risk</span> score.
                                  Ensure you check the {dependencies.length} connected components before deployment.
                              </p>
                          </div>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                          <Search className="w-12 h-12 mb-4 opacity-20" />
                          <p>Select a node in the graph first to run a detailed impact analysis.</p>
                          <button 
                            onClick={() => setShowImpactModal(false)}
                            className="mt-4 text-sf-blue text-sm hover:underline"
                          >
                              Go back to Graph
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
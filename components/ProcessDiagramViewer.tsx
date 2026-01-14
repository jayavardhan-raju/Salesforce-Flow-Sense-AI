import React, { useRef, useState, useMemo } from 'react';
import Graph from './Graph';
import { GraphData, GraphNode, ProcessMiningConfig } from '../types';
import { 
    ChevronLeft, Settings, Bell, Share, Search, 
    ZoomIn, ZoomOut, Maximize, MousePointer2, Type, 
    StickyNote, Layout, Image, MoreHorizontal, GitMerge 
} from 'lucide-react';

interface ProcessDiagramViewerProps {
    data: GraphData;
    config: ProcessMiningConfig;
    onBack: () => void;
}

const ProcessDiagramViewer: React.FC<ProcessDiagramViewerProps> = ({ data, config, onBack }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    // Compute active filters based on data to show all by default
    const activeFilters = useMemo(() => Array.from(new Set(data.nodes.map(n => n.group))), [data]);

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            {/* Header Bar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4 h-10">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <span className="text-sf-blue font-bold text-lg">App</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold text-gray-900">{config.diagramName || 'Opportunity Process'}</h1>
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded tracking-wide">Draft</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                Level 1 of {config.selectedObject} <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span> Last edited just now
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4 text-gray-400">
                        <button className="p-1.5 hover:bg-gray-100 rounded"><Search className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded"><GitMerge className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-sf-blue hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow-sm transition-colors">
                        Edit diagram
                    </button>
                    
                    <div className="h-8 w-px bg-gray-200 mx-1"></div>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                        <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full"><Settings className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full"><Bell className="w-5 h-5" /></button>
                    </div>
                    
                    <button className="bg-sf-blue text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-blue-700">
                        Share
                    </button>
                    
                    <div className="w-8 h-8 rounded-full bg-sf-blue flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                        KL
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 relative overflow-hidden flex" ref={containerRef}>
                
                {/* Left Floating Toolbar (Visual Mock) */}
                <div className="absolute left-4 top-4 z-10 bg-white border border-gray-200 shadow-md rounded-lg flex flex-col p-1 gap-1">
                    <button className="p-2 text-sf-blue bg-blue-50 rounded hover:bg-blue-100"><MousePointer2 className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><Layout className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><Type className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><StickyNote className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><Image className="w-5 h-5" /></button>
                </div>

                {/* Graph Canvas */}
                <div className="flex-1 bg-white">
                    <Graph 
                        data={data}
                        width={containerRef.current?.offsetWidth || 1200}
                        height={containerRef.current?.offsetHeight || 800}
                        activeFilters={activeFilters}
                        onToggleFilter={() => {}}
                        onNodeClick={setSelectedNode}
                        layoutMode="tree" // Enforce the specific Tree/Process layout
                    />
                </div>

                {/* Bottom Right Zoom Controls (Visual Mock - Graph has own zoom but this matches screenshot) */}
                <div className="absolute right-4 bottom-4 z-10 bg-white border border-gray-200 shadow-md rounded-lg flex items-center p-1 gap-1">
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><ZoomOut className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><ZoomIn className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-500 hover:bg-gray-50 rounded"><Maximize className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

export default ProcessDiagramViewer;
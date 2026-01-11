import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../types';
import { Filter, RotateCw, Maximize2, Minimize2, FileText, Printer, Search, Camera, X } from 'lucide-react';

interface GraphProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  width: number;
  height: number;
  activeFilters: string[];
  onToggleFilter: (filter: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onExport?: (type: 'pdf' | 'word') => void;
}

const Graph: React.FC<GraphProps> = ({ 
    data, 
    onNodeClick, 
    width, 
    height, 
    activeFilters, 
    onToggleFilter,
    isExpanded,
    onToggleExpand,
    onExport
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulationKey, setSimulationKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Use a ref to track search query inside D3 event closures
  const searchQueryRef = useRef('');

  // Extract all unique groups from data
  const availableGroups = useMemo(() => Array.from(new Set(data.nodes.map(n => n.group))).sort(), [data]);

  // Update ref and apply highlight when search changes
  useEffect(() => {
      searchQueryRef.current = searchQuery;
      applySearchHighlight(searchQuery);
  }, [searchQuery, simulationKey]);

  // 1. Main D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Filter data based on activeFilters prop
    const filteredNodes = data.nodes.filter(n => activeFilters.includes(n.group));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => 
        filteredNodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) && 
        filteredNodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target)
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom as any);

    // Initial background to catch clicks for zooming
    svg.append("rect")
       .attr("width", "100%")
       .attr("height", "100%")
       .attr("fill", "transparent");

    const g = svg.append("g");

    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Markers
    g.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const link = g.append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("class", "link") 
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node") 
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Interaction Highlighting
    node.on("mouseover", function(event, d: any) {
        // Dim everything first
        node.transition().duration(200).attr("opacity", 0.1);
        link.transition().duration(200).attr("stroke-opacity", 0.1);
        
        // Highlight selected
        d3.select(this).transition().duration(200).attr("opacity", 1);
        
        // Find neighbors
        const neighborIds = new Set<string>();
        filteredLinks.forEach((l: any) => {
            if (l.source.id === d.id) {
                neighborIds.add(l.target.id);
                link.filter((linkD: any) => linkD === l).transition().duration(200).attr("stroke-opacity", 1).attr("stroke", "#0176D3");
            }
            if (l.target.id === d.id) {
                neighborIds.add(l.source.id);
                 link.filter((linkD: any) => linkD === l).transition().duration(200).attr("stroke-opacity", 1).attr("stroke", "#0176D3");
            }
        });
        
        node.filter((n: any) => neighborIds.has(n.id)).transition().duration(200).attr("opacity", 1);
    })
    .on("mouseout", function() {
        // Restore state based on search query ref (avoids stale closure)
        if (searchQueryRef.current) {
             applySearchHighlight(searchQueryRef.current);
        } else {
             node.transition().duration(200).attr("opacity", 1);
             link.transition().duration(200).attr("stroke-opacity", 0.6).attr("stroke", "#cbd5e1");
        }
    });

    // Shapes & Colors Logic
    node.each(function(d: any) {
      const el = d3.select(this);
      
      let color = "#cbd5e1"; // default gray
      if (d.group === 'Object') color = "#0176D3";
      else if (d.group === 'Flow') color = "#9333ea";
      else if (d.group === 'Trigger') color = "#f97316";
      else if (d.group === 'ValidationRule' || d.group === 'Field') color = "#ef4444";
      else if (d.group === 'ApexClass') color = "#64748b";
      else if (d.group === 'LWC') color = "#06b6d4";
      else if (d.group === 'Aura') color = "#14b8a6";
      else if (d.group === 'Visualforce') color = "#4f46e5";

      if (d.group === 'Trigger') {
          el.append("rect").attr("width", 20).attr("height", 20).attr("x", -10).attr("y", -10).attr("fill", color);
      } else if (d.group === 'Object') {
          el.append("circle").attr("r", 15).attr("fill", color);
      } else {
          el.append("circle").attr("r", d.group === 'Flow' ? 12 : 8).attr("fill", color);
      }
    });

    node.append("text")
      .attr("class", "node-text")
      .attr("dx", 18)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("font-size", "10px")
      .attr("font-family", "sans-serif")
      .attr("fill", "#334155")
      .style("pointer-events", "none")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    node.on("click", (event, d: any) => {
      onNodeClick(d);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick, activeFilters, simulationKey]);

  const applySearchHighlight = (query: string) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const nodes = svg.selectAll(".node");
    const links = svg.selectAll(".link");

    if (!query.trim()) {
        nodes.transition().duration(200).attr("opacity", 1);
        links.transition().duration(200).attr("stroke-opacity", 0.6).attr("stroke", "#cbd5e1");
        return;
    }

    const lowerQuery = query.toLowerCase();
    const matchedIds = new Set<string>();

    nodes.each(function(d: any) {
        if (d.label.toLowerCase().includes(lowerQuery) || 
           (d.metadata?.apiName || '').toLowerCase().includes(lowerQuery)) {
            matchedIds.add(d.id);
        }
    });

    nodes.transition().duration(200).attr("opacity", (d: any) => matchedIds.has(d.id) ? 1 : 0.1);
    links.transition().duration(200).attr("stroke-opacity", 0.05);
  };

  const refreshGraph = () => {
      setSimulationKey(prev => prev + 1);
  };

  const handleDownloadImage = () => {
      if (!svgRef.current) return;
      
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      const canvas = document.createElement("canvas");
      const bbox = svgElement.getBoundingClientRect();
      canvas.width = bbox.width;
      canvas.height = bbox.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      const img = new Image();
      // Use Blob to avoid URL length limits
      const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
          // Fill white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(img, 0, 0);
          
          const a = document.createElement("a");
          a.download = `FlowSense_Graph_${new Date().toISOString().slice(0,10)}.png`;
          a.href = canvas.toDataURL("image/png");
          a.click();
          
          URL.revokeObjectURL(url);
      };
      
      img.src = url;
  };
  
  // Helper for color indicator in filters
  const getColor = (group: string) => {
      switch(group) {
          case 'Object': return 'bg-sf-blue';
          case 'Flow': return 'bg-purple-600';
          case 'Trigger': return 'bg-orange-500';
          case 'ValidationRule': return 'bg-red-500';
          case 'Field': return 'bg-emerald-500';
          case 'ApexClass': return 'bg-slate-500';
          case 'LWC': return 'bg-cyan-500';
          case 'Aura': return 'bg-teal-500';
          case 'Visualforce': return 'bg-indigo-600';
          default: return 'bg-gray-400';
      }
  };

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden relative group">
       <svg ref={svgRef} width={width} height={height} className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-50/30" />
       
       {/* Zoom Instructions / Hint */}
       <div className="absolute top-2 left-2 text-[10px] text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Scroll to zoom • Drag to pan
       </div>

       {/* Toolbar: Refresh & Filters */}
       <div className="absolute top-2 right-2 flex flex-col items-end gap-2 pointer-events-none">
            {/* Top Row Buttons (Pointer events auto) */}
            <div className="flex gap-2 pointer-events-auto">
                 {/* Search Toggle */}
                 <div className={`flex items-center bg-white rounded border shadow-sm transition-all overflow-hidden ${showSearch ? 'w-48 border-sf-blue' : 'w-8 border-gray-200'}`}>
                    <button 
                        onClick={() => { setShowSearch(!showSearch); if(showSearch) setSearchQuery(''); }}
                        className={`p-1.5 text-gray-400 hover:text-sf-blue transition-colors flex-shrink-0`}
                        title="Search Graph"
                    >
                        {showSearch && searchQuery ? <X className="w-4 h-4" onClick={(e) => {e.stopPropagation(); setSearchQuery('');}}/> : <Search className="w-4 h-4" />}
                    </button>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nodes..."
                        className={`text-xs outline-none py-1 w-full text-gray-700 ${showSearch ? 'opacity-100 px-1' : 'opacity-0 w-0'}`}
                    />
                 </div>

                 {/* Image Export */}
                 <button 
                     onClick={handleDownloadImage}
                     className="p-1.5 bg-white rounded border border-gray-200 shadow-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                     title="Download Graph Image (PNG)"
                 >
                     <Camera className="w-4 h-4" />
                 </button>

                 {/* Report Exports */}
                 {onExport && (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExport('word'); }}
                            className="p-1.5 bg-white rounded border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Export Graph Details to Word"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExport('pdf'); }}
                            className="p-1.5 bg-white rounded border border-gray-200 shadow-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Print / Export Graph PDF"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                    </>
                 )}

                 <div className="w-px bg-gray-300 mx-1 h-auto my-1"></div>

                 {/* Expand Button */}
                {onToggleExpand && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                        className="p-1.5 bg-white rounded border border-gray-200 shadow-sm text-gray-500 hover:text-sf-blue hover:bg-gray-50 transition-colors"
                        title={isExpanded ? "Minimize Section" : "Expand to Full Screen"}
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}
                <button 
                    onClick={refreshGraph}
                    className="p-1.5 bg-white rounded border border-gray-200 shadow-sm text-gray-500 hover:text-sf-blue hover:bg-gray-50 transition-colors"
                    title="Refresh Layout"
                >
                    <RotateCw className="w-4 h-4" />
                </button>
            </div>
            
            <div className="bg-white/95 p-2 rounded text-xs border border-gray-200 shadow-sm flex flex-col gap-1.5 backdrop-blur-sm pointer-events-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                    <Filter className="w-3 h-3"/> FILTERS
                </div>
                
                {availableGroups.map(group => (
                    <div 
                        key={group}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity ${!activeFilters.includes(group) && 'opacity-40'}`} 
                        onClick={() => onToggleFilter(group)}
                    >
                        <span className={`w-2 h-2 rounded-full ${getColor(group)}`}></span> {group}
                    </div>
                ))}
            </div>
       </div>
    </div>
  );
};

export default Graph;
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../types';
import { Filter, Search } from 'lucide-react';

interface GraphProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  width: number;
  height: number;
}

const Graph: React.FC<GraphProps> = ({ data, onNodeClick, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Object', 'Flow', 'Trigger', 'Field']);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Filter data
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

    const g = svg.append("g");

    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Markers
    g.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
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
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Interaction Highlighting
    node.on("mouseover", function(event, d: any) {
        // Dim all
        node.attr("opacity", 0.1);
        link.attr("stroke-opacity", 0.1);

        // Highlight current
        d3.select(this).attr("opacity", 1);

        // Find neighbors
        const neighborIds = new Set<string>();
        filteredLinks.forEach((l: any) => {
            if (l.source.id === d.id) {
                neighborIds.add(l.target.id);
                // Highlight outgoing links
                link.filter((linkD: any) => linkD === l).attr("stroke-opacity", 1).attr("stroke", "#0176D3");
            }
            if (l.target.id === d.id) {
                neighborIds.add(l.source.id);
                 // Highlight incoming links
                 link.filter((linkD: any) => linkD === l).attr("stroke-opacity", 1).attr("stroke", "#0176D3");
            }
        });

        // Highlight neighbors
        node.filter((n: any) => neighborIds.has(n.id)).attr("opacity", 1);
    })
    .on("mouseout", function() {
        node.attr("opacity", 1);
        link.attr("stroke-opacity", 0.6).attr("stroke", "#cbd5e1");
    });


    // Shapes
    node.each(function(d: any) {
      const el = d3.select(this);
      if (d.group === 'Object') {
        el.append("circle").attr("r", 15).attr("fill", "#0176D3");
      } else if (d.group === 'Flow') {
        el.append("circle").attr("r", 12).attr("fill", "#9333ea");
      } else if (d.group === 'Trigger') {
        el.append("rect").attr("width", 20).attr("height", 20).attr("x", -10).attr("y", -10).attr("fill", "#f97316");
      } else {
        el.append("circle").attr("r", 8).attr("fill", "#10b981");
      }
    });

    node.append("text")
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
  }, [data, width, height, onNodeClick, activeFilters]);

  const toggleFilter = (type: string) => {
      setActiveFilters(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 border border-gray-200 rounded-lg overflow-hidden shadow-inner relative group">
       <svg ref={svgRef} width={width} height={height} className="w-full h-full cursor-grab active:cursor-grabbing" />
       
       {/* Zoom Instructions / Hint */}
       <div className="absolute top-2 left-2 text-[10px] text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Scroll to zoom • Drag to pan
       </div>

       {/* Legend & Filter */}
       <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded text-xs border border-gray-200 shadow-sm flex flex-col gap-1">
          <div className="text-[10px] text-gray-400 font-semibold mb-1 flex items-center gap-1"><Filter className="w-3 h-3"/> FILTERS</div>
          
          <div className={`flex items-center gap-2 cursor-pointer ${!activeFilters.includes('Object') && 'opacity-40'}`} onClick={() => toggleFilter('Object')}>
            <span className="w-2 h-2 rounded-full bg-sf-blue"></span> Object
          </div>
          <div className={`flex items-center gap-2 cursor-pointer ${!activeFilters.includes('Flow') && 'opacity-40'}`} onClick={() => toggleFilter('Flow')}>
            <span className="w-2 h-2 rounded-full bg-purple-600"></span> Flow
          </div>
          <div className={`flex items-center gap-2 cursor-pointer ${!activeFilters.includes('Trigger') && 'opacity-40'}`} onClick={() => toggleFilter('Trigger')}>
            <span className="w-2 h-2 rounded-sm bg-orange-500"></span> Trigger
          </div>
          <div className={`flex items-center gap-2 cursor-pointer ${!activeFilters.includes('Field') && 'opacity-40'}`} onClick={() => toggleFilter('Field')}>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Field
          </div>
       </div>
    </div>
  );
};

export default Graph;
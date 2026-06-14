import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const severityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

const layerYPositions = {
  frontend: 0,
  backend: 1,
  database: 2,
  network: 3,
  infrastructure: 4,
};

const layerLabels = ['Frontend', 'Backend', 'Database', 'Network', 'Infrastructure'];

export default function ChainGraph({ nodes, edges, onSelectNode, selectedNode }) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (container) {
      const resizeObserver = new ResizeObserver(entries => {
        const { width } = entries[0].contentRect;
        setDimensions({ 
          width: Math.max(600, width), 
          height: Math.max(400, Math.min(600, nodes.length * 80 + 100)) 
        });
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, [nodes.length]);

  const layout = useMemo(() => {
    if (!nodes.length) return { positions: {}, usedLayers: [] };

    const padding = { top: 60, right: 60, bottom: 40, left: 120 };

    // HELPER: Normalizează string-urile din backend pentru a se potrivi cu layerYPositions
    const normalizeLayer = (layerStr) => {
      if (!layerStr) return 'backend';
      const low = layerStr.toLowerCase();
      if (low.includes('data')) return 'database';
      if (low.includes('logic') || low.includes('back')) return 'backend';
      if (low.includes('front') || low.includes('app')) return 'frontend';
      if (low.includes('net')) return 'network';
      return 'infrastructure';
    };

    // Mapăm și sortăm straturile utilizate în mod real
    const usedLayers = [...new Set(nodes.map(n => normalizeLayer(n.layer)))].sort(
      (a, b) => (layerYPositions[a] ?? 1) - (layerYPositions[b] ?? 1)
    );

    const layerHeight = (dimensions.height - padding.top - padding.bottom) / Math.max(usedLayers.length, 1);
    const layerNodes = {};
    
    nodes.forEach(n => {
      const normalized = normalizeLayer(n.layer);
      if (!layerNodes[normalized]) layerNodes[normalized] = [];
      layerNodes[normalized].push(n);
    });

    const positions = {};
    usedLayers.forEach((layer, li) => {
      const layerN = layerNodes[layer] || [];
      const nodeSpacing = (dimensions.width - padding.left - padding.right) / Math.max(layerN.length + 1, 2);
      layerN.forEach((node, ni) => {
        positions[node.id] = {
          x: padding.left + nodeSpacing * (ni + 1),
          y: padding.top + layerHeight * li + layerHeight / 2,
        };
      });
    });

    return { positions, usedLayers, layerHeight, padding };
  }, [nodes, dimensions]);

  const { positions, usedLayers, layerHeight, padding } = layout;

  return (
    <div className="relative bg-[hsl(222,47%,4%)] w-full overflow-auto" style={{ minHeight: dimensions.height }}>
      {/* Background-ul randat pe straturi (Layer backgrounds) */}
      {usedLayers?.map((layer, i) => (
        <div
          key={layer}
          className="absolute left-0 right-0 border-b border-border/20 animate-fade-in"
          style={{ top: (padding?.top || 60) + (layerHeight || 100) * i, height: layerHeight || 100 }}
        >
          <span className="absolute left-3 top-2 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
            {layerLabels[layerYPositions[layer]] || layer}
          </span>
        </div>
      ))}

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="relative z-10"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="14" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(190, 95%, 50%)" fillOpacity="0.7" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Randare muchii (Edges) */}
{edges.map((edge, i) => {
  const from = positions[edge.from];
  const to = positions[edge.to];
  if (!from || !to) return null;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlOffset = Math.abs(dx) < 50 ? 40 : 0;

  return (
    <g key={i}>
      <path
        d={`M ${from.x} ${from.y} Q ${midX + controlOffset} ${midY} ${to.x} ${to.y}`}
        fill="none"
        stroke={edge.difficulty === 'hard' ? '#ef4444' : 'hsl(190, 95%, 50%)'}
        strokeWidth="1.5"
        strokeOpacity="0.4"
        markerEnd="url(#arrowhead)"
        strokeDasharray={edge.difficulty === 'hard' ? '5,5' : undefined}
      />
      
      {/* ⚡ ANIMAȚIE PROGRESIVE PAYLOAD  */}
      <circle r="4" fill="hsl(190, 95%, 50%)" fillOpacity="0.8">
        <animateMotion 
          dur="3s" 
          repeatCount="indefinite" 
          path={`M ${from.x} ${from.y} Q ${midX + controlOffset} ${midY} ${to.x} ${to.y}`} 
        />
      </circle>
      

      {edge.method && (
        <text
          x={midX + controlOffset / 2}
          y={midY - 8}
          fill="hsl(190, 90%, 60%)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          className="bg-slate-950 px-1 font-semibold"
        >
          {edge.method}
        </text>
      )}
    </g>
  );
})}

        {/* Randare noduri (Nodes) */}
        {nodes.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;
          const color = severityColors[node.severity] || severityColors.medium;
          const isSelected = selectedNode?.id === node.id;
          const isMitigated = node.status === 'mitigated'; // Aici verificăm statusul
          const r = node.is_critical_intersection ? 22 : node.is_entry_point ? 20 : 16;
        
          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node)}
              className="cursor-pointer group"
            >
              {/* Inel de strălucire la selecție sau intersecție critică */}
              {(isSelected || node.is_critical_intersection) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 6}
                  fill="none"
                  stroke={isSelected ? 'hsl(190, 95%, 50%)' : color}
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                  filter="url(#glow)"
                />
              )}

              {/* Cercul principal al nodului */}
              <circle
                cx={pos.x}
        cy={pos.y}
        r={r}
        fill={isMitigated ? '#064e3b' : `${color}15`} // Verde închis dacă e mitigat
        stroke={isMitigated ? '#10b981' : color}       // Verde aprins dacă e mitigat
        strokeWidth={isSelected ? 3 : 1.5}
        className="transition-all duration-200 group-hover:fill-opacity-30"
              />

              {/* Indicator Punct de Intrare (Entry Point) */}
              {node.is_entry_point && (
                <polygon
                  points={`${pos.x - 4},${pos.y - 2} ${pos.x + 4},${pos.y - 2} ${pos.x},${pos.y + 4}`}
                  fill={color}
                  fillOpacity="0.9"
                />
              )}

              {/* Indicator Intersecție Critică (Diamant) */}
              {node.is_critical_intersection && !node.is_entry_point && (
                <rect
                  x={pos.x - 4}
                  y={pos.y - 4}
                  width="8"
                  height="8"
                  fill={color}
                  fillOpacity="0.9"
                  transform={`rotate(45, ${pos.x}, ${pos.y})`}
                />
              )}

              {/* Etichetă Text sub nod */}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                fill={isSelected ? "hsl(190, 95%, 70%)" : "hsl(210, 40%, 95%)"}
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                fontWeight={isSelected ? "700" : "500"}
              >
                {node.title?.length > 25 ? node.title.substring(0, 22) + '...' : node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
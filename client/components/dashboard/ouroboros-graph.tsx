'use client';

import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import { createClient } from '@supabase/supabase-js';
import '@xyflow/react/dist/style.css';
import DissonanceEdge from './dissonance-edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const edgeTypes = { dissonance: DissonanceEdge };

const nodeStyle = { 
  background: '#101420', 
  color: '#00FFFF', 
  border: '1px solid #00FFFF', 
  borderRadius: '4px', 
  fontFamily: 'monospace', 
  padding: '12px 20px',
  fontSize: '13px',
  fontWeight: 'bold',
  boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
};

export default function OuroborosGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchIntelligence = useCallback(async () => {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30); // Keep graph clean by only showing the latest 30 nodes

    if (error || !data) return;

    // 1. Map Unique Actors to Nodes in a Circular "Ouroboros" Layout
    const uniqueActors = Array.from(new Set(data.map(r => r.actor)));
    const radius = 250; 
    const centerX = 400;
    const centerY = 300;

    const newNodes: Node[] = uniqueActors.map((actor, index) => {
      // Basic trigonometry to arrange nodes in a perfect circle
      const angle = (index / uniqueActors.length) * 2 * Math.PI;
      return {
        id: String(actor),
        position: { 
          x: centerX + radius * Math.cos(angle), 
          y: centerY + radius * Math.sin(angle) 
        },
        data: { label: String(actor).toUpperCase() },
        style: nodeStyle,
      };
    });

    // 2. Advanced Edge Mapping (Timeline & Dissonance)
    const newEdges: Edge[] = [];
    const edgeSet = new Set(); // Prevent duplicate lines between the same two nodes

    for (let i = 0; i < data.length - 1; i++) {
      const r1 = data[i];
      const r2 = data[i+1];

      // Only connect different actors to build the intelligence web
      if (r1.actor !== r2.actor) {
        const edgeId = [r1.actor, r2.actor].sort().join('-');
        
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);

          // Logic: If one actor is highly positive and the other is highly negative, flag it!
          const isConflict = Math.abs(r1.sentiment - r2.sentiment) > 1.2;

          newEdges.push({
            id: `edge-${r1.id}-${r2.id}`,
            source: String(r1.actor),
            target: String(r2.actor),
            type: isConflict ? 'dissonance' : 'default',
            animated: !isConflict, // Cyan data streams flow; Red conflict lines stay solid
            style: { 
              stroke: isConflict ? '#DC3545' : '#00FFFF', 
              strokeWidth: isConflict ? 3 : 1.5,
              opacity: isConflict ? 1 : 0.4
            }
          });
        }
      }
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchIntelligence();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence_reports' }, fetchIntelligence)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIntelligence]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }} // Adds some breathing room around the circle
      >
        <Controls style={{ fill: '#00FFFF', backgroundColor: '#101420', border: '1px solid #00FFFF' }} />
        <Background variant={BackgroundVariant.Dots} gap={24} color="#00FFFF" style={{ opacity: 0.15 }} />
      </ReactFlow>
    </div>
  );
}
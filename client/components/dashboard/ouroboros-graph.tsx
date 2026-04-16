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

// Initialize Supabase using your environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const edgeTypes = { dissonance: DissonanceEdge };

const nodeStyle = { 
  background: '#101420', 
  color: '#00FFFF', 
  border: '1px solid #00FFFF', 
  borderRadius: '2px', 
  fontFamily: 'monospace', 
  padding: '10px 15px',
  fontSize: '12px',
  fontWeight: 'bold'
};

export default function OuroborosGraph() {
  // Explicitly tell TypeScript what these arrays hold to fix the 'never[]' error
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchIntelligence = useCallback(async () => {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return;

    // 1. Map Unique Actors to Nodes
    const uniqueActors = Array.from(new Set(data.map(r => r.actor)));
    const newNodes: Node[] = uniqueActors.map((actor, index) => ({
      id: String(actor),
      position: { x: 150 + (index * 250), y: 200 + (Math.sin(index) * 100) }, // Spread them out
      data: { label: String(actor).toUpperCase() },
      style: nodeStyle,
    }));

    // 2. Map Shared Subjects to Edges
    const newEdges: Edge[] = [];
    const subjects = Array.from(new Set(data.map(r => r.subject)));
    
    subjects.forEach(sub => {
      const related = data.filter(r => r.subject === sub);
      // If multiple actors are talking about the same subject, connect them
      if (related.length > 1) {
        // Check for dissonance (hypocrisy/conflict) in sentiment
        const hasConflict = Math.abs(related[0].sentiment - related[1].sentiment) > 1.2;
        
        newEdges.push({
          id: `e-${related[0].actor}-${related[1].actor}-${sub}`,
          source: String(related[0].actor),
          target: String(related[1].actor),
          type: hasConflict ? 'dissonance' : 'default',
          animated: !hasConflict,
          style: { stroke: hasConflict ? '#DC3545' : '#00FFFF', strokeWidth: 2 }
        });
      }
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchIntelligence();
    
    // Real-time listener: Updates the graph instantly when the backend adds data
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
      >
        <Controls style={{ fill: '#00FFFF', backgroundColor: '#101420', border: '1px solid #00FFFF' }} />
        <Background variant={BackgroundVariant.Dots} gap={20} color="#00FFFF" style={{ opacity: 0.1 }} />
      </ReactFlow>
    </div>
  );
}
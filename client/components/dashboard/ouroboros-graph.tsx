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
  background: '#101420', color: '#00FFFF', border: '1px solid #00FFFF', 
  borderRadius: '4px', fontFamily: 'monospace', padding: '12px 20px',
  fontSize: '13px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
};

// --- ENTITY NORMALIZER ---
const normalizeActor = (rawActor: string) => {
  let actor = String(rawActor).toUpperCase().trim();
  
  // STRIP TITLES: Removes "PREZ", "PRESIDENT", "PM", etc. from the start of the name
  actor = actor.replace(/^(PREZ|PRESIDENT|PM|PRIME MINISTER|FORMER PRESIDENT|MINISTER)\s+/g, '');

  const aliases: Record<string, string> = {
    "UNITED STATES": "USA", "U.S.": "USA", "US": "USA", "THE UNITED STATES": "USA",
    "UNITED KINGDOM": "UK", "U.K.": "UK", "BRITAIN": "UK", "GREAT BRITAIN": "UK",
    "RUSSIAN FEDERATION": "RUSSIA", "PEOPLE'S REPUBLIC OF CHINA": "CHINA", "PRC": "CHINA",
    "EUROPEAN UNION": "EU", "SOUTH KOREA": "S. KOREA", "NORTH KOREA": "N. KOREA"
  };
  return aliases[actor] || actor;
};

export default function OuroborosGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchIntelligence = useCallback(async () => {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return;

    // 1. Clean the Data
    const cleanedData = data.map(r => ({ ...r, actor: normalizeActor(r.actor) }));

    // 2. Map Unique Actors to Ouroboros Circle
    const uniqueActors = Array.from(new Set(cleanedData.map(r => r.actor)));
    const radius = 250; const centerX = 400; const centerY = 300;

    const newNodes: Node[] = uniqueActors.map((actor, index) => {
      const angle = (index / uniqueActors.length) * 2 * Math.PI;
      return {
        id: actor,
        position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) },
        data: { label: actor },
        style: nodeStyle,
      };
    });

    // 3. Map Dynamic Edges
    const newEdges: Edge[] = [];
    const edgeSet = new Set();

    for (let i = 0; i < cleanedData.length - 1; i++) {
      const r1 = cleanedData[i];
      const r2 = cleanedData[i+1];

      if (r1.actor !== r2.actor) {
        const edgeId = [r1.actor, r2.actor].sort().join('-');
        
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          const isConflict = Math.abs(r1.sentiment - r2.sentiment) > 1.2;

          newEdges.push({
            id: `edge-${r1.id}-${r2.id}`,
            source: r1.actor,
            target: r2.actor,
            type: isConflict ? 'dissonance' : 'default',
            animated: !isConflict,
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
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence_reports' }, fetchIntelligence)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchIntelligence]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes} edges={edges} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        colorMode="dark" fitView fitViewOptions={{ padding: 0.2 }}
      >
        <Controls style={{ fill: '#00FFFF', backgroundColor: '#101420', border: '1px solid #00FFFF' }} />
        <Background variant={BackgroundVariant.Dots} gap={24} color="#00FFFF" style={{ opacity: 0.15 }} />
      </ReactFlow>
    </div>
  );
}
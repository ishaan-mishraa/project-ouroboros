"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, ShieldAlert, Activity, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DissonanceAlert {
  id: string;
  type: "HYPOCRISY" | "GEOPOLITICAL CLASH";
  actor1: string;
  actor2: string;
  statement1: string;
  statement2: string;
  sentimentShift: number;
  timestamp: string;
}

export function ContradictionAlertCenter() {
  const [alerts, setAlerts] = useState<DissonanceAlert[]>([])

  const scanForDissonance = async () => {
    // Fetch the 20 most recent intelligence reports
    const { data } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) return;

    const detectedAlerts: DissonanceAlert[] = [];
    const alertSet = new Set(); // Prevent duplicates

    // Compare reports against each other to find active contradictions
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const r1 = data[i];
        const r2 = data[j];
        
        const shift = Math.abs(r1.sentiment - r2.sentiment);
        
        // If the sentiment shift is massive (>0.8), we have a contradiction
        if (shift > 0.8) {
          const isHypocrisy = r1.actor.toUpperCase() === r2.actor.toUpperCase();
          const alertId = isHypocrisy ? `hyp-${r1.actor}` : `clash-${r1.actor}-${r2.actor}`;
          
          if (!alertSet.has(alertId)) {
            alertSet.add(alertId);
            detectedAlerts.push({
              id: `${r1.id}-${r2.id}`,
              type: isHypocrisy ? "HYPOCRISY" : "GEOPOLITICAL CLASH",
              actor1: r1.actor.toUpperCase(),
              actor2: r2.actor.toUpperCase(),
              statement1: r1.statement,
              statement2: r2.statement,
              sentimentShift: shift,
              timestamp: new Date(r1.created_at).toLocaleTimeString([], { hour12: false })
            });
          }
        }
      }
    }
    
    setAlerts(detectedAlerts.slice(0, 5)); // Keep the top 5 most recent alerts
  };

  useEffect(() => {
    scanForDissonance();
    
    // Auto-update when new intelligence drops
    const channel = supabase.channel('alert-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence_reports' }, scanForDissonance)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <aside className="w-80 h-full border-l border-red-500/20 bg-[#0A0D14]/90 backdrop-blur-md flex flex-col">
      <div className="h-12 border-b border-red-500/20 flex items-center gap-2 px-4 bg-red-950/10 shrink-0">
        <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">
          Dissonance Alert Center
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 space-y-2 opacity-50">
            <Activity className="h-6 w-6" />
            <span className="text-[10px] uppercase tracking-widest">No Active Contradictions</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="relative p-3 rounded border border-red-500/30 bg-[#1A0B0E] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-[8px] font-bold text-red-500 tracking-wider">
                      {alert.type}
                    </span>
                  </div>
                  <span className="text-[9px] text-red-400/60 font-mono">{alert.timestamp}</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-black/40 border border-red-500/10 p-2 rounded">
                    <div className="text-[9px] text-red-400 font-bold mb-1 tracking-wider">{alert.actor1}</div>
                    <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">{alert.statement1}</p>
                  </div>
                  
                  <div className="flex justify-center -my-1 relative z-20">
                    <div className="bg-red-500 text-black text-[8px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                      VS (SHIFT: {alert.sentimentShift.toFixed(1)})
                    </div>
                  </div>

                  <div className="bg-black/40 border border-red-500/10 p-2 rounded">
                    <div className="text-[9px] text-red-400 font-bold mb-1 tracking-wider">{alert.actor2}</div>
                    <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">{alert.statement2}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
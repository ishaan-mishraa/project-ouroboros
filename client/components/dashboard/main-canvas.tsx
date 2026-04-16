"use client"

import { useState, useEffect } from "react"
import { Network, Layers } from "lucide-react"
import OuroborosGraph from './ouroboros-graph'

export function MainCanvas() {
  // Mock fluctuating numbers for the aesthetic top status bar
  const [nodeCount, setNodeCount] = useState(47)
  const [edgeCount, setEdgeCount] = useState(128)

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount((prev) => prev + Math.floor(Math.random() * 3) - 1)
      setEdgeCount((prev) => prev + Math.floor(Math.random() * 5) - 2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0D14] rounded-lg border border-cyan-500/20">
      
      {/* Top Left Toolbar (Floating over canvas) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#101420]/90 backdrop-blur-sm border border-cyan-500/30 rounded px-2 py-1 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
          <Network className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">NODES:</span>
          <span className="text-[10px] text-cyan-400 font-bold tabular-nums font-mono">
            {nodeCount}
          </span>
          <span className="mx-1 text-slate-600">|</span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">EDGES:</span>
          <span className="text-[10px] text-cyan-400 font-bold tabular-nums font-mono">
            {edgeCount}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[#101420]/90 backdrop-blur-sm border border-cyan-500/30 rounded px-2 py-1 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">LAYER:</span>
          <span className="text-[10px] text-slate-200 font-medium font-mono tracking-wider">GEOPOLITICAL</span>
        </div>
      </div>

      {/* --- THE REAL REACT FLOW CANVAS --- */}
      {/* We set pointer-events-auto here so the graph is interactive underneath the floating UI */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <OuroborosGraph />
      </div>

      {/* Bottom Status Bar (Floating over canvas) */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-cyan-500/30 bg-[#101420]/90 backdrop-blur-md flex items-center justify-between px-3 z-10 pointer-events-none">
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider">
          <span className="text-slate-400">
            LAST SYNC: <span className="text-slate-200">00:00:03 AGO</span>
          </span>
          <span className="text-slate-400">
            QUERY TIME: <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">127ms</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider">
          <span className="text-slate-400">
            MEMORY: <span className="text-slate-200">2.4GB</span>
          </span>
          <span className="text-slate-400">
            CPU: <span className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">23%</span>
          </span>
        </div>
      </div>
    </div>
  )
}
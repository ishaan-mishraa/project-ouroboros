"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Radio, TrendingUp, TrendingDown, Send, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewsEvent {
  id: string
  timestamp: string
  region: string
  headline: string
  sentiment: "positive" | "negative" | "neutral"
  source: string
  priority: "high" | "medium" | "low"
}

// Keep the initial mock data for that "busy" look
const mockEvents: NewsEvent[] = [
  {
    id: "evt-001",
    timestamp: "18:15:58",
    region: "APAC",
    headline: "System initialized. Ouroboros core awaiting manual neural input.",
    sentiment: "neutral",
    source: "CORE-01",
    priority: "low",
  },
]

export function IngestionFeed() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [events, setEvents] = useState<NewsEvent[]>(mockEvents)
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Manual Ingestion Logic
  const handleIngest = async () => {
    if (!inputText.trim()) return
    setIsProcessing(true)

    try {
      const response = await fetch("http://localhost:8787/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Add your manual entry to the top of the feed list
        const newEvent: NewsEvent = {
          id: `manual-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          region: "USER",
          headline: inputText,
          sentiment: result.dissonance ? "negative" : "positive",
          source: "DIRECT_LINK",
          priority: result.dissonance ? "high" : "medium",
        }
        
        setEvents(prev => [newEvent, ...prev])
        setInputText("")
      }
    } catch (err) {
      console.error("Link Failure: Cannot reach Hono server.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <aside
      className={cn(
        "h-full border-r border-cyan-500/20 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300 flex flex-col",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-cyan-500/20 flex items-center justify-between px-3 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
              Neural Ingestion Feed
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-cyan-500/10 rounded transition-colors text-slate-500 hover:text-cyan-400"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* MANUAL INPUT SECTION */}
          <div className="p-3 border-b border-cyan-500/10 bg-cyan-950/10">
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="INPUT RAW INTELLIGENCE..."
                className="w-full h-20 bg-black/50 border border-cyan-500/30 rounded p-2 text-[10px] font-mono text-cyan-100 placeholder:text-slate-600 focus:border-cyan-400 outline-none resize-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
              />
              <button 
                onClick={handleIngest}
                disabled={isProcessing}
                className="absolute bottom-2 right-2 p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded text-cyan-400 transition-all disabled:opacity-30"
              >
                <Send className={cn("h-3 w-3", isProcessing && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* FEED CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2 space-y-2">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-2.5 rounded border border-cyan-500/10 bg-[#0D1117] hover:border-cyan-500/30 transition-all cursor-crosshair group relative overflow-hidden",
                    index === 0 && "border-cyan-500/40 shadow-[0_0_15px_rgba(0,255,255,0.05)]"
                  )}
                >
                  {/* Decorative Scanline Effect */}
                  <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000" />
                  
                  <div className="flex items-center justify-between mb-1.5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-cyan-500 font-bold tracking-tighter uppercase">
                        {event.region}
                      </span>
                      <span className={cn(
                        "h-1 w-1 rounded-full",
                        event.priority === "high" ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : "bg-cyan-500"
                      )} />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono tabular-nums">
                      {event.timestamp}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-300 leading-tight mb-2 relative z-10 font-sans">
                    {event.headline}
                  </p>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[9px] text-slate-600 font-mono italic">
                      SRC: {event.source}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold tracking-widest",
                      event.sentiment === "positive" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                      event.sentiment === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
                      event.sentiment === "neutral" && "bg-slate-500/10 text-slate-400"
                    )}>
                      {event.sentiment === "positive" ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                      {event.sentiment.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Collapsed Sidebar State */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-3 opacity-50">
          <Terminal className="h-4 w-4 text-cyan-500" />
          <div className="flex flex-col gap-2">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className={cn(
                "h-1 w-1 rounded-full",
                event.sentiment === "positive" ? "bg-cyan-500" : "bg-red-500"
              )} />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Radio, TrendingUp, TrendingDown, Send, Terminal, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NewsEvent {
  id: string
  timestamp: string
  region: string
  headline: string
  sentiment: "positive" | "negative" | "neutral"
  source: string
  priority: "high" | "medium" | "low"
}

export function IngestionFeed() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [events, setEvents] = useState<NewsEvent[]>([])
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Fetch Actual History from Database on Load
  const fetchHistory = async () => {
    const { data } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) {
      const formattedEvents: NewsEvent[] = data.map((item: any) => ({
        id: item.id.toString(),
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour12: false }),
        region: item.actor.substring(0, 4).toUpperCase(),
        headline: item.statement,
        sentiment: item.sentiment > 0.3 ? "positive" : item.sentiment < -0.3 ? "negative" : "neutral",
        source: "OSINT",
        priority: Math.abs(item.sentiment) > 0.8 ? "high" : "medium"
      }))
      setEvents(formattedEvents)
    }
  }

  useEffect(() => {
    fetchHistory();
  }, [])

  // 2. Manual Ingestion Logic
  const handleIngest = async () => {
    if (!inputText.trim()) return
    setIsProcessing(true)
    try {
      await fetch("http://localhost:8787/ingest", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: inputText }),
      })
      setInputText("")
      fetchHistory() // Refresh the feed
    } catch (err) {
      console.error("Link Failure")
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. Automated Global Sync Logic
  const handleGlobalSync = async () => {
    setIsSyncing(true)
    try {
      await fetch("http://localhost:8787/sync")
      fetchHistory() // Refresh the feed with the new global data
    } catch (err) {
      console.error("Sync Failure")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <aside className={cn("h-full border-r border-cyan-500/20 bg-[#0A0D14]/80 backdrop-blur-md transition-all duration-300 flex flex-col", isCollapsed ? "w-12" : "w-80")}>
      {/* Header */}
      <div className="h-12 border-b border-cyan-500/20 flex items-center justify-between px-3 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Neural Ingestion Feed</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-cyan-500/10 rounded transition-colors text-slate-500 hover:text-cyan-400">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* INPUT & SYNC SECTION */}
          <div className="p-3 border-b border-cyan-500/10 bg-cyan-950/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Manual Override</span>
              <button 
                onClick={handleGlobalSync}
                disabled={isSyncing}
                className="flex items-center gap-1 text-[9px] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded hover:bg-cyan-500/10 transition-all disabled:opacity-50"
              >
                <Globe className={cn("h-3 w-3", isSyncing && "animate-spin")} /> 
                {isSyncing ? "SYNCING..." : "GLOBAL SYNC"}
              </button>
            </div>
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="INPUT RAW INTELLIGENCE..."
                className="w-full h-16 bg-black/50 border border-cyan-500/30 rounded p-2 text-[10px] font-mono text-cyan-100 focus:border-cyan-400 outline-none resize-none transition-all"
              />
              <button 
                onClick={handleIngest} disabled={isProcessing}
                className="absolute bottom-2 right-2 p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded text-cyan-400 transition-all disabled:opacity-30"
              >
                <Send className={cn("h-3 w-3", isProcessing && "animate-pulse")} />
              </button>
            </div>
          </div>

          {/* REAL FEED CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2 space-y-2">
              {events.length === 0 ? (
                <div className="text-center p-4 text-[10px] text-slate-500 font-mono">NO DATA IN DATABANKS. INITIATE SYNC.</div>
              ) : (
                events.map((event, index) => (
                  <div key={event.id} className={cn("p-2.5 rounded border border-cyan-500/10 bg-[#0D1117] hover:border-cyan-500/30 transition-all cursor-crosshair group relative overflow-hidden", index === 0 && "border-cyan-500/40 shadow-[0_0_15px_rgba(0,255,255,0.05)]")}>
                    <div className="flex items-center justify-between mb-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-cyan-500 font-bold tracking-tighter uppercase">{event.region}</span>
                        <span className={cn("h-1 w-1 rounded-full", event.priority === "high" ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : "bg-cyan-500")} />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono tabular-nums">{event.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight mb-2 relative z-10 font-sans">{event.headline}</p>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[9px] text-slate-600 font-mono italic">SRC: {event.source}</span>
                      <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold tracking-widest", event.sentiment === "positive" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20", event.sentiment === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20", event.sentiment === "neutral" && "bg-slate-500/10 text-slate-400")}>
                        {event.sentiment === "positive" ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                        {event.sentiment.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
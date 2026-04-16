"use client"

import { useState } from "react"
import { AlertTriangle, X, ChevronDown, ChevronUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Alert {
  id: string
  title: string
  description: string
  sources: string[]
  severity: "critical" | "high" | "medium"
  timestamp: string
  isExpanded: boolean
}

const initialAlerts: Alert[] = [
  {
    id: "alert-001",
    title: "SOURCE CONFLICT: Naval Deployment Data",
    description:
      "SIGINT-7 reports 12 vessels in South China Sea patrol. IMINT-4 satellite data shows only 8 vessels. Discrepancy of 4 vessels requires immediate verification.",
    sources: ["SIGINT-7", "IMINT-4"],
    severity: "critical",
    timestamp: "14:28:07",
    isExpanded: true,
  },
  {
    id: "alert-002",
    title: "TIMELINE ANOMALY: Troop Movement",
    description:
      "HUMINT-3 reports battalion mobilization at 0800 UTC. Satellite pass at 0745 UTC shows no activity. Verify source reliability or consider deception operation.",
    sources: ["HUMINT-3", "IMINT-2"],
    severity: "critical",
    timestamp: "14:15:33",
    isExpanded: false,
  },
  {
    id: "alert-003",
    title: "ATTRIBUTION CONFLICT: Cyber Attack Origin",
    description:
      "Network forensics indicate APT-29 signatures. SIGINT intercepts suggest APT-41 involvement. Possible false flag operation detected.",
    sources: ["CYBERCOM", "SIGINT-5"],
    severity: "high",
    timestamp: "13:52:19",
    isExpanded: false,
  },
  {
    id: "alert-004",
    title: "QUANTITY MISMATCH: Arms Shipment",
    description:
      "Manifest shows 500 units exported. Port authority records indicate 650 units loaded. 150 unit discrepancy flagged for investigation.",
    sources: ["FININT-2", "OSINT-8"],
    severity: "medium",
    timestamp: "13:41:55",
    isExpanded: false,
  },
]

export function ContradictionAlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)

  const toggleExpand = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isExpanded: !alert.isExpanded } : alert
      )
    )
  }

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length

  return (
    <aside className="w-80 h-full border-l border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {criticalCount > 0 && (
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-ping" />
            )}
          </div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Contradiction Alert Center
          </span>
        </div>
        {criticalCount > 0 && (
          <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] font-bold rounded">
            {criticalCount} CRITICAL
          </span>
        )}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Zap className="h-8 w-8 mb-2 opacity-50" />
            <span className="text-xs">No active contradictions</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded border transition-all",
                alert.severity === "critical" &&
                  "border-destructive/50 glow-crimson bg-destructive/5",
                alert.severity === "high" &&
                  "border-warning/50 bg-warning/5",
                alert.severity === "medium" &&
                  "border-border bg-background/50"
              )}
            >
              {/* Alert Header */}
              <div
                className="p-2.5 cursor-pointer"
                onClick={() => toggleExpand(alert.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        alert.severity === "critical" && "text-destructive",
                        alert.severity === "high" && "text-warning",
                        alert.severity === "medium" && "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        alert.severity === "critical" && "text-destructive",
                        alert.severity === "high" && "text-warning",
                        alert.severity === "medium" && "text-muted-foreground"
                      )}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {alert.timestamp}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissAlert(alert.id)
                      }}
                      className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {alert.title}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex gap-1">
                    {alert.sources.map((source) => (
                      <span
                        key={source}
                        className="px-1 py-0.5 bg-accent text-[9px] text-accent-foreground rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                  {alert.isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {alert.isExpanded && (
                <div className="px-2.5 pb-2.5 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                    {alert.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 px-2 py-1 bg-accent hover:bg-accent/80 text-[10px] text-accent-foreground font-medium rounded transition-colors">
                      INVESTIGATE
                    </button>
                    <button className="flex-1 px-2 py-1 bg-destructive/20 hover:bg-destructive/30 text-[10px] text-destructive font-medium rounded transition-colors">
                      ESCALATE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="h-10 border-t border-border flex items-center justify-around px-3 shrink-0 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">
            {alerts.filter((a) => a.severity === "critical").length} Critical
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-muted-foreground">
            {alerts.filter((a) => a.severity === "high").length} High
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">
            {alerts.filter((a) => a.severity === "medium").length} Med
          </span>
        </div>
      </div>
    </aside>
  )
}

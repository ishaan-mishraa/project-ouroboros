"use client"

import { useState, useEffect } from "react"
import { Shield, Wifi, WifiOff, Activity } from "lucide-react"

export function TopNav() {
  const [time, setTime] = useState<string>("")
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const utc = now.toISOString().slice(11, 19)
      setTime(utc)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="h-8 w-8 text-primary" />
          <div className="absolute inset-0 text-primary blur-sm opacity-50">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
            Classified
          </span>
          <h1 className="text-lg font-bold text-primary text-glow-cyan tracking-wide">
            PROJECT OUROBOROS
          </h1>
        </div>
      </div>

      {/* Center: Status Indicators */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">DATA STREAMS</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-success animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-xs">
          <Activity className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">NEURAL NET</span>
          <span className="text-primary">ACTIVE</span>
        </div>
      </div>

      {/* Right: Clock & Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span
            className={`text-xs ${isOnline ? "text-success" : "text-destructive"}`}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">UTC</span>
          <span className="text-sm font-bold text-primary text-glow-cyan tabular-nums">
            {time}
          </span>
        </div>
      </div>
    </header>
  )
}

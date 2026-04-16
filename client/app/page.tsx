import { TopNav } from "@/components/dashboard/top-nav"
import { IngestionFeed } from '@/components/dashboard/ingestion-feed'
import { MainCanvas } from "@/components/dashboard/main-canvas"
import { ContradictionAlertCenter } from "@/components/dashboard/contradiction-alert-center"

export default function DashboardPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Ingestion Feed */}
        <IngestionFeed />

        {/* Center - Main Canvas */}
        <MainCanvas />

        {/* Right Panel - Contradiction Alert Center */}
        <ContradictionAlertCenter />
      </div>

      {/* Classification Banner */}
      <div className="h-6 bg-destructive/20 border-t border-destructive/30 flex items-center justify-center">
        <span className="text-[10px] font-bold text-destructive tracking-[0.3em]">
          TOP SECRET // NOFORN // ORCON
        </span>
      </div>
    </div>
  )
}

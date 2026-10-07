import React, { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Chat from './components/Chat'
import Timeline from './components/Timeline'
import Settings from './components/Settings'
import Graph3D from './components/Graph3D'

const VIEWS = {
  dashboard: Dashboard,
  chat: Chat,
  timeline: Timeline,
  settings: Settings,
}

export default function App() {
  const [activeView, setActiveView] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const ActiveComponent = VIEWS[activeView] || Chat

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-dark-900">
      {/* Header — fixed height, no scroll */}
      <Header activeView={activeView} />

      {/* Main area — fills remaining space, no scroll */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content — no page-level scrolling */}
        <main className="flex-1 relative overflow-hidden">
          {/* 3D Background Graph */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <Graph3D />
          </div>

          {/* Active View */}
          <div className="relative z-10 h-full">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  )
}

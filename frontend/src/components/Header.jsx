import React from 'react'

export default function Header({ activeView }) {
  const viewLabels = {
    dashboard: 'Dashboard',
    chat: 'Chat',
    timeline: 'Timeline',
    settings: 'Settings',
  }

  return (
    <header className="h-14 glass border-b border-dark-500 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🧠</span>
        <h1 className="text-lg font-semibold gradient-text">Atlas</h1>
        <span className="text-xs text-gray-500 font-mono">v0.1.0</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {viewLabels[activeView] || activeView}
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-xs text-gray-500">Local</span>
        </div>
      </div>
    </header>
  )
}

import React from 'react'

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '⏱️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ activeView, onNavigate, isOpen, onToggle }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-16 left-2 z-20 w-8 h-8 glass rounded-lg flex items-center justify-center hover:border-atlas-400/30 transition-colors"
        aria-label="Toggle sidebar"
      >
        <span className="text-sm">{isOpen ? '◀' : '▶'}</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-48' : 'w-0 -ml-4'
        } transition-all duration-200 glass border-r border-dark-500 flex flex-col shrink-0 overflow-hidden`}
      >
        <div className="flex-1 flex flex-col gap-1 p-3 pt-16">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeView === item.id
                  ? 'bg-atlas-500/20 text-atlas-300 border border-atlas-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600/50 border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              {isOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Bottom status */}
        {isOpen && (
          <div className="p-3 border-t border-dark-500">
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-atlas-400"></span>
                All Local
              </div>
              <div className="mt-1">0 memories indexed</div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

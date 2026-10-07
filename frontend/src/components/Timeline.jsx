import React from 'react'

const MOCK_EVENTS = [
  { date: '2026-10-07', title: 'Atlas Project Started', type: 'milestone' },
  { date: '2026-10-06', title: 'Browser History Scanned', type: 'ingestion', source: 'Chrome' },
  { date: '2026-10-05', title: 'Documents Indexed', type: 'ingestion', source: 'Files' },
]

export default function Timeline() {
  return (
    <div className="h-full p-6 overflow-hidden">
      <h2 className="text-xl font-semibold gradient-text mb-4">Timeline</h2>

      <div className="glass rounded-xl p-4 h-[calc(100%-3rem)] overflow-y-auto">
        <div className="space-y-0">
          {MOCK_EVENTS.map((event, i) => (
            <div key={i} className="relative pl-6 pb-5 border-l border-dark-500 last:pb-0">
              {/* Dot */}
              <div className="absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-atlas-500 border-2 border-dark-900"></div>

              {/* Date */}
              <div className="text-xs text-gray-500 mb-1">{event.date}</div>

              {/* Title */}
              <div className="text-sm text-gray-200">{event.title}</div>

              {/* Type badge */}
              <div className="mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-atlas-500/10 text-atlas-400 border border-atlas-500/20">
                  {event.type}
                </span>
                {event.source && (
                  <span className="text-xs text-gray-500 ml-2">{event.source}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

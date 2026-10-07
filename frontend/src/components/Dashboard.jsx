import React, { useState, useEffect } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('atlas_api_key') || ''}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.data)
      }
    } catch (err) {
      // Server not running
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: 'Memories',
      value: stats?.documents_count ?? '--',
      icon: '🧠',
      color: 'border-atlas-500/30',
    },
    {
      title: 'Sources',
      value: Object.keys(stats?.sources_count ?? {}).length || '--',
      icon: '📡',
      color: 'border-purple-500/30',
    },
    {
      title: 'Status',
      value: loading ? 'Loading...' : 'Online',
      icon: '🔒',
      color: 'border-green-500/30',
    },
    {
      title: 'Privacy',
      value: 'Local',
      icon: '🏠',
      color: 'border-blue-500/30',
    },
  ]

  return (
    <div className="h-full p-6 overflow-hidden">
      <h2 className="text-xl font-semibold gradient-text mb-4">Dashboard</h2>

      {/* Stats Grid — 2x2, fits viewport */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`glass rounded-xl p-4 border-l-2 ${card.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-2xl font-bold gradient-text">
                {card.value}
              </span>
            </div>
            <div className="text-sm text-gray-400">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              try {
                await fetch('/api/v1/ingest', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('atlas_api_key') || ''}`,
                  },
                  body: JSON.stringify({ sources: ['files'] }),
                })
                fetchStats()
              } catch (err) {
                // ignore
              }
            }}
            className="glass rounded-lg px-3 py-2 text-sm text-gray-300 hover:border-atlas-400/30 transition-colors text-left"
          >
            📥 Ingest Files
          </button>

          <button
            onClick={async () => {
              try {
                await fetch('/api/v1/ingest', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('atlas_api_key') || ''}`,
                  },
                  body: JSON.stringify({ sources: ['browser'] }),
                })
                fetchStats()
              } catch (err) {
                // ignore
              }
            }}
            className="glass rounded-lg px-3 py-2 text-sm text-gray-300 hover:border-atlas-400/30 transition-colors text-left"
          >
            🌐 Ingest Browser History
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'

export default function Settings() {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('atlas_api_key') || ''
  )
  const [saved, setSaved] = useState(false)

  const handleSaveKey = () => {
    localStorage.setItem('atlas_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full p-6 overflow-hidden">
      <h2 className="text-xl font-semibold gradient-text mb-4">Settings</h2>

      <div className="glass rounded-xl p-4 space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Atlas API key"
              className="flex-1 glass rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-atlas-500/40"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 rounded-lg bg-atlas-500/20 border border-atlas-500/30 text-atlas-300 text-sm hover:bg-atlas-500/30 transition-colors"
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Found in your .env file or server output
          </p>
        </div>

        {/* Server Status */}
        <div className="border-t border-dark-500 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Server</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Status: <span className="text-green-400">Checking...</span></div>
            <div>API: http://127.0.0.1:8741</div>
            <div>Privacy Mode: Local</div>
          </div>
        </div>

        {/* About */}
        <div className="border-t border-dark-500 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">About</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Atlas v0.1.0</div>
            <div>Personal Life Operating System</div>
            <div>100% local — your data never leaves</div>
          </div>
        </div>
      </div>
    </div>
  )
}

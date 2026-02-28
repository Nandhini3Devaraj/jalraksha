import { NavLink } from 'react-router-dom'
import { Droplets, LayoutDashboard, Map, Bell, Bot, RefreshCw } from 'lucide-react'
import { recalculateRisks } from '../services/api'
import { useState } from 'react'

const links = [
  { to: '/',         label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/map',      label: 'Risk Map',    icon: Map },
  { to: '/alerts',   label: 'Alerts',      icon: Bell },
  { to: '/chatbot',  label: 'AI Chatbot',  icon: Bot },
]

export default function Navbar() {
  const [recalc, setRecalc] = useState(false)

  const handleRecalc = async () => {
    setRecalc(true)
    try { await recalculateRisks() } finally { setRecalc(false) }
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Droplets className="text-blue-400 w-7 h-7" />
        <span className="text-xl font-bold text-white tracking-tight">
          Jal<span className="text-blue-400">Raksha</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <button
        onClick={handleRecalc}
        disabled={recalc}
        className="flex items-center gap-2 btn-primary"
        title="Recalculate risk scores"
      >
        <RefreshCw className={`w-4 h-4 ${recalc ? 'animate-spin' : ''}`} />
        Recalculate
      </button>
    </nav>
  )
}

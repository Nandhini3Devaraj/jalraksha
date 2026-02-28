import { useEffect, useState } from 'react'
import { getDashboardSummary, getDiseaseSummary } from '../services/api'
import type { DashboardData, DiseaseSummary } from '../types'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import type { RiskLevel } from '../types'
import {
  Activity, Users, HeartPulse, Skull, Droplets,
  Thermometer, CloudRain, AlertTriangle, MapPin,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444',
}

const DISEASE_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#22c55e','#eab308','#06b6d4','#f43f5e']

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function Dashboard() {
  const [data, setData]  = useState<DashboardData | null>(null)
  const [diseases, setDiseases] = useState<DiseaseSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getDiseaseSummary()])
      .then(([dash, dis]) => { setData(dash); setDiseases(dis) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (data && (data.statistics.critical_areas > 0 || data.statistics.high_risk_areas > 0)) {
      playBeep()
    }
  }, [data])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )
  if (!data) return <p className="text-red-400 p-8">Failed to load dashboard data.</p>

  const { statistics: s, water_quality: wq, weather: w, recent_alerts } = data

  const overallRisk: RiskLevel =
    s.critical_areas > 0 ? 'Critical' :
    s.high_risk_areas > 2 ? 'High' :
    s.high_risk_areas > 0 ? 'Medium' : 'Low'

  const wqGauge = [
    { name: 'pH',          value: Math.min((wq.ph / 14) * 100, 100),         fill: '#3b82f6' },
    { name: 'Turbidity',   value: Math.min((wq.turbidity / 25) * 100, 100),  fill: '#f97316' },
    { name: 'Chloramines', value: Math.min((wq.chloramines / 10) * 100, 100),fill: '#8b5cf6' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real-Time Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Water health monitoring & outbreak risk</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">System Risk Level</span>
          <RiskBadge level={overallRisk} size="lg" />
        </div>
      </div>

      {/* Critical banner */}
      {overallRisk === 'Critical' && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm font-medium">
            🚨 Critical outbreak risk detected in {s.critical_areas} area(s). Immediate action required!
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Cases"    value={s.total_cases.toLocaleString()}  icon={Users}     color="text-blue-400" />
        <StatCard title="Active Cases"   value={s.active_cases.toLocaleString()} icon={Activity}  color="text-yellow-400" />
        <StatCard title="Recovered"      value={s.recovered.toLocaleString()}    icon={HeartPulse} color="text-green-400" sub={`${s.recovery_rate}% rate`} />
        <StatCard title="Deaths"         value={s.deaths.toLocaleString()}       icon={Skull}     color="text-red-400"   sub={`${s.fatality_rate}% fatality`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Monitored Areas"  value={s.monitored_areas}        icon={MapPin}      color="text-cyan-400" />
        <StatCard title="High-Risk Areas"  value={s.high_risk_areas}        icon={AlertTriangle} color="text-orange-400" />
        <StatCard title="Avg Rainfall"     value={`${w.avg_rainfall_mm} mm`} icon={CloudRain}  color="text-sky-400" sub={`${w.flood_zones} flood zone(s)`} />
        <StatCard title="Avg pH"           value={wq.ph.toFixed(1)}          icon={Droplets}   color="text-blue-400" sub={`Turbidity ${wq.turbidity.toFixed(1)} NTU`} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Disease bar chart */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-200">Disease Cases Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={diseases} margin={{ left: -10 }}>
              <XAxis dataKey="disease" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Bar dataKey="total_cases"  name="Total"   fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="active_cases" name="Active"  fill="#f97316" radius={[4,4,0,0]} />
              <Bar dataKey="recovered"    name="Recovered" fill="#22c55e" radius={[4,4,0,0]} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Disease pie chart */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-200">Active Cases by Disease</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={diseases} dataKey="active_cases" nameKey="disease" cx="50%" cy="50%" outerRadius={90} label={({ disease, percent }) => `${disease} ${(percent*100).toFixed(0)}%`}>
                {diseases.map((_, i) => <Cell key={i} fill={DISEASE_COLORS[i % DISEASE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Quality + Recent Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Water quality radial */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-200">Water Quality Parameters</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={wqGauge}>
              <RadialBar dataKey="value" label={{ fill: '#9ca3af', fontSize: 11 }} />
              <Legend iconSize={10} wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Level']} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400">pH</p>
              <p className="text-lg font-bold text-blue-400">{wq.ph.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Safe: 6.5–8.5</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400">Turbidity</p>
              <p className="text-lg font-bold text-orange-400">{wq.turbidity.toFixed(2)} NTU</p>
              <p className="text-xs text-gray-500">Safe: &lt;1 NTU</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400">Hardness</p>
              <p className="text-lg font-bold text-purple-400">{wq.hardness.toFixed(0)} mg/L</p>
              <p className="text-xs text-gray-500">Safe: &lt;300 mg/L</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400">Chloramines</p>
              <p className="text-lg font-bold text-cyan-400">{wq.chloramines.toFixed(2)} ppm</p>
              <p className="text-xs text-gray-500">Safe: &lt;4 ppm</p>
            </div>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-200">Recent Alerts</h2>
          {recent_alerts.length === 0 ? (
            <p className="text-gray-500 text-sm">No alerts at this time.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recent_alerts.map(a => (
                <div key={a.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 leading-snug">{a.message}</p>
                    <RiskBadge level={a.severity as RiskLevel} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.area} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getRiskMap, getHighRiskAreas, getAreaDetail } from '../services/api'
import type { AreaRisk, RiskLevel } from '../types'
import RiskBadge from '../components/RiskBadge'
import AreaWarningPanel from '../components/AreaWarningPanel'
import { MapPin, X, Droplets, CloudRain, Activity, Bug, ShieldAlert } from 'lucide-react'

const RISK_BG: Record<RiskLevel, string> = {
  Low:      'bg-green-900/40 border-green-700',
  Medium:   'bg-yellow-900/40 border-yellow-700',
  High:     'bg-orange-900/40 border-orange-700',
  Critical: 'bg-red-900/40 border-red-700 animate-pulse',
}

const RISK_BAR: Record<RiskLevel, string> = {
  Low: 'bg-green-500', Medium: 'bg-yellow-500', High: 'bg-orange-500', Critical: 'bg-red-500',
}

export default function DiseaseMap() {
  const [areas, setAreas]           = useState<AreaRisk[]>([])
  const [highRisk, setHighRisk]     = useState<AreaRisk[]>([])
  const [selected, setSelected]     = useState<any>(null)
  const [warningDetail, setWarning] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<RiskLevel | 'All'>('All')

  useEffect(() => {
    Promise.all([getRiskMap(), getHighRiskAreas()])
      .then(([map, hr]) => { setAreas(map); setHighRisk(hr) })
      .finally(() => setLoading(false))
  }, [])

  const handleAreaClick = async (area: AreaRisk) => {
    const detail = await getAreaDetail(area.area)
    setSelected(detail)
    setWarning(detail)
  }

  const filtered = filter === 'All' ? areas : areas.filter(a => a.level === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  const counts = (['Low','Medium','High','Critical'] as RiskLevel[]).reduce((acc, l) => {
    acc[l] = areas.filter(a => a.level === l).length; return acc
  }, {} as Record<RiskLevel, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Map</h1>
          <p className="text-gray-400 text-sm mt-0.5">Area-based outbreak risk visualization</p>
        </div>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-4 gap-3">
        {(['Low','Medium','High','Critical'] as RiskLevel[]).map(l => (
          <div key={l} className={`card cursor-pointer border ${selected?.risk?.level === l ? 'ring-2 ring-blue-500' : ''}`}
               onClick={() => setFilter(f => f === l ? 'All' : l)}>
            <div className="flex items-center justify-between">
              <RiskBadge level={l} size="sm" />
              <span className="text-2xl font-bold">{counts[l] || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">areas</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area grid (visual map replacement) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-200">
                Area Risk Grid {filter !== 'All' && <span className="ml-2 text-sm text-blue-400">({filter})</span>}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Click any area to see precautions, causes & actions</p>
            </div>
            {filter !== 'All' && (
              <button onClick={() => setFilter('All')} className="text-xs text-gray-400 hover:text-white">
                Clear filter ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(area => (
              <button
                key={area.id}
                onClick={() => handleAreaClick(area)}
                className={`text-left p-3 rounded-xl border transition-all hover:scale-105 ${RISK_BG[area.level]}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{area.area}</p>
                    <div className="mt-1">
                      <RiskBadge level={area.level} score={area.score} size="sm" />
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${RISK_BAR[area.level]} transition-all`}
                        style={{ width: `${area.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-200">{selected.area}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Risk Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{selected.risk?.score}</span>
                    <RiskBadge level={selected.risk?.level} size="sm" />
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${RISK_BAR[selected.risk?.level as RiskLevel]} transition-all`}
                         style={{ width: `${selected.risk?.score}%` }} />
                  </div>
                </div>

                {selected.water_quality && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <p className="text-xs font-medium text-gray-300">Water Quality</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">pH</span> <span className="text-white font-medium ml-1">{selected.water_quality.ph}</span></div>
                      <div><span className="text-gray-500">Turbidity</span> <span className="text-white font-medium ml-1">{selected.water_quality.turbidity} NTU</span></div>
                      <div><span className="text-gray-500">Hardness</span> <span className="text-white font-medium ml-1">{selected.water_quality.hardness}</span></div>
                      <div><span className="text-gray-500">Chloramines</span> <span className="text-white font-medium ml-1">{selected.water_quality.chloramines}</span></div>
                    </div>
                  </div>
                )}

                {selected.weather && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CloudRain className="w-4 h-4 text-sky-400" />
                      <p className="text-xs font-medium text-gray-300">Weather</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Rainfall</span> <span className="text-white font-medium ml-1">{selected.weather.rainfall_mm} mm</span></div>
                      <div><span className="text-gray-500">Humidity</span> <span className="text-white font-medium ml-1">{selected.weather.humidity}%</span></div>
                      <div><span className="text-gray-500">Temp</span> <span className="text-white font-medium ml-1">{selected.weather.temperature}°C</span></div>
                      <div><span className="text-gray-500">Flood Risk</span> <span className={`font-medium ml-1 ${selected.weather.flood_risk ? 'text-red-400' : 'text-green-400'}`}>{selected.weather.flood_risk ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>
                )}

                {selected.disease && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bug className="w-4 h-4 text-purple-400" />
                      <p className="text-xs font-medium text-gray-300">Disease: {selected.disease.disease}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Total</span> <span className="text-white font-medium ml-1">{selected.disease.total_cases.toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Active</span> <span className="text-yellow-400 font-medium ml-1">{selected.disease.active_cases.toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Recovered</span> <span className="text-green-400 font-medium ml-1">{selected.disease.recovered.toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Deaths</span> <span className="text-red-400 font-medium ml-1">{selected.disease.deaths.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setWarning(selected)}
                  className="w-full mt-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  View Full Advisory &amp; Precautions →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MapPin className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Click an area to view<br />detailed information</p>
            </div>
          )}
        </div>
      </div>

      {/* High risk table */}
      {highRisk.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            High-Risk Areas Requiring Immediate Attention
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="pb-2 text-left">Area</th>
                  <th className="pb-2 text-left">Risk</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-left">Disease</th>
                  <th className="pb-2 text-right">Active Cases</th>
                  <th className="pb-2 text-right">Rainfall</th>
                  <th className="pb-2 text-right">Turbidity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {highRisk.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-2.5 font-medium text-white">{a.area}</td>
                    <td className="py-2.5"><RiskBadge level={a.level} size="sm" /></td>
                    <td className="py-2.5 text-right text-gray-300">{a.score}</td>
                    <td className="py-2.5 text-gray-300">{a.disease || '—'}</td>
                    <td className="py-2.5 text-right text-yellow-400">{a.active_cases?.toLocaleString() || '—'}</td>
                    <td className="py-2.5 text-right text-sky-400">{a.rainfall_mm != null ? `${a.rainfall_mm} mm` : '—'}</td>
                    <td className="py-2.5 text-right text-orange-400">{a.turbidity != null ? `${a.turbidity} NTU` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Area Warning Panel Modal */}
      {warningDetail && (
        <AreaWarningPanel
          detail={warningDetail}
          onClose={() => setWarning(null)}
        />
      )}
    </div>
  )
}

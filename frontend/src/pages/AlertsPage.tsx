import { useEffect, useState } from 'react'
import { getAlerts, clearAlerts, sendAlertsNow, markAlertSent } from '../services/api'
import type { Alert, RiskLevel } from '../types'
import RiskBadge from '../components/RiskBadge'
import { Bell, Send, Trash2, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts]       = useState<Alert[]>([])
  const [filter, setFilter]       = useState<string>('All')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [smsResult, setSmsResult] = useState<string | null>(null)

  const load = (sev?: string) => {
    setLoading(true)
    getAlerts(sev === 'All' ? undefined : sev)
      .then(setAlerts)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = (f: string) => {
    setFilter(f)
    load(f)
  }

  const handleSendSMS = async () => {
    setSending(true); setSmsResult(null)
    try {
      const res = await sendAlertsNow()
      setSmsResult(`✅ ${res.sent} SMS alert(s) sent successfully.`)
    } catch (e: any) {
      setSmsResult(`❌ ${e?.response?.data?.error || 'Failed to send SMS'}`)
    } finally {
      setSending(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Clear all alerts?')) return
    await clearAlerts()
    setAlerts([])
  }

  const handleMarkSent = async (id: number) => {
    await markAlertSent(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_sent: true } : a))
  }

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-400" />
            Alert Center
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time outbreak alerts & notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSendSMS} disabled={sending} className="btn-primary flex items-center gap-2">
            <Send className={`w-4 h-4 ${sending ? 'animate-bounce' : ''}`} />
            {sending ? 'Sending…' : 'Send SMS Alerts'}
          </button>
          <button onClick={handleClear} className="btn-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {smsResult && (
        <div className={`rounded-xl p-3 text-sm border ${smsResult.startsWith('✅') ? 'bg-green-950 border-green-700 text-green-300' : 'bg-red-950 border-red-700 text-red-300'}`}>
          {smsResult}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {severities.map(s => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
            }`}
          >
            {s}
            {s !== 'All' && (
              <span className="ml-1.5 text-xs opacity-70">
                {alerts.filter(a => a.severity === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['Critical','High','Medium','Low'] as RiskLevel[]).map(level => {
          const count = alerts.filter(a => a.severity === level).length
          return (
            <div key={level} className="card text-center">
              <RiskBadge level={level} size="sm" />
              <p className="text-3xl font-bold text-white mt-2">{count}</p>
              <p className="text-xs text-gray-500">alert(s)</p>
            </div>
          )
        })}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-400">No alerts found. System is operating normally.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`card border transition-all ${
                alert.severity === 'Critical' ? 'border-red-800 bg-red-950/30' :
                alert.severity === 'High'     ? 'border-orange-800 bg-orange-950/20' :
                alert.severity === 'Medium'   ? 'border-yellow-800 bg-yellow-950/20' :
                'border-green-800 bg-green-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {alert.severity === 'Critical' || alert.severity === 'High' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{alert.area}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                      {alert.is_sent && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> SMS sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RiskBadge level={alert.severity as RiskLevel} size="sm" />
                  {!alert.is_sent && (
                    <button
                      onClick={() => handleMarkSent(alert.id)}
                      className="text-xs text-gray-400 hover:text-green-400 transition-colors"
                      title="Mark as sent"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

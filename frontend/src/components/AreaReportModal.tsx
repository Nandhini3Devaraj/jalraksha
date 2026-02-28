import { useEffect, useRef, useState } from 'react'
import { X, Printer, Mail, MessageSquare, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'
import { getAreaReport, sendReportEmail, sendReportSMS } from '../services/api'

interface Report {
  report_id: string
  generated_at: string
  area: string
  risk: { level: string; score: number }
  water_quality?: Record<string, number>
  weather?: Record<string, number | boolean>
  disease?: Record<string, string | number>
  water_issues: string[]
  flood_active: boolean
}

interface Props {
  areaName: string
  onClose: () => void
}

const RISK_COLOR: Record<string, string> = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-orange-400',
  Critical: 'text-red-400',
}
const RISK_BG: Record<string, string> = {
  Low: 'bg-green-900/40 border-green-700',
  Medium: 'bg-yellow-900/40 border-yellow-700',
  High: 'bg-orange-900/40 border-orange-700',
  Critical: 'bg-red-900/40 border-red-700',
}

// ── send panel ────────────────────────────────────────────────────────────────
type SendMode = 'none' | 'email' | 'sms'

function SendPanel({ areaName, report, mode, onClose }: { areaName: string; report: Report; mode: SendMode; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const placeholder = mode === 'email'
    ? 'e.g. collector@tn.gov.in, cmcooffice@tn.gov.in'
    : 'e.g. +919876543210, +918765432109'

  const label = mode === 'email' ? 'Recipient Emails (comma-separated)' : 'Phone Numbers in E.164 format (comma-separated)'

  async function handleSend() {
    const items = input.split(',').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    setLoading(true)
    setFeedback(null)
    try {
      let res: Record<string, unknown>
      if (mode === 'email') {
        res = await sendReportEmail(areaName, items)
      } else {
        res = await sendReportSMS(areaName, items)
      }
      const status = (res as any).status as string
      if (status === 'sent') {
        setFeedback({ ok: true, msg: `Report successfully sent to ${items.length} recipient(s)!` })
      } else if (status === 'smtp_not_configured' || status === 'twilio_not_configured') {
        if (mode === 'email') {
          // Open mailto as fallback
          const subject = encodeURIComponent(`[JalRaksha] Water Health Report — ${areaName} | ${report.risk.level} Risk`)
          const body = encodeURIComponent(
            `Area: ${areaName}\nRisk Level: ${report.risk.level} (${report.risk.score}/100)\nReport ID: ${report.report_id}\nGenerated: ${report.generated_at}\n\nPlease configure SMTP in backend .env for auto-sending.`
          )
          window.open(`mailto:${items.join(',')}?subject=${subject}&body=${body}`)
          setFeedback({ ok: true, msg: 'Opened your email client (SMTP not configured in server). Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD to .env for direct sending.' })
        } else {
          setFeedback({ ok: false, msg: 'Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM to backend .env' })
        }
      } else {
        setFeedback({ ok: false, msg: (res as any).error || 'Unknown error' })
      }
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message || 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-700 rounded-xl p-4 bg-gray-800/60 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          {mode === 'email' ? <Mail className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-green-400" />}
          {mode === 'email' ? 'Send Report via Email' : 'Send SMS Alert to Residents'}
        </h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
      />

      {/* Pre-filled government contacts */}
      {mode === 'email' && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['collector@tn.gov.in', 'cmcooffice@tn.gov.in', 'healthsec@tn.gov.in', 'nhmtn@tn.gov.in'].map(e => (
            <button
              key={e}
              onClick={() => setInput(prev => prev ? `${prev}, ${e}` : e)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full"
            >{e}</button>
          ))}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        className="mt-3 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />)}
        {loading ? 'Sending...' : `Send ${mode === 'email' ? 'Email' : 'SMS'}`}
      </button>

      {feedback && (
        <div className={`mt-2 flex items-start gap-2 text-xs p-2 rounded-lg ${feedback.ok ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
          {feedback.ok ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
          {feedback.msg}
        </div>
      )}
    </div>
  )
}


// ── printable report ──────────────────────────────────────────────────────────
function PrintReport({ report }: { report: Report }) {
  const wq = report.water_quality || {}
  const wd = report.weather || {}
  const dc = report.disease || {}
  const level = report.risk.level
  const color = { Low: '#16a34a', Medium: '#ca8a04', High: '#ea580c', Critical: '#dc2626' }[level] || '#6b7280'
  const genAt = report.generated_at.slice(0, 19).replace('T', ' ') + ' UTC'

  const wqRows: [string, string | number, string][] = [
    ['pH', wq.ph ?? '—', '6.5 – 8.5'],
    ['Turbidity (NTU)', wq.turbidity ?? '—', '< 1 NTU'],
    ['Hardness (mg/L)', wq.hardness ?? '—', '< 300 mg/L'],
    ['Chloramines (ppm)', wq.chloramines ?? '—', '< 4 ppm'],
    ['Trihalomethanes (µg/L)', wq.trihalomethanes ?? '—', '< 80 µg/L'],
    ['Conductivity (µS/cm)', wq.conductivity ?? '—', '< 500'],
    ['Organic Carbon (mg/L)', wq.organic_carbon ?? '—', '< 2 mg/L'],
  ]

  return (
    <div id="jalraksha-printable" className="bg-white text-gray-900 p-8 font-sans text-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 pb-4 mb-5" style={{ borderColor: color }}>
        <div>
          <h1 className="text-xl font-bold text-gray-900">🌊 JalRaksha — Water Health Intelligence</h1>
          <p className="text-gray-500 text-xs mt-0.5">Official Area Water Health & Risk Report</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Report ID: <span className="font-mono font-medium">{report.report_id}</span></div>
          <div className="text-xs text-gray-400">Generated: {genAt}</div>
        </div>
      </div>

      {/* Title card */}
      <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ backgroundColor: `${color}18`, border: `2px solid ${color}` }}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{report.area}</h2>
          <p className="text-gray-500 text-xs mt-0.5">Chennai Metropolitan Region · Tamil Nadu</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black" style={{ color }}>{report.risk.score}/100</div>
          <div className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color }}>{level} RISK</div>
        </div>
      </div>

      {/* Water quality */}
      <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-2">1. Water Quality Analysis</h3>
      <table className="w-full border-collapse mb-5 text-xs">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Parameter</th>
            <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Measured Value</th>
            <th className="border border-gray-200 px-3 py-2 text-center font-semibold">WHO Safe Range</th>
            <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {wqRows.map(([name, val, safe]) => {
            const isViolation = report.water_issues.some(i => i.toLowerCase().includes(name.split(' ')[0].toLowerCase()))
            return (
              <tr key={name} className={isViolation ? 'bg-red-50' : ''}>
                <td className="border border-gray-200 px-3 py-1.5">{name}</td>
                <td className="border border-gray-200 px-3 py-1.5 text-center font-medium">{String(val)}</td>
                <td className="border border-gray-200 px-3 py-1.5 text-center text-gray-500">{safe}</td>
                <td className="border border-gray-200 px-3 py-1.5 text-center font-semibold" style={{ color: isViolation ? '#dc2626' : '#16a34a' }}>
                  {isViolation ? '⚠ UNSAFE' : '✓ Safe'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {report.water_issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
          <p className="font-semibold text-red-800 text-xs mb-1">Parameter Violations Detected:</p>
          <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
            {report.water_issues.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {/* Weather */}
      <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-2">2. Environmental & Weather Conditions</h3>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Rainfall', value: `${wd.rainfall_mm ?? '—'} mm`, warn: (wd.rainfall_mm as number) > 50 },
          { label: 'Temperature', value: `${wd.temperature ?? '—'} °C`, warn: (wd.temperature as number) > 30 },
          { label: 'Humidity', value: `${wd.humidity ?? '—'} %`, warn: (wd.humidity as number) > 85 },
          { label: 'Flood Risk', value: wd.flood_risk ? 'ACTIVE' : 'None', warn: wd.flood_risk as boolean },
        ].map(item => (
          <div key={item.label} className={`rounded-lg p-3 border text-center ${item.warn ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className={`font-bold text-sm ${item.warn ? 'text-red-700' : 'text-gray-800'}`}>{String(item.value)}</div>
          </div>
        ))}
      </div>

      {/* Disease */}
      {Object.keys(dc).length > 0 && (
        <>
          <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-2">3. Disease Outbreak Data</h3>
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Disease', value: dc.disease, highlight: false },
              { label: 'Total Cases', value: dc.total_cases, highlight: false },
              { label: 'Active Cases', value: dc.active_cases, highlight: true },
              { label: 'Recovered', value: dc.recovered, highlight: false },
              { label: 'Deaths', value: dc.deaths, highlight: true },
            ].map(item => (
              <div key={item.label} className={`rounded-lg p-3 border text-center ${item.highlight && Number(item.value) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className={`font-bold text-sm ${item.highlight && Number(item.value) > 0 ? 'text-red-700' : 'text-gray-800'}`}>{String(item.value ?? '—')}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Government recommendations */}
      <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-2">4. Recommended Government Actions</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-800">
          <li>Deploy mobile water testing units to <strong>{report.area}</strong> within <strong>24 hours</strong></li>
          <li>Issue a public advisory for residents to boil water before use</li>
          <li>Inspect and repair sewage infrastructure and open drains in the area</li>
          <li>Distribute ORS packets and water purification tablets at public distribution centres</li>
          <li>Increase surveillance frequency for waterborne disease cases at local PHCs</li>
          <li>Coordinate with CMWSSB / TWAD Board for emergency clean water supply</li>
          <li>Activate Rapid Response Teams if active disease cases exceed threshold</li>
          <li>Conduct vector control operations and chlorination of affected water bodies</li>
        </ol>
      </div>

      {/* Public precautions */}
      <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-2">5. Public Precautions</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
        <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
          <li>Boil all drinking water vigorously for at least 1 minute before use</li>
          <li>Wash hands thoroughly with soap and water before eating and after toilet visits</li>
          <li>Avoid consuming raw vegetables, uncooked food, or street food from this area</li>
          <li>Use only sealed bottled water for drinking, cooking, and brushing teeth</li>
          <li>Report any illness symptoms immediately to the nearest PHC or dial 104</li>
          <li>Do not allow children to play near water bodies, drains, or flooded areas</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 mt-5 flex items-center justify-between text-xs text-gray-400">
        <span>JalRaksha Water Health Intelligence System · Auto-generated Report</span>
        <span>🚨 Emergency: <strong>108</strong> | Disease: <strong>104</strong> | Water Helpline: <strong>1800-180-5678</strong></span>
      </div>
    </div>
  )
}


// ── main modal ────────────────────────────────────────────────────────────────
export default function AreaReportModal({ areaName, onClose }: Props) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendMode, setSendMode] = useState<SendMode>('none')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAreaReport(areaName)
      .then((r: Report) => setReport(r))
      .catch(() => setError('Failed to load report data'))
      .finally(() => setLoading(false))
  }, [areaName])

  function handlePrint() {
    const el = document.getElementById('jalraksha-printable')
    if (!el) return
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><title>JalRaksha Report - ${areaName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; color: #111; }
        @media print { @page { margin: 1cm; } }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 5px 8px; }
        th { background: #eef2ff; }
        h1, h2, h3 { margin: 0 0 4px; }
        .no-print { display: none }
      </style>
    </head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  const level = report?.risk.level || 'Unknown'

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="font-bold text-white text-base">Official Water Health Report</h2>
              <p className="text-xs text-gray-400">{areaName} {report && `· ${level} Risk · Score ${report.risk.score}/100`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Action bar */}
        {report && (
          <div className="flex gap-2 px-6 py-3 bg-gray-850 border-b border-gray-700 bg-gray-800/50">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Download / Print PDF
            </button>
            <button
              onClick={() => setSendMode(m => m === 'email' ? 'none' : 'email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sendMode === 'email' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            >
              <Mail className="w-4 h-4" /> Send to Government
            </button>
            <button
              onClick={() => setSendMode(m => m === 'sms' ? 'none' : 'sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sendMode === 'sms' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            >
              <MessageSquare className="w-4 h-4" /> Broadcast SMS to Residents
            </button>
          </div>
        )}

        <div className="overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-teal-400" />
              <p className="text-sm">Generating report for {areaName}…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 m-6 p-4 rounded-xl bg-red-900/30 border border-red-700 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {report && (
            <div>
              {/* Send panel — shown above the report */}
              {sendMode !== 'none' && (
                <div className="px-6 pt-4">
                  <SendPanel
                    areaName={areaName}
                    report={report}
                    mode={sendMode}
                    onClose={() => setSendMode('none')}
                  />
                </div>
              )}

              {/* Report risk summary strip */}
              <div className={`mx-6 mt-4 mb-0 rounded-xl p-4 border flex items-center justify-between ${RISK_BG[level] || 'bg-gray-800 border-gray-600'}`}>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Report ID</p>
                  <p className="font-mono font-medium text-white text-sm">{report.report_id}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Risk Score</p>
                  <p className={`text-3xl font-black ${RISK_COLOR[level] || 'text-gray-400'}`}>{report.risk.score}<span className="text-base font-normal text-gray-400">/100</span></p>
                  <p className={`text-xs font-bold uppercase tracking-widest ${RISK_COLOR[level]}`}>{level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Generated</p>
                  <p className="text-xs text-gray-300">{report.generated_at.slice(0, 19).replace('T', ' ')} UTC</p>
                </div>
              </div>

              {/* the printable section (white-background) */}
              <div ref={printRef}>
                <PrintReport report={report} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

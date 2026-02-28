import { X, ShieldAlert, Ban, HelpCircle, Zap, AlertTriangle, CloudRain, Users, FileText } from 'lucide-react'
import { useState } from 'react'
import AreaReportModal from './AreaReportModal'
import type { RiskLevel } from '../types'

interface AreaDetail {
  area: string
  risk: { level: RiskLevel; score: number }
  water_quality?: { ph: number; turbidity: number; hardness: number; chloramines: number }
  weather?: { rainfall_mm: number; humidity: number; temperature: number; flood_risk: boolean }
  disease?: { disease: string; active_cases: number; total_cases: number; deaths: number }
}

interface Props {
  detail: AreaDetail
  onClose: () => void
}


// ─── Cause analysis ────────────────────────────────────────────────────────────
function getCauses(detail: AreaDetail): { human: string[]; climate: string[] } {
  const human: string[]  = []
  const climate: string[] = []
  const wq = detail.water_quality
  const w  = detail.weather

  if (wq) {
    if (wq.turbidity > 4)    human.push('Untreated sewage or waste water discharged into local water bodies')
    if (wq.ph < 6.5)         human.push('Industrial effluents and acid waste lowering water pH')
    if (wq.ph > 8.5)         human.push('Overuse of fertilisers causing alkaline run-off into water sources')
    if (wq.chloramines > 8)  human.push('Incorrect dosing of chlorine during water treatment')
    if (wq.hardness > 250)   human.push('Old or corroded pipes leaching minerals into distribution system')
  }
  if (w) {
    if (w.rainfall_mm > 50)  climate.push(`Heavy rainfall (${w.rainfall_mm} mm) flushing surface contaminants into water sources`)
    if (w.flood_risk)        climate.push('Flooding mixing sewage with drinking water supply')
    if (w.humidity > 85)     climate.push('High humidity accelerating microbial growth in water storage')
    if (w.temperature > 30)  climate.push('High temperatures promoting rapid bacterial and algal growth')
  }
  if (human.length === 0)  human.push('Poor sanitation practices and open defecation near water bodies')
  if (climate.length === 0) climate.push('Seasonal weather changes affecting water source quality')
  return { human, climate }
}

// ─── Disease-specific guidance ─────────────────────────────────────────────────
interface Guidance {
  precautions: string[]
  doNot: string[]
  actions: string[]
  emergencyAction: string
}

const DISEASE_GUIDANCE: Record<string, Guidance> = {
  Cholera: {
    precautions: [
      'Boil all drinking water vigorously for at least 1 minute before use',
      'Use oral rehydration salts (ORS) at the first sign of diarrhoea',
      'Wash hands thoroughly with soap after every toilet visit and before eating',
      'Store boiled water in clean, covered containers — never reuse uncovered pots',
      'Eat freshly cooked food; avoid raw vegetables and unpeeled fruits in the area',
      'Vaccinate with oral cholera vaccine if available at local PHC',
    ],
    doNot: [
      'Do NOT drink tap water, well water, or river water without boiling/purifying',
      'Do NOT eat street food, raw seafood, or food from open stalls in the area',
      'Do NOT share drinking glasses, plates, or utensils with affected persons',
      'Do NOT delay seeking medical help — cholera can become fatal within hours',
      'Do NOT dispose of patient waste near any water body',
    ],
    actions: [
      'Immediately report to the nearest PHC or government hospital',
      'Administer ORS continuously — 200–400 ml after each loose stool',
      'Isolate affected individuals from food preparation areas',
      'Notify the local health authority / District Medical Officer',
      'Disinfect toilets and surrounding surfaces with 1% chlorine solution',
    ],
    emergencyAction: 'Seek hospital care IMMEDIATELY if vomiting is uncontrollable or patient is losing consciousness.',
  },
  Typhoid: {
    precautions: [
      'Drink only sealed bottled water or water boiled for 5+ minutes',
      'Get typhoid vaccination at the local PHC — effective for up to 3 years',
      'Wash all raw produce with clean water; peel fruits before eating',
      'Maintain strict hand hygiene — wash hands before meals and after restroom use',
      'Ensure sewage lines are not leaking near household water supply',
    ],
    doNot: [
      'Do NOT take antibiotics without doctor prescription — contributes to resistance',
      'Do NOT enter water bodies in flood-prone areas',
      'Do NOT share food with someone who has high fever and stomach pain',
      'Do NOT ignore persistent fever lasting more than 3–4 days',
      'Do NOT use river or canal water for washing vegetables',
    ],
    actions: [
      'Visit a doctor immediately if fever persists beyond 3 days',
      'Request a Widal test or blood culture to confirm typhoid',
      'Complete the full antibiotic course even if symptoms improve',
      'Notify school/workplace if a child or worker is diagnosed',
      'Conduct source-tracing to identify contaminated food or water supply',
    ],
    emergencyAction: 'Go to the emergency ward if the patient develops intestinal pain, bleeding, or confusion.',
  },
  'Hepatitis A': {
    precautions: [
      'Get Hepatitis A vaccine — two doses provide lifelong immunity',
      'Boil water for at least 1 minute or use a UV purifier',
      'Avoid shellfish, clams, or oysters sourced from the affected area',
      'Maintain good personal hygiene; clean bathrooms regularly with disinfectant',
      'Ensure food handlers in the area have regular health checkups',
    ],
    doNot: [
      'Do NOT share needles, toothbrushes, or personal items with infected persons',
      'Do NOT consume alcohol — it severely worsens liver damage',
      'Do NOT eat food prepared by anyone with jaundice symptoms',
      'Do NOT use water from open sources for cooking without purification',
      'Do NOT give over-the-counter painkillers without medical advice — they stress the liver',
    ],
    actions: [
      'Consult a doctor for liver function tests (LFT) and Hepatitis A IgM test',
      'Rest and maintain good nutrition; avoid fatty foods',
      'Inform close contacts — post-exposure vaccination within 2 weeks is effective',
      'Report outbreak to the District Health Department',
      'Temporarily close food establishments in the zone for disinfection',
    ],
    emergencyAction: 'Seek immediate hospital care for deep jaundice, dark urine, or swelling of abdomen.',
  },
  Dysentery: {
    precautions: [
      'Use only purified or boiled water for drinking and food preparation',
      'Cook food thoroughly; avoid refrigerated food kept more than 24 hours',
      'Wash hands for 20 seconds with soap after restroom and before eating',
      'Use separate towels and utensils for affected family members',
      'Wear footwear at all times, especially near waterlogged areas',
    ],
    doNot: [
      'Do NOT eat unwashed raw salads, cut fruits, or roadside ice',
      'Do NOT drink water from ponds, canals or wells during the outbreak',
      'Do NOT use antibiotics without lab confirmation of bacterial cause',
      'Do NOT allow children to play near floodwater or sewage overflow',
      'Do NOT suppress diarrhoea with anti-motility drugs without medical advice',
    ],
    actions: [
      'Administer ORS to prevent dehydration, especially in children and elderly',
      'Collect a stool sample for culture to identify bacterial or amoebic cause',
      'Visit a doctor for appropriate treatment — metronidazole or ciprofloxacin as prescribed',
      'Disinfect all toilets and common areas with bleach solution',
      'Report any cluster (5+ cases) to the local health authority immediately',
    ],
    emergencyAction: 'Take patient to hospital immediately if there is blood in stool, high fever, or signs of severe dehydration.',
  },
  Giardiasis: {
    precautions: [
      'Filter water using a filter with ≤1 micron absolute pore size before boiling',
      'Use hand sanitiser with ≥60% alcohol when soap and water are unavailable',
      'Avoid swallowing water while swimming or wading in local water bodies',
      'Thoroughly cook all meat and fish from the area',
    ],
    doNot: [
      'Do NOT drink water directly from rivers, lakes, or wells — Giardia is chlorine-resistant',
      'Do NOT change diapers near food preparation areas',
      'Do NOT share food or drinks with an infected person',
      'Do NOT reuse single-use water bottles without sterilisation',
    ],
    actions: [
      'Consult a doctor for stool antigen test to confirm Giardia',
      'Take prescribed antiparasitic medication (tinidazole or metronidazole) for the full course',
      'Wash and sterilise all water containers and cooking vessels',
      'Advise all household members to get tested if one person is diagnosed',
    ],
    emergencyAction: 'See a doctor urgently if diarrhoea lasts more than 2 weeks or causes significant weight loss.',
  },
  Leptospirosis: {
    precautions: [
      'Wear rubber boots and gloves when wading through or working near floodwater',
      'Cover all wounds and cuts with waterproof dressings before entering floodwater',
      'Shower thoroughly with soap immediately after any contact with floodwater',
      'Avoid swimming in rivers, canals, or stagnant water during and after flooding',
      'Ensure rodent control around homes and grain storage areas',
    ],
    doNot: [
      'Do NOT walk barefoot in flooded streets, fields, or waterlogged areas',
      'Do NOT allow children to play in floodwater or near open drains',
      'Do NOT ignore early symptoms — fever + body ache + red eyes after flood exposure',
      'Do NOT consume food contaminated by floodwater or rodent urine',
    ],
    actions: [
      'Seek medical attention immediately if fever, headache, muscle pain, and red eyes appear within 2–14 days of flood contact',
      'Inform the doctor about floodwater contact — early doxycycline treatment is effective',
      'Drain and clean all waterlogged areas around homes promptly',
      'Fumigate and place rat traps in and around the household',
      'Report suspected cases to the District Surveillance Unit',
    ],
    emergencyAction: 'Emergency hospitalisation required if symptoms include jaundice, bleeding, difficulty breathing, or reduced urine output.',
  },
  Gastroenteritis: {
    precautions: [
      'Boil water and use separate drinking storage containers with lids',
      'Wash hands rigorously before cooking and before every meal',
      'Refrigerate leftovers immediately; do not consume food left out for more than 2 hours',
      'Use food-safe disinfectants to clean kitchen surfaces daily',
    ],
    doNot: [
      'Do NOT eat at roadside stalls or restaurants with poor hygiene in the affected area',
      'Do NOT consume ice or cold drinks from unverified sources',
      'Do NOT use shared cups or glasses during an active outbreak',
      'Do NOT ignore vomiting + diarrhoea in children under 5 — rapid deterioration possible',
    ],
    actions: [
      'Start ORS immediately — continue until diarrhoea subsides',
      'Visit a doctor if symptoms do not improve within 48 hours',
      'Collect water samples from the household for testing',
      'Report the outbreak to the local municipal water authority',
    ],
    emergencyAction: 'Rush to hospital if infant or elderly patient shows sunken eyes, dry mouth, or inability to drink fluids.',
  },
  Cryptosporidiosis: {
    precautions: [
      'Use NSF-certified filters (1 micron absolute or reverse osmosis) for drinking water',
      'Boil water for at least 1 minute — Cryptosporidium is resistant to standard chlorination',
      'Avoid contact with calves, lambs, or their faeces (common source)',
      'Maintain strict hand hygiene especially after handling animals or soil',
    ],
    doNot: [
      'Do NOT swim in lakes, rivers, or pools in the affected area',
      'Do NOT rely on standard chlorine treatment alone — it does not kill Cryptosporidium',
      'Do NOT allow immunocompromised persons (HIV, cancer patients) to drink untreated water',
      'Do NOT use animal manure on vegetable gardens without proper composting',
    ],
    actions: [
      'Consult a doctor for stool ova and parasite examination or PCR test',
      'Immunocompromised patients require urgent specialised treatment (nitazoxanide)',
      'Decontaminate water storage tanks with hydrogen peroxide or UV treatment',
      'Alert the water authority to assess the filtration system in the area',
    ],
    emergencyAction: 'Urgent hospital care required for patients with HIV or cancer who develop watery diarrhoea.',
  },
}

const DEFAULT_GUIDANCE: Guidance = {
  precautions: [
    'Boil all drinking water for at least 1 minute before use',
    'Wash hands with soap for 20 seconds before eating and after using the toilet',
    'Avoid consuming food or water from open sources in the area',
    'Use sealed bottled water if available',
    'Keep food covered and cook thoroughly',
  ],
  doNot: [
    'Do NOT drink untreated tap, well, or surface water',
    'Do NOT eat raw or undercooked food from the affected area',
    'Do NOT share utensils or personal items with symptomatic people',
    'Do NOT delay seeking medical attention if symptoms develop',
    'Do NOT ignore warning notices issued by health authorities',
  ],
  actions: [
    'Contact your nearest Primary Health Centre (PHC) for guidance',
    'Report any unusual cluster of illness to the District Health Officer',
    'Follow all official advisories issued by municipal authorities',
    'Disinfect your water storage containers with a diluted bleach solution',
    'Ensure all household members are aware of the outbreak risk',
  ],
  emergencyAction: 'Visit the emergency department if symptoms are severe, persistent, or affecting children or elderly members.',
}

const RISK_HEADER: Record<RiskLevel, { bg: string; border: string; icon: string; label: string }> = {
  Low:      { bg: 'from-green-900 to-gray-900',   border: 'border-green-700',  icon: '🟢', label: 'Low Risk — Routine Monitoring' },
  Medium:   { bg: 'from-yellow-900 to-gray-900',  border: 'border-yellow-600', icon: '🟡', label: 'Medium Risk — Increased Vigilance' },
  High:     { bg: 'from-orange-900 to-gray-900',  border: 'border-orange-600', icon: '🟠', label: 'High Risk — Advisory Issued' },
  Critical: { bg: 'from-red-900 to-gray-900',     border: 'border-red-600',    icon: '🔴', label: 'CRITICAL — Emergency Response Active' },
}

export default function AreaWarningPanel({ detail, onClose }: Props) {
  const [showReport, setShowReport] = useState(false)
  const level    = detail.risk?.level as RiskLevel ?? 'Low'
  const disease  = detail.disease?.disease ?? ''
  const guidance = DISEASE_GUIDANCE[disease] ?? DEFAULT_GUIDANCE
  const causes   = getCauses(detail)
  const header   = RISK_HEADER[level]

  const showWarning = level === 'High' || level === 'Critical'

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-start justify-center pt-8 pb-8 px-4">
      <div className={`w-full max-w-3xl rounded-2xl border ${header.border} overflow-hidden shadow-2xl`}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${header.bg} px-6 py-5 flex items-start justify-between`}>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{header.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{detail.area}</h2>
                <p className={`text-sm font-medium mt-0.5 ${level === 'Critical' ? 'text-red-300' : level === 'High' ? 'text-orange-300' : 'text-yellow-300'}`}>
                  {header.label}
                </p>
              </div>
            </div>
            {disease && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                <span className="bg-gray-800/60 px-3 py-1 rounded-full">Primary Disease: <strong className="text-white">{disease}</strong></span>
                <span className="bg-gray-800/60 px-3 py-1 rounded-full">Risk Score: <strong className="text-white">{detail.risk?.score}</strong>/100</span>
                {detail.disease && (
                  <span className="bg-gray-800/60 px-3 py-1 rounded-full">Active Cases: <strong className="text-yellow-300">{detail.disease.active_cases.toLocaleString()}</strong></span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency banner */}
        {showWarning && (
          <div className="bg-red-950 border-b border-red-800 px-6 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 font-medium">{guidance.emergencyAction}</p>
          </div>
        )}

        <div className="bg-gray-900 divide-y divide-gray-800">

          {/* ── PRECAUTIONS ── */}
          <section className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white text-base">Precautions to Take</h3>
            </div>
            <ul className="space-y-2">
              {guidance.precautions.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── DO NOT ── */}
          <section className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-white text-base">Things You Must NOT Do</h3>
            </div>
            <ul className="space-y-2">
              {guidance.doNot.map((d, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 font-bold">✕</span>
                  <span className="text-red-200 leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── WHY IS THIS HAPPENING ── */}
          <section className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white text-base">Why Is This Happening?</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Human causes */}
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-medium text-orange-300">Human / Sanitation Causes</p>
                </div>
                <ul className="space-y-2">
                  {causes.human.map((c, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">▸</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Climate causes */}
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  <p className="text-sm font-medium text-sky-300">Climatic / Environmental Causes</p>
                </div>
                <ul className="space-y-2">
                  {causes.climate.map((c, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-sky-400 mt-0.5">▸</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Water quality context */}
            {detail.water_quality && (
              <div className="mt-3 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Water Parameter Readings</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'pH',           value: detail.water_quality.ph,           safe: '6.5–8.5',  warn: detail.water_quality.ph < 6.5 || detail.water_quality.ph > 8.5 },
                    { label: 'Turbidity',    value: `${detail.water_quality.turbidity} NTU`, safe: '<1 NTU',  warn: detail.water_quality.turbidity > 4 },
                    { label: 'Hardness',     value: `${detail.water_quality.hardness} mg/L`, safe: '<300',    warn: detail.water_quality.hardness > 300 },
                    { label: 'Chloramines',  value: `${detail.water_quality.chloramines} ppm`, safe: '<4 ppm', warn: detail.water_quality.chloramines > 8 },
                  ].map(p => (
                    <div key={p.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${p.warn ? 'bg-red-950 border-red-700 text-red-300' : 'bg-green-950 border-green-800 text-green-300'}`}>
                      <span className={p.warn ? 'text-red-400' : 'text-green-400'}>{p.warn ? '⚠' : '✓'}</span>
                      <span className="font-medium">{p.label}:</span>
                      <span>{String(p.value)}</span>
                      <span className="opacity-50">(safe: {p.safe})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── ACTIONS TO TAKE ── */}
          <section className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white text-base">Immediate Actions to Take</h3>
            </div>
            <div className="space-y-3">
              {guidance.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-950/40 border border-green-800/50 rounded-xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-green-800 text-green-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-green-200 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FOOTER CONTACTS ── */}
          <section className="px-6 py-4 bg-gray-800/40">
            <p className="text-xs text-gray-400 text-center mb-3">
              🚨 Emergency: <strong className="text-white">108</strong> &nbsp;|&nbsp;
              Disease Surveillance: <strong className="text-white">104</strong> &nbsp;|&nbsp;
              Water Quality Helpline: <strong className="text-white">1800-180-5678</strong>
            </p>
            <button
              onClick={() => setShowReport(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Generate &amp; Send Official Report
            </button>
          </section>

        </div>
      </div>
    </div>

    {showReport && (
      <AreaReportModal areaName={detail.area} onClose={() => setShowReport(false)} />
    )}
  </>
  )
}

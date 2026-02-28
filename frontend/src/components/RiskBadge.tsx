import type { RiskLevel } from '../types'

const COLORS: Record<RiskLevel, string> = {
  Low:      'bg-green-900 text-green-300  border-green-700',
  Medium:   'bg-yellow-900 text-yellow-300 border-yellow-700',
  High:     'bg-orange-900 text-orange-300 border-orange-700',
  Critical: 'bg-red-900 text-red-300    border-red-700',
}

interface Props { level: RiskLevel; score?: number; size?: 'sm' | 'md' | 'lg' }

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${COLORS[level]} ${padding}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {level}{score !== undefined ? ` (${score})` : ''}
    </span>
  )
}

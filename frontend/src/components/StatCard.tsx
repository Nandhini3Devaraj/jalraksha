import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: string
}

export default function StatCard({ title, value, sub, icon: Icon, color = 'text-blue-400' }: Props) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gray-800 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

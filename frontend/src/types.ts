export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface DashboardStats {
  total_cases: number
  active_cases: number
  recovered: number
  deaths: number
  recovery_rate: number
  fatality_rate: number
  monitored_areas: number
  high_risk_areas: number
  critical_areas: number
}

export interface WaterQualityAvg {
  ph: number
  turbidity: number
  hardness: number
  chloramines: number
}

export interface WeatherSummary {
  avg_rainfall_mm: number
  flood_zones: number
}

export interface DashboardData {
  statistics: DashboardStats
  water_quality: WaterQualityAvg
  weather: WeatherSummary
  recent_alerts: Alert[]
}

export interface DiseaseSummary {
  disease: string
  total_cases: number
  active_cases: number
  recovered: number
  deaths: number
  recovery_rate: number
}

export interface AreaRisk {
  id: number
  area: string
  score: number
  level: RiskLevel
  lat: number | null
  lng: number | null
  updated_at: string
  disease?: string
  active_cases?: number
  rainfall_mm?: number
  turbidity?: number
}

export interface Alert {
  id: number
  area: string
  message: string
  severity: RiskLevel
  is_sent: boolean
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'bot'
  text: string
  timestamp: string
}

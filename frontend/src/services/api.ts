import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getDashboardSummary   = () => api.get('/dashboard/summary').then(r => r.data)
export const getWaterQuality       = () => api.get('/dashboard/water-quality').then(r => r.data)
export const getWeather            = () => api.get('/dashboard/weather').then(r => r.data)

export const getDiseaseSummary     = () => api.get('/disease/summary').then(r => r.data)
export const getRiskMap            = () => api.get('/disease/map').then(r => r.data)
export const getHighRiskAreas      = () => api.get('/disease/high-risk').then(r => r.data)
export const getAreaDetail         = (area: string) => api.get(`/disease/area/${encodeURIComponent(area)}`).then(r => r.data)
export const recalculateRisks      = () => api.post('/disease/recalculate').then(r => r.data)
export const sendAlertsNow         = () => api.post('/disease/scheduler/send-now').then(r => r.data)

export const getAlerts             = (severity?: string) =>
  api.get('/alerts/', { params: severity ? { severity } : {} }).then(r => r.data)
export const getUnreadCount        = () => api.get('/alerts/unread-count').then(r => r.data)
export const markAlertSent         = (id: number) => api.patch(`/alerts/${id}/mark-sent`).then(r => r.data)
export const clearAlerts           = () => api.delete('/alerts/clear').then(r => r.data)

export const sendChatMessage       = (message: string, history: {user: string; bot: string}[]) =>
  api.post('/chatbot/message', { message, history }).then(r => r.data)

export const getAreaReport         = (area: string) =>
  api.get(`/reports/area/${encodeURIComponent(area)}`).then(r => r.data)
export const sendReportEmail       = (area: string, recipients: string[]) =>
  api.post('/reports/send-email', { area, recipients }).then(r => r.data)
export const sendReportSMS         = (area: string, phones: string[]) =>
  api.post('/reports/send-sms', { area, phones }).then(r => r.data)

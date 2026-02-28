import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import DiseaseMap from './pages/DiseaseMap'
import AlertsPage from './pages/AlertsPage'
import ChatbotPage from './pages/ChatbotPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main>
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/map"     element={<DiseaseMap />} />
            <Route path="/alerts"  element={<AlertsPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

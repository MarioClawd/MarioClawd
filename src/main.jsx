import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import UtilityDashboard from './UtilityDashboard'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/app" element={<UtilityDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

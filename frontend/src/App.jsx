import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import Bracket from './pages/Bracket'
import FriendsBracket from './pages/FriendsBracket'
import Predictions from './pages/Predictions'
import Leaderboard from './pages/Leaderboard'
import TeamStats from './pages/TeamStats'
import Register from './pages/Register'
import Login from './pages/Login'
import Admin from './pages/Admin'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <BrowserRouter>
      <AuthProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/"                element={<Bracket />} />
            <Route path="/bracket"         element={<Bracket />} />
            <Route path="/friends-bracket" element={<FriendsBracket />} />
            <Route path="/leaderboard"     element={<Leaderboard />} />
            <Route path="/teams"           element={<TeamStats />} />
            <Route path="/predictions"     element={<Predictions />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/admin"           element={<Admin />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

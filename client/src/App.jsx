import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import Login from './components/Login.jsx'
import Feed from './components/Feed.jsx'
import Circles from './components/Circles.jsx'
import Communities from './components/Communities.jsx'
import CommunityFeed from './components/CommunityFeed.jsx'
import Profile from './components/Profile.jsx'
import Chat from './components/Chat.jsx'
import FriendsPage from './components/FriendsPage.jsx'
import { auth, sally } from './lib/api.js'
import Header from './components/Header.jsx'

export default function App() {
  const [theme, setTheme] = useState('light')
  const [me, setMe] = useState(null)
  const [myProf, setMyProf] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
  }, [theme])

  useEffect(() => {
    (async () => {
      try {
        const j = await auth.verify()
        const u = j.data?.sub || null
        setMe(u)
        if (u) {
          const p = await sally.getProfile({})
          setMyProf(p.profile || null)
        }
      } catch (e) { }
    })()
  }, [])

  return (
    <BrowserRouter>
      <Header theme={theme} setTheme={setTheme} me={me} myProf={myProf} setMe={setMe} />
      <div className="container">
        {!me ? <Login onLogin={(u) => setMe(u)} /> : (
          <Routes>
            <Route path="/" element={<Feed me={me} />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityFeed />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<FriendsPage />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  )
}

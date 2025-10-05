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
import GoogleAuthCallback from './components/GoogleAuthCallback.jsx'
import { Toaster } from 'react-hot-toast';

export default function App() {
  const mediaQuery = window?.matchMedia('(prefers-color-scheme: dark)');
  const t = mediaQuery.matches ? 'dark' : 'light';
  const [theme, setTheme] = useState(localStorage?.getItem("theme") ?? t)
  const [me, setMe] = useState(null)
  const [myProf, setMyProf] = useState(null)

  useEffect(() => {
    if (!theme) {
      const mediaQuery = window?.matchMedia('(prefers-color-scheme: dark)');
      const t = mediaQuery.matches ? 'dark' : 'light';
      setTheme(t);
    }
    localStorage.setItem("theme", theme);
    document?.documentElement?.setAttribute('data-theme', theme)
  }, [theme])


  // Set initial theme
  document?.documentElement?.setAttribute('data-theme', theme)

  useEffect(() => {
    verify()
  }, [])

  const verify = async () => {
    try {
      const j = await auth.verify()
      const u = j.data?.sub || null
      setMe(u)
      if (u) {
        const p = await sally.getProfile({})
        setMyProf(p.profile || null)
      }
    } catch (e) {
      console.warn('Auth verify failed', e)
    }
  }

  const onLogin = (u) => {
    verify();
  }

  return (
    <BrowserRouter>
      <Header theme={theme} setTheme={setTheme} me={me} myProf={myProf} setMe={setMe} key={me} />
      <div className="container">
        <Routes>
          <Route path="/auth/callback" element={<GoogleAuthCallback onLogin={onLogin} />} />
          {!me ? (
            // Login route
            <Route path="*" element={<Login onLogin={onLogin} />} />
          ) : (
            <>
              <Route path="/" element={<Feed me={me} />} />
              <Route path="/circles" element={<Circles />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/communities/:id" element={<CommunityFeed />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<FriendsPage />} />
            </>
          )}
        </Routes>
        <Toaster
          position='bottom-right'
        />
      </div>
    </BrowserRouter>
  )
}

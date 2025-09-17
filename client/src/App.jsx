import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './styles.css'
import Login from './components/Login.jsx'
import Feed from './components/Feed.jsx'
import Circles from './components/Circles.jsx'
import Communities from './components/Communities.jsx'
import CommunityFeed from './components/CommunityFeed.jsx'
import Profile from './components/Profile.jsx'
import Chat from './components/Chat.jsx'
import { auth, setToken, sally } from './lib/api.js'
import FriendsPage from './components/FriendsPage.jsx'

export default function App(){
  const [theme, setTheme] = useState('light')
  const [me, setMe] = useState(null)
  const [myProf, setMyProf] = useState(null)

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme==='dark'?'dark':'light') }, [theme])
  useEffect(() => { (async ()=>{ try { const j = await auth.verify(); const u=j.data?.sub||null; setMe(u); if (u){ const p=await sally.getProfile({}); setMyProf(p.profile||null) } } catch(e){} })() }, [])

  return (
    <BrowserRouter>
      <header>
        <img src="/logo/sally.jpg" alt="Sally" />
        <div className="brand">Sally</div>
        <nav>
          <NavLink to="/" end>🏠 Feed</NavLink>
          <NavLink to="/circles">👥 Circles</NavLink>
          <NavLink to="/communities">🧑‍🤝‍🧑 Communities</NavLink>
          <NavLink to="/chat">💬 Chat</NavLink>
          <NavLink to="/friends">👥 Friends</NavLink>
          <NavLink to="/profile">👤 Profile</NavLink>
        </nav>
        <div className="spacer" />
        {myProf && (
          <div style={{ marginRight: 8, fontSize: 12, opacity: 0.8 }}>Signed in as: <b>{myProf.display_name||myProf.username}</b> @{myProf.handle||myProf.username}</div>
        )}
        <button onClick={() => setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'Dark':'Light'}</button>
        {me && (
          <button onClick={()=>{ setToken(''); setMe(null); }}>Logout</button>
        )}
      </header>
      <div className="container">
        {!me ? <Login onLogin={(u)=>setMe(u)} /> : (
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

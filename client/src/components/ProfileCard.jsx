import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'
import { NavLink } from 'react-router-dom'

export default function ProfileCard(){
  const [p, setP] = useState(null)
  const [postCount, setPostCount] = useState(0)
  const [impressions, setImpressions] = useState(0)

  useEffect(() => { (async()=>{ try { const j = await sally.getProfile({}); setP(j.profile||{}) } catch(e){} })() }, [])
  // Real counts via new endpoints
  useEffect(() => { (async()=>{
    try {
      if (!p?.username) return
      const [pc, im] = await Promise.all([
        sally.countPosts(p.username),
        sally.impressions(p.username)
      ])
      setPostCount(pc.count||0)
      setImpressions(im.impressions||0)
    } catch(e){}
  })() }, [p?.username])

  const initials = (p?.display_name||p?.username||'S')[0]?.toUpperCase?.() || 'S'
  const [zoom, setZoom] = useState(false)

  return (
    <>
    <div className="card">
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        {p?.avatar_url ? (
          <div className="zoom-wrap" onClick={()=>setZoom(true)} style={{cursor:'zoom-in'}}>
            <img src={p.avatar_url} alt="avatar" className="avatar" style={{borderRadius:'50%'}}/>
            <span className="zoom-icon">🔍</span>
          </div>
        ) : (
          <div className="avatar !bg-[var(--bg)]">{initials}</div>
        )}
        <div>
          <div style={{fontWeight:700}}>{p?.display_name || p?.username || 'Me'}</div>
          <div style={{opacity:0.7, fontSize:12}}>@{p?.handle || p?.username || 'me'}</div>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <div className="stat"><span>Public impressions</span><b>{impressions}</b></div>
        <div className="stat"><span>Total posts</span><b>{postCount}</b></div>
      </div>
      <div style={{marginTop:12}}>
        <NavLink to="/profile"><button className="primary" style={{width:'100%'}}>Edit Profile</button></NavLink>
      </div>
    </div>
    {zoom && (
      <div className="lightbox-backdrop" onClick={()=>setZoom(false)}>
        <button className="lightbox-close" onClick={()=>setZoom(false)}>Close ✕</button>
        <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
          <img src={p?.avatar_url} alt="" />
        </div>
      </div>
    )}
    </>
  )
}

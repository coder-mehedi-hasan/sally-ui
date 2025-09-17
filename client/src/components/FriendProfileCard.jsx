import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function FriendProfileCard({ handle }){
  const [p, setP] = useState(undefined) // undefined = loading; null = not found
  const [postCount, setPostCount] = useState(0)
  const [impressions, setImpressions] = useState(0)
  const [zoom, setZoom] = useState(false)

  useEffect(()=>{ (async()=>{ try { const h=String(handle||'').replace(/^@/,''); if(!h){ setP(null); return } const j=await sally.getProfile({ handle:h }); setP(j.profile||null) } catch(e){ setP(null) } })() }, [handle])
  useEffect(()=>{ (async()=>{ try { if(!p?.username) return; const [pc, im]=await Promise.all([ sally.countPosts(p.username), sally.impressions(p.username) ]); setPostCount(pc.count||0); setImpressions(im.impressions||0) } catch(e){} })() }, [p?.username])

  if (p === undefined) {
    return (
      <div className="card sidebar-sticky">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className="skeleton skeleton-avatar" />
          <div style={{flex:1}}>
            <div className="skeleton skeleton-line" style={{width:'60%'}} />
            <div className="skeleton skeleton-line" style={{width:'40%'}} />
          </div>
        </div>
        <div style={{marginTop:12}}>
          <div className="skeleton skeleton-line" style={{width:'80%'}} />
          <div className="skeleton skeleton-line" style={{width:'70%'}} />
        </div>
      </div>
    )
  }
  if (p === null) {
    const h = String(handle||'').replace(/^@/,'')
    return (
      <div className="card sidebar-sticky">
        <h4 style={{marginTop:0}}>Profile</h4>
        <div style={{opacity:0.75}}>No profile found for @{h}</div>
      </div>
    )
  }
  const initials = (p?.display_name||p?.username||'S')[0]?.toUpperCase?.() || 'S'
  return (
    <div className="card sidebar-sticky">
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        {p?.avatar_url ? (
          <div className="zoom-wrap" onClick={()=>setZoom(true)} style={{cursor:'zoom-in'}}>
            <img src={p.avatar_url} alt="avatar" className="avatar" style={{borderRadius:'50%'}}/>
            <span className="zoom-icon">🔍</span>
          </div>
        ) : (
          <div className="avatar">{initials}</div>
        )}
        <div>
          <div style={{fontWeight:700}}>{p?.display_name || p?.username}</div>
          <div style={{opacity:0.7, fontSize:12}}>@{p?.handle || p?.username}</div>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <div className="stat"><span>Public impressions</span><b>{impressions}</b></div>
        <div className="stat"><span>Total posts</span><b>{postCount}</b></div>
      </div>
      {zoom && (
        <div className="lightbox-backdrop" onClick={()=>setZoom(false)}>
          <button className="lightbox-close" onClick={()=>setZoom(false)}>Close ✕</button>
          <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
            <img src={p?.avatar_url} alt="" />
          </div>
        </div>
      )}
    </div>
  )
}

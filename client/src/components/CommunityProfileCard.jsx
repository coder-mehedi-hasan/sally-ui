import { useEffect, useState } from 'react'
import { sally, upload } from '../lib/api.js'

export default function CommunityProfileCard({ communityId, initialCommunity=null, initialRole='' }){
  const [c, setC] = useState(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [about, setAbout] = useState('')
  const [avatar, setAvatar] = useState('')
  const [role, setRole] = useState('member')
  const [zoom, setZoom] = useState(false)

  async function load(){
    try {
      const list = await sally.listCommunities()
      const found = (list.communities||[]).find(x=>String(x.id)===String(communityId)) || null
      if (found){
        setRole(found.role||'member')
        setC(found)
        setName(found.name||'')
        setAbout(found.about||'')
        setAvatar(found.avatar_url||'')
      }
      try {
        const j = await sally.getCommunity(communityId)
        if (j && j.community){
          setC(j.community)
          setName(j.community.name||'')
          setAbout(j.community.about||'')
          setAvatar(j.community.avatar_url||'')
        }
      } catch(e){}
    } catch(e){}
  }
  useEffect(()=>{
    if (initialCommunity){
      setC(initialCommunity)
      setName(initialCommunity.name||'')
      setAbout(initialCommunity.about||'')
      setAvatar(initialCommunity.avatar_url||'')
    }
    if (initialRole) setRole(initialRole)
    load()
  }, [communityId])

  async function pickAvatar(files){
    if (!files || !files.length) return
    const res = await upload(files)
    const url = res[0]?.url || ''
    setAvatar(url)
  }

  async function save(){
    await sally.updateCommunity(communityId, { name, about, avatar_url: avatar })
    setEditing(false)
    load()
  }

  const initials = (c?.name||'C').slice(0,1).toUpperCase()
  return (
    <>
    <div className="card">
      {!editing ? (
        <div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            {avatar ? (
              <div className="zoom-wrap" onClick={()=>setZoom(true)} style={{cursor:'zoom-in'}}>
                <img src={avatar} alt="" style={{width:72, height:72, borderRadius:12, objectFit:'cover', border:'1px solid #e5e5e5'}} />
                <span className="zoom-icon">🔍</span>
              </div>
            ) : (
              <div className="avatar">{initials}</div>
            )}
            <div>
              <div style={{fontWeight:700, fontSize:18}}>{c?.name||'Community'}</div>
              <div style={{opacity:0.7, fontSize:12}}>{c?.about||''}</div>
            </div>
          </div>
          {(role==='owner' || role==='admin') && (
            <div style={{marginTop:8}}>
              <button className="primary" style={{width:'100%'}} onClick={()=>setEditing(true)}>Edit Community</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h4>Edit Community</h4>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            {avatar ? <img src={avatar} alt="" style={{width:72, height:72, borderRadius:12, objectFit:'cover', border:'1px solid #e5e5e5'}} /> : <div className="avatar">{initials}</div>}
            <label style={{cursor:'pointer'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>pickAvatar(Array.from(e.target.files||[]))} />
              <span>Change avatar</span>
            </label>
          </div>
          <input style={{marginTop:8}} placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <textarea rows={3} style={{marginTop:8}} placeholder="About" value={about} onChange={e=>setAbout(e.target.value)} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button className="primary" onClick={save}>Save</button>
            <button onClick={()=>{ setEditing(false); setName(c?.name||''); setAbout(c?.about||''); setAvatar(c?.avatar_url||'') }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
    {zoom && (
      <div className="lightbox-backdrop" onClick={()=>setZoom(false)}>
        <button className="lightbox-close" onClick={()=>setZoom(false)}>Close ✕</button>
        <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
          <img src={avatar} alt="" />
        </div>
      </div>
    )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { sally, upload } from '../lib/api.js'

export default function Profile(){
  const [profile, setProfile] = useState({ display_name:'', handle:'', bio:'', avatar_url:'' })
  const [file, setFile] = useState(null)

  useEffect(()=>{ (async()=>{ const j = await sally.getProfile({}); setProfile(j.profile||{}) })() }, [])

  async function save(){
    let avatar_url = profile.avatar_url
    if (file){ const up = await upload([file]); if (up && up[0]) avatar_url = up[0].url }
    await sally.upsertProfile({ display_name: profile.display_name, handle: profile.handle, bio: profile.bio, avatar_url })
    const j = await sally.getProfile({}); setProfile(j.profile||{})
  }

  return (
    <div className="card" style={{maxWidth:640}}>
      <h3>My profile</h3>
      <div className="row"><div className="col"><input placeholder="Display name" value={profile.display_name||''} onChange={e=>setProfile({...profile, display_name:e.target.value})} /></div></div>
      <div className="row" style={{marginTop:8}}><div className="col"><input placeholder="@handle" value={profile.handle||''} onChange={e=>setProfile({...profile, handle:e.target.value})} /></div></div>
      <div className="row" style={{marginTop:8}}><div className="col"><textarea rows={4} placeholder="Bio" value={profile.bio||''} onChange={e=>setProfile({...profile, bio:e.target.value})} /></div></div>
      <div className="row" style={{marginTop:8}}>
        <div className="col"><input type="file" onChange={e=>setFile((e.target.files||[])[0]||null)} /></div>
        <div><img src={profile.avatar_url||'/sally.jpg'} alt="avatar" style={{height:48, width:48, borderRadius:8}}/></div>
      </div>
      <div style={{marginTop:8}}><button className="primary" onClick={save}>Save</button></div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function FriendsCommunitiesCard({ handle }){
  const [items, setItems] = useState([])
  useEffect(()=>{ (async()=>{ try { const h=String(handle||'').replace(/^@/,''); if(!h) return; const j = await sally.listUserCommunities({ handle: h, skip:0, limit: 100 }); setItems(j.communities||[]) } catch(e){} })() }, [handle])
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h4 style={{margin:0}}>Communities</h4>
      </div>
      <div style={{marginTop:8}}>
        {items.map(c => (
          <a key={c.id} className="list-item" href={`/communities/${encodeURIComponent(c.id)}`}>
            <div className="avatar" style={{width:28, height:28, fontSize:12}}>{(c.name||'?')[0].toUpperCase()}</div>
            <div style={{display:'flex', flexDirection:'column'}}>
              <b>{c.name}</b>
              <span style={{opacity:0.7, fontSize:12}}>{c.role||'member'}</span>
            </div>
          </a>
        ))}
        {!items.length && <div style={{opacity:0.7}}>No communities</div>}
      </div>
    </div>
  )
}


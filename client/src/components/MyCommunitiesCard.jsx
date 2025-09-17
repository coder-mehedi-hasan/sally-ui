import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function MyCommunitiesCard({ limit=4 }){
  const [items, setItems] = useState([])
  useEffect(()=>{ (async()=>{ try { const j = await sally.listCommunities(); setItems(j.communities||[]) } catch(e){} })() }, [])
  return (
    <div className="card">
      <h4>Communities</h4>
      <div>
        {items.slice(0, limit).map(c => (
          <a key={c.id} className="list-item" href={`/communities/${c.id}`}>
            <div className="tag">{c.role||'member'}</div>
            <div style={{fontWeight:600}}>{c.name}</div>
          </a>
        ))}
        {!items.length && <div style={{opacity:0.7}}>No communities yet</div>}
      </div>
      <div style={{marginTop:8}}><a href="/communities">View all</a></div>
    </div>
  )
}

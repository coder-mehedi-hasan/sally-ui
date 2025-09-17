import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function MyCircles({ onPick, limit=4 }){
  const [circles, setCircles] = useState([])

  useEffect(()=>{ (async()=>{ try { const j = await sally.listCircles(); setCircles(j.circles||[]) } catch(e){} })() }, [])

  return (
    <div className="card">
      <h4>My Circles</h4>
      <div>
        {circles.slice(0, limit).map(c => (
          <div key={c.id} className="list-item" onClick={()=>onPick && onPick(c)}>
            <div className="tag">{c.kind}</div>
            <div style={{fontWeight:600}}>{c.name}</div>
          </div>
        ))}
        {!circles.length && <div style={{opacity:0.7}}>No circles yet</div>}
      </div>
      <div style={{marginTop:8}}>
        <a href="/circles">View all</a>
      </div>
    </div>
  )
}

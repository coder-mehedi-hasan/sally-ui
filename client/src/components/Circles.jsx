import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'

export default function Circles(){
  const [circles, setCircles] = useState([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState('friends')
  const [sel, setSel] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [members, setMembers] = useState([])
  const tRef = useRef(null)

  async function load(){ const j = await sally.listCircles(); setCircles(j.circles||[]) }
  useEffect(()=>{ load() }, [])

  async function create(){ await sally.createCircle(name, kind); setName(''); load() }
  async function add(username){ if (!sel) return; await sally.addToCircle(sel.id, username); pick(sel) }
  async function pick(c){ setSel(c); const j = await sally.listCircleMembers(c.id); setMembers(j.members||[]) }

  // live search among my friends by display_name or handle
  useEffect(() => {
    if (!sel) { setResults([]); return }
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q){ setResults([]); return }
      try {
        const j = await sally.searchMyFriends(q, 0, 10)
        setResults(j.users || [])
      } catch(e){ setResults([]) }
    }, 300)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query, sel])

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h4>Create circle</h4>
          <div className="row">
            <div className="col"><input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div className="col">
              <select value={kind} onChange={e=>setKind(e.target.value)}>
                <option>friends</option>
                <option>neighbours</option>
                <option>office</option>
                <option>custom</option>
              </select>
            </div>
          </div>
          <div style={{marginTop:8}}><button className="primary" onClick={create}>Create</button></div>
        </div>
        <div className="card" style={{marginTop:12}}>
          <h4>My circles</h4>
          {circles.map(c => (
            <div key={c.id} style={{padding:'8px 0', borderBottom:'1px solid #eee', cursor:'pointer'}} onClick={()=>pick(c)}>
              <b>{c.name}</b> <span style={{opacity:0.6}}>• {c.kind}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h4>Members {sel?('• '+sel.name):''}</h4>
          {sel && (
            <div>
              <input placeholder="Search by name or handle" value={query} onChange={e=>setQuery(e.target.value)} />
              {!!results.length && (
                <div className="search-results">
                  {results.map(u => (
                    <div className="search-item" key={u.username}>
                      <div className="name">{u.display_name || u.username}</div>
                      <div className="handle">@{u.handle || u.username}</div>
                      <div className="spacer" />
                      <button className="primary" onClick={()=>add(u.username)}>Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:8}}>
            {members.map(m => (
              <div key={m.id} style={{padding:'6px 0', borderBottom:'1px solid #eee'}}>@{m.member}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

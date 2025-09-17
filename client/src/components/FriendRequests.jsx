import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'

export default function FriendRequests(){
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const tRef = useRef(null)
  const [open, setOpen] = useState(false)

  async function load(){
    const inc = await sally.listFriendRequests('incoming', 0, 50)
    const out = await sally.listFriendRequests('outgoing', 0, 50)
    // Only show pending incoming on fresh loads
    setIncoming((inc.requests||[]).filter(r => (r.status||'pending') === 'pending'))
    setOutgoing(out.requests||[])
  }
  useEffect(()=>{ load() }, [])

  async function send(toUser){ if (!toUser) return; await sally.sendFriendRequest(toUser); load() }
  async function accept(id){
    try {
      await sally.respondFriendRequest(id, 'accept')
      // Optimistically update UI: mark as accepted and remove buttons
      setIncoming(list => list.map(r => r.id===id ? { ...r, status: 'accepted' } : r))
    } catch(e){}
  }
  async function decline(id){
    try {
      await sally.respondFriendRequest(id, 'decline')
      // Optimistically update UI: mark as declined and remove buttons
      setIncoming(list => list.map(r => r.id===id ? { ...r, status: 'declined' } : r))
    } catch(e){}
  }

  // live search by display_name or handle (matches Circles UX)
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q){ setResults([]); return }
      try {
        const j = await sally.searchUsers(q, 0, 10)
        setResults(j.users || [])
      } catch(e){ setResults([]) }
    }, 300)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query])

  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h4 style={{margin:0}}>Friend Requests</h4>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <a href="/friends" style={{fontSize:12, opacity:0.8}}>View all</a>
          <button title="Friends" onClick={()=>setOpen(true)} style={{border:'1px solid #ddd', background:'var(--panel)', color:'var(--panel-fg)', borderRadius:8, padding:'4px 8px'}}>👥</button>
        </div>
      </div>
      <div>
        <input placeholder="Search by display name or handle" value={query} onChange={e=>setQuery(e.target.value)} />
        {!!results.length && (
          <div className="search-results" style={{marginTop:8}}>
            {results.map(u => (
              <div className="search-item" key={u.username}>
                <div className="name">{u.display_name || u.username}</div>
                <div className="handle">@{u.handle || u.username}</div>
                <div className="spacer" />
                <button className="primary" onClick={()=>send(u.username)}>Send request</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{marginTop:8}}>
        <b>Incoming</b>
        {(incoming||[]).slice(0,6).map(r => (
          <div key={r.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #eee'}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <AvatarSmall url={r.from_profile?.avatar_url} name={r.from_profile?.display_name || r.from} />
              <div>
                <div><b>{r.from_profile?.display_name || r.from}</b> <span style={{opacity:0.8}}>@{r.from_profile?.handle || r.from}</span></div>
              </div>
            </div>
            {(r.status && r.status !== 'pending') ? (
              <div style={{fontSize:12, opacity:0.8}}>{r.status}</div>
            ) : (
              <div style={{display:'flex', gap:6}}>
                <button className="primary" onClick={()=>accept(r.id)}>Accept</button>
                <button onClick={()=>decline(r.id)}>Decline</button>
              </div>
            )}
          </div>
        ))}
        {!incoming.length && <div style={{opacity:0.7}}>No incoming requests</div>}
        {(incoming||[]).length>6 && <div style={{marginTop:6}}><a href="/friends">View all</a></div>}
      </div>
      <div style={{marginTop:8}}>
        <b>Outgoing</b>
        {(outgoing||[]).slice(0,6).map(r => (
          <div key={r.id} style={{padding:'6px 0', borderBottom:'1px solid #eee'}}>
            <span style={{opacity:0.7}}>to</span> <b>{r.to_profile?.display_name || r.to}</b> <span style={{opacity:0.8}}>@{r.to_profile?.handle || r.to}</span> • {r.status}
          </div>
        ))}
        {!outgoing.length && <div style={{opacity:0.7}}>No outgoing requests</div>}
        {(outgoing||[]).length>6 && <div style={{marginTop:6}}><a href="/friends">View all</a></div>}
      </div>

      {open && (
        <div className="lightbox-backdrop" onClick={()=>setOpen(false)}>
          <div className="card" style={{maxWidth:420, width:'90%', maxHeight:'80vh', overflow:'auto'}} onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h4 style={{margin:0}}>My Friends</h4>
              <button onClick={()=>setOpen(false)}>Close ✕</button>
            </div>
            <FriendsListPopup />
          </div>
        </div>
      )}
    </div>
  )
}

function FriendsListPopup(){
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState([])
  useEffect(()=>{ (async()=>{ const j = await sally.listFriendsDetailed(q, 0, 200); setFriends(j.friends||[]) })() }, [q])
  return (
    <div>
      <input placeholder="Search friends" value={q} onChange={e=>setQ(e.target.value)} />
      <div style={{marginTop:8}}>
        {friends.map(f => (
          <a key={f.username} className="list-item" href={`/?user=${encodeURIComponent(f.handle||f.username)}`}>
            <AvatarSmall url={f.avatar_url} name={f.display_name||f.handle||f.username} />
            <div style={{display:'flex', flexDirection:'column'}}>
              <b>{f.display_name || f.username}</b>
              <span style={{opacity:0.7, fontSize:12}}>@{f.handle || f.username}</span>
            </div>
          </a>
        ))}
        {!friends.length && <div style={{opacity:0.7}}>No friends yet</div>}
      </div>
    </div>
  )
}

function AvatarSmall({ url, name }){
  if (url){ return <img src={url} alt="" style={{width:22, height:22, borderRadius:'50%', border:'1px solid #ddd'}} /> }
  const initial = (name||'?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:22, height:22, fontSize:11}}>{initial}</div>
}

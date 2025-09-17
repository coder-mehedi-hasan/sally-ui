import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function FriendsPage(){
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState([])

  async function load(){
    const inc = await sally.listFriendRequests('incoming', 0, 200)
    const out = await sally.listFriendRequests('outgoing', 0, 200)
    setIncoming(inc.requests||[])
    setOutgoing(out.requests||[])
  }
  useEffect(()=>{ load() }, [])
  useEffect(()=>{ (async()=>{ const j = await sally.listFriendsDetailed(q, 0, 500); setFriends(j.friends||[]) })() }, [q])

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h4 style={{margin:0}}>Friend Requests</h4>
          </div>
          <div style={{marginTop:8}}>
            <b>Incoming</b>
            {(incoming||[]).map(r => (
              <div key={r.id} className="list-item">
                <Avatar url={r.from_profile?.avatar_url} name={r.from_profile?.display_name||r.from} />
                <div>
                  <div><b>{r.from_profile?.display_name || r.from}</b> <span style={{opacity:0.8}}>@{r.from_profile?.handle || r.from}</span></div>
                  <div style={{fontSize:12, opacity:0.8}}>{r.status}</div>
                </div>
              </div>
            ))}
            {!incoming.length && <div style={{opacity:0.7}}>No incoming requests</div>}
          </div>
          <div style={{marginTop:8}}>
            <b>Outgoing</b>
            {(outgoing||[]).map(r => (
              <div key={r.id} className="list-item">
                <Avatar url={r.to_profile?.avatar_url} name={r.to_profile?.display_name||r.to} />
                <div>
                  <div><b>{r.to_profile?.display_name || r.to}</b> <span style={{opacity:0.8}}>@{r.to_profile?.handle || r.to}</span></div>
                  <div style={{fontSize:12, opacity:0.8}}>{r.status}</div>
                </div>
              </div>
            ))}
            {!outgoing.length && <div style={{opacity:0.7}}>No outgoing requests</div>}
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h4>All Friends</h4>
          <input placeholder="Search friends" value={q} onChange={e=>setQ(e.target.value)} />
          <div style={{marginTop:8, maxHeight: '65vh', overflow:'auto'}}>
            {friends.map(f => (
              <a key={f.username} className="list-item" href={`/?user=${encodeURIComponent(f.handle||f.username)}`}>
                <Avatar url={f.avatar_url} name={f.display_name||f.handle||f.username} />
                <div style={{display:'flex', flexDirection:'column'}}>
                  <b>{f.display_name || f.username}</b>
                  <span style={{opacity:0.7, fontSize:12}}>@{f.handle || f.username}</span>
                </div>
              </a>
            ))}
            {!friends.length && <div style={{opacity:0.7}}>No friends yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Avatar({ url, name }){
  if (url){ return <img src={url} alt="" style={{width:28, height:28, borderRadius:'50%', border:'1px solid #ddd'}} /> }
  const initial = (name||'?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:28, height:28, fontSize:12}}>{initial}</div>
}


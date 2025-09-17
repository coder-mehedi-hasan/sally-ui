import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'

export default function FriendsPanel(){
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const tRef = useRef(null)

  async function load(reset=false){
    const nextSkip = reset ? 0 : skip
    const j = await sally.listFriendsDetailed(q, nextSkip, 30)
    const list = j.friends||[]
    setHasMore(list.length===30)
    if (reset){ setFriends(list); setSkip(30) } else { setFriends(prev=>prev.concat(list)); setSkip(nextSkip+30) }
  }

  useEffect(()=>{ load(true) }, [])

  useEffect(()=>{
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(()=>{ load(true) }, 250)
    return ()=>{ if (tRef.current) clearTimeout(tRef.current) }
  }, [q])

  return (
    <div className="card" style={{maxHeight: 380, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h4 style={{margin:0}}>Friends</h4>
        <a href="/friends" style={{fontSize:12, opacity:0.8}}>View all</a>
      </div>
      <input placeholder="Search friends" value={q} onChange={e=>setQ(e.target.value)} />
      <div style={{marginTop:8}}>
        {friends.map(f => (
          <a key={f.username} className="list-item" href={`/?user=${encodeURIComponent(f.handle||f.username)}`}>
            <Avatar url={f.avatar_url} name={f.display_name||f.handle||f.username} />
            <div style={{display:'flex', flexDirection:'column'}}>
              <b>{f.display_name || f.username}</b>
              <span style={{opacity:0.7, fontSize:12}}>@{f.handle || f.username}</span>
            </div>
          </a>
        ))}
        {!friends.length && <div style={{opacity:0.7}}>No friends found</div>}
        {hasMore && <div style={{marginTop:8}}><button onClick={()=>load(false)}>Load more</button></div>}
      </div>
    </div>
  )
}

function Avatar({ url, name }){
  if (url){ return <img src={url} alt="" style={{width:28, height:28, borderRadius:'50%', border:'1px solid #ddd'}} /> }
  const initial = (name||'?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:28, height:28, fontSize:12}}>{initial}</div>
}


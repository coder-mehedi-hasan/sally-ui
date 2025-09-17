import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'
import React from 'react'

export default function Communities(){
  const [communities, setCommunities] = useState([])
  const [name, setName] = useState('')
  const [about, setAbout] = useState('')
  const [sel, setSel] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  // Single-add like Circles; no multiselect
  const [members, setMembers] = useState([])
  const tRef = useRef(null)
  const [feedItems, setFeedItems] = useState([])
  const [feedSkip, setFeedSkip] = useState(0)
  const [feedHasMore, setFeedHasMore] = useState(true)

  async function load(){ const j = await sally.listCommunities(); setCommunities(j.communities||[]) }
  async function loadFeed(reset=true){
    const nextSkip = reset ? 0 : feedSkip
    const j = await sally.feed({ scope: 'communities', skip: nextSkip, limit: 10 })
    const newItems = j.items||[]
    setFeedHasMore(newItems.length === 10)
    if (reset){ setFeedItems(newItems); setFeedSkip(10) } else { setFeedItems(prev=>prev.concat(newItems)); setFeedSkip(nextSkip+10) }
  }
  useEffect(()=>{ load() }, [])
  useEffect(()=>{ loadFeed(true) }, [])

  async function create(){ await sally.createCommunity(name, about); setName(''); setAbout(''); load() }
  async function pick(c){ setSel(c); const j = await sally.listCommunityMembers(c.id); setMembers(j.members||[]) }
  async function add(username){ if (!sel) return; await sally.addToCommunity(sel.id, [username]); const j = await sally.listCommunityMembers(sel.id); setMembers(j.members||[]); setResults(r=>r.filter(u=>u.username!==username)) }

  useEffect(() => {
    if (!sel) { setResults([]); return }
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q){ setResults([]); return }
      try { const j = await sally.searchMyFriends(q, 0, 15); setResults(j.users||[]) } catch(e){ setResults([]) }
    }, 250)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query, sel])

  // removed multiselect toggle

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h4>Create community</h4>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <textarea rows={3} placeholder="About" style={{marginTop:8}} value={about} onChange={e=>setAbout(e.target.value)} />
          <div style={{marginTop:8}}><button className="primary" onClick={create}>Create</button></div>
        </div>
        <div className="card" style={{marginTop:12}}>
          <h4>My communities</h4>
          {communities.map(c => (
            <div key={c.id} style={{display:'flex', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #eee'}}>
              <a style={{flex:1, cursor:'pointer'}} href={`/communities/${c.id}`}>
                <b>{c.name}</b> <span style={{opacity:0.6, fontSize:12}}>• {c.member_count||0} members • role: {c.role||'member'}</span>
                <div style={{opacity:0.7, fontSize:12}}>{c.about}</div>
              </a>
              {c.role !== 'owner' && (
                <button onClick={async()=>{ await sally.leaveCommunity(c.id); load(); }}>Leave</button>
              )}
            </div>
          ))}
          {!communities.length && <div style={{opacity:0.7}}>No communities yet</div>}
        </div>
        <div style={{height:12}} />
      </div>
      <div className="col">
        <div className="card">
          <h4>Community posts</h4>
          <div style={{marginTop:8}}>
            {feedItems.map(({post, media=[], community}) => (
              <div className="feed-item" key={post.id}>
                <div style={{fontSize:12, opacity:0.7}}>
                  {community && community.name ? (<>
                    <a href={`/communities/${community.id}`}>{community.name}</a> &gt; 
                  </>) : null}
                  @{post.author} • {new Date(post.created_at).toLocaleString()}
                </div>
                <div style={{marginTop:4}}>{post.text}</div>
                {!!media.length && (<MediaInline media={media} />)}
              </div>
            ))}
            {feedHasMore && (
              <div style={{display:'flex', justifyContent:'center', marginTop:8}}>
                <button onClick={()=>loadFeed(false)}>Load more</button>
              </div>
            )}
          </div>
        </div>
        <div style={{height:12}} />
        <div className="card">
          <h4>Members {sel?('• '+sel.name):''}</h4>
          {sel && (
            <div>
              <input placeholder="Search my friends by name or handle" value={query} onChange={e=>setQuery(e.target.value)} />
              {!!results.length && (
                <div className="search-results">
                  {results.map(u => (
                    <div key={u.username} className="search-item">
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
            {members.map(m => (<div key={m.id} style={{padding:'6px 0', borderBottom:'1px solid #eee'}}>@{m.member}</div>))}
          </div>
        </div>
        {sel && sel.role === 'owner' && (
          <OwnershipPanel community={sel} onChanged={load} />
        )}
      </div>
    </div>
  )
}

function MediaInline({ media }){
  return (
    <div className="media-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))'}}>
      {media.map((m, idx) => (
        m.mime && m.mime.startsWith('image') ? (
          <img key={m.id||idx} src={m.url} alt="" />
        ) : (
          <a key={m.id||idx} href={m.url} target="_blank" rel="noreferrer">{m.kind||m.mime||'file'}</a>
        )
      ))}
    </div>
  )
}

function OwnershipPanel({ community, onChanged }){
  const [members, setMembers] = useState([])
  const [nextOwner, setNextOwner] = useState('')
  useEffect(()=>{ (async()=>{ const j = await sally.listCommunityMembers(community.id); setMembers((j.members||[]).filter(m=>m.member!==community.owner)) })() }, [community.id])
  async function transfer(){ if (!nextOwner) return; await sally.transferCommunityOwner(community.id, nextOwner); onChanged && onChanged() }
  return (
    <div className="card" style={{marginTop:12}}>
      <h4>Ownership</h4>
      <div style={{display:'flex', gap:8}}>
        <select value={nextOwner} onChange={e=>setNextOwner(e.target.value)}>
          <option value="">Select new owner…</option>
          {members.map(m => <option key={m.id} value={m.member}>{m.member}</option>)}
        </select>
        <button className="primary" onClick={transfer}>Transfer</button>
      </div>
      <div style={{marginTop:8}}>
        <button onClick={async()=>{ if (confirm('Delete community? This removes all memberships.')) { await sally.deleteCommunity(community.id); onChanged && onChanged() } }}>Delete community</button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { sally, upload } from '../lib/api.js'
import CommunityProfileCard from './CommunityProfileCard.jsx'
import { auth } from '../lib/api.js'
import Comments from './Comments.jsx'
import Reactions from './Reactions.jsx'
import ReactionBreakdown from './ReactionBreakdown.jsx'
import UploadToolbar from './UploadToolbar.jsx'
import MediaPreviews from './MediaPreviews.jsx'

export default function CommunityFeed(){
  const { id } = useParams()
  const communityId = id
  const [community, setCommunity] = useState(null)
  const [role, setRole] = useState('member')
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [members, setMembers] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  // Single-add like Circles; no multiselect
  const [ws, setWs] = useState(null)
  const [me, setMe] = useState('')
  const [loading, setLoading] = useState(false)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [sentinel, setSentinel] = useState(null)
  const [rxnOpen, setRxnOpen] = useState(false)
  const [rxnItems, setRxnItems] = useState([])

  async function add(u){ if (!communityId) return; try { await sally.addToCommunity(communityId, [u]); setResults(r=>r.filter(x=>x.username!==u)); load(); } catch(e){} }

  async function load(reset=true){
    if (fetching) return
    setFetching(true)
    const nextSkip = reset ? 0 : (skip)
    const j = await sally.feed({ scope:'community', community_id: communityId, skip: nextSkip, limit: 10 })
    const newItems = j.items||[]
    setHasMore(newItems.length === 10)
    if (reset){ setItems(newItems); setSkip(10) } else { setItems(prev=>prev.concat(newItems)); setSkip(nextSkip+10) }
    const mm = await sally.listCommunityMembers(communityId)
    setMembers(mm.members||[])
    setFetching(false)
  }

  useEffect(()=>{ (async()=>{
    try {
      const list = await sally.listCommunities()
      const c = (list.communities||[]).find(x=>String(x.id)===String(communityId))
      if (c){ setCommunity(c); setRole(c.role||'member') }
    } catch(e){}
  })() }, [communityId])

  useEffect(()=>{ load() }, [communityId])

  useEffect(()=>{ (async()=>{ try { const j = await auth.verify(); setMe(j.data?.sub||'') } catch(e){} })() }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim()
      if (!q) { setResults([]); return }
      try { const j = await sally.searchMyFriends(q, 0, 15); setResults(j.users||[]) } catch(e){ setResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const w = new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws')
    w.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.kind==='post' || m.kind==='comment') load() } catch(e){} }
    setWs(w)
    return () => { try { w.close() } catch(e){} }
  }, [])

  // Infinite scroll
  useEffect(() => {
    if (!sentinel) return
    const obs = new IntersectionObserver((entries)=>{
      for (const e of entries){ if (e.isIntersecting && hasMore && !fetching) load(false) }
    }, { rootMargin: '300px' })
    obs.observe(sentinel)
    return () => { try { obs.disconnect() } catch(e){} }
  }, [sentinel, hasMore, fetching])

  async function post(){
    let media = []
    try {
      setLoading(true)
      if (files.length) media = await upload(files)
      await sally.createPost({ text, media, community_id: communityId })
    } finally {
      setLoading(false)
    }
    setText(''); setFiles([])
    load(true)
    try { ws && ws.readyState===1 && ws.send(JSON.stringify({kind:'post'})) } catch(e){}
  }

  async function showReactions(postId){
    try { const j = await sally.listReactions(postId); setRxnItems(j.reactions||[]); setRxnOpen(true) } catch(e){}
  }

  // removed multiselect addSelected

  return (
    <>
    <div className="layout-3col">
      <div className="col-left">
        <CommunityProfileCard communityId={communityId} initialCommunity={community} initialRole={role} />
      </div>
      <div className="col-main">
        <div className="card">
          <h4>{community ? community.name : 'Community'} — Feed</h4>
          <textarea rows={3} placeholder="Share something with the community" value={text} onChange={e=>setText(e.target.value)} />
          <MediaPreviews files={files} onRemove={(i)=>setFiles(f=>f.filter((_,idx)=>idx!==i))} />
          <div className="composer-actions">
            <UploadToolbar onFiles={(fs)=>setFiles(prev => prev.concat(fs))} />
            <button className="primary" onClick={post} disabled={loading}>
              {loading ? <>Posting… <span className="spinner" /></> : 'Post'}
            </button>
          </div>
        </div>
        <div className="card" style={{marginTop:12}}>
          <div style={{marginTop:8}}>
            {items.map(({post,reactions,comments,media=[],my_reaction,author}) => (
              <div className="feed-item" key={post.id}>
                <div style={{fontSize:12, opacity:0.85, display:'flex', alignItems:'center', gap:8}}>
                  <a href={`/?user=@${(author?.handle||post.author)}`}><AvatarSmall author={author} username={post.author} /></a>
                  <a href={`/?user=@${(author?.handle||post.author)}`} style={{fontWeight:700}}>{author?.display_name || author?.handle || post.author}</a>
                  <a href={`/?user=@${(author?.handle||post.author)}`} style={{opacity:0.8}}>@{author?.handle || post.author}</a>
                  <span className="meta">{new Date(post.created_at).toLocaleString()}</span>
                </div>
                <div style={{marginTop:4}}>{post.text}</div>
                {!!media.length && (
                  <MediaGrid media={media} />
                )}
                <div style={{marginTop:6, fontSize:12, opacity:0.7}}>
                  <a href="#" onClick={(e)=>{e.preventDefault(); showReactions(post.id)}}>{reactions} reactions</a>
                  <ReactionBreakdown postId={post.id} />
                   • {comments} comments
                </div>
                <Reactions postId={post.id} onReact={load} my={my_reaction} />
                <div style={{marginTop:8}}>
                  <Comments me={me} postId={post.id} notify={() => { try { ws && ws.readyState===1 && ws.send(JSON.stringify({kind:'comment', post_id: post.id})) } catch(e){} }} />
                </div>
              </div>
            ))}
            <div ref={setSentinel} style={{height:1}} />
          </div>
        </div>
      </div>
      <div className="col-right sidebar-sticky">
        <div className="card">
          <h4>Members {community?('• '+community.name):''}</h4>
          {(role==='owner' || role==='admin') && (
            <div>
              <input placeholder="Search my friends to add" value={query} onChange={e=>setQuery(e.target.value)} />
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
            {!members.length && <div style={{opacity:0.7}}>No members yet</div>}
          </div>
        </div>
      </div>
    </div>
    {rxnOpen && (
      <div className="lightbox-backdrop" onClick={()=>setRxnOpen(false)}>
        <div className="card" style={{maxWidth:420, width:'90%', maxHeight:'80vh', overflow:'auto'}} onClick={(e)=>e.stopPropagation()}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h4 style={{margin:0}}>Reactions</h4>
            <button onClick={()=>setRxnOpen(false)}>Close ✕</button>
          </div>
          <div style={{marginTop:8}}>
            {rxnItems.map((r,i)=> (
              <div key={i} className="stat"><span>@{r.user}</span><b>{r.type}</b></div>
            ))}
            {!rxnItems.length && <div style={{opacity:0.7}}>No reactions yet</div>}
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function AvatarSmall({ author, username }){
  const url = author && author.avatar_url ? author.avatar_url : ''
  if (url){ return <img src={url} alt="" style={{width:24, height:24, borderRadius:'50%', border:'1px solid #ddd'}} /> }
  const initial = (author?.display_name || author?.handle || username || '?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:24, height:24, fontSize:12}}>{initial}</div>
}

function MediaGrid({ media }){
  const images = media.filter(m => m.mime && m.mime.startsWith('image'))
  const [openIdx, setOpenIdx] = useState(-1)
  const open = openIdx >= 0 ? images[openIdx]?.url : null
  useEffect(() => {
    function onKey(e){
      if (openIdx < 0) return
      if (e.key === 'Escape'){ setOpenIdx(-1) }
      else if (e.key === 'ArrowLeft'){ setOpenIdx(i => (i-1+images.length)%images.length) }
      else if (e.key === 'ArrowRight'){ setOpenIdx(i => (i+1)%images.length) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx, images.length])
  return (
    <>
      <div className="media-grid">
        {media.map((m, idx) => (
          m.mime && m.mime.startsWith('image') ? (
            <img key={m.id||idx} src={m.url} alt="" onClick={()=>setOpenIdx(images.findIndex(im=>im.url===m.url))} style={{cursor:'zoom-in'}} />
          ) : (
            <a key={m.id||idx} href={m.url} target="_blank" rel="noreferrer">{m.kind||m.mime||'file'}</a>
          )
        ))}
      </div>
      {open && (
        <div className="lightbox-backdrop" onClick={()=>setOpenIdx(-1)}>
          <button className="lightbox-close" onClick={()=>setOpenIdx(-1)}>Close ✕</button>
          <div className="lightbox-content" onClick={(e)=>e.stopPropagation()}>
            <img src={open} alt="" />
            {images.length > 1 && (
              <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
                <button onClick={()=>setOpenIdx((i)=> (i-1+images.length)%images.length)}>◀ Prev</button>
                <button onClick={()=>setOpenIdx((i)=> (i+1)%images.length)}>Next ▶</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

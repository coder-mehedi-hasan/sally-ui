import { useEffect, useState } from 'react'
import { sally, upload } from '../lib/api.js'
import FriendRequests from './FriendRequests.jsx'
import ProfileCard from './ProfileCard.jsx'
import FriendProfileCard from './FriendProfileCard.jsx'
import MyCircles from './MyCircles.jsx'
import MyCommunitiesCard from './MyCommunitiesCard.jsx'
import FriendsPanel from './FriendsPanel.jsx'
import RecentChats from './RecentChats.jsx'
import FriendsCommunitiesCard from './FriendsCommunitiesCard.jsx'
import Comments from './Comments.jsx'
import Reactions from './Reactions.jsx'
import ReactionBreakdown from './ReactionBreakdown.jsx'
import UploadToolbar from './UploadToolbar.jsx'
import MediaPreviews from './MediaPreviews.jsx'

export default function Feed({ me }){
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const [scope, setScope] = useState('friends')
  const [audience, setAudience] = useState('friends') // composer audience
  const [files, setFiles] = useState([])
  const [circles, setCircles] = useState([])
  const [circleId, setCircleId] = useState('') // filter circle
  const [postCircleId, setPostCircleId] = useState('') // composer circle
  const [circleMembers, setCircleMembers] = useState([])
  const [ws, setWs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [io, setIo] = useState(null)
  const [sentinel, setSentinel] = useState(null)
  const [rxnOpen, setRxnOpen] = useState(false)
  const [rxnItems, setRxnItems] = useState([])

  async function load(reset=true){
    if (fetching) return
    setFetching(true)
    const nextSkip = reset ? 0 : (skip)
    const j = await sally.feed({ scope, circle_id: circleId || undefined, skip: nextSkip, limit: 10 })
    let newItems = j.items||[]
    const qp = new URLSearchParams(window.location.search)
    const sel = (qp.get('user')||'').replace(/^@/,'').toLowerCase()
    if (sel){ newItems = newItems.filter(it => (it.author?.handle||'').toLowerCase()===sel || (it.post?.author||'').toLowerCase()===sel) }
    setHasMore(newItems.length === 10)
    if (reset){ setItems(newItems); setSkip(10) } else { setItems(prev=>prev.concat(newItems)); setSkip(nextSkip+10) }
    setFetching(false)
  }
  useEffect(() => { load(true) }, [scope, circleId])

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!sentinel) return
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting && hasMore && !fetching) load(false)
      }
    }, { rootMargin: '300px' })
    obs.observe(sentinel)
    setIo(obs)
    return () => { try { obs.disconnect() } catch(e){} }
  }, [sentinel, hasMore, fetching])
  useEffect(() => { (async()=>{ const j = await sally.listCircles(); setCircles(j.circles||[]) })() }, [])
  useEffect(() => { (async()=>{ if (scope==='circle' && circleId){ const j = await sally.listCircleMembers(circleId); setCircleMembers(j.members||[]) } else setCircleMembers([]) })() }, [scope, circleId])
  useEffect(() => {
    const w = new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws')
    w.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.kind==='post' || m.kind==='comment') load() } catch(e){} }
    setWs(w)
    return () => { try { w.close() } catch(e){} }
  }, [])

  async function post(){
    let media = []
    try {
      setLoading(true)
      if (files.length) media = await upload(files)
    } finally {}
    const circle_id = audience==='circle' && postCircleId ? postCircleId : undefined
    const visibility = audience==='global' ? 'global' : 'friends'
    await sally.createPost({ text, media, circle_id, visibility })
    setText(''); setFiles([])
    await load(true)
    setLoading(false)
    try { ws && ws.readyState===1 && ws.send(JSON.stringify({kind:'post'})) } catch(e){}
  }

  async function showReactions(postId){
    try { const j = await sally.listReactions(postId); setRxnItems(j.reactions||[]); setRxnOpen(true) } catch(e){}
  }

  return (
    <>
    <div className="layout-3col">
      <div className="col-left">
        {/* If a friend is selected via ?user=, show their profile */}
        {new URLSearchParams(window.location.search).get('user') ? (
          <FriendProfileCard handle={new URLSearchParams(window.location.search).get('user')} />
        ) : (
          <>
            <ProfileCard />
            <div style={{height:12}} />
            <MyCircles limit={6} onPick={(c)=>{ setScope('circle'); setCircleId(String(c.id)); }} />
          </>
        )}
      </div>
      <div className="col-main">
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <h4 style={{margin:0}}>Create post</h4>
          </div>
          <textarea rows={3} placeholder="What's new?" value={text} onChange={e=>setText(e.target.value)} />
          <MediaPreviews files={files} onRemove={(i)=>setFiles(f=>f.filter((_,idx)=>idx!==i))} />
          <div style={{display:'flex', gap:6, alignItems:'center', marginTop:6}}>
            <select className="select-dark select-compact select-sm" value={audience} onChange={e=>setAudience(e.target.value)}>
              <option value="friends">Friends</option>
              <option value="global">Global</option>
              <option value="circle">Circle</option>
            </select>
            {audience==='circle' && (
              <select className="select-dark select-compact select-sm" value={postCircleId} onChange={e=>setPostCircleId(e.target.value)}>
                <option value="">Select circle…</option>
                {circles.map(c => <option key={c.id} value={c.id}>{c.name} • {c.kind}</option>)}
              </select>
            )}
          </div>
          <div className="composer-actions">
            <UploadToolbar onFiles={(fs)=>setFiles(prev => prev.concat(fs))} />
            <button className="primary" onClick={post} disabled={loading}>
              {loading ? <>Posting… <span className="spinner" /></> : 'Post'}
            </button>
          </div>
        </div>
        <div className="card" style={{marginTop:12}}>
          {/* Feed filter row (Friends / Global / Circle) */}
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select className="select-pill select-compact" value={scope} onChange={e=>setScope(e.target.value)}>
              <option value="friends">Friends</option>
              <option value="global">Global</option>
              <option value="circle">Circle</option>
            </select>
            {scope==='circle' && (
              <select className="select-pill select-compact" value={circleId} onChange={e=>setCircleId(e.target.value)}>
                <option value="">Select circle…</option>
                {circles.map(c => <option key={c.id} value={c.id}>{c.name} • {c.kind}</option>)}
              </select>
            )}
          </div>
          {/* feed list begins below */}
          <div style={{marginTop:8}}>
            {!items.length && fetching && (
              <>
                {[1,2,3].map(i => (
                  <div key={i} className="feed-item">
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div className="skeleton skeleton-avatar" />
                      <div style={{flex:1}}>
                        <div className="skeleton skeleton-line" style={{width:'40%'}} />
                      </div>
                    </div>
                    <div className="skeleton skeleton-line" style={{width:'90%', marginTop:8}} />
                    <div className="skeleton skeleton-line" style={{width:'80%'}} />
                  </div>
                ))}
              </>
            )}
            {items.map(({post,reactions,comments,media=[],my_reaction,community,author}) => (
              <div className="feed-item" key={post.id}>
                <div style={{fontSize:12, opacity:0.85, display:'flex', alignItems:'center', gap:8}}>
                  <a href={`/?user=@${(author?.handle||post.author)}`}>
                    <AvatarSmall author={author} username={post.author} />
                  </a>
                  <a href={`/?user=@${(author?.handle||post.author)}`} style={{fontWeight:700}}>
                    {author?.display_name || author?.handle || post.author}
                  </a>
                  <a href={`/?user=@${(author?.handle||post.author)}`} style={{opacity:0.8}}>@{author?.handle || post.author}</a>
                  <span className="meta">{new Date(post.created_at).toLocaleString()}</span>
                  <span style={{
                    fontSize:11,
                    padding:'2px 6px',
                    borderRadius:999,
                    background:'var(--primary, #e9e5e0)',
                    color:'#333',
                    border:'1px solid rgba(0,0,0,0.1)'
                  }}>
                    {scope==='circle' ? 'Circle' : (community ? `Community${community.name?': '+community.name:''}` : ((post.visibility||'friends')==='global' ? 'Global' : 'Friends'))}
                  </span>
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
            <div ref={setSentinel} style={{height: 1}} />
          </div>
        </div>
      </div>
      <div className="col-right sidebar-sticky">
        {new URLSearchParams(window.location.search).get('user') ? (
          <FriendsCommunitiesCard handle={new URLSearchParams(window.location.search).get('user')} />
        ) : (
          <>
            <FriendRequests />
            <div style={{height:12}} />
            <MyCommunitiesCard limit={4} />
            <div style={{height:12}} />
            <FriendsPanel />
            <div style={{height:12}} />
            <RecentChats limit={6} />
          </>
        )}
        {scope==='circle' && circleId && (
          <div className="card" style={{marginTop:12}}>
            <h4>Circle members</h4>
            <div>
              {circleMembers.map(m => (<div key={m.id} style={{padding:'6px 0', borderBottom:'1px solid #eee'}}>@{m.member}</div>))}
              {!circleMembers.length && <div style={{opacity:0.7}}>No members yet</div>}
            </div>
          </div>
        )}
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
  if (url){
    return <img src={url} alt="" style={{width:24, height:24, borderRadius:'50%', border:'1px solid #ddd'}} />
  }
  // fallback initials
  const initial = (author?.display_name || author?.handle || username || '?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:24, height:24, fontSize:12}}>{initial}</div>
}

function MediaGrid({ media }){
  const images = media.filter(m => m.mime && m.mime.startsWith('image'))
  const [openIdx, setOpenIdx] = useState(-1)
  const open = openIdx >= 0 ? images[openIdx]?.url : null
  // keyboard navigation
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
      {images.length === 1 ? (
        <div className="media-single">
          <img src={images[0].url} alt="" onClick={()=>setOpenIdx(0)} style={{cursor:'zoom-in'}} />
        </div>
      ) : (
        <div className="media-grid">
          {media.map((m) => (
            m.mime && m.mime.startsWith('image') ? (
              <img key={m.id} src={m.url} alt="" onClick={()=>setOpenIdx(images.findIndex(im=>im.url===m.url))} style={{cursor:'zoom-in'}} />
            ) : (
              <a key={m.id} href={m.url} target="_blank" rel="noreferrer">{m.kind||m.mime||'file'}</a>
            )
          ))}
        </div>
      )}
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

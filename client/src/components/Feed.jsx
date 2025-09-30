import { useEffect, useState } from 'react'
import { sally, upload } from '../lib/api.js'
import { feedFormatDate } from '../lib/helper.js'
import Comments from './Comments.jsx'
import FriendProfileCard from './FriendProfileCard.jsx'
import FriendRequests from './FriendRequests.jsx'
import FriendsCommunitiesCard from './FriendsCommunitiesCard.jsx'
import FriendsPanel from './FriendsPanel.jsx'
import MediaPreviews from './MediaPreviews.jsx'
import MyCircles from './MyCircles.jsx'
import MyCommunitiesCard from './MyCommunitiesCard.jsx'
import ProfileCard from './ProfileCard.jsx'
import ReactionBreakdown from './ReactionBreakdown.jsx'
import Reactions from './Reactions.jsx'
import RecentChats from './RecentChats.jsx'
import UploadToolbar from './UploadToolbar.jsx'
import ContentBox from './common/ContentBox.jsx'
import constant from '../lib/constant.js'
import AvatarSmall from './common/AvatarSmall.jsx'
import MediaGrid from './common/MediaGrid.jsx'
import ReactionsModal from './common/ReactionsModal.jsx'
import { NavLink } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Feed({ me }) {
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
  const [rxnItems, setRxnItems] = useState([]);
  const [commentExpandedPost, setCommentExpandedPost] = useState(new Set());

  async function load(reset = true) {
    if (fetching) return
    setFetching(true)
    const nextSkip = reset ? 0 : (skip)
    const j = await sally.feed({ scope, circle_id: circleId || undefined, skip: nextSkip, limit: 10 })
    let newItems = j.items || []
    const qp = new URLSearchParams(window.location.search)
    const sel = (qp.get('user') || '').replace(/^@/, '').toLowerCase()
    if (sel) { newItems = newItems.filter(it => (it.author?.handle || '').toLowerCase() === sel || (it.post?.author || '').toLowerCase() === sel) }
    setHasMore(newItems.length === 10)
    if (reset) { setItems(newItems); setSkip(10) } else { setItems(prev => prev.concat(newItems)); setSkip(nextSkip + 10) }
    setFetching(false)
  }
  useEffect(() => { load(true) }, [scope, circleId])

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!sentinel) return
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && hasMore && !fetching) load(false)
      }
    }, { rootMargin: '300px' })
    obs.observe(sentinel)
    setIo(obs)
    return () => { try { obs.disconnect() } catch (e) { } }
  }, [sentinel, hasMore, fetching])
  useEffect(() => { (async () => { const j = await sally.listCircles(); setCircles(j.circles || []) })() }, [])
  useEffect(() => { (async () => { if (scope === 'circle' && circleId) { const j = await sally.listCircleMembers(circleId); setCircleMembers(j.members || []) } else setCircleMembers([]) })() }, [scope, circleId])
  useEffect(() => {
    const w = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws')
    w.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.kind === 'post' || m.kind === 'comment') load() } catch (e) { } }
    setWs(w)
    return () => { try { w.close() } catch (e) { } }
  }, [])

  async function post() {
    let media = []
    try {
      setLoading(true)
      if (files.length) media = await upload(files)
    } finally { }
    try {
      const circle_id = audience === 'circle' && postCircleId ? postCircleId : undefined
      const visibility = audience === 'global' ? 'global' : 'friends'
      await sally.createPost({ text, media, circle_id, visibility })
      setText(''); setFiles([])
      await load(true)
    } catch (error) { toast.error("Failed to Post!") }
    finally {
      setLoading(false)
    }
    try { ws && ws.readyState === 1 && ws.send(JSON.stringify({ kind: 'post' })) } catch (e) { }
  }

  async function showReactions(postId) {
    try { const j = await sally.listReactions(postId); setRxnItems(j.reactions || []); setRxnOpen(true) } catch (e) { }
  }

  const FeedPost = ({ post, reactions, comments, media = [], my_reaction, community, author }) => {
    const [updatedComments, setUpdatedComments] = useState(comments);

    const isExpanded = commentExpandedPost.has(post.id)
    return (
      <div className='card mb-3 !p-0 ' key={post.id}>
        <div className="feed-item">
          <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavLink to={`/?user=@${(author?.handle || post.author)}`}>
              <AvatarSmall size={38} author={author} username={post.author} />
            </NavLink>
            <div className='flex flex-col w-full'>
              <div className='flex gap-2 justify-between'>
                <div>
                  <NavLink to={`/?user=@${(author?.handle || post.author)}`} className='text-sm' style={{ fontWeight: 700, }}>
                    {author?.display_name || author?.handle || post.author}
                  </NavLink>
                  <NavLink to={`/?user=@${(author?.handle || post.author)}`} style={{ opacity: 0.8 }}>@{author?.handle || post.author}</NavLink>

                </div>
                <span style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'var(--primary, #e9e5e0)',
                  color: '#333',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  {scope === 'circle' ? 'Circle' : (community ? `Community${community.name ? ': ' + community.name : ''}` : ((post.visibility || 'friends') === 'global' ? 'Global' : 'Friends'))}
                </span>
              </div>
              <span className="meta text-xs">{feedFormatDate(post.created_at)}</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>{post.text}</div>
          {!!media.length && (
            <MediaGrid media={media} />
          )}
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            <span className='hover:underline cursor-pointer' onClick={(e) => { e.preventDefault(); showReactions(post.id) }}>{reactions} reactions</span>
            <ReactionBreakdown postId={post.id} />
            {" "}• <span className='hover:underline cursor-pointer' onClick={() => {
              setCommentExpandedPost(pre => {
                const nSet = new Set(pre)
                if (nSet.has(post.id)) {
                  nSet.delete(post.id)
                } else {
                  nSet.add(post.id)
                }
                return nSet;
              });
            }}>{updatedComments} comments</span>
          </div>
          <Reactions postId={post.id} onReact={load} my={my_reaction} />
          {
            isExpanded && (
              <div style={{ marginTop: 12, }} className='border-t py-1'>
                <Comments count={updatedComments} me={me} postId={post.id} notify={() => { try { ws && ws.readyState === 1 && ws.send(JSON.stringify({ kind: 'comment', post_id: post.id })); setUpdatedComments(pre => pre + 1) } catch (e) { } }} />
              </div>
            )
          }
        </div>
      </div>
    )
  }

  const PostBox = () => {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 style={{ margin: 0 }} className='font-bold'>Create post</h4>
        </div>
        <ContentBox
          value={text}
          onChange={setText}
          onSubmit={post}
          placeholder="What's new?"
          minHeight={100}
        />
        {/* <textarea rows={3} placeholder="What's new?" value={text} onChange={e=>setText(e.target.value)} /> */}
        <MediaPreviews files={files} onRemove={(i) => setFiles(f => f.filter((_, idx) => idx !== i))} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
          <select className="select-dark select-compact select-sm" value={audience} onChange={e => setAudience(e.target.value)}>
            <option value="friends">Friends</option>
            <option value="global">Global</option>
            <option value="circle">Circle</option>
          </select>
          {audience === 'circle' && (
            <select className="select-dark select-compact select-sm" value={postCircleId} onChange={e => setPostCircleId(e.target.value)}>
              <option value="">Select circle…</option>
              {circles.map(c => <option key={c.id} value={c.id}>{c.name} • {c.kind}</option>)}
            </select>
          )}
        </div>
        <div className="composer-actions">
          <UploadToolbar onFiles={(fs) => setFiles(prev => prev.concat(fs))} />
          <button className="primary bg-[#fff]" onClick={post} disabled={loading}>
            {loading ? <>Posting… <span className="spinner" /></> : 'Post'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="layout-3col">
        <div className="col-left  sidebar-sticky hidden md:block">
          {/* If a friend is selected via ?user=, show their profile */}
          {new URLSearchParams(window.location.search).get('user') ? (
            <FriendProfileCard handle={new URLSearchParams(window.location.search).get('user')} />
          ) : (
            <>
              <div className=''>
                <ProfileCard />
              </div>
              <div style={{ height: 12 }} />
              <MyCircles limit={6} onPick={(c) => { setScope('circle'); setCircleId(String(c.id)); }} />
            </>
          )}
        </div>
        <div className="col-main">
          <div className=''>
            <PostBox></PostBox>
          </div>
          <div className="card sidebar-sticky filter-bar pt-4 pb-[8px] z-10" id='filter-bar' style={{ marginTop: 12 }}>
            {/* Feed filter row (Friends / Global / Circle) */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className=' bg-white'>
              <select className="select-pill select-compact" value={scope} onChange={e => setScope(e.target.value)}>
                <option value="friends">Friends</option>
                <option value="global">Global</option>
                <option value="circle">Circle</option>
              </select>
              {scope === 'circle' && (
                <select className="select-pill select-compact" value={circleId} onChange={e => setCircleId(e.target.value)}>
                  <option value="">Select circle…</option>
                  {circles.map(c => <option key={c.id} value={c.id}>{c.name} • {c.kind}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="" style={{ marginTop: 12 }}>
            <div>
              {!items.length && fetching && (
                <>
                  {[1, 2, 3].map(i => (
                    <div className='card mb-3'>
                      <div key={i} className="feed-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="skeleton skeleton-avatar" />
                          <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-line" style={{ width: '40%' }} />
                          </div>
                        </div>
                        <div className="skeleton skeleton-line" style={{ width: '90%', marginTop: 8 }} />
                        <div className="skeleton skeleton-line" style={{ width: '80%' }} />
                      </div>
                    </div>
                  ))}
                </>
              )}
              {items.map(({ post, reactions, comments, media = [], my_reaction, community, author }) => {
                return (
                  <FeedPost
                    post={post}
                    reactions={reactions}
                    comments={comments}
                    media={media}
                    my_reaction={my_reaction}
                    community={community}
                    author={author}
                  ></FeedPost>
                )
              })}
              <div ref={setSentinel} style={{ height: 1 }} />
            </div>
          </div>
        </div>
        <div className="col-right sidebar-sticky !hidden md:!block">
          {new URLSearchParams(window.location.search).get('user') ? (
            <FriendsCommunitiesCard handle={new URLSearchParams(window.location.search).get('user')} />
          ) : (
            <>
              <FriendRequests />
              <div style={{ height: 12 }} />
              <MyCommunitiesCard limit={4} />
              <div style={{ height: 12 }} />
              <FriendsPanel />
              <div style={{ height: 12 }} />
              <RecentChats limit={6} />
            </>
          )}
          {scope === 'circle' && circleId && (
            <div className="card" style={{ marginTop: 12 }}>
              <h4>Circle members</h4>
              <div>
                {circleMembers.map(m => (<div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>@{m.member}</div>))}
                {!circleMembers.length && <div style={{ opacity: 0.7 }}>No members yet</div>}
              </div>
            </div>
          )}
        </div>
      </div>
      {rxnOpen && (
        <ReactionsModal rxnItems={rxnItems} setRxnOpen={setRxnOpen}></ReactionsModal>
      )
      }
    </>
  )
}


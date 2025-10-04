import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { auth, sally, upload } from '../lib/api.js'
import { feedFormatDate } from '../lib/helper.js'
import Comments from './Comments.jsx'
import CommunityProfileCard from './CommunityProfileCard.jsx'
import MediaPreviews from './MediaPreviews.jsx'
import ReactionBreakdown from './ReactionBreakdown.jsx'
import Reactions from './Reactions.jsx'
import UploadToolbar from './UploadToolbar.jsx'
import AvatarSmall from './common/AvatarSmall.jsx'
import ContentBox from './common/ContentBox.jsx'
import MediaGrid from './common/MediaGrid.jsx'
import ReactionsModal from './common/ReactionsModal.jsx';
import { FiSearch } from "react-icons/fi"


export default function CommunityFeed() {
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
  const [rxnItems, setRxnItems] = useState([]);
  const [commentExpandedPost, setCommentExpandedPost] = useState(new Set());

  async function add(u) { if (!communityId) return; try { await sally.addToCommunity(communityId, [u]); setResults(r => r.filter(x => x.username !== u)); load(); } catch (e) { } }

  async function load(reset = true) {
    if (fetching) return
    setFetching(true)
    const nextSkip = reset ? 0 : (skip)
    const j = await sally.feed({ scope: 'community', community_id: communityId, skip: nextSkip, limit: 10 })
    const newItems = j.items || []
    setHasMore(newItems.length === 10)
    if (reset) { setItems(newItems); setSkip(10) } else { setItems(prev => prev.concat(newItems)); setSkip(nextSkip + 10) }
    const mm = await sally.listCommunityMembers(communityId)
    setMembers(mm.members || [])
    setFetching(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const list = await sally.listCommunities()
        const c = (list.communities || []).find(x => String(x.id) === String(communityId))
        if (c) { setCommunity(c); setRole(c.role || 'member') }
      } catch (e) { }
    })()
  }, [communityId])

  useEffect(() => { load() }, [communityId])

  useEffect(() => { (async () => { try { const j = await auth.verify(); setMe(j.data?.sub || '') } catch (e) { } })() }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim()
      if (!q) { setResults([]); return }
      try { const j = await sally.searchMyFriends(q, 0, 15); setResults(j.users || []) } catch (e) { setResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const w = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws')
    w.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.kind === 'post' || m.kind === 'comment') load() } catch (e) { } }
    setWs(w)
    return () => { try { w.close() } catch (e) { } }
  }, [])

  // Infinite scroll
  useEffect(() => {
    if (!sentinel) return
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting && hasMore && !fetching) load(false) }
    }, { rootMargin: '300px' })
    obs.observe(sentinel)
    return () => { try { obs.disconnect() } catch (e) { } }
  }, [sentinel, hasMore, fetching])

  async function post() {
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
    try { ws && ws.readyState === 1 && ws.send(JSON.stringify({ kind: 'post' })) } catch (e) { }
  }

  async function showReactions(postId) {
    try { const j = await sally.listReactions(postId); setRxnItems(j.reactions || []); setRxnOpen(true) } catch (e) { }
  }

  const FeedPost = ({ post, reactions, comments, media = [], my_reaction, author }) => {
    const [updatedComments, setUpdatedComments] = useState(comments);
    const isExpanded = commentExpandedPost.has(post.id);

    return (
      <div className='card mb-3' key={post.id}>
        <div className="feed-item">
          <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavLink to={`/?user=@${(author?.handle || post.author)}`}>
              <AvatarSmall size={38} author={author} username={post.author} />
            </NavLink>
            <div className='flex flex-col w-full'>
              <div className='flex gap-2 justify-between'>
                <div>
                  <NavLink
                    to={`/?user=@${(author?.handle || post.author)}`}
                    className='text-sm font-bold'
                  >
                    {author?.display_name || author?.handle || post.author}
                  </NavLink>
                  <NavLink
                    to={`/?user=@${(author?.handle || post.author)}`}
                    style={{ opacity: 0.8 }}
                  >
                    @{author?.handle || post.author}
                  </NavLink>
                </div>
              </div>
              <span className="meta text-xs">
                {feedFormatDate(post.created_at)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>{post.text}</div>

          {!!media.length && (
            <MediaGrid media={media} />
          )}

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            <span
              className='hover:underline cursor-pointer'
              onClick={(e) => {
                e.preventDefault()
                showReactions(post.id)
              }}
            >
              {reactions} reactions
            </span>
            <ReactionBreakdown postId={post.id} />{" • "}
            <span className='hover:underline cursor-pointer' onClick={() => {
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

  return (
    <>
      <div className="layout-3col">
        <div className="col-left sidebar-sticky">
          <CommunityProfileCard communityId={communityId} initialCommunity={community} initialRole={role} />
        </div>
        <div className="col-main">
          <div className="card">
            <h4 className='mb-2 font-bold'>{community ? community.name : 'Community'} — Feed</h4>
            <ContentBox
              value={text}
              onChange={setText}
              onSubmit={post}
              placeholder="Share something with the community"
              minHeight={100}
            />
            <MediaPreviews files={files} onRemove={(i) => setFiles(f => f.filter((_, idx) => idx !== i))} />
            <div className="composer-actions">
              <UploadToolbar onFiles={(fs) => setFiles(prev => prev.concat(fs))} />
              <button className="primary" onClick={post} disabled={loading}>
                {loading ? <>Posting… <span className="spinner" /></> : 'Post'}
              </button>
            </div>
          </div>
          <div className="" style={{ marginTop: 12 }}>
            <div style={{ marginTop: 8 }}>
              {items.map(({ post, reactions, comments, media = [], my_reaction, author }) => {

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
        <div className="col-right sidebar-sticky">
          <div className="card p-4 bg-white rounded-2xl shadow-md">
            {/* Header */}
            <h4 className="mb-2 font-semibold text-[var(--fg)]">
              Members {community ? `• ${community.name}` : ""}
            </h4>

            {/* Search Section */}
            {(role === "owner" || role === "admin") && (
              <div className="space-y-3 relative">
                {/* Input with icon */}
                <div className="relative w-full">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search my friends to add"
                    className="form-input w-full !pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {/* Search Results */}
                {!!results.length && (
                  <div className="search-results bg-[var(--hover-bg)] rounded-lg border border-[var(--border)] shadow-sm divide-y">
                    {results.map((u) => (
                      <div
                        key={u.username}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg)] transition-colors rounded-lg"
                      >
                        {/* Avatar */}
                        <AvatarSmall
                          author={u}
                          username={u.display_name || u.username}
                        />

                        {/* Name & Handle */}
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--fg)]">
                            {u.display_name || u.username}
                          </span>
                          <span className="text-xs text-gray-500 leading-none">
                            @{u.handle || u.username}
                          </span>
                        </div>

                        <div className="spacer flex-1" />

                        <button
                          className="primary !py-1 !px-3 !rounded-lg"
                          onClick={() => add(u.username)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="mt-4 space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--bg)] transition-colors"
                >
                  <AvatarSmall username={m.member} author={m} />
                  <span className="text-[var(--fg)] font-medium">@{m.member}</span>
                </div>
              ))}

              {!members.length && (
                <div className="text-sm text-gray-500 text-center py-3">
                  No members yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {rxnOpen && (
        <ReactionsModal rxnItems={rxnItems} setRxnOpen={setRxnOpen}></ReactionsModal>
      )}
    </>
  )
}

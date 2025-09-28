import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'
import ContentBox from './common/ContentBox.jsx'
import { NavLink } from 'react-router-dom'
import { feedFormatDate } from '../lib/helper.js'

export default function Communities() {
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

  async function load() { const j = await sally.listCommunities(); setCommunities(j.communities || []) }
  async function loadFeed(reset = true) {
    const nextSkip = reset ? 0 : feedSkip
    const j = await sally.feed({ scope: 'communities', skip: nextSkip, limit: 10 })
    const newItems = j.items || []
    setFeedHasMore(newItems.length === 10)
    if (reset) { setFeedItems(newItems); setFeedSkip(10) } else { setFeedItems(prev => prev.concat(newItems)); setFeedSkip(nextSkip + 10) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { loadFeed(true) }, [])

  async function create() { await sally.createCommunity(name, about); setName(''); setAbout(''); load() }
  async function pick(c) { setSel(c); const j = await sally.listCommunityMembers(c.id); setMembers(j.members || []) }
  async function add(username) { if (!sel) return; await sally.addToCommunity(sel.id, [username]); const j = await sally.listCommunityMembers(sel.id); setMembers(j.members || []); setResults(r => r.filter(u => u.username !== username)) }

  useEffect(() => {
    if (!sel) { setResults([]); return }
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q) { setResults([]); return }
      try { const j = await sally.searchMyFriends(q, 0, 15); setResults(j.users || []) } catch (e) { setResults([]) }
    }, 250)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query, sel])

  // removed multiselect toggle

  return (
    <div className="grid md:grid-flow-col md:grid-cols-2 gap-4">
      <div className="md:col-span-1">
        <div className="card">
          <h4 className='mb-2 font-bold text-sm'>Create community</h4>
          <input className='form-input' placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          {/* <textarea rows={3} placeholder="About" style={{marginTop:8}} value={about} onChange={e=>setAbout(e.target.value)} /> */}
          <div className='mt-2'>
            <ContentBox
              value={about}
              setAbout={setAbout}
              placeholder="About"
              onSubmit={create}
              fontSize={14}
              minHeight={80}
            >
            </ContentBox>
          </div>
          <div style={{ marginTop: 8 }}><button className="primary" onClick={create}>Create</button></div>
        </div>
        <div className="card mt-3 p-4 bg-white rounded-2xl shadow-md">
          <h4 className="mb-3 font-semibold text-gray-900">My Communities</h4>

          <div className="space-y-3">
            {communities.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <NavLink
                  to={`/communities/${c.id}`}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <b className="text-gray-800">{c.name}</b>
                    <span className="text-xs text-gray-500">
                      • {c.member_count || 0} members • role: {c.role || "member"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{c.about}</div>
                </NavLink>

                {c.role !== "owner" && (
                  <button
                    className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                    onClick={async () => {
                      await sally.leaveCommunity(c.id);
                      load();
                    }}
                  >
                    Leave
                  </button>
                )}
              </div>
            ))}

            {!communities.length && (
              <div className="text-sm text-gray-500 text-center py-4">
                No communities yet
              </div>
            )}
          </div>

          <div className="mt-3 text-right">
            <NavLink className="text-sm text-[#1f2937] hover:underline" to="/communities">
              View All
            </NavLink>
          </div>
        </div>
        <div style={{ height: 12 }} />
      </div>
      <div className="md:col-span-1">
        <div className="card">
          <h4 className='mb-2 font-bold'>Community Posts</h4>
          <div className="space-y-4 mt-2">
            {feedItems.map(({ post, media = [], community }) => (
              <div
                key={post.id}
                className="feed-item p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Meta info */}
                <div className="flex items-center flex-wrap text-xs text-gray-500 gap-1">
                  {community?.name && (
                    <>
                      <NavLink
                        to={`/communities/${community.id}`}
                        className="hover:underline"
                      >
                        {community.name}
                      </NavLink>{" "}
                      &gt;
                    </>
                  )}
                  <span className="font-medium">@{post.author}</span>
                  <span>• {feedFormatDate(post.created_at)}</span>
                </div>

                {/* Post content */}
                <div className="mt-2 text-gray-800">{post.text}</div>

                {/* Media */}
                {media.length > 0 && (
                  <div className="mt-2">
                    <MediaInline media={media} />
                  </div>
                )}
              </div>
            ))}

            {/* Load more */}
            {feedHasMore && (
              <div className="flex justify-center mt-4">
                <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors text-sm font-medium" onClick={() => loadFeed(false)}>
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 12 }} />
        <div className="card">
          <h4 className='mb-2 font-bold'>Members {sel ? ('• ' + sel.name) : ''}</h4>
          {sel && (
            <div>
              <input placeholder="Search my friends by name or handle" value={query} onChange={e => setQuery(e.target.value)} />
              {!!results.length && (
                <div className="search-results">
                  {results.map(u => (
                    <div key={u.username} className="search-item">
                      <div className="name">{u.display_name || u.username}</div>
                      <div className="handle">@{u.handle || u.username}</div>
                      <div className="spacer" />
                      <button className="primary" onClick={() => add(u.username)}>Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            {members.map(m => (<div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>@{m.member}</div>))}
          </div>
        </div>
        {sel && sel.role === 'owner' && (
          <OwnershipPanel community={sel} onChanged={load} />
        )}
      </div>
    </div>
  )
}

function MediaInline({ media }) {
  return (
    <div className="media-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
      {media.map((m, idx) => (
        m.mime && m.mime.startsWith('image') ? (
          <img key={m.id || idx} src={m.url} alt="" />
        ) : (
          <a key={m.id || idx} href={m.url} target="_blank" rel="noreferrer">{m.kind || m.mime || 'file'}</a>
        )
      ))}
    </div>
  )
}

function OwnershipPanel({ community, onChanged }) {
  const [members, setMembers] = useState([])
  const [nextOwner, setNextOwner] = useState('')
  useEffect(() => { (async () => { const j = await sally.listCommunityMembers(community.id); setMembers((j.members || []).filter(m => m.member !== community.owner)) })() }, [community.id])
  async function transfer() { if (!nextOwner) return; await sally.transferCommunityOwner(community.id, nextOwner); onChanged && onChanged() }
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h4>Ownership</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={nextOwner} onChange={e => setNextOwner(e.target.value)}>
          <option value="">Select new owner…</option>
          {members.map(m => <option key={m.id} value={m.member}>{m.member}</option>)}
        </select>
        <button className="primary" onClick={transfer}>Transfer</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={async () => { if (confirm('Delete community? This removes all memberships.')) { await sally.deleteCommunity(community.id); onChanged && onChanged() } }}>Delete community</button>
      </div>
    </div>
  )
}

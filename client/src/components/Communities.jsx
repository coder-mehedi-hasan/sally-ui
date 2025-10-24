import { useEffect, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiSearch, FiSend, FiUser, FiUsers, FiXCircle } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { sally } from '../lib/api.js'
import { feedFormatDate } from '../lib/helper.js'
import ContentBox from './common/ContentBox.jsx'



function JoinRequestsPanel({ community, onChanged, primaryColor = 'var(--primary)' }) {
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      if (!community) return
      setLoading(true)
      try {
        const j = await sally.listCommunityJoinRequests(community.id, status)
        setRequests(j.requests || [])
      } catch {
        setRequests([])
      } finally {
        setLoading(false)
      }
    })()
  }, [community, status])

  async function respond(request_id, action) {
    await sally.respondJoinCommunity(request_id, action)
    onChanged && onChanged()
    const j = await sally.listCommunityJoinRequests(community.id, status)
    setRequests(j.requests || [])
  }

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FiClock className="w-4 h-4" /> },
    { key: 'accepted', label: 'Accepted', icon: <FiCheckCircle className="w-4 h-4" /> },
    { key: 'rejected', label: 'Rejected', icon: <FiXCircle className="w-4 h-4" /> },
  ]

  return (
    <div className="card mt-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <h4 className="mb-3 font-semibold text-[var(--fg)] text-sm uppercase tracking-wide flex items-center gap-1">
        Join Requests
      </h4>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(t => {
          const active = status === t.key
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              aria-pressed={active}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                active
                  ? 'text-white shadow-sm'
                  : 'bg-[var(--bg)] border-transparent text-[var(--fg)]/70 hover:bg-[var(--bg-hover)]'
              }`}
              style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {/* Requests */}
      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-gray-500 text-center py-4">Loading…</div>
        )}

        {!loading && requests.length > 0 && requests.map(r => (
          <div
            key={r.id}
            className="flex items-center justify-between border-b border-[var(--border)] py-2"
          >
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500" />
              <span className="font-medium text-[var(--fg)]">@{r.user}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                style={
                  r.status === 'accepted'
                    ? { backgroundColor: '#dcfce7', color: '#166534' }
                    : r.status === 'rejected'
                      ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                      : { backgroundColor: '#fef9c3', color: '#854d0e' }
                }
              >
                {r.status}
              </span>

              {status === 'pending' && (
                <>
                  <button
                    onClick={() => respond(r.id, 'accept')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded-md hover:opacity-90 transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <FiCheckCircle className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, 'reject')}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    <FiXCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {!loading && !requests.length && (
          <div className="text-sm text-gray-500 text-center py-4">No requests</div>
        )}
      </div>
    </div>
  )
}

function SearchCommunityPanel({ primaryColor = 'var(--primary)' }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [joinStatus, setJoinStatus] = useState({})
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!q.trim()) return
    setLoading(true)
    try {
      const j = await sally.searchCommunities(q)
      setResults(j.communities || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  async function requestJoin(id) {
    try {
      await sally.requestJoinCommunity(id)
      setJoinStatus(s => ({ ...s, [id]: 'requested' }))
    } catch {
      setJoinStatus(s => ({ ...s, [id]: 'error' }))
    }
  }

  return (
    <div className="card mt-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <h4 className="mb-2 font-bold text-[var(--fg)] text-sm uppercase tracking-wide flex items-center gap-1">
        <FiSearch className="w-4 h-4 opacity-70" /> Search Communities
      </h4>

      <div className="flex gap-2">
        <input
          className="form-input"
          placeholder="Search by name"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button
          className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-[var(--fg)] hover:opacity-90 transition"
          style={{ backgroundColor: primaryColor }}
          onClick={search}
        >
          <FiSearch className="w-4 h-4" /> Search
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {loading && <div className="text-sm text-gray-500 text-center py-4">Searching…</div>}
        {!loading && results.length > 0 && results.map(c => (
          <div
            key={c.id}
            className="flex items-center justify-between border-b border-[var(--border)] py-2"
          >
            <div className="flex items-center gap-2">
              <FiUsers className="text-gray-500" />
              <span className="font-medium text-[var(--fg)]">{c.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={joinStatus[c.id] === 'requested'}
                onClick={() => requestJoin(c.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--fg)] rounded-md hover:opacity-90 transition disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                <FiSend className="w-4 h-4" />
                {joinStatus[c.id] === 'requested' ? 'Requested' : 'Join'}
              </button>
              {joinStatus[c.id] === 'error' && (
                <span className="text-xs text-red-500">Error</span>
              )}
            </div>
          </div>
        ))}
        {!loading && !results.length && (
          <div className="text-sm text-gray-500 text-center py-4">No results</div>
        )}
      </div>
    </div>
  )
}

function MyJoinRequestsPanel({ primaryColor = 'var(--primary)' }) {
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const j = await sally.listMyCommunityJoinRequests(status)
        setRequests(j.requests || [])
      } catch {
        setRequests([])
      } finally {
        setLoading(false)
      }
    })()
  }, [status])

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FiClock className="w-4 h-4" /> },
    { key: 'accepted', label: 'Accepted', icon: <FiCheckCircle className="w-4 h-4" /> },
    { key: 'rejected', label: 'Rejected', icon: <FiXCircle className="w-4 h-4" /> }
  ]

  return (
    <div className="card mt-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <h4 className="mb-3 font-semibold text-[var(--fg)] text-sm uppercase tracking-wide flex items-center gap-1">
        <FiUsers className="w-4 h-4 opacity-70" /> My Community Join Requests
      </h4>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(t => {
          const active = status === t.key
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                active
                  ? 'text-white shadow-sm'
                  : 'bg-[var(--bg)] border-transparent text-[var(--fg)]/70 hover:bg-[var(--bg-hover)]'
              }`}
              style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {/* Requests */}
      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-gray-500 text-center py-4">Loading…</div>
        )}

        {!loading && requests.length > 0 && requests.map(r => (
          <div
            key={r.id}
            className="flex items-center justify-between border-b border-[var(--border)] py-2"
          >
            <span className="font-medium text-[var(--fg)]">{r.community_name}</span>

            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={
                r.status === 'accepted'
                  ? { backgroundColor: '#dcfce7', color: '#166534' }
                  : r.status === 'rejected'
                    ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                    : { backgroundColor: '#fef9c3', color: '#854d0e' }
              }
            >
              {r.status}
            </span>
          </div>
        ))}

        {!loading && !requests.length && (
          <div className="text-sm text-gray-500 text-center py-4">No requests</div>
        )}
      </div>
    </div>
  )
}


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
          <h4 className="mb-3 font-semibold text-[var(--fg)]">My Communities</h4>

          <div className="space-y-3">
            {communities.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <NavLink
                  to={`/communities/${c.id}`}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <b className="text-[var(--fg)]">{c.name}</b>
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
        <SearchCommunityPanel />
        <MyJoinRequestsPanel />
        <div style={{ height: 12 }} />
        <div className="card">
          <h4 className='mb-2 font-bold'>Community Posts</h4>
          <div className="space-y-4 mt-2">
            {feedItems.map(({ post, media = [], community }) => (
              <div
                key={post.id}
                className="feed-item p-4 bg-[var(--bg)] rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow"
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
                <div className="mt-2 text-[var(--fg)]">{post.text}</div>

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
        {sel && sel.role === 'owner' && (
          <JoinRequestsPanel community={sel} onChanged={load} />
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

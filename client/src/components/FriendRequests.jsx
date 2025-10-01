import { useEffect, useRef, useState } from 'react'
import { FaCheck, FaSearch, FaTimes, FaTimesCircle, FaUserFriends } from "react-icons/fa"
import { FiSearch } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { sally } from '../lib/api.js'
import { toast } from 'react-hot-toast'

export default function FriendRequests({ visiableViewAllBtn = true, disableFriendsModal = false }) {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const tRef = useRef(null)
  const [open, setOpen] = useState(false)

  async function load() {
    const inc = await sally.listFriendRequests('incoming', 0, 50)
    const out = await sally.listFriendRequests('outgoing', 0, 50)
    setIncoming((inc.requests || []).filter(r => (r.status || 'pending') === 'pending'))
    setOutgoing(out.requests || [])
  }
  useEffect(() => { load() }, [])

  async function send(toUser) { if (!toUser) return; await sally.sendFriendRequest(toUser); load() }
  async function accept(id) {
    try {
      await sally.respondFriendRequest(id, 'accept')
      setIncoming(list => list.map(r => r.id === id ? { ...r, status: 'accepted' } : r))
    } catch (e) { }
  }
  async function decline(id) {
    try {
      await sally.respondFriendRequest(id, 'decline')
      setIncoming(list => list.map(r => r.id === id ? { ...r, status: 'declined' } : r))
    } catch (e) { }
  }

  const onClose = () => {
    setOpen(false);
    document.getElementById("filter-bar").style.zIndex = 1;
  }


  // live search by display_name or handle
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q) { setResults([]); return }
      try {
        const j = await sally.searchUsers(q, 0, 10)
        setResults(j.users || [])
      } catch (e) { setResults([]) }
    }, 300)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query])


  const NewFriendRequestCard = ({ u }) => {
    const [requested, setRequested] = useState(false);
    const [loading, setLoading] = useState(false);
    const alreadyRequested =
      requested || (!!outgoing?.find((r) => r.to === u.username)) || (!!incoming?.find((r) => r.from === u.username));

    const handleSendRequest = async () => {
      setLoading(true);
      try {
        await send(u.username);
        setRequested(true);
      } catch (err) {
        // console.log(err?.message)
        console.error("Failed to send request:", err);
        toast.error(err?.message || "Failed to send request");

      } finally {
        setLoading(false);
      }
    };


    return (
      <div className="search-item" style={{ overflowWrap: "anywhere" }} key={u.username}>
        <div className="name">{u.display_name || u.username}</div>
        <div className="handle">@{u.handle || u.username}</div>
        <div className="spacer" />
        <button
          style={{
            overflowWrap: "break-word",
          }}
          className={`primary !px-2 !text-xs flex items-center gap-1 ${alreadyRequested ? "!bg-[#1f2937af] opacity-75" : ""
            }`}
          disabled={alreadyRequested || loading}
          onClick={handleSendRequest}>
          {loading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : alreadyRequested ? (
            "Sent"
          ) : (
            "Send request"
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }} className='text-sm font-bold'>Friend Requests</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {
            visiableViewAllBtn &&
            <NavLink to="/friends" className='underline' style={{ fontSize: 12, opacity: 0.8 }}>View All</NavLink>
          }
          <button
            disabled={disableFriendsModal}
            title="Friends"
            onClick={() => {
              setOpen(true);
              document.getElementById("filter-bar").style.zIndex = 0;
            }}
            style={{ border: '1px solid #ddd', background: 'var(--panel)', color: 'var(--panel-fg)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FaUserFriends size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginTop: 8 }}>
        <div style={{ position: 'relative' }}>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          {/* <FaSearch size={14} style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', opacity: 0.6 }} /> */}
          <input
            className='form-input w-full !pl-9'
            placeholder="Search by display name or handle"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: 28 }}
          />
        </div>
        {!!results.length && (
          <div className="search-results" style={{ marginTop: 8 }}>
            {results.map(u => (
              <NewFriendRequestCard u={u} key={u?.username} />
            ))}
          </div>
        )}
      </div>

      {/* Incoming */}
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">Incoming</h5>
        <div className="space-y-2">
          {(incoming || []).slice(0, 6).map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 border
               rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors
              owa
              "
            >
              {/* User info */}
              <div className="flex items-center gap-3">
                <AvatarSmall url={r.from_profile?.avatar_url} name={r.from_profile?.display_name || r.from} />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {r.from_profile?.display_name || r.from}
                  </span>
                  <span className="text-xs text-gray-500 leading-none">
                    @{r.from_profile?.handle || r.from}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(r.status && r.status !== 'pending') ? (
                <span className="text-xs text-gray-500">{r.status}</span>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="primary flex items-center gap-1 !py-1 !px-3 !rounded-lg owb"
                    onClick={() => accept(r.id)}
                  >
                    <FaCheck size={12} /> Accept
                  </button>
                  <button
                    className="flex items-center gap-1 text-sm text-red-600 border border-red-300 rounded-lg px-2 py-1 hover:bg-red-50 owb"
                    onClick={() => decline(r.id)}
                  >
                    <FaTimesCircle size={12} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}

          {!incoming.length && (
            <p className="text-xs text-gray-500 text-center py-2">
              No incoming requests
            </p>
          )}

          {(incoming || []).length > 6 && (
            <div className="text-xs text-blue-600 mt-2">
              <NavLink to="/friends" className="hover:underline">View all</NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Outgoing */}
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">Outgoing</h5>
        <div className="space-y-2">
          {(outgoing || []).slice(0, 6).map(r => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <AvatarSmall url={r.to_profile?.avatar_url} name={r.to_profile?.display_name || r.to} />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {r.to_profile?.display_name || r.to}
                </span>
                <span className="text-xs text-gray-500 leading-none">
                  @{r.to_profile?.handle || r.to}
                </span>
              </div>
              <div
                className={`ml-auto px-2 py-0.5 text-xs rounded-full font-medium border`}
                style={{
                  background:
                    r.status === "accepted"
                      ? "var(--primary)"
                      : r.status === "declined"
                        ? "#fee2e2"          // light red
                        : r.status === "pending"
                          ? "var(--bubble)"
                          : "var(--bubble)",
                  borderColor:
                    r.status === "accepted"
                      ? "var(--secondary)"
                      : r.status === "declined"
                        ? "#fca5a5"          // red border
                        : "var(--bubble-border)",
                  color:
                    r.status === "accepted"
                      ? "#1a1a1a"          // dark text on primary
                      : r.status === "declined"
                        ? "#991b1b"          // dark red text
                        : "var(--fg)",
                }}
              >
                {r.status}
              </div>
            </div>
          ))}

          {!outgoing.length && (
            <p className="text-xs text-gray-500 text-center py-2">
              No outgoing requests
            </p>
          )}

          {(outgoing || []).length > 6 && (
            <div className="text-xs text-blue-600 mt-2">
              <NavLink to="/friends" className="hover:underline">View all</NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Friends Popup */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md max-h-[80vh] overflow-y-auto p-5 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-semibold text-gray-900">My Friends</h4>
              <button
                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-red-500 transition-colors"
                onClick={onClose}
              >
                <FaTimes className="text-base" /> Close
              </button>
            </div>

            {/* Body */}
            <div className="mt-4">
              <FriendsListPopup />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FriendsListPopup() {
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState([])
  useEffect(() => { (async () => { const j = await sally.listFriendsDetailed(q, 0, 200); setFriends(j.friends || []) })() }, [q])
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <FaSearch size={14} style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', opacity: 0.6 }} />
        <input placeholder="Search friends" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 28 }} />
      </div>
      <div style={{ marginTop: 8 }}>
        {friends.map(f => (
          <NavLink key={f.username} className="list-item" to={`/?user=${encodeURIComponent(f.handle || f.username)}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarSmall url={f.avatar_url} name={f.display_name || f.handle || f.username} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <b>{f.display_name || f.username}</b>
              <span style={{ opacity: 0.7, fontSize: 12 }}>@{f.handle || f.username}</span>
            </div>
          </NavLink>
        ))}
        {!friends.length && <div style={{ opacity: 0.7 }}>No friends yet</div>}
      </div>
    </div>
  )
}

function AvatarSmall({ url, name }) {
  if (url) { return <img src={url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #ddd' }} /> }
  const initial = (name || '?').substring(0, 1).toUpperCase()
  return <div className="avatar owb" style={{ width: 22, height: 22, fontSize: 11 }}>{initial}</div>
}

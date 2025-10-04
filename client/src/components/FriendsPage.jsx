import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'
import { FiSearch } from "react-icons/fi"
import FriendRequests from './FriendRequests.jsx'
import { NavLink } from 'react-router-dom'

export default function FriendsPage() {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState([])

  async function load() {
    const inc = await sally.listFriendRequests('incoming', 0, 200)
    const out = await sally.listFriendRequests('outgoing', 0, 200)
    setIncoming(inc.requests || [])
    setOutgoing(out.requests || [])
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    (async () => {
      const j = await sally.listFriendsDetailed(q, 0, 500);
      setFriends(j.friends || [])
    })()
  }, [q])

  return (
    <div className="grid md:grid-flow-col md:grid-cols-2 gap-4">
      {/* Friend Requests */}
      <div className="md:col-span-1">
        <FriendRequests
          visiableViewAllBtn={false}
          disableFriendsModal={true}
        ></FriendRequests>
      </div>

      {/* All Friends */}
      <div className="md:col-span-1">
        <div className="card p-4 rounded-2xl shadow-md">
          <h4 className="font-bold mb-2">All Friends</h4>

          {/* Search with icon */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search friends"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="form-input w-full !pl-9"
            />
          </div>

          {/* Friends List */}
          <div className="mt-2 max-h-[65vh] overflow-y-auto space-y-2">
            {friends.map(f => (
              <NavLink
                key={f.username}
                to={`/?user=${encodeURIComponent(f.handle || f.username)}`}
                className="flex items-center gap-3 px-3 py-2 border rounded-lg bg-[var(--bg)] hover:bg-[var(--hover-bg)] transition-colors border-[var(--border)]"
              >
                <Avatar url={f.avatar_url} name={f.display_name || f.handle || f.username} />
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--fg)]">{f.display_name || f.username}</span>
                  <span className="text-xs text-gray-500">@{f.handle || f.username}</span>
                </div>
              </NavLink>
            ))}
            {!friends.length && (
              <div className="text-xs text-gray-500 text-center py-2">No friends yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Avatar({ url, name }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-8 h-8 rounded-full border border-[var(--border)] object-cover"
      />
    )
  }
  const initial = (name || '?').substring(0, 1).toUpperCase()
  return (
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--panel)] text-[var(--fg)] text-xs font-medium border border-[var(--border)]">
      {initial}
    </div>
  )
}

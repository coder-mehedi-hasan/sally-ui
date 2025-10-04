import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'
import { FaUsers } from "react-icons/fa"
import { FiSearch } from "react-icons/fi"


export default function Circles() {
  const [circles, setCircles] = useState([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState('friends')
  const [sel, setSel] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [members, setMembers] = useState([])
  const tRef = useRef(null)
  async function load() { const j = await sally.listCircles(); setCircles(j.circles || []) }
  useEffect(() => { load() }, [])

  async function create() { await sally.createCircle(name, kind); setName(''); load() }
  async function add(username) { if (!sel) return; await sally.addToCircle(sel.id, username); pick(sel) }
  async function pick(c) { setSel(c); const j = await sally.listCircleMembers(c.id); setMembers(j.members || []) }

  // live search among my friends by display_name or handle
  useEffect(() => {
    if (!sel) { setResults([]); return }
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const q = query.trim()
      if (!q) { setResults([]); return }
      try {
        const j = await sally.searchMyFriends(q, 0, 10)
        setResults(j.users || [])
      } catch (e) { setResults([]) }
    }, 300)
    return () => { if (tRef.current) clearTimeout(tRef.current) }
  }, [query, sel])

  return (
    <div className='circles'>
      <div className="grid md:grid-flow-col md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <div className="card">
            <h4 className='font-bold mb-2'>Create circle</h4>
            <div className="row">
              <div className="col">
                <input placeholder="Name" className='form-input' value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="col">
                <select value={kind} className='capitalize bg-[var(--bg)] border-[var(--border)]' onChange={e => setKind(e.target.value)}>
                  <option className='capitalize'>friends</option>
                  <option className='capitalize'>neighbours</option>
                  <option className='capitalize'>office</option>
                  <option className='capitalize'>custom</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 8 }}><button className="primary" onClick={create}>Create</button></div>
          </div>
          <div className="card mt-3 p-4 bg-white rounded-2xl shadow-md">
            <h4 className="mb-2 font-semibold text-[var(--fg)]">My Circles</h4>
            <div className="space-y-2">
              {circles.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    if (sel && c.id === sel.id) setSel(null);
                    else pick(c);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-md border transition-all cursor-pointer
          ${sel?.id === c?.id ? "bg-[var(--bg)] border-[var(--border)]" : "bg-[var(--bg)] hover:bg-[var(--hover-bg)] border-[var(--border)]"}
        `}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center size-8 rounded-full bg-[var(--primary)] opacity-80">
                    <FaUsers size={16} />
                  </div>

                  {/* Circle Info */}
                  <div className="flex flex-col">
                    <b className="text-[var(--fg)]">{c.name}</b>
                    <span className="text-sm text-gray-500 leading-0">• {c.kind}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="card p-4 bg-white rounded-2xl shadow-md">
            {/* Header */}
            <h4 className="mb-3 font-semibold text-[var(--fg)]">
              Members {sel ? `• ${sel.name}` : ""}
            </h4>

            {/* Search Section */}
            {sel && (
              <div className="space-y-3 relative">
                {/* Input with icon */}
                <div className="relative w-full">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search by name or handle"
                    className="form-input w-full !pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {/* Search Results */}
                {!!results.length && (
                  <div className="search-results bg-[var(--bg)] rounded-lg border border-[var(--border)] shadow-sm divide-y ">
                    {results.map((u) => (
                      <div
                        key={u.username}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors rounded-lg"
                      >
                        {/* Avatar */}
                        <AvatarSmall url={u.avatar_url} name={u.display_name || u.username} />

                        {/* Name & Handle */}
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--fg)] ">
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
                  className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <AvatarSmall url={m.avatar_url} name={m.member} />
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
    </div>
  )
}

function AvatarSmall({ url, name }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="size-7 rounded-full border border-gray-200 object-cover"
      />
    );
  }
  const initial = (name || "?").substring(0, 1).toUpperCase();
  return (
    <div className="size-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-black font-bold text-xs leading-none opacity-80">
      {initial}
    </div>
  );
}

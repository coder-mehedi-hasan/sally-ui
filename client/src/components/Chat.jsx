// Chat.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { auth, sally, upload } from '../lib/api.js'
import chatWS from '../lib/chat_ws.js'
import MediaPreviews from './MediaPreviews.jsx'
import UploadToolbar from './UploadToolbar.jsx'
import ContentBox from './common/ContentBox.jsx'
import { FaArrowLeft } from "react-icons/fa6";

function dmGroupId(a, b) {
  const A = String(a || '').toLowerCase()
  const B = String(b || '').toLowerCase()
  return A < B ? `dm:${A}~${B}` : `dm:${B}~${A}`
}

export default function Chat() {
  const CHAT_DEBUG =
    (import.meta && import.meta.env && String(import.meta.env.VITE_CHAT_DEBUG || '').toLowerCase() === 'true') || true

  const [withUser, setWithUser] = useState('')
  const [filter, setFilter] = useState('')
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [latest, setLatest] = useState({})
  const [me, setMe] = useState('')
  const [threadOpen, setThreadOpen] = useState(false)

  // refs to avoid stale closures inside ws handlers
  const meRef = useRef('')
  const withUserRef = useRef('')
  const typingTimerRef = useRef(null)
  const typingActiveRef = useRef(false)
  const lastKeyRef = useRef('')
  const scrollRef = useRef(null)
  const seenTimerRef = useRef(null)

  // Load identity and friends (with latest); optionally auto-open from ?user=@handle
  useEffect(() => {
    (async () => {
      try {
        const info = await auth.verify()
        const u = info?.data?.sub || ''
        setMe(u)

        const jf = await sally.chatFriendsWithLatest(200)
        setFriends(jf.friends || [])

        // chatUserLatest is not implemented
        /*const jl = await sally.chatUserLatest()
        const map = {}
        ;(jl.result||[]).forEach(({key, value}) => {
          try {
            const gid = (key.split(':g:')[1]) || ''
            map[gid] = value
          } catch {}
        })
        setLatest(map)*/

        // auto-open friend from query param
        const qp = new URLSearchParams(window.location.search)
        const handle = (qp.get('user') || '').replace(/^@/, '')
        if (handle) {
          const friend = (jf.friends || []).find(f => f.username === handle || f.handle === handle)
          const target = friend ? friend.username : handle
          if (target) { setWithUser(target); await loadFor(target) }
        }
      } catch (e) {
        if (CHAT_DEBUG) console.warn('[chat] init failed', e)
      }
    })()
  }, [])

  // keep refs fresh
  useEffect(() => { meRef.current = me }, [me])
  useEffect(() => { withUserRef.current = withUser }, [withUser])

  // WebSocket: single persistent connection + frame handler
  useEffect(() => {
    chatWS.connect()

    const onFrame = (m) => {
      // console.log('[chat] ws frame', m)
      if (m?.type === 'message') {
        const gid = m?.message?.group_id
        const idk = m?.message?.id

        // append live if it's the currently-open DM
        if (withUserRef.current) {
          const cur = dmGroupId(meRef.current, withUserRef.current)
          if (gid === cur) { setMessages(prev => prev.concat([m.message])) }
        }

        // update "latest" map + lastKey
        if (gid && idk) {
          try { localStorage.setItem('lastKey:' + gid, idk) } catch { }
          lastKeyRef.current = idk
        }
        if (gid) {
          setLatest(prev => ({
            ...prev,
            [gid]: {
              ...(prev[gid] || {}),
              lastKey: idk,
              lastFrom: m.message.from,
              lastText: m.message.text,
              lastTs: m.message.at,
            },
          }))

          // bump unread on the friend if message belongs to a different thread and it's not from me
          const [a, b] = gid.replace(/^dm:/, '').split('~')
          const other = (a === meRef.current ? b : a)
          const isCurrent = withUserRef.current && gid === dmGroupId(meRef.current, withUserRef.current)
          const isMine = m?.message?.from === meRef.current
          if (!isCurrent && !isMine && other) {
            setFriends(prev => prev.map(f => f.username === other ? { ...f, unread: (Number(f.unread) || 0) + 1 } : f))
          }
        }

        // auto-send read receipt if this is the open thread
        if (withUserRef.current && idk) {
          const cur = dmGroupId(meRef.current, withUserRef.current)
          if (gid === cur) { chatWS.sendFrame({ type: 'read', group_id: gid, lastKey: idk }) }
        }
      } else if (m?.type === 'typing') {
        const gid = m?.group_id
        const u = m?.user
        if (gid && u && withUserRef.current) {
          const cur = dmGroupId(meRef.current, withUserRef.current)
          if (gid === cur && u !== meRef.current) setTypingPeer(!!m.is_typing)
        }
      } else if (m?.type === 'read') {
        const gid = m?.group_id
        const u = m?.user
        const lk = m?.lastKey
        if (gid && u && lk && withUserRef.current) {
          const cur = dmGroupId(meRef.current, withUserRef.current)
          if (gid === cur && u !== meRef.current) {
            setLatest(prev => ({ ...prev, [gid]: { ...(prev[gid] || {}), peerReadKey: lk } }))
          }
        }
      }
    }

    chatWS.setHandler(onFrame)
    return () => { chatWS.setHandler(null) }
  }, [])

  // After we know me and friends, subscribe to all DM groups once (idempotent)
  useEffect(() => {
    if (!me || !friends || !friends.length) return
    const groups = friends.map(f => dmGroupId(me, f.username)).filter(Boolean)
    chatWS.subscribeGroups(groups)
  }, [me, friends])

  // Derived: friend list with preview
  const [typingPeer, setTypingPeer] = useState(false)
  const friendRows = useMemo(() => {
    return (friends || []).map(f => {
      const gid = dmGroupId(me, f.username)
      const l = latest[gid] || f.latest || {}
      const unread = (typeof f.unread === 'number') ? f.unread : 0
      return { ...f, group_id: gid, preview: l.lastText || '', when: l.lastTs || '', unread }
    })
  }, [friends, latest, me])

  // Load a conversations history and open it
  async function loadFor(friend) {
    const gid = dmGroupId(me, friend)
    setWithUser(friend)

    // show cached while fetching
    const cacheKey = 'chat:history:' + gid
    let cached = []
    try { cached = JSON.parse(localStorage.getItem(cacheKey) || '[]') } catch { }
    setMessages(cached)

    const savedAfter = localStorage.getItem('lastKey:' + gid) || ''
    const j = await sally.chatFetchAfter(gid, savedAfter, 0, 200)
    const vals = (j.result || [])

    let merged = cached.concat(vals.map(x => x.value))
    const seen = {}
    merged = merged.filter(m => (m && m.id && !seen[m.id]) ? (seen[m.id] = true) : false)
    merged.sort((a, b) => a.id < b.id ? -1 : (a.id > b.id ? 1 : 0))

    if (vals.length) {
      lastKeyRef.current = vals[vals.length - 1].key
      localStorage.setItem('lastKey:' + gid, lastKeyRef.current)
    }
    if (merged.length > 500) merged = merged.slice(-500)
    setMessages(merged)
    try { localStorage.setItem(cacheKey, JSON.stringify(merged)) } catch { }

    // we no longer re-subscribe here; subscribeGroups above already covers it
    // reset unread counter in list
    setFriends(prev => prev.map(f => f.username === friend ? { ...f, unread: 0 } : f))
    setThreadOpen(true);
  }

  async function load() { if (withUser) await loadFor(withUser) }

  async function send() {
    if (!withUser || (!text.trim() && files.length === 0)) return
    const gid = dmGroupId(me, withUser)
    let media = []
    try {
      if (files.length) media = await upload(files)
    } catch (e) { }
    chatWS.sendFrame({ type: 'message', group_id: gid, text, media })
    setText('')
    setFiles([])
  }

  function onType(val) {
    setText(val)
    const gid = withUser ? dmGroupId(me, withUser) : ''
    if (!gid) return
    // Debounced typing: send true once per burst; send false after inactivity
    if (!typingActiveRef.current) {
      typingActiveRef.current = true
      chatWS.sendFrame({ type: 'typing', group_id: gid, is_typing: true })
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      chatWS.sendFrame({ type: 'typing', group_id: gid, is_typing: false })
      typingActiveRef.current = false
    }, 1500)
  }

  // Mark messages as seen when visible (debounced)
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver((entries) => {
      let maxId = ''
      for (const e of entries) {
        if (e.isIntersecting) {
          const id = e.target.getAttribute('data-id') || ''
          if (id > maxId) maxId = id
        }
      }
      if (!maxId) return
      if (seenTimerRef.current) clearTimeout(seenTimerRef.current)
      seenTimerRef.current = setTimeout(() => {
        const gid = dmGroupId(me, withUser || '')
        if (gid) { chatWS.sendFrame({ type: 'read', group_id: gid, lastKey: maxId }) }
      }, 150)
    }, { root, threshold: 0.6 })
    const items = root.querySelectorAll('[data-id]')
    items.forEach(n => obs.observe(n))
    return () => { try { obs.disconnect() } catch { } }
  }, [messages, me, withUser])

  // Auto-scroll to bottom when messages change or chat switches
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    root.scrollTop = root.scrollHeight
  }, [messages, withUser])

  // UI
  const friendList = (friendRows || [])
    .filter(fr => !filter || (fr.username?.toLowerCase().includes(filter.toLowerCase()) || fr.display_name?.toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => (b.when || '') < (a.when || '') ? -1 : 1)

  return (
    <div className="row" style={{ gap: 12 }}>
      {/* Left: Conversations */}
      <div className={`card ${threadOpen ? "hidden" : "flex"} md:flex w-full md:w-[320px] h-[calc(100vh-210px)] md:h-[calc(100vh-87px)]`} style={{ flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, flex: 1 }} className='font-bold mb-2'>Messaging</h3>
        </div>
        <input placeholder="Search" value={filter} onChange={e => setFilter(e.target.value)} style={{ marginBottom: 8 }} className='form-input' />
        <div style={{ overflow: 'auto' }}>
          {friendList.map(fr => (
            <div key={fr.username}
              onClick={() => loadFor(fr.username)}
              style={{ padding: '10px 8px', cursor: 'pointer', borderRadius: 8, background: withUser === fr.username ? 'var(--bg)' : 'var(--hover-bg)', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border)', marginBottom: 6 }}>
              {fr.avatar_url ? (
                <img src={fr.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              ) : (
                <div className="avatar !bg-[var(--bg)]" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {(fr.display_name || fr.handle || fr.username || '?').substring(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fr.display_name || fr.username}</div>
                  {fr.unread > 0 && <span style={{ fontSize: 11, background: '#e33', color: '#fff', borderRadius: 999, padding: '0 6px' }}>{fr.unread}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{fr.handle || fr.username}  {fr.preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Thread */}
      <div className={`card ${threadOpen ? "flex" : "hidden"} md:flex w-full h-[calc(100vh-210px)] md:h-[calc(100vh-87px)]`} style={{ flex: 1, maxWidth: 820, flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg)', paddingBottom: 8, gap: 4 }} className='flex-col md:flex-row md:justify-between'>
          <h3 className='mb-2 font-bold w-full break-all' style={{ margin: 0 }}>{
            threadOpen ? (
              <button className="md:hidden px-1 text-base" onClick={() => setThreadOpen(false)} style={{ alignSelf: 'flex-start' }}><FaArrowLeft /></button>
            ) : null
          } {withUser ? `Chat with @${withUser}` : 'Select a conversation'}</h3>
          {typingPeer ? <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>typing</span> : null}
          {/* <div style={{ flex: 1 }} /> */}
          <div className="row w-full md:w-min" style={{ alignItems: 'center', gap: 8 }}>
            <div className="col" style={{ width: 180 }}>
              <input className='form-input !py-1' placeholder="@friend" value={withUser} onChange={e => setWithUser(e.target.value)} />
            </div>
            <div><button onClick={load}>Open</button></div>
          </div>
        </div>

        <div ref={scrollRef} className='message-box' style={{ marginTop: 8, flex: 1, overflow: 'auto', borderRadius: 8, padding: 12, }}>
          {messages.map(m => {
            const gid = dmGroupId(me, withUser || '')
            const peerReadKey = (latest[gid] || {}).peerReadKey || ''
            const isMine = m.from === me
            const read = isMine && peerReadKey && (m.id <= peerReadKey)
            return (
              <div key={m.id} data-id={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', margin: '8px 0' }}>
                <div style={{ maxWidth: '70%', padding: '8px 10px', borderRadius: 10, background: isMine ? '#c9b28f' : 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 2 }}>{isMine ? 'You' : '@' + m.from}</div>
                  {!!m.text && <p style={{ whiteSpace: 'pre-wrap' }} className={isMine ? `text-[#1a1a1a]` : `text-[var(--fg)]`} >{m.text}</p>}
                  {!!(m.media && m.media.length) && <MsgMedia media={m.media} />}
                  {isMine && (
                    <div style={{ fontSize: 11, color: read ? '#888' : 'var(--gray)', textAlign: 'right', marginTop: 4 }}>
                      {read ? '✅ Seen' : '✓ Delivered'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {!withUser && (
            <div style={{ opacity: 0.7 }}>Pick a conversation from the left list to start messaging.</div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <MediaPreviews files={files} onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
        </div>
        <div className="row flex-col items-start md:flex-row md:items-center w-full" style={{ marginTop: 8, gap: 8 }}>
          <div>
            <UploadToolbar onFiles={(fs) => setFiles(prev => prev.concat(fs || []))} />
          </div>
          <div className="col w-full">
            <div className='flex gap-2 items-end'>
              <ContentBox
                onChange={onType}
                value={text}
                placeholder={"Messsage"}
                onSubmit={send}
                maxHeight={100}
                enterToSubmit={true}
              >
              </ContentBox>
              <div><button className="primary cursor-pointer" onClick={send} disabled={!withUser || (!text.trim() && files.length === 0)}>Send</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MsgMedia({ media }) {
  const imgs = (media || []).filter(m => (m.mime || '').startsWith('image'))
  const others = (media || []).filter(m => !(m.mime || '').startsWith('image'))
  const [openIdx, setOpenIdx] = useState(-1)
  const open = openIdx >= 0 ? (imgs[openIdx]?.url || '') : ''

  useEffect(() => {
    function onKey(e) {
      if (openIdx < 0) return
      if (e.key === 'Escape') setOpenIdx(-1)
      else if (e.key === 'ArrowLeft') setOpenIdx(i => (i - 1 + imgs.length) % imgs.length)
      else if (e.key === 'ArrowRight') setOpenIdx(i => (i + 1) % imgs.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx, imgs.length])

  if (!media || !media.length) return null
  return (
    <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
      {imgs.map((m, i) => (
        <div key={'img' + i} className="zoom-wrap" style={{ width: 96, height: 96, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fafafa', cursor: 'zoom-in' }} onClick={() => setOpenIdx(i)}>
          <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <span className="zoom-icon">🔍</span>
        </div>
      ))}
      {others.map((m, i) => (
        <a key={'file' + i} href={m.url} target="_blank" rel="noreferrer" className="preview-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>{(m.kind || m.mime || 'file')}</span> ↗
        </a>
      ))}

      {open && (
        <div className="lightbox-backdrop" onClick={() => setOpenIdx(-1)}>
          <button className="lightbox-close" onClick={() => setOpenIdx(-1)}>Close ✕</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={open} alt="" />
            {imgs.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); setOpenIdx((i) => (i - 1 + imgs.length) % imgs.length) }}>◀ Prev</button>
                <button onClick={(e) => { e.stopPropagation(); setOpenIdx((i) => (i + 1) % imgs.length) }}>Next ▶</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

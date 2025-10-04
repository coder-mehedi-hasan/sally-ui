import { useEffect, useRef, useState } from 'react'
import { sally } from '../lib/api.js'
import { feedFormatDate } from '../lib/helper.js';
import ContentBox from './common/ContentBox.jsx';
import { NavLink } from 'react-router-dom';

export default function Comments({ postId, notify, me, count = 0 }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true) // track loading state
  const [text, setText] = useState('');
  const listRef = useRef(null);

  async function load(l = false) {
    setLoading(l)
    try {
      const j = await sally.listComments(postId, 0, 50)
      setComments(j.comments || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, [postId])

  async function add() {
    if (!text) return
    await sally.comment(postId, text)
    setText('')
    load()
    try { notify && notify() } catch (e) { }
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [comments]);

  return (
    <div>
      <div
        ref={listRef}
        className='comments-list'>
        {loading ? (
          <>
            {(count == 0 ? [] : [1, 2, 3])?.map(i => (
              <div key={i} className={i % 2 == 0 ? "comment-row me" : "comment-row"}>
                <div className="comment-bubble w-full">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="skeleton skeleton-avatar" style={{ width: 18, height: 18 }} />
                    <div className="skeleton skeleton-line" style={{ width: '30%', height: 10 }} />
                    <div className="skeleton skeleton-line" style={{ width: '20%', height: 10 }} />
                    <div className="skeleton skeleton-line" style={{ width: '15%', height: 10 }} />
                  </div>
                  <div className="skeleton skeleton-line" style={{ width: '80%', marginTop: 6 }} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {(comments || []).map(c => {
              const mine = me && (String(c.user).toLowerCase() === String(me).toLowerCase())
              return (
                <div key={c.id} className={mine ? 'comment-row me' : 'comment-row'}>
                  <div className={mine ? 'comment-bubble me' : 'comment-bubble'}>
                    <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <NavLink to={`/?user=@${(c.user_profile?.handle || c.user)}`}><AvatarX profile={c.user_profile} username={c.user} /></NavLink>
                      <NavLink to={`/?user=@${(c.user_profile?.handle || c.user)}`} style={{ fontWeight: 600 }}>{c.user_profile?.display_name || c.user}</NavLink>
                      <NavLink to={`/?user=@${(c.user_profile?.handle || c.user)}`} style={{ opacity: 0.8 }}>@{c.user_profile?.handle || c.user}</NavLink>
                      <span>• {feedFormatDate(c?.created_at)}</span>
                    </div>
                    <p className="text text-sm !text-[var(--fg)]">{c.text}</p>
                  </div>
                </div>
              )
            })}
            {!comments.length && !loading && <p style={{ opacity: 0.6 }} className='text-sm'>Be the first to comment</p>}
          </>
        )}
      </div>
      <div className="border border-[var(--border)] rounded-xl p-1" style={{ marginTop: 6, boxShadow: "0 1px 2px rgba(0, 0, 0, .2)" }}>
        <ContentBox
          value={text}
          onChange={setText}
          placeholder="Add a comment"
          onSubmit={add}
          border='0px'
          fontSize={14}
          minHeight={20}
          maxHeight={160}
        />
        <div className='mx-[14px] my-3 flex justify-end'>
          <button className="primary !py-1 !px-[10px] !rounded-[10px]" onClick={add}>Comment</button>
        </div>
      </div>
    </div>
  )
}

function AvatarX({ profile, username }) {
  const url = profile && profile.avatar_url ? profile.avatar_url : ''
  if (url) {
    return <img src={url} alt="" style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #ddd' }} />
  }
  const initial = (profile?.display_name || profile?.handle || username || '?').substring(0, 1).toUpperCase()
  return <div className="avatar" style={{ width: 18, height: 18, fontSize: 10 }}>{initial}</div>
}

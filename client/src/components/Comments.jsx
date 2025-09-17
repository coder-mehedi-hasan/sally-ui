import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

export default function Comments({ postId, notify, me }){
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  async function load(){ const j = await sally.listComments(postId, 0, 50); setComments(j.comments||[]) }
  useEffect(()=>{ load() }, [postId])

  async function add(){ if (!text) return; await sally.comment(postId, text); setText(''); load(); try { notify && notify() } catch(e){} }

  return (
    <div>
      <div>
        {(comments||[]).map(c => {
          const mine = me && (String(c.user).toLowerCase() === String(me).toLowerCase())
          return (
            <div key={c.id} className={mine? 'comment-row me' : 'comment-row'}>
              <div className={mine? 'comment-bubble me' : 'comment-bubble'}>
                <div className="meta" style={{display:'flex', alignItems:'center', gap:6}}>
                  <a href={`/?user=@${(c.user_profile?.handle || c.user)}`}><AvatarX profile={c.user_profile} username={c.user} /></a>
                  <a href={`/?user=@${(c.user_profile?.handle || c.user)}`} style={{fontWeight:600}}>{c.user_profile?.display_name || c.user}</a>
                  <a href={`/?user=@${(c.user_profile?.handle || c.user)}`} style={{opacity:0.8}}>@{c.user_profile?.handle || c.user}</a>
                  <span>• {new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text">{c.text}</div>
              </div>
            </div>
          )
        })}
        {!comments.length && <div style={{opacity:0.7}}>Be the first to comment</div>}
      </div>
      <div className="row" style={{marginTop:6}}>
        <div className="col"><input placeholder="Add a comment" value={text} onChange={e=>setText(e.target.value)} /></div>
        <div><button className="primary" onClick={add}>Comment</button></div>
      </div>
    </div>
  )
}

function AvatarX({ profile, username }){
  const url = profile && profile.avatar_url ? profile.avatar_url : ''
  if (url){ return <img src={url} alt="" style={{width:18, height:18, borderRadius:'50%', border:'1px solid #ddd'}} /> }
  const initial = (profile?.display_name || profile?.handle || username || '?').substring(0,1).toUpperCase()
  return <div className="avatar" style={{width:18, height:18, fontSize:10}}>{initial}</div>
}

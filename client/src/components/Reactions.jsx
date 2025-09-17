import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

const EMOJIS = [
  { key: 'like', label: '👍' },
  { key: 'love', label: '❤️' },
  { key: 'smile', label: '😄' },
  { key: 'party', label: '🎉' },
]

export default function Reactions({ postId, onReact, my }){
  const [busy, setBusy] = useState(false)
  const [counts, setCounts] = useState({})
  async function loadCounts(){
    try {
      const j = await sally.reactionSummary(postId)
      const c = j && j.counts ? j.counts : {}
      if (c && Object.keys(c).length){ setCounts(c); return }
      const lr = await sally.listReactions(postId)
      const cc = {}
      for (const r of (lr.reactions||[])) cc[r.type] = (cc[r.type]||0)+1
      setCounts(cc)
    } catch(e){
      try {
        const lr = await sally.listReactions(postId)
        const cc = {}
        for (const r of (lr.reactions||[])) cc[r.type] = (cc[r.type]||0)+1
        setCounts(cc)
      } catch(_){}
    }
  }
  useEffect(()=>{ loadCounts() }, [postId])
  async function react(type){
    if (busy) return; setBusy(true)
    try {
      await sally.react(postId, type);
      await loadCounts()
      onReact && onReact()
    } finally { setBusy(false) }
  }
  return (
    <div style={{display:'flex', gap:8, marginTop:6}}>
      {EMOJIS.map(e => {
        const selected = my === e.key
        return (
          <button key={e.key} disabled={busy} onClick={()=>react(e.key)} className={selected? 'reaction selected':'reaction'} title={e.key}>
            <span style={{display:'inline-flex', alignItems:'center'}}>
              {e.label}
              {!!counts[e.key] && (<span className="rxn-count">+{counts[e.key]}</span>)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

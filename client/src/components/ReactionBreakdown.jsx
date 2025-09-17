import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'

const EMOJIS = [
  { key: 'like', label: '👍' },
  { key: 'love', label: '❤️' },
  { key: 'smile', label: '😄' },
  { key: 'party', label: '🎉' },
]

export default function ReactionBreakdown({ postId }){
  const [counts, setCounts] = useState({})
  useEffect(()=>{ (async()=>{
    try {
      const j = await sally.reactionSummary(postId)
      const c = j && j.counts ? j.counts : {}
      if (c && Object.keys(c).length){ setCounts(c); return }
    } catch(e){}
    try {
      const lr = await sally.listReactions(postId)
      const cc = {}
      for (const r of (lr.reactions||[])) cc[r.type] = (cc[r.type]||0)+1
      setCounts(cc)
    } catch(_){}
  })() }, [postId])
  const parts = EMOJIS.filter(e => counts[e.key] > 0)
  if (!parts.length) return null
  return (
    <span style={{marginLeft:6}}>
      {parts.map((e, i) => (
        <span key={e.key} style={{marginLeft: i?6:0}}>{e.label}{counts[e.key]}</span>
      ))}
    </span>
  )
}


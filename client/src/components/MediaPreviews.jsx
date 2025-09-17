import { useEffect, useState } from 'react'

export default function MediaPreviews({ files=[], onRemove }){
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const ps = files.map(f => ({
      name: f.name,
      type: f.type || '',
      url: f.type?.startsWith('image') ? URL.createObjectURL(f) : '',
      size: f.size
    }))
    setPreviews(ps)
    return () => { ps.forEach(p => { if (p.url) URL.revokeObjectURL(p.url) }) }
  }, [files])

  if (!files.length) return null
  return (
    <div className="previews">
      {previews.map((p, i) => (
        p.url ? (
          <div key={i} className="preview-thumb">
            <img src={p.url} alt={p.name} />
            <button className="preview-remove" onClick={()=>onRemove && onRemove(i)}>✕</button>
          </div>
        ) : (
          <div key={i} className="preview-chip">
            <span className="kind">{iconFor(p.type)}</span>
            <span className="name" title={p.name}>{p.name}</span>
            <button className="preview-remove" onClick={()=>onRemove && onRemove(i)}>✕</button>
          </div>
        )
      ))}
    </div>
  )
}

function iconFor(type){
  if (!type) return '📎'
  if (type.startsWith('audio')) return '🎵'
  if (type.startsWith('video')) return '🎞️'
  if (type === 'application/pdf' || type.startsWith('text')) return '📄'
  return '📎'
}


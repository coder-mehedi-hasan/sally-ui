import { useEffect, useState } from 'react'
import { sally } from '../lib/api.js'
import { NavLink } from 'react-router-dom'

export default function MyCommunitiesCard({ limit = 4 }) {
  const [items, setItems] = useState([])
  useEffect(() => { (async () => { try { const j = await sally.listCommunities(); setItems(j.communities || []) } catch (e) { } })() }, [])
  return (
    <div className="card">
      <h4 className='mb-2 text-sm font-bold'>Communities</h4>
      <div>
        {items.slice(0, limit).map(c => (
          <NavLink key={c.id} className="list-item" to={`/communities/${c.id}`}>
            <div className="tag">{c.role || 'member'}</div>
            <div style={{ fontWeight: 600 }}>{c.name}</div>
          </NavLink>
        ))}
        {!items.length && <p style={{ opacity: 0.6 }} className='text-xs'>No communities yet</p>}
      </div>
      <div style={{ marginTop: 8, textAlign: "end" }} className='mb-2 pt-[6px]'><NavLink to="/communities" className='mt-2 btn-primary text-sm text-black'>View All</NavLink></div>
    </div>
  )
}

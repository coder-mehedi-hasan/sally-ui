import { useEffect, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { sally } from '../lib/api.js'
import { NavLink } from 'react-router-dom'

export default function MyCircles({ onPick, limit = 4 }) {
  const [circles, setCircles] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const j = await sally.listCircles()
        setCircles(j.circles || [])
      } catch (e) { }
    })()
  }, [])

  return (
    <div className="card" style={{ padding: '16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
      <h4 style={{ marginBottom: '12px', fontWeight: 700, }}>My Circles</h4>
      <div>
        {circles.slice(0, limit).map((c) => (
          <div
            key={c.id}
            className="list-item !gap-[4px]"
            onClick={() => onPick && onPick(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <p style={{ fontWeight: 600, color: '#222', fontSize: "13px" }} className='capitalize '>{c.name}</p>
            <div
              className="tag"
              style={{
                fontSize: '0.75rem',
                background: '#eef2ff',
                padding: '4px 6px',
                borderRadius: '4px',
                // marginRight: '8px',
                lineHeight: "50%"
              }}
            >
              {c.kind}
            </div>
          </div>
        ))}
        {!circles.length && <div style={{ opacity: 0.6, padding: '8px 0' }}>No circles yet</div>}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <NavLink
          to="/circles"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#000',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#162036')}
          className='text-xs font-bold'
        >
          View All <FiArrowRight size={16} />
        </NavLink>
      </div>
    </div>
  )
}

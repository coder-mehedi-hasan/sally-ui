import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { sally } from '../lib/api.js'

export default function RecentChats({ limit = 8 }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    (async () => {
      try {
        const j = await sally.chatFriendsWithLatest(limit)
        setRows(j.friends || [])
      } catch { }
    })()
  }, [limit])
  return (
    <div className="card">
      <h4 className='mb-2 text-sm font-bold'>Recent chats</h4>
      <div>
        {(rows || []).slice(0, limit).map(r => (
          <NavLink key={r.username} to={`/chat?user=@${r.username}`} style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>@{r.username} {r.display_name ? `(${r.display_name})` : ''}</div>
              {r.unread > 0 && (
                <span style={{ fontSize: 11, background: '#e33', color: '#fff', borderRadius: 999, padding: '0 6px' }}>{r.unread}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{r.latest?.lastText || ''}</div>
          </NavLink>
        ))}
        {(!rows || !rows.length) && <div style={{ opacity: 0.6 }} className='text-xs'>No recent chats</div>}
      </div>
    </div>
  )
}

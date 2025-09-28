

function AvatarSmall({ author, username, size = 24 }) {
    const url = author && author.avatar_url ? author.avatar_url : ''
    if (url) {
        return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', border: '1px solid #ddd' }} />
    }
    // fallback initials
    const initial = (author?.display_name || author?.handle || username || '?').substring(0, 1).toUpperCase()
    return <div className="avatar" style={{ width: size, height: size, fontSize: 12 }}>{initial}</div>
}

export default AvatarSmall
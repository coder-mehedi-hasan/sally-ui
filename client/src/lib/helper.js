export function feedFormatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffMinutes < 10) {
        return `${diffMinutes < 1 ? 'few seconds' : `${diffMinutes} minutes`} ago`
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`
    } else if (diffHours < 24) {
        return diffHours === 1 ? '1h ago' : `${diffHours}h ago`
    } else {
        const options = { day: 'numeric', month: 'long' }
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return `${date.toLocaleDateString(undefined, options)} at ${time}`
    }
}
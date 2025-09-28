import { useEffect, useState } from 'react'


function MediaGrid({ media }) {
    const images = media.filter(m => m.mime && m.mime.startsWith('image'))
    const [openIdx, setOpenIdx] = useState(-1)
    const open = openIdx >= 0 ? images[openIdx]?.url : null
    // keyboard navigation
    useEffect(() => {
        function onKey(e) {
            if (openIdx < 0) return
            if (e.key === 'Escape') { setOpenIdx(-1) }
            else if (e.key === 'ArrowLeft') { setOpenIdx(i => (i - 1 + images.length) % images.length) }
            else if (e.key === 'ArrowRight') { setOpenIdx(i => (i + 1) % images.length) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [openIdx, images.length])
    return (
        <>
            {images.length === 1 ? (
                <div className="media-single">
                    <img src={images[0].url} alt="" onClick={() => setOpenIdx(0)} style={{ cursor: 'zoom-in' }} />
                </div>
            ) : (
                <div className="media-grid">
                    {media.map((m) => (
                        m.mime && m.mime.startsWith('image') ? (
                            <img key={m.id} src={m.url} alt="" onClick={() => setOpenIdx(images.findIndex(im => im.url === m.url))} style={{ cursor: 'zoom-in' }} />
                        ) : (
                            <a key={m.id} href={m.url} target="_blank" rel="noreferrer">{m.kind || m.mime || 'file'}</a>
                        )
                    ))}
                </div>
            )}
            {open && (
                <div className="lightbox-backdrop" onClick={() => setOpenIdx(-1)}>
                    <button className="lightbox-close" onClick={() => setOpenIdx(-1)}>Close ✕</button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={open} alt="" />
                        {images.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <button onClick={() => setOpenIdx((i) => (i - 1 + images.length) % images.length)}>◀ Prev</button>
                                <button onClick={() => setOpenIdx((i) => (i + 1) % images.length)}>Next ▶</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}


export default MediaGrid;
import { useRef } from 'react'
import { FiImage, FiFilm, FiFileText, FiPaperclip } from 'react-icons/fi'
import styles from './css/UploadToolbar.module.css'


export default function UploadToolbar({ onFiles }) {
  const imgRef = useRef(null)
  const mediaRef = useRef(null)
  const docRef = useRef(null)
  const anyRef = useRef(null)

  function pick(ref) { if (ref && ref.current) ref.current.click() }
  function got(e) { const files = Array.from(e.target.files || []); if (files.length && onFiles) onFiles(files) }

  return (
    <div className={styles.uploadToolbar} role="toolbar" aria-label="Add attachments">
      <button type="button" title="Add image" onClick={() => pick(imgRef)}><FiImage /></button>
      <button type="button" title="Add media" onClick={() => pick(mediaRef)}><FiFilm /></button>
      <button type="button" title="Add document" onClick={() => pick(docRef)}><FiFileText /></button>
      <button type="button" title="Add attachment" onClick={() => pick(anyRef)}><FiPaperclip /></button>
      <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={got} />
      <input ref={mediaRef} type="file" accept="video/*,audio/*" multiple style={{ display: 'none' }} onChange={got} />
      <input ref={docRef} type="file" accept="application/pdf,text/plain" multiple style={{ display: 'none' }} onChange={got} />
      <input ref={anyRef} type="file" multiple style={{ display: 'none' }} onChange={got} />
    </div>
  )
}

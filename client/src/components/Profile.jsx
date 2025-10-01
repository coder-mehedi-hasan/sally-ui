import { useEffect, useState } from 'react'
import { sally, upload } from '../lib/api.js'
import { toast } from 'react-hot-toast'

export default function Profile() {
  const [profile, setProfile] = useState({ display_name: '', handle: '', bio: '', avatar_url: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const j = await sally.getProfile({})
      setProfile(j.profile || {})
    })()
  }, [])

  async function save() {
    setError('')
    setSaving(true)

    try {
      let avatar_url = profile.avatar_url
      if (file) {
        const isValid = validateFile(file)
        if (!isValid) {
          setSaving(false)
          return
        }
        const up = await upload([file])
        if (up && up[0]) avatar_url = up[0].url
      }

      await sally.upsertProfile({
        display_name: profile.display_name,
        handle: profile.handle,
        bio: profile.bio,
        avatar_url
      })

      toast.success('Profile saved!', { position: 'top-center' })

      const j = await sally.getProfile({})
      setProfile(j.profile || {})
      setFile(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function validateFile(selectedFile) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    const maxSizeMB = 5

    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPG, PNG, WEBP).')
      setFile(null)
      return false
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size should be less than ${maxSizeMB}MB.`)
      setFile(null)
      return false
    }

    return true
  }

  function handleFileChange(e) {
    const selectedFile = (e.target.files || [])[0] || null
    if (selectedFile) {
      const isValid = validateFile(selectedFile)
      if (isValid) {
        setFile(selectedFile)
        setError('')
      }
    } else {
      setFile(null)
      setError('')
    }
  }

  return (
    <div className="card mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-md">
      <h4 className="mb-2 font-bold">My profile</h4>

      <div className="row mb-3">
        <div className="col w-full">
          <input
            placeholder="Display name"
            value={profile.display_name || ''}
            onChange={e => setProfile({ ...profile, display_name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm form-input"
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col w-full">
          <input
            className="form-input w-full rounded-lg border border-gray-300 px-3 py-2 text-sm form-input"
            placeholder="@handle"
            value={profile.handle || ''}
            onChange={e => setProfile({ ...profile, handle: e.target.value })}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col w-full">
          <textarea
            className="form-input w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm form-input"
            rows={4}
            placeholder="Bio"
            value={profile.bio || ''}
            onChange={e => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>
      </div>

      <div className="row mb-4 flex items-center gap-4">
        <div className="col">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div>
          <img
            src={file ? URL.createObjectURL(file) : profile.avatar_url || '/logo/sally.jpg'}
            alt="avatar"
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-300"
          />
        </div>
      </div>

      <div>
        <button
          className="primary w-full flex justify-center items-center gap-2"
          onClick={save}
          disabled={saving}
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

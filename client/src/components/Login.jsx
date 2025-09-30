import { useState } from 'react'
import { FaEye, FaEyeSlash, FaGoogle, FaLock, FaUser } from "react-icons/fa"
import { auth, oauthGoogle } from '../lib/api.js'
import { googleOAuthSignIn } from '../lib/googleOAuth.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [devEmail, setDevEmail] = useState('')
  const [err, setErr] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function doSignup() {
    try {
      setErr('')
      await auth.signup(username, password)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  async function doLogin() {
    try {
      setErr('')
      await auth.login(username, password)
      const v = await auth.verify()
      onLogin && onLogin(v?.data?.sub || username)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  function isValidEmail(s) {
    return /.+@.+\..+/.test(String(s || '').trim())
  }

  async function doGoogle() {
    try {
      setErr('')
      const email = (devEmail || '').trim()
      if (!isValidEmail(email)) {
        setErr('Please enter a valid email for Google (dev)')
        return
      }
      const displayName = email.split('@')[0]
      const j = await oauthGoogle(undefined, email, displayName)
      if (j.token) {
        const v = await auth.verify()
        onLogin && onLogin(v?.data?.sub || 'google')
      }
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  return (
    <div className="card p-6 bg-white rounded-2xl shadow-md max-w-md mx-auto mt-12">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Sally</h3>

      {/* Username + Password */}
      <div className="space-y-3">
        {/* Username */}
        <div className="relative">
          <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="form-input w-full !pl-9"
          />
        </div>

        {/* Password with toggle */}
        <div className="relative">
          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="form-input w-full !pl-9 !pr-9"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(p => !p)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button className="primary flex-1" onClick={doSignup}>Sign up</button>
        <button className="primary flex-1" onClick={doLogin}>Log in</button>
      </div>

      {/* Google Dev Login */}
      <div className="mt-6">
        {/* <div className="relative">
          <FaGoogle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Email for Google (dev)"
            value={devEmail}
            onChange={e => setDevEmail(e.target.value)}
            className="form-input w-full !pl-9"
          />
        </div> */}
        <button
          onClick={googleOAuthSignIn}
          // disabled={!isValidEmail(devEmail)}
          className="mt-3 w-full flex items-center justify-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FaGoogle className="text-red-500" />
          Login with Google (dev)
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-4 text-sm text-red-600 font-medium">{err}</div>
      )}
    </div>
  )
}

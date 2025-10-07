import { useState } from 'react'
import { FaEye, FaEyeSlash, FaGoogle, FaLock, FaUser } from "react-icons/fa"
import { auth, oauthGoogle } from '../lib/api.js'
import { googleOAuthSignIn } from '../lib/googleOAuth.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function doSignup() {
    try {
      setErr('')
      setLoading(true)
      await auth.signup(username, password)
      const v = await auth.verify()
      onLogin && onLogin(v?.data?.sub || username)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  async function doLogin() {
    try {
      setErr('')
      setLoading(true)
      await auth.login(username, password)
      const v = await auth.verify()
      onLogin && onLogin(v?.data?.sub || username)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="card p-6 rounded-2xl shadow-md max-w-md mx-auto mt-12 relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="spinner border-t-transparent border-white border-4 rounded-full !w-10 !h-10 animate-spin" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-[var(--pg)] mb-4">Welcome to Sally</h3>

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
            disabled={loading}
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
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(p => !p)}
            disabled={loading}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          className="primary flex-1 disabled:cursor-not-allowed"
          onClick={doSignup}
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
        <button
          className="primary flex-1 disabled:cursor-not-allowed"
          onClick={doLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </div>

      {/* Google Dev Login */}
      <div className="mt-6">
        <button
          onClick={googleOAuthSignIn}
          disabled={loading}
          className="mt-3 w-full flex items-center justify-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaGoogle className="text-red-500" />
          {loading ? 'Please wait...' : 'Login with Google'}
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-4 text-sm text-red-600 font-medium">{err}</div>
      )}
    </div>
  )
}

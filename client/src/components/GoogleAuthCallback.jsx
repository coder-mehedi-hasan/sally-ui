import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, oauthGoogle } from '../lib/api'

export default function GoogleAuthCallback({ onLogin }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')

        const handleAuth = async () => {
            try {
                if (!accessToken) {
                    navigate('/login')
                    return
                }

                // Get Google user info
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                })
                const userInfo = await res.json()

                // App-specific OAuth login
                const oauthLogin = await oauthGoogle(undefined, userInfo?.email, userInfo?.name)
                if (oauthLogin?.token) {
                    const verified = await auth.verify()
                    await onLogin?.(verified?.data?.sub || 'google')
                    navigate('/profile')
                } else {
                    navigate('/login')
                }
            } catch (err) {
                console.error('Google OAuth failed:', err)
                navigate('/login')
            } finally {
                setLoading(false)
            }
        }

        handleAuth()
    }, [navigate, onLogin])

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
            {loading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm">Signing you in with Google...</p>
                </div>
            ) : (
                <p className="text-gray-600 text-sm">Redirecting...</p>
            )}
        </div>
    )
}

import { useState } from 'react'
import { auth, oauthGoogle } from '../lib/api.js'

export default function Login({ onLogin }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [devEmail, setDevEmail] = useState('')
  const [err, setErr] = useState('')

  async function doSignup(){ try { setErr(''); await auth.signup(username, password) } catch(e){ setErr(String(e.message||e)) } }
  async function doLogin(){
    try {
      setErr('');
      await auth.login(username, password);
      const v = await auth.verify();
      onLogin && onLogin(v?.data?.sub || username);
    } catch(e){ setErr(String(e.message||e)) }
  }

  function isValidEmail(s){ return /.+@.+\..+/.test(String(s||'').trim()) }
  async function doGoogle(){
    try {
      setErr('')
      const email = (devEmail||'').trim()
      if (!isValidEmail(email)) { setErr('Please enter a valid email for Google (dev)'); return }
      const displayName = email.split('@')[0]
      const j = await oauthGoogle(undefined, email, displayName)
      if (j.token){ const v = await auth.verify(); onLogin && onLogin(v?.data?.sub || 'google') }
    } catch(e){ setErr(String(e.message||e)) }
  }

  return (
    <div className="card" style={{maxWidth:480, margin:'40px auto'}}>
      <h3>Welcome to Sally</h3>
      <div className="row">
        <div className="col"><input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div className="col"><input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      </div>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button className="primary" onClick={doSignup}>Sign up</button>
        <button className="primary" onClick={doLogin}>Log in</button>
      </div>
      <div style={{marginTop:8}}>
        <input placeholder="email for Google (dev), e.g., alice@sally.dev" value={devEmail} onChange={e=>setDevEmail(e.target.value)} />
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button onClick={doGoogle} disabled={!isValidEmail(devEmail)}>Login with Google (dev)</button>
        </div>
      </div>
      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
    </div>
  )
}

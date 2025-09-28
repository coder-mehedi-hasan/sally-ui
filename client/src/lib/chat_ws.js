// Shared Chat WebSocket manager: single connection, auto-reconnect, queueing, debug logs
import { getToken } from './api.js'

const CHAT_DEBUG =
  (import.meta && import.meta.env && String(import.meta.env.VITE_CHAT_DEBUG || '').toLowerCase() === 'true')

const HEARTBEAT_MS = Number(import.meta?.env?.VITE_CHAT_HEARTBEAT_MS || 0) // default OFF

let ws = null
let reconnectTimer = null
let heartbeatTimer = null
let flushTimer = null
let tries = 0
let pending = []
const subscribers = new Set()
let onMessage = null
let handshakeSent = false

function wsBase(){
  return (import.meta && import.meta.env && import.meta.env.VITE_CHAT_WS)
    ? import.meta.env.VITE_CHAT_WS
    : ((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + ':18080')
}

function flushPending(){
  try {
    if (!ws || ws.readyState !== 1) return
    if (!pending.length) return
    const items = pending.splice(0)
    for (const data of items){
      try { ws.send(data) } catch(e){ if (CHAT_DEBUG) console.warn('[chat-ws] flush send failed', e) }
    }
  } catch {}
}

function connect(){
  console.log('connecting ... ');
  if (ws && (ws.readyState === 0 || ws.readyState === 1 || ws.readyState === 2)) return ws

  const token = getToken()
  if (!token){ if (CHAT_DEBUG) console.warn('[chat-ws] no token; skip connect'); return null }

  const url = wsBase() + '/chat/ws?token=' + encodeURIComponent(token)
  if (CHAT_DEBUG) console.log('[chat-ws] opening', { url })
  ws = new WebSocket(url)

  // any new connection resets handshake
  handshakeSent = false

  ws.onopen = () => {
    if (CHAT_DEBUG) console.log('[chat-ws] open')
    tries = 0
    
    // start/stop heartbeat depending on env flag
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    if (HEARTBEAT_MS > 0) {
      heartbeatTimer = setInterval(() => {
        try {
          if (ws && ws.readyState === 1) {
            // Only send if your server EXPECTS this kind of app-level ping
            ws.send(JSON.stringify({ type: 'ping', at: Date.now() }))
          }
        } catch {}
      }, HEARTBEAT_MS)
    }
    
    hello();
    // flush queued frames after hello is sent
    flushPending()

    // Do not send any app frames inside onopen; pending will flush via the flusher
    
    ws.onmessage = (ev) => {
		let m
		try { m = JSON.parse(ev.data) } 
		catch(e){ if (CHAT_DEBUG) console.warn('[chat-ws] parse error', e); return }
			
		if (CHAT_DEBUG) console.log('[chat-ws] frame', m)
		try { onMessage && onMessage(m) } catch(e){ if (CHAT_DEBUG) console.warn('[chat-ws] onMessage handler error', e) }
	}
		
	ws.onerror = (e) => { if (CHAT_DEBUG) console.error('[chat-ws] error', e) }
	
	ws.onclose = (ev) => {
		if (CHAT_DEBUG) console.warn('[chat-ws] close', { code: ev?.code, reason: ev?.reason, wasClean: ev?.wasClean })
		if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
		if (flushTimer) { clearInterval(flushTimer); flushTimer = null }
		handshakeSent = false
		const delay = Math.min(15000, 500 * (++tries))
		if (reconnectTimer) clearTimeout(reconnectTimer)
		reconnectTimer = setTimeout(connect, delay)
	}
    
  }

  return ws
}

function ensure(){ if (!ws || ws.readyState === 3) connect() }

function sendFrame(obj){

  if (!obj || typeof obj !== 'object' || !obj.type){
    if (CHAT_DEBUG) console.warn('[chat-ws] drop invalid frame', obj)
    return
  }
  const data = JSON.stringify(obj)
  ensure()
  if (ws && ws.readyState === 1){
	try { ws.send(data) } catch(e){ if (CHAT_DEBUG) console.warn('[chat-ws] send failed', e) }
  } else {
    pending.push(data)
    if (CHAT_DEBUG) console.log('[chat-ws] queued', obj)
  }
}

// idempotent subscribe: only send when we actually add a new group
function subscribe(gid){
  if (!gid) return
  const beforeSize = subscribers.size
  subscribers.add(gid)
  ensureHello()
  if (subscribers.size !== beforeSize) {
    //sendFrame({ type: 'subscribe', groups: [gid] })
  }
}

function subscribeGroups(groups){
  let added = false
  for (const g of groups || []) {
    const s = subscribers.size
    subscribers.add(g)
    if (subscribers.size !== s) added = true
  }
  ensureHello()
  if (added) {
    //sendFrame({ type: 'subscribe', groups: Array.from(new Set(groups || [])) })
  }
}

// Public handshake: sends hello with token and current groups
function hello(){
  const token = getToken()
  const groups = Array.from(subscribers)
  if (!token) { if (CHAT_DEBUG) console.warn('[chat-ws] hello skipped: no token'); return }
  sendFrame({ type: 'hello', token, groups })
  handshakeSent = true
}

function ensureHello(){ if (!handshakeSent) hello() }

export default {
  connect,
  disconnect: (code = 1000, reason = 'client closing') => {
    try { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null } } catch{}
    try { if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null } } catch{}
    try { if (flushTimer) { clearInterval(flushTimer); flushTimer = null } } catch{}
    try {
      if (ws){
        try { ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null } catch{}
        try { ws.close(code, reason) } catch{}
      }
    } finally { ws = null }
    handshakeSent = false
  },
  sendFrame,
  subscribe,
  subscribeGroups,
  hello,
  setHandler: (fn) => { onMessage = (typeof fn === 'function') ? fn : null },
  readyState: () => ws ? ws.readyState : -1,
}

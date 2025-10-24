const API_BASE = '/api';

export function setToken(t){ localStorage.setItem('token', t||''); }
export function getToken(){ return localStorage.getItem('token') || ''; }

async function call(fn, params={}){
  const token = getToken();
  const body = { ...params };
  if (token) body.token = token;
  const headers = { 'content-type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${API_BASE}/${encodeURIComponent(fn)}`, { method:'POST', headers, body: JSON.stringify(body) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}

export const auth = {
  async signup(username, password){ return call('signup', { username, password }); },
  async login(username, password){ const j = await call('login', { username, password }); setToken(j.token); return j; },
  async verify(){ return call('verify', {}); }
};

export const sally = {
  upsertProfile: (data) => call('sally_upsertProfile', data),
  getProfile: (params) => call('sally_getProfile', params),
  searchUsers: (q, skip=0, limit=25) => call('sally_searchUsers', { q, skip, limit }),
  sendFriendRequest: (to) => call('sally_sendFriendRequest', { to }),
  listFriendRequests: (direction, skip=0, limit=50) => call('sally_listFriendRequests', { direction, skip, limit }),
  respondFriendRequest: (request_id, action) => call('sally_respondFriendRequest', { request_id, action }),
  listFriends: (username) => call('sally_listFriends', { username }),
  listFriendsDetailed: (q='', skip=0, limit=50) => call('sally_listFriendsDetailed', { q, skip, limit }),
  createCircle: (name, kind) => call('sally_createCircle', { name, kind }),
  listCircles: (skip=0, limit=50) => call('sally_listCircles', { skip, limit }),
  addToCircle: (circle_id, member) => call('sally_addToCircle', { circle_id, member }),
  listCircleMembers: (circle_id, skip=0, limit=100) => call('sally_listCircleMembers', { circle_id, skip, limit }),
  createPost: ({ text, media=[], circle_id, community_id, visibility }) => call('sally_createPost', { text, media, circle_id, community_id, visibility }),
  feed: ({ scope='friends', circle_id, community_id, skip=0, limit=50 }) => call('sally_feed', { scope, circle_id, community_id, skip, limit }),
  react: (post_id, type) => call('sally_react', { post_id, type }),
  comment: (post_id, text, parent_id='') => call('sally_comment', { post_id, text, parent_id }),
  listComments: (post_id, skip=0, limit=50) => call('sally_listComments', { post_id, skip, limit }),
  reactionSummary: (post_id) => call('sally_reactionSummary', { post_id }),
  listReactions: (post_id) => call('sally_listReactions', { post_id }),
  searchCommunities : (q, skip=0, limit=25) => call('sally_searchCommunities', { q, skip, limit }),
  requestJoinCommunity : (community_id) => call('sally_requestJoinCommunity', { community_id }),
  listCommunityJoinRequests : (community_id, status='', skip=0, limit=50) => call('sally_listCommunityJoinRequests', { community_id, status, skip, limit }),
  respondJoinCommunity : (request_id, action) => call('sally_respondJoinCommunity', { request_id, action }),
  listMyCommunityJoinRequests : (status='', skip=0, limit=50) => call('sally_listMyCommunityJoinRequests', { status, skip, limit }),
};

export async function upload(files){
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const r = await fetch('/upload', { method: 'POST', body: fd });
  return r.json();
}

export async function oauthGoogle(idToken, email, name){
  const r = await fetch('/oauth/google', { method: 'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ idToken, email, name }) });
  const j = await r.json();
  if (j.token) setToken(j.token);
  return j;
}

// Chat helpers (new chatservice APIs)
export function chatResolve(withUser){ return call('chat_resolveGroup', { with: withUser }) }
export function chatFetchAfter(group_id, after='', skip=0, limit=50){ return call('chat_fetchAfter', { group_id, after, skip, limit }) }
export function chatLast(group_id){ return call('chat_last', { group_id }) }
export function chatUserInbox(skip=0, limit=20){ return call('chat_userInbox', { skip, limit }) }
export function chatFriendsWithLatest(limit=50){ return call('chat_friendsWithLatest', { limit }) }

// Also expose chat via sally.* for convenience in components
sally.chatResolve = (withUser) => call('chat_resolveGroup', { with: withUser })
sally.chatFetchAfter = (group_id, after='', skip=0, limit=50) => call('chat_fetchAfter', { group_id, after, skip, limit })
sally.chatLast = (group_id) => call('chat_last', { group_id })
sally.chatUserInbox = (skip=0, limit=20) => call('chat_userInbox', { skip, limit })
sally.chatFriendsWithLatest = (limit=50) => call('chat_friendsWithLatest', { limit })

// Analytics
sally.countPosts = (username) => call('sally_countPosts', { username })
sally.impressions = (username) => call('sally_impressions', { username })

// Communities
sally.createCommunity = (name, about='') => call('sally_createCommunity', { name, about })
sally.listCommunities = (skip=0, limit=50) => call('sally_listCommunities', { skip, limit })
sally.listUserCommunities = (params) => call('sally_listUserCommunities', params)
sally.addToCommunity = (community_id, members) => call('sally_addToCommunity', { community_id, members })
sally.listCommunityMembers = (community_id, skip=0, limit=100) => call('sally_listCommunityMembers', { community_id, skip, limit })
sally.searchMyFriends = (q, skip=0, limit=25) => call('sally_searchMyFriends', { q, skip, limit })
sally.leaveCommunity = (community_id) => call('sally_leaveCommunity', { community_id })
sally.transferCommunityOwner = (community_id, new_owner) => call('sally_transferCommunityOwner', { community_id, new_owner })
sally.deleteCommunity = (community_id) => call('sally_deleteCommunity', { community_id })
sally.getCommunity = (community_id) => call('sally_getCommunity', { community_id })
sally.updateCommunity = (community_id, data) => call('sally_updateCommunity', { community_id, ...data })

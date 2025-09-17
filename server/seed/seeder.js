// Seeding logic for Sally, runs inside the Node server
// Usage (programmatic): await runSeed({ apiBase, seedFile })

import fs from 'fs/promises';

async function postJson(apiBase, fn, body, token) {
  const url = `${apiBase}/${fn}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {}),
    body: JSON.stringify(body || {}),
  });
  let j;
  try {
    j = await r.json();
  } catch (e) {
    let t = '';
    try { t = await r.text(); } catch {}
    throw new Error(`${fn} ${r.status}: non-JSON response from ${url}: ${t.slice(0,120)}`);
  }
  if (!r.ok || j?.error) throw new Error(`${fn} ${r.status}: ${j?.error || j?.message || 'Unknown error'}`);
  return j;
}

function usernameForSeedUser(u) {
  return `google:${(u.email || u.external_id || u.handle).toLowerCase()}`;
}

function guessMime(url) {
  const u = (url || '').toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.gif')) return 'image/gif';
  if (u.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function runSeed({ apiBase, seedFile, uiBase }) {
  const raw = await fs.readFile(seedFile, 'utf8');
  const seed = JSON.parse(raw);

  const tokensByUsername = new Map();
  const usersByKey = new Map();

  const summary = { users: 0, friendships: 0, communities: 0, posts: 0, communityPosts: 0 };

  // Users
  for (const u of seed.users || []) {
    const external_id = u.external_id || u.email || u.handle;
    const email = u.email || `${u.handle}@example.com`;
    const display_name = u.display_name || u.name || u.handle;
    const handle = u.handle || (email.split('@')[0]);
    const username = usernameForSeedUser(u);

    // Use the UI OAuth route to avoid token middleware issues on the API
    let login;
    try {
      if (uiBase) {
        const r = await fetch(`${uiBase}/oauth/google`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idToken: external_id, email, name: display_name }),
        });
        const j = await r.json();
        if (!r.ok || j?.error) throw new Error(j?.error || r.status);
        login = j;
      } else {
        login = await postJson(apiBase, 'sally_oauthLogin', {
          provider: 'google',
          external_id,
          email,
          display_name,
        });
      }
    } catch (e) {
      throw new Error(`oauthLogin failed for ${email}: ${e?.message || e}`);
    }
    tokensByUsername.set(username, login.token);
    usersByKey.set(u.key || email || handle, username);

    await postJson(apiBase, 'sally_upsertProfile', {
      token: login.token,
      display_name,
      handle,
      bio: u.bio || '',
      avatar_url: u.avatar_url || '',
    }, login.token);
    summary.users++;
  }

  // Friendships
  for (const fr of seed.friendships || []) {
    const fromU = usersByKey.get(fr.from) || fr.from;
    const toU = usersByKey.get(fr.to) || fr.to;
    const fromToken = tokensByUsername.get(fromU);
    if (!fromToken) continue;
    await postJson(apiBase, 'sally_sendFriendRequest', { token: fromToken, to: toU }, fromToken);
    const action = String(fr.action || '').toLowerCase();
    if (action === 'accept' || action === 'decline') {
      const toToken = tokensByUsername.get(toU);
      if (toToken) {
        const list = await postJson(apiBase, 'sally_listFriendRequests', { token: toToken, direction: 'incoming', skip: 0, limit: 100 }, toToken);
        const req = (list.requests || []).find((r) => r.from === fromU && r.to === toU && r.status === 'pending');
        if (req) {
          await postJson(apiBase, 'sally_respondFriendRequest', { token: toToken, request_id: req.id, action }, toToken);
        }
      }
    }
    summary.friendships++;
  }

  // Communities
  const communityIdByName = new Map();
  for (const c of seed.communities || []) {
    const ownerU = usersByKey.get(c.owner) || c.owner;
    const token = tokensByUsername.get(ownerU);
    if (!token) continue;
    const res = await postJson(apiBase, 'sally_createCommunity', { token, name: c.name, about: c.about || '' }, token);
    const cid = res.community.id;
    communityIdByName.set(c.name, cid);
    if (Array.isArray(c.members) && c.members.length) {
      const memberUsernames = c.members.map((m) => usersByKey.get(m) || m);
      await postJson(apiBase, 'sally_addToCommunity', { token, community_id: cid, members: memberUsernames }, token);
    }
    summary.communities++;
  }

  // Global posts
  for (const p of seed.posts || []) {
    const authorU = usersByKey.get(p.author) || p.author;
    const token = tokensByUsername.get(authorU);
    if (!token) continue;
    const media = (p.images || []).map((url) => ({ url, kind: 'image', mime: guessMime(url), size: 0 }));
    await postJson(apiBase, 'sally_createPost', { token, text: p.text, media }, token);
    summary.posts++;
  }

  // Community posts
  for (const p of seed.communityPosts || []) {
    const authorU = usersByKey.get(p.author) || p.author;
    const token = tokensByUsername.get(authorU);
    if (!token) continue;
    const cid = p.community_id || communityIdByName.get(p.community) || p.community;
    const media = (p.images || []).map((url) => ({ url, kind: 'image', mime: guessMime(url), size: 0 }));
    await postJson(apiBase, 'sally_createPost', { token, text: p.text, media, community_id: cid }, token);
    summary.communityPosts++;
  }

  return summary;
}

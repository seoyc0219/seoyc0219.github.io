(() => {
  'use strict';
  const root = document.getElementById('post-interactions');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const API = 'https://ochae-guestbook.vigilantclef2.chatgpt.site/api';
  let postId;
  try { postId = decodeURIComponent(root.dataset.postId); } catch { return; }
  let visitorToken;
  try { visitorToken = localStorage.getItem('0chae.reaction.visitor.v1'); } catch {}
  if (!/^[a-f0-9]{64}$/.test(visitorToken || '')) {
    visitorToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    try { localStorage.setItem('0chae.reaction.visitor.v1', visitorToken); } catch {}
  }
  let liked = false, likesLoaded = false, likeBusy = false;
  let entries = [], totalComments = 0, nextPage = null, commentsLoaded = false, commentsBusy = false, submitting = false, commentRevision = 0;
  let challenge = null, challengePending = null;
  async function request(path, options = {}) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API + path, { ...options, signal: controller.signal });
      let data;
      try { data = await response.json(); } catch { throw new Error('서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
      if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
      return data;
    } catch (error) { if (error.name === 'AbortError') throw new Error('서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.'); throw error; }
    finally { clearTimeout(timer); }
  }
  function postQuery(page) {
    const params = new URLSearchParams({ post: postId });
    if (page !== undefined) params.set('page', String(page));
    return '?' + params;
  }
  function renderLikes(data) {
    if (!Number.isInteger(data.count) || data.count < 0 || typeof data.liked !== 'boolean') throw new Error('공감 정보를 확인하지 못했습니다.');
    liked = data.liked; likesLoaded = true;
    $('post-like-count').textContent = String(data.count);
    $('post-like-heart').textContent = liked ? '♥' : '♡';
    $('post-like').setAttribute('aria-pressed', String(liked));
  }
  async function loadLikes() {
    if (likeBusy) return;
    likeBusy = true; $('post-like').disabled = true;
    try {
      renderLikes(await request('/reactions' + postQuery(), { headers: { 'X-Visitor-Token': visitorToken } }));
      $('post-like-status').textContent = '';
    } catch (error) {
      $('post-like-status').textContent = '공감 수를 불러오지 못했습니다. 공감 버튼을 눌러 다시 확인해주세요.';
    } finally { likeBusy = false; $('post-like').disabled = false; }
  }
  $('post-like').addEventListener('click', async () => {
    if (likeBusy) return;
    if (!likesLoaded) { await loadLikes(); return; }
    likeBusy = true; $('post-like').disabled = true;
    try {
      renderLikes(await request('/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Visitor-Token': visitorToken }, body: JSON.stringify({ post: postId, liked: !liked }) }));
      $('post-like-status').textContent = liked ? '공감했습니다.' : '공감을 취소했습니다.';
    } catch (error) { $('post-like-status').textContent = error.message || '공감을 저장하지 못했습니다.'; }
    finally { likeBusy = false; $('post-like').disabled = false; }
  });
  function validComment(entry) {
    return entry && typeof entry.id === 'string' && entry.post_id === postId && typeof entry.name === 'string' && typeof entry.message === 'string' && Number.isFinite(Date.parse(entry.created_at));
  }
  function renderComments() {
    const list = $('post-comment-list'); list.replaceChildren();
    $('post-comment-count').textContent = String(totalComments);
    if (!entries.length) { const empty = document.createElement('p'); empty.className = 'comment-empty'; empty.textContent = '아직 댓글이 없습니다.'; list.append(empty); }
    for (const entry of entries) {
      const card = document.createElement('article'), header = document.createElement('header'), name = document.createElement('h3'), time = document.createElement('time'), body = document.createElement('p');
      card.className = 'post-comment'; name.textContent = entry.name.slice(0, 20); time.dateTime = entry.created_at;
      time.textContent = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at));
      body.textContent = entry.message.slice(0, 1000); header.append(name, time); card.append(header, body); list.append(card);
    }
  }
  function pagingState() {
    $('post-comments-more').hidden = nextPage === null;
    $('post-comments-more').disabled = commentsBusy;
    $('post-comments-more').textContent = commentsBusy ? '불러오는 중…' : '이전 댓글 더 보기';
    $('post-comments-refresh').disabled = commentsBusy;
    $('post-comment-list').setAttribute('aria-busy', String(commentsBusy));
  }
  async function loadComments(more = false) {
    if (commentsBusy || (more && nextPage === null)) return;
    commentsBusy = true; const revision = commentRevision; let reload = false; pagingState();
    try {
      const data = await request('/comments' + postQuery(more ? nextPage : 0));
      if (!Array.isArray(data.entries) || !Number.isInteger(data.total) || data.total < 0) throw new Error('댓글 목록을 확인하지 못했습니다.');
      if (revision !== commentRevision) { reload = true; return; }
      const incoming = data.entries.filter(validComment);
      entries = more ? [...entries, ...incoming.filter(entry => !entries.some(item => item.id === entry.id))] : incoming;
      totalComments = data.total; nextPage = Number.isInteger(data.nextPage) && data.nextPage >= 0 ? data.nextPage : null;
      commentsLoaded = true; renderComments(); $('post-comment-status').textContent = '';
    } catch (error) {
      $('post-comment-status').textContent = error.message || '댓글을 불러오지 못했습니다. 새로고침을 눌러주세요.';
      if (!commentsLoaded) { const empty = document.createElement('p'); empty.className = 'comment-empty'; empty.textContent = '댓글을 불러오지 못했습니다.'; $('post-comment-list').replaceChildren(empty); }
    } finally { commentsBusy = false; pagingState(); if (reload) loadComments(); }
  }
  async function prepareChallenge() {
    if (challengePending) return challengePending;
    challengePending = request('/comments/challenge').then(data => {
      if (typeof data.challenge !== 'string') throw new Error('등록 확인을 불러오지 못했습니다.');
      challenge = { value: data.challenge, readyAt: Date.now() + Math.max(2000, Number(data.waitMs) || 2000), expiresAt: Date.now() + 29 * 60000 };
      return challenge;
    }).finally(() => { challengePending = null; });
    return challengePending;
  }
  const form = $('post-comment-form');
  form.addEventListener('focusin', () => { if (!challenge || Date.now() > challenge.expiresAt) prepareChallenge().catch(() => {}); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submitting) return;
    const name = form.elements.nickname.value.trim(), message = form.elements.message.value.trim();
    if (!name || name.length > 20 || !message || message.length > 1000) { $('post-comment-status').textContent = '닉네임은 1~20자, 댓글은 1~1000자로 적어주세요.'; return; }
    submitting = true; const submit = form.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = '등록하는 중…';
    try {
      if (!challenge || Date.now() > challenge.expiresAt) await prepareChallenge();
      if (Date.now() < challenge.readyAt) await new Promise(resolve => setTimeout(resolve, challenge.readyAt - Date.now()));
      const ticket = challenge.value; challenge = null;
      const data = await request('/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post: postId, name, message, website: form.elements.website.value, challenge: ticket }) });
      if (!validComment(data.entry) || !Number.isInteger(data.total)) throw new Error('등록 결과를 확인하지 못했습니다. 댓글 새로고침으로 확인해주세요.');
      commentRevision++; form.elements.message.value = ''; entries = [data.entry, ...entries.filter(entry => entry.id !== data.entry.id)]; totalComments = data.total; commentsLoaded = true; renderComments();
      $('post-comment-status').textContent = '댓글을 등록했습니다.';
    } catch (error) { $('post-comment-status').textContent = error.message || '등록하지 못했습니다. 입력한 내용은 유지했습니다.'; }
    finally { submitting = false; submit.disabled = false; submit.textContent = '댓글 등록'; prepareChallenge().catch(() => {}); }
  });
  $('post-comments-refresh').addEventListener('click', () => loadComments());
  $('post-comments-more').addEventListener('click', () => loadComments(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadLikes(); });
  loadLikes(); loadComments();
})();

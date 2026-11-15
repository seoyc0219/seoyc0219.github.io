'use strict';
const $ = id => document.getElementById(id);
function storageGet(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function storageSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
let toastTimer;
function toast(message) { const el = $('toast'); if (!el) return; el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4000); }
function openDialog(id) { const dialog = $(id); if (dialog && !dialog.open) dialog.showModal(); }
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => { openDialog(button.dataset.dialog); $('start-menu').hidden = true; $('start').setAttribute('aria-expanded', 'false'); }));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }));
function showWorkspace(show) { $('workspace').hidden = !show; $('task').setAttribute('aria-pressed', String(show)); }
$('minimize').addEventListener('click', () => showWorkspace(false));
$('close-window').addEventListener('click', () => { showWorkspace(false); toast('작업표시줄의 0chae.exe를 누르면 다시 열려요.'); });
$('maximize').addEventListener('click', () => $('workspace').classList.toggle('maximized'));
$('task').addEventListener('click', () => showWorkspace(true));
$('start').addEventListener('click', () => { $('start-menu').hidden = !$('start-menu').hidden; $('start').setAttribute('aria-expanded', String(!$('start-menu').hidden)); });
document.addEventListener('click', event => { if (!event.target.closest('#start-menu, #start')) { $('start-menu').hidden = true; $('start').setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('start-menu').hidden = true; $('start').setAttribute('aria-expanded', 'false'); } });
function updateClock() { const now = new Date(); const clock = $('clock'); clock.dateTime = now.toISOString(); clock.textContent = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(now); clock.title = '한국 시간 (Asia/Seoul)'; }
updateClock(); setInterval(updateClock, 30000);

// Jekyll renders actual posts; the room and the menu share this filter.
const categoryButtons = document.querySelectorAll('[data-category]');
const postCards = document.querySelectorAll('[data-post-categories]');
let selectedCategory = new URLSearchParams(location.search).get('category') || '전체';
if (!['전체', '개발', '보안', '기타.'].includes(selectedCategory)) selectedCategory = '전체';
function filterPosts(category) {
  selectedCategory = category; let visible = 0;
  postCards.forEach(post => { let names; try { names = JSON.parse(post.dataset.postCategories); } catch { names = []; } const matches = category === '전체' || names.includes(category); post.hidden = !matches; if (matches) visible++; });
  categoryButtons.forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  if ($('empty-state')) $('empty-state').hidden = visible > 0;
  if ($('empty-title')) $('empty-title').textContent = category === '전체' ? '아직 작성된 글이 없어요.' : `${category} 카테고리에 아직 글이 없어요.`;
}
categoryButtons.forEach(button => button.addEventListener('click', () => filterPosts(button.dataset.category)));
document.querySelectorAll('[data-nav-category]').forEach(link => link.addEventListener('click', event => { if (!$('journal')) return; event.preventDefault(); filterPosts(link.dataset.navCategory); $('journal').scrollIntoView({ block: 'start' }); }));
filterPosts(selectedCategory);

// Cosmetic game rewards are personal browser unlocks, not security credentials.
const REWARD_KEY = '0chae.reward.v1';
const rewardData = storageGet(REWARD_KEY, null);
let hunterUnlocked = rewardData?.unlocked === true;
let bestScore = Number.isFinite(rewardData?.bestScore) ? Math.max(0, Math.min(300, rewardData.bestScore)) : 0;
function updateRewardControls() {
  $('hunter-style').disabled = !hunterUnlocked;
  $('reward-status').textContent = hunterUnlocked ? '버그 헌터 획득! 배지와 별 프레임을 사용할 수 있어요.' : '버그 찾기 3문제를 풀면 잠금이 해제돼요.';
}
updateRewardControls();

// Public nickname guestbook. Only deletion capabilities remain browser-local.
const GUEST_API = 'https://ochae-guestbook.vigilantclef2.chatgpt.site/api/guestbook';
const DELETE_KEY = '0chae.guest.delete.v1';
const storedTokens = storageGet(DELETE_KEY, {});
const deleteTokens = storedTokens && !Array.isArray(storedTokens) && typeof storedTokens === 'object' ? storedTokens : {};
let guests = [], guestLoading = false, guestSubmitting = false, nextGuestPage = null;
async function guestRequest(url, options = {}) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000);
  try { const response = await fetch(url, { ...options, signal: controller.signal }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '서버에 연결하지 못했어요.'); return data; }
  finally { clearTimeout(timer); }
}
function validEntry(entry) { return entry && typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.message === 'string' && typeof entry.created_at === 'string' && Number.isFinite(Date.parse(entry.created_at)); }
function makeGuestCard(entry, allowDelete = false) {
  const card = document.createElement('article'); card.className = 'guest-card' + (entry.style === 'bug-hunter' ? ' hunter-card' : '');
  const header = document.createElement('header'); const name = document.createElement('h3'); name.textContent = entry.name.slice(0,20); header.append(name);
  if (allowDelete && Object.hasOwn(deleteTokens, entry.id)) { const button = document.createElement('button'); button.className = 'delete-guest'; button.textContent = '삭제'; button.setAttribute('aria-label', `${entry.name.slice(0,20)}의 방명록 삭제`); button.addEventListener('click', async () => {
    button.disabled = true;
    try { const url = new URL(GUEST_API); url.searchParams.set('id',entry.id); await guestRequest(url.href, { method:'DELETE', headers:{Authorization:`Bearer ${deleteTokens[entry.id]}`} }); delete deleteTokens[entry.id]; storageSet(DELETE_KEY,deleteTokens); guests = guests.filter(item => item.id !== entry.id); renderGuests(); toast('방명록을 삭제했어요.'); }
    catch(error) { button.disabled = false; toast(error.message || '삭제하지 못했어요.'); }
  }); header.append(button); }
  const time = document.createElement('time'); time.dateTime = entry.created_at; time.textContent = new Intl.DateTimeFormat('ko-KR', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(entry.created_at));
  const message = document.createElement('p'); message.textContent = entry.message.slice(0,300); card.append(header,time);
  if (entry.style === 'bug-hunter') { const badge = document.createElement('span'); badge.className = 'hunter-badge'; badge.textContent = '🐛 BUG HUNTER'; card.append(badge); }
  card.append(message); return card;
}
function guestPlaceholder(message = '방명록이 비어 있습니다') { const el = document.createElement('div'); el.className = 'guest-placeholder'; el.textContent = message; return el; }
function renderGuests() { const entries = $('guest-entries'); entries.replaceChildren(); if (!guests.length) entries.append(guestPlaceholder()); else guests.forEach(entry => entries.append(makeGuestCard(entry,true))); const preview = $('guest-preview'); if (preview) { preview.replaceChildren(); if (!guests.length) preview.append(guestPlaceholder()); else guests.slice(0,3).forEach(entry => preview.append(makeGuestCard(entry))); } }
async function loadGuests(more = false) {
  if (guestLoading) return; guestLoading = true; $('refresh-guests').disabled = true; $('more-guests').disabled = true; $('guest-status').textContent = '방명록을 불러오는 중…';
  try { const url = new URL(GUEST_API); if (more && nextGuestPage !== null) url.searchParams.set('page',String(nextGuestPage)); const data = await guestRequest(url.href); if (!Array.isArray(data.entries)) throw new Error('방명록 응답을 읽지 못했어요.');
    const incoming = data.entries.filter(validEntry); guests = more ? [...guests,...incoming.filter(entry => !guests.some(item => item.id === entry.id))] : incoming; nextGuestPage = Number.isInteger(data.nextPage) ? data.nextPage : null;
    renderGuests(); $('more-guests').hidden = nextGuestPage === null; $('guest-status').textContent = '모든 방문자와 함께 보는 방명록이에요.';
  } catch(error) { $('guest-status').textContent = error.message || '방명록을 불러오지 못했어요. 새로고침을 눌러주세요.'; if (!guests.length) for (const target of [$('guest-entries'),$('guest-preview')]) if (target) target.replaceChildren(guestPlaceholder('방명록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')); }
  finally { guestLoading = false; $('refresh-guests').disabled = false; $('more-guests').disabled = false; }
}
$('refresh-guests').addEventListener('click', () => loadGuests()); $('more-guests').addEventListener('click', () => loadGuests(true));
$('guest-form').addEventListener('submit', async event => {
  event.preventDefault(); if (guestSubmitting) return; const form = event.currentTarget; const name = form.elements.nickname.value.trim().slice(0,20); const message = form.elements.message.value.trim().slice(0,300);
  if (!name || !message) { toast('닉네임과 인사를 적어주세요.'); return; }
  const style = hunterUnlocked && form.elements.style.value === 'bug-hunter' ? 'bug-hunter' : 'plain';
  const deleteToken = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2,'0')).join('');
  const submit = form.querySelector('[type="submit"]'); guestSubmitting = true; submit.disabled = true; submit.textContent = '등록하는 중…';
  try { const data = await guestRequest(GUEST_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message,style,deleteToken,website:form.elements.website.value})}); if (!validEntry(data.entry)) throw new Error('등록 결과를 확인하지 못했어요. 새로고침으로 확인해주세요.');
    deleteTokens[data.entry.id] = deleteToken; const saved = storageSet(DELETE_KEY,deleteTokens); form.elements.message.value = ''; guests = [data.entry,...guests.filter(item => item.id !== data.entry.id)]; renderGuests(); $('guest-status').textContent = '등록 완료! 다른 방문자에게도 보여요.'; toast(saved ? '방명록을 남겼어요 ♡' : '글은 등록됐지만 삭제 정보를 이 브라우저에 저장하지 못했어요.');
  } catch(error) { $('guest-status').textContent = error.message || '등록하지 못했어요. 입력한 내용은 유지했어요.'; toast(error.message || '등록하지 못했어요. 잠시 후 다시 시도해주세요.'); }
  finally { guestSubmitting = false; submit.disabled = false; submit.textContent = '✎ 인사 남기기'; }
});
for (const target of [$('guest-entries'),$('guest-preview')]) if (target) target.replaceChildren(guestPlaceholder('방명록을 불러오는 중…'));
loadGuests();

// Educational examples only; snippets are displayed as text and never executed.
const challenges = [
  { title: '01. 수상한 로그인 쿼리', language: 'Python / SQL', lines: ['def find_user(username):', '    db = connect_database()', '    query = "SELECT * FROM users WHERE name = \'" + username + "\'"', '    return db.execute(query)'], answer: 2, why: '사용자 입력을 SQL 문자열에 직접 이어 붙이면 쿼리의 의미가 바뀔 수 있어요. SQL Injection 위험입니다.', fix: '값은 매개변수로 전달해요: db.execute("SELECT * FROM users WHERE name = ?", (username,))' },
  { title: '02. 댓글을 보여주는 화면', language: 'JavaScript / DOM', lines: ['const comment = new URLSearchParams(location.search).get("comment");', 'const box = document.querySelector("#comment");', 'box.innerHTML = comment;'], answer: 2, why: '외부 입력을 innerHTML로 넣으면 HTML로 해석됩니다. DOM 기반 XSS가 발생할 수 있어요.', fix: '일반 텍스트는 box.textContent = comment; 로 표시해요. HTML이 꼭 필요하면 검증된 정화 도구를 사용해요.' },
  { title: '03. 누구의 메모일까요?', language: 'Python / API', lines: ['@app.get("/notes/<note_id>")', '@login_required', 'def read_note(note_id):', '    note = db.get_note(note_id)', '    return jsonify(note)'], answer: 4, why: '로그인 여부만 확인하고 메모 소유자를 확인하지 않은 채 데이터를 반환하고 있어요. 다른 사람의 메모에 접근하는 IDOR 위험입니다.', fix: '반환 전에 note.owner_id와 current_user.id를 비교하고, 권한이 없으면 403을 반환해요. 서버에서 객체별 권한을 확인해야 합니다.' }
];
let gameIndex = 0, gameScore = 0, gameSolved = false, wrongLines = new Set();
function renderChallenge() { $('game-result').hidden = true; $('code-lines').hidden = false; $('game-title').hidden = false; $('game-prompt').hidden = false; $('game-feedback').hidden = false; const question = challenges[gameIndex]; gameSolved = false; wrongLines = new Set(); $('game-progress').textContent = `문제 ${gameIndex + 1} / ${challenges.length} · ${question.language}`; $('game-score').textContent = `${gameScore} pts`; $('game-title').textContent = question.title; $('game-prompt').textContent = '취약점이 발생하는 줄을 눌러보세요.'; $('game-feedback').replaceChildren(); $('game-next').hidden = true; $('game-restart').hidden = true; $('code-lines').replaceChildren(); question.lines.forEach((line, index) => { const button = document.createElement('button'); button.className = 'code-line'; const number = document.createElement('span'); number.textContent = String(index + 1); const code = document.createElement('code'); code.textContent = line; button.append(number, code); button.setAttribute('aria-label', `${index + 1}번째 줄: ${line}`); button.addEventListener('click', () => answerLine(index, button)); $('code-lines').append(button); }); }
function answerLine(index, button) { if (gameSolved) return; const question = challenges[gameIndex]; if (index !== question.answer) { wrongLines.add(index); button.classList.add('wrong'); $('game-feedback').textContent = '이 줄은 핵심 취약 지점이 아니에요. 외부 입력이 어디에 쓰이는지, 권한 검사가 빠진 곳은 없는지 다시 살펴보세요.'; return; } gameSolved = true; gameScore += Math.max(40, 100 - wrongLines.size * 20); button.classList.add('correct'); $('code-lines').querySelectorAll('button').forEach(line => { line.disabled = true; }); const strong = document.createElement('strong'); strong.textContent = '정답! 버그를 찾았어요 ✦'; const reason = document.createElement('p'); reason.textContent = question.why; const fix = document.createElement('p'); fix.textContent = question.fix; $('game-feedback').replaceChildren(strong, reason, fix); $('game-score').textContent = `${gameScore} pts`; if (gameIndex < challenges.length - 1) $('game-next').hidden = false; else { hunterUnlocked = true; bestScore = Math.max(bestScore, gameScore); const saved = storageSet(REWARD_KEY, { unlocked: true, bestScore }); updateRewardControls(); renderCompletion(); if (!saved) toast('보상은 획득했지만 브라우저에 저장하지 못했어요. 이 화면에서는 사용할 수 있어요.'); } }
$('game-next').addEventListener('click', () => { if (!gameSolved || gameIndex >= challenges.length - 1) return; gameIndex++; renderChallenge(); });
$('game-restart').addEventListener('click', () => { gameIndex = 0; gameScore = 0; renderChallenge(); });
function renderCompletion() {
  $('game-progress').textContent = '3 / 3 완료'; $('game-score').textContent = `${bestScore} pts · 최고 기록`;
  $('game-title').hidden = true; $('game-prompt').hidden = true; $('code-lines').hidden = true; $('game-feedback').hidden = true;
  $('game-next').hidden = true; $('game-restart').hidden = false; $('game-result').hidden = false;
  $('reward-score').textContent = `최고 기록 ${bestScore} / 300 pts`;
}
$('use-reward').addEventListener('click', () => { if (!hunterUnlocked) return; $('game-dialog').close(); $('hunter-style').checked = true; openDialog('guest-dialog'); });
if (hunterUnlocked) renderCompletion(); else renderChallenge();

// Movable furniture, stored only in this browser. Pointer and keyboard controls.
const room = $('room');
if (room) {
  const ROOM_KEY = '0chae.room.v1';
  const LIFE_KEY = '0chae.room.life.v1';
  const loadedLife = storageGet(LIFE_KEY, {});
  const life = loadedLife && typeof loadedLife === 'object' && !Array.isArray(loadedLife) ? loadedLife : {};
  let sleeping = life.sleeping === true, lightsOn = life.lightsOn !== false;
  const growthEntries = life.plants && typeof life.plants === 'object' && !Array.isArray(life.plants) ? Object.entries(life.plants) : [];
  const plantGrowth = new Map(growthEntries.filter(([,stage]) => Number.isInteger(stage) && stage >= 0 && stage <= 4));
  function saveLife() { if (!storageSet(LIFE_KEY, { sleeping, lightsOn, plants: Object.fromEntries(plantGrowth) })) toast('이 브라우저에 상태를 저장하지 못했어요. 현재 화면에서는 계속 사용할 수 있어요.'); }
  const avatar = $('profile-avatar');
  if (avatar) { const preload = new Image(); preload.src = avatar.dataset.sleepSrc; }
  function updateAvatar() {
    if (!avatar) return;
    const src = sleeping ? avatar.dataset.sleepSrc : avatar.dataset.awakeSrc;
    if (avatar.getAttribute('src') !== src) avatar.src = src;
    avatar.alt = sleeping ? '베개에 기대 잠든 픽셀 캐릭터' : '보라색 헤드폰을 쓴 깨어 있는 픽셀 캐릭터';
    $('avatar-frame').classList.toggle('sleeping', sleeping); $('sleep-symbols').hidden = !sleeping;
    $('avatar-sticker').textContent = sleeping ? '☾' : '♡'; $('avatar-status').hidden = !sleeping;
    $('avatar-status').textContent = sleeping ? '자는 중 · 침대를 누르면 깨요' : '';
  }
  function plantStage(item) { return plantGrowth.get(item.id) || 0; }
  function refreshFurniture(button, item) {
    let label = types[item.type].label;
    if (item.type === 'bed') { label = sleeping ? '침대 · 캐릭터 깨우기' : '침대 · 캐릭터 재우기'; button.setAttribute('aria-pressed',String(sleeping)); }
    if (item.type === 'lamp') { label = lightsOn ? '조명 · 불 끄기' : '조명 · 불 켜기'; button.setAttribute('aria-pressed',String(lightsOn)); button.classList.toggle('lamp-lit',lightsOn); button.querySelector('use').setAttribute('href',lightsOn ? '#i-lamp' : '#i-lamp-off'); }
    if (item.type === 'plant') { const stage = plantStage(item); label = stage === 4 ? '식물 · 다 자랐어요' : `식물 · 성장 ${stage}/4 · 눌러서 키우기`; button.dataset.growth = String(stage); button.querySelector('use').setAttribute('href',`#i-plant-${stage}`); }
    button.setAttribute('aria-label',label + (editing ? ' · 꾸미기 모드 · 방향키로 이동' : ''));
    button.querySelector('.item-label').textContent = label;
  }
  function refreshLife() { updateAvatar(); room.classList.toggle('lights-off',!lightsOn); layer.querySelectorAll('.furniture').forEach((button,index) => refreshFurniture(button,items[index])); }

  const types = { desk: { label: '노트북 · 기술 글 목록', width: 43 }, shelf: { label: '책장 · 방명록', width: 23 }, bed: { label: '침대', width: 39 }, chair: { label: '의자', width: 15 }, plant: { label: '화분', width: 15 }, lamp: { label: '조명', width: 12 }, bug: { label: '작은 벌레 · 버그 찾기 게임', width: 8 } };
  const defaults = () => [ { id: 'bed', type: 'bed', x: 1, y: 68 }, { id: 'plant', type: 'plant', x: 5, y: 45 }, { id: 'shelf', type: 'shelf', x: 74, y: 30 }, { id: 'desk', type: 'desk', x: 32, y: 43 }, { id: 'lamp', type: 'lamp', x: 29, y: 35 }, { id: 'chair', type: 'chair', x: 53, y: 70 }, { id: 'bug', type: 'bug', x: 84, y: 84 } ];
  function validItems(value) { return Array.isArray(value) && value.length <= 24 && value.every(item => item && typeof item.id === 'string' && typeof item.type === 'string' && Object.hasOwn(types, item.type) && Number.isFinite(item.x) && item.x >= 0 && item.x <= 100 && Number.isFinite(item.y) && item.y >= 0 && item.y <= 100) && new Set(value.map(item => item.id)).size === value.length; }
  const saved = storageGet(ROOM_KEY, null); let items = validItems(saved) ? saved : defaults();
  let editing = false, selected = null, dirty = false, dragging = null, suppressClickUntil = 0;
  const layer = $('furniture-layer');
  function markDirty() { dirty = true; $('save-status').textContent = '아직 저장하지 않은 배치예요. 배치 저장을 눌러주세요.'; }
  function bounds(element) { const r = room.getBoundingClientRect(); return { maxX: Math.max(0, 100 - element.offsetWidth / r.width * 100), maxY: Math.max(0, 100 - element.offsetHeight / r.height * 100) }; }
  function place(element, item) { const limits = bounds(element); item.x = Math.min(limits.maxX, Math.max(0, item.x)); item.y = Math.min(limits.maxY, Math.max(0, item.y)); element.style.setProperty('--x', `${item.x}%`); element.style.setProperty('--y', `${item.y}%`); element.style.zIndex = String(Math.round(item.y)); }
  function select(id) { selected = id; layer.querySelectorAll('.furniture').forEach(element => element.classList.toggle('selected', element.dataset.itemId === id)); $('remove-item').disabled = !editing || !selected; }
  function activate(item, button) {
    const type = item.type;
    if (type === 'desk') { filterPosts('전체'); $('journal').scrollIntoView({ block: 'start' }); }
    else if (type === 'shelf') openDialog('guest-dialog');
    else if (type === 'bug') openDialog('game-dialog');
    else if (type === 'bed') { sleeping = !sleeping; refreshLife(); saveLife(); toast(sleeping ? '캐릭터가 잠들었어요. 침대를 다시 누르면 깨어나요 ☾' : '캐릭터가 깨어났어요!'); }
    else if (type === 'lamp') { lightsOn = !lightsOn; refreshLife(); saveLife(); toast(lightsOn ? '불을 켰어요.' : '불을 껐어요. 조명을 다시 누르면 켜져요.'); }
    else if (type === 'plant') {
      const stage = plantStage(item);
      if (stage === 4) { toast('식물이 다 자랐어요! 🌸'); return; }
      plantGrowth.set(item.id,stage+1); refreshFurniture(button,item); saveLife();
      button.classList.remove('plant-pop'); void button.offsetWidth; button.classList.add('plant-pop');
      toast(stage+1 === 4 ? '식물이 다 자랐어요! 꽃이 피었네요 🌸' : `식물이 자라고 있어요 🌱 (${stage+1}/4)`);
    }
    else toast('여기는 코딩하는 자리! ⌨');
  }
  function renderRoom() { layer.replaceChildren(); items.forEach(item => { const button = document.createElement('button'); button.className = 'furniture'; button.dataset.itemId = item.id; button.dataset.type = item.type; button.style.setProperty('--w', `${types[item.type].width}%`); button.style.setProperty('--x', `${item.x}%`); button.style.setProperty('--y', `${item.y}%`); button.style.zIndex = String(Math.round(item.y)); button.setAttribute('aria-label', types[item.type].label + (editing ? ' · 방향키로 이동' : '')); const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); const viewBoxes = { desk: '0 0 180 135', shelf: '0 0 115 155', bed: '0 0 180 105', plant: '0 0 90 125', chair: '0 0 95 125', lamp: '0 0 95 125', bug: '0 0 70 70' }; svg.setAttribute('viewBox', viewBoxes[item.type]); svg.setAttribute('aria-hidden', 'true'); use.setAttribute('href', `#i-${item.type}`); svg.append(use); const label = document.createElement('span'); label.className = 'item-label'; label.textContent = types[item.type].label; button.append(svg, label);
    button.addEventListener('click', () => { if (Date.now() < suppressClickUntil) return; if (editing) select(item.id); else activate(item, button); });
    button.addEventListener('pointerdown', event => { if (!editing || (event.pointerType === 'mouse' && event.button !== 0)) return; select(item.id); const rect = room.getBoundingClientRect(); dragging = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y, width: rect.width, height: rect.height, moved: false }; button.setPointerCapture(event.pointerId); });
    button.addEventListener('pointermove', event => { if (!dragging || dragging.pointerId !== event.pointerId || !editing) return; const dx = event.clientX - dragging.startX, dy = event.clientY - dragging.startY; if (Math.abs(dx) + Math.abs(dy) > 4) dragging.moved = true; if (!dragging.moved) return; item.x = dragging.x + dx / dragging.width * 100; item.y = dragging.y + dy / dragging.height * 100; place(button, item); markDirty(); });
    function endDrag(event) { if (!dragging || dragging.pointerId !== event.pointerId) return; if (dragging.moved) suppressClickUntil = Date.now() + 250; dragging = null; }
    button.addEventListener('pointerup', endDrag); button.addEventListener('pointercancel', endDrag);
    button.addEventListener('keydown', event => { if (!editing) return; const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (!directions[event.key]) return; event.preventDefault(); select(item.id); const delta = directions[event.key]; const step = event.shiftKey ? 5 : 1; item.x += delta[0] * step; item.y += delta[1] * step; place(button, item); markDirty(); });
    layer.append(button); refreshFurniture(button,item); }); select(selected); refreshLife(); requestAnimationFrame(() => layer.querySelectorAll('.furniture').forEach((element, index) => place(element, items[index]))); }
  function setEditing(value) { editing = value; room.classList.toggle('editing', value); $('edit-room').textContent = value ? '✓ 꾸미기 마치기' : '✎ 미니룸 꾸미기'; $('edit-room').setAttribute('aria-pressed', String(value)); $('save-room').hidden = !value; $('reset-room').hidden = !value; $('room-instruction').textContent = value ? '끌어서 이동 · 방향키로 미세 조정 · 저장하기 ♡' : '노트북 · 책장 · 벌레를 클릭!'; room.querySelector('.room-hint').textContent = value ? '아이템을 끌거나 선택 후 방향키로 옮겨요' : '가구를 클릭해보세요!'; document.querySelectorAll('[data-add]').forEach(button => button.setAttribute('aria-disabled', String(!value))); renderRoom(); }
  $('edit-room').addEventListener('click', () => { if (editing && dirty) { if (!storageSet(ROOM_KEY, items)) { toast('저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.'); return; } dirty = false; $('save-status').textContent = '이 브라우저에 배치를 저장했어요 ♡'; } setEditing(!editing); });
  $('save-room').addEventListener('click', () => { if (!storageSet(ROOM_KEY, items)) { toast('브라우저 저장 공간을 사용할 수 없어요.'); return; } dirty = false; $('save-status').textContent = '이 브라우저에 배치를 저장했어요 ♡'; toast('나만의 미니룸 저장 완료 ♡'); });
  $('reset-room').addEventListener('click', () => { items = defaults(); selected = null; renderRoom(); markDirty(); toast('기본 배치로 돌아왔어요. 저장하면 다음에도 유지돼요.'); });
  $('remove-item').addEventListener('click', () => { if (!editing || !selected) return; plantGrowth.delete(selected); saveLife(); items = items.filter(item => item.id !== selected); selected = null; renderRoom(); markDirty(); });
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => { if (!editing) { toast('먼저 미니룸 꾸미기를 눌러주세요 ♡'); return; } if (items.length >= 24) { toast('가구는 최대 24개까지 놓을 수 있어요.'); return; } const item = { id: crypto.randomUUID(), type: button.dataset.add, x: 35, y: 45 }; items.push(item); selected = item.id; renderRoom(); markDirty(); }));
  if (saved && !validItems(saved)) toast('저장된 배치를 읽지 못해 기본 미니룸을 열었어요.');
  if (saved && validItems(saved)) $('save-status').textContent = '이 브라우저에 저장한 미니룸을 불러왔어요 ♡';
  setEditing(false);
  let resizeFrame; window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => layer.querySelectorAll('.furniture').forEach((element, index) => place(element, items[index]))); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
}

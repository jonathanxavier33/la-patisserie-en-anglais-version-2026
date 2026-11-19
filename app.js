/* ════════════════════════════════════════════════════════════════════
   PASTRY ENGLISH PRO — v5.0.0
   © 2025 — Tous droits réservés.
   Code source protégé — CPI art. L.111-1.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

/* ─── STOCKAGE ───────────────────────────────────────────────────── */
const store = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : v; }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
    getJSON(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
    setJSON(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ─── OUTILS ─────────────────────────────────────────────────────── */
function shuffle(a){ const b=[...a]; for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; }
function shuffleWithIdx(arr, ci){ const wi=arr.map((item,i)=>({item,i})); const s=shuffle(wi); return { items:s.map(x=>x.item), ci:s.findIndex(x=>x.i===ci) }; }
function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function norm(s){
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
        .replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g,'').replace(/\s+/g,' ').trim()
        .replace(/^(the|a|an) /,'');
}
function matches(value, item){
    const v = norm(value);
    if (!v) return false;
    if (v === norm(item.en)) return true;
    return (ALT[item.en] || []).some(a => norm(a) === v);
}
function todayStr(d){
    d = d || new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function yesterdayStr(){ const d=new Date(); d.setDate(d.getDate()-1); return todayStr(d); }

/* Tirage sans répétition : toutes les questions passent avant de recommencer */
const BAGS = {};
function draw(name, n){
    if (!BAGS[name] || !BAGS[name].length) BAGS[name] = shuffle([...Array(n).keys()]);
    const i = BAGS[name].pop();
    return { i, pos: n - BAGS[name].length };
}

/* ─── VOIX (synthèse vocale) ─────────────────────────────────────── */
let VOICE = null, voiceWarned = false;
function pickVoice(){
    try{
        const vs = window.speechSynthesis.getVoices();
        VOICE = vs.find(v=>/^en[-_]GB/i.test(v.lang)) || vs.find(v=>/^en/i.test(v.lang)) || null;
    }catch(e){}
}
if ('speechSynthesis' in window){
    pickVoice();
    try{ window.speechSynthesis.addEventListener('voiceschanged', pickVoice); }catch(e){}
}
function speak(txt){
    if (!('speechSynthesis' in window)){
        if (!voiceWarned){ voiceWarned = true; popup("🔇 Synthèse vocale non disponible sur cet appareil", 0, 3200); }
        return;
    }
    try{
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        if (VOICE){ u.voice = VOICE; u.lang = VOICE.lang; } else { u.lang = 'en-GB'; }
        u.rate = 0.88;
        window.speechSynthesis.speak(u);
        if (!VOICE && !voiceWarned && window.speechSynthesis.getVoices().length > 0){
            voiceWarned = true;
            popup("🔇 Aucune voix anglaise : ajoutez-en une dans les réglages du téléphone", 0, 3800);
        }
    }catch(e){}
}

/* ─── DONNÉES DÉRIVÉES ───────────────────────────────────────────── */
const ALL = Object.entries(DB).flatMap(([theme, arr]) =>
    arr.map(w => ({ ...w, theme, key: w.fr + '|' + w.en })));
const ROLE_ALL = ROLEPLAY
    .map(r => ({ scene:r.scene, turns:[{ ctx:r.ctx, opts:r.opts, ok:r.ok, tip:r.tip }] }))
    .concat(ROLEPLAY_MULTI);
const ALL_THEME = '★ Tous';

/* ─── ÉTAT ───────────────────────────────────────────────────────── */
let S = {
    xp:0, streak:0, dailyXP:0,
    mode:"flashcard", theme:"Basic Ingredients", transTheme:Object.keys(DB_TRANS)[0],
    quizTheme:ALL_THEME, quizType:'mix',
    deck:[], idx:0, flipped:false,
    q:null, recent:[],
    listenItem:null, listenOpts:null, listenOk:0, listenPos:0,
    roleItem:null, roleTurn:0, roleOpts:null, roleOk:0,
    recipeItem:null, userSteps:[], selStep:null, recipeDone:false,
    convItem:null, convOpts:null, convOk:0, convPos:0,
    worldItem:null, worldOpts:null, worldPos:0,
    rushTimer:null, rushLeft:0, rushTotal:15, rushItem:null,
    memTimer:null, mem:null,
    lastAnswer:0, limitShown:false,
    sess:{ n:0, ok:0, xp:0, ko:{}, badges:[] }
};
S.xp      = parseInt(store.get('pep_xp','0'))  || 0;
S.streak  = parseInt(store.get('pep_str','0')) || 0;
S.dailyXP = parseInt(store.get('pep_day','0')) || 0;
S.quizType = store.get('pep_qt','mix');

let SRS    = store.getJSON('pep_srs', {});
let DAYS   = store.getJSON('pep_days', { n:0, best:0, last:'' });
let BADGES = store.getJSON('pep_badges', []);
let CNT    = store.getJSON('pep_cnt', { spell:0, rush:0 });

/* ─── RÉPÉTITION ESPACÉE (boîtes de Leitner) ─────────────────────── */
const DAY_MS = 86400000;
const INTERVALS = [0, 1, 3, 7, 14, 30];  // jours d'attente selon la boîte (1 à 5)

function srsRecord(item, ok){
    const key = item.key || (item.fr + '|' + item.en);
    const r = SRS[key] || { box:0, ok:0, ko:0, due:0, last:0 };
    if (ok){ r.ok++; r.box = Math.min(5, r.box + 1); r.due = Date.now() + INTERVALS[r.box] * DAY_MS; }
    else   { r.ko++; r.box = 1; r.due = Date.now(); if (!S.sess.ko[key]) S.sess.ko[key] = item; }
    r.last = Date.now();
    SRS[key] = r;
    store.setJSON('pep_srs', SRS);
}
function isDue(w){ const r = SRS[w.key]; return r && r.due <= Date.now(); }
function dueCount(){ return ALL.filter(isDue).length; }
function masteredCount(pool){ return pool.filter(w => SRS[w.key] && SRS[w.key].box >= 4).length; }
function hardWords(){
    return ALL.filter(w => { const r = SRS[w.key]; return r && r.ko > 0 && r.box <= 2; })
              .sort((a,b) => SRS[b.key].ko - SRS[a.key].ko);
}
function smartPick(pool, ignoreDue){
    const cand = pool.filter(w => !S.recent.includes(w.key));
    const base = cand.length ? cand : pool;
    const due   = ignoreDue ? [] : base.filter(isDue).sort((a,b) => SRS[a.key].box - SRS[b.key].box);
    const fresh = base.filter(w => !SRS[w.key]);
    let pick;
    if (due.length && (Math.random() < 0.6 || !fresh.length)) pick = rnd(due.slice(0, 5));
    else if (fresh.length) pick = rnd(fresh);
    else pick = rnd(base);
    S.recent.push(pick.key);
    if (S.recent.length > 4) S.recent.shift();
    return pick;
}

/* Enregistre une réponse (mot du vocabulaire) */
function recordAnswer(item, ok){
    srsRecord(item, ok);
    S.sess.n++; if (ok) S.sess.ok++;
    checkBadges();
}
/* Enregistre une réponse (exercice sans mot précis) */
function sessionTick(ok){ S.sess.n++; if (ok) S.sess.ok++; }

/* ─── SÉRIE QUOTIDIENNE ──────────────────────────────────────────── */
function touchDay(){
    const t = todayStr();
    if (DAYS.last === t) return;
    DAYS.n = (DAYS.last === yesterdayStr()) ? DAYS.n + 1 : 1;
    DAYS.last = t;
    DAYS.best = Math.max(DAYS.best || 0, DAYS.n);
    store.setJSON('pep_days', DAYS);
    checkBadges();
}
function daysAlive(){ return (DAYS.last === todayStr() || DAYS.last === yesterdayStr()) ? DAYS.n : 0; }

/* ─── BADGES ─────────────────────────────────────────────────────── */
const BADGE_LIST = [
    { id:'first',   icon:'🌱', name:"Première réponse",              test:()=>S.xp > 0 },
    { id:'streak10',icon:'⚡', name:"10 bonnes réponses d'affilée",  test:()=>S.streak >= 10 },
    { id:'days3',   icon:'📅', name:"3 jours de suite",              test:()=>DAYS.n >= 3 && daysAlive() >= 3 },
    { id:'days7',   icon:'🔥', name:"7 jours de suite",              test:()=>DAYS.n >= 7 && daysAlive() >= 7 },
    { id:'master20',icon:'🧠', name:"20 mots maîtrisés",             test:()=>masteredCount(ALL) >= 20 },
    { id:'spell10', icon:'✍️', name:"10 mots bien orthographiés",    test:()=>CNT.spell >= 10 },
    { id:'rush10',  icon:'⏱️', name:"10 victoires au Rush",          test:()=>CNT.rush >= 10 },
    { id:'lvl3',    icon:'🎂', name:"Niveau Pastry Chef",            test:()=>S.xp >= LEVELS[3].xp },
    { id:'mem8',    icon:'🃏', name:"Memory en 8 coups ou moins",    test:()=>false }   // attribué directement
];
function award(id){
    if (BADGES.includes(id)) return;
    const b = BADGE_LIST.find(x => x.id === id);
    if (!b) return;
    BADGES.push(id);
    store.setJSON('pep_badges', BADGES);
    S.sess.badges.push(b);
    popup(`🏅 ${b.name}`, 1, 2400);
}
function checkBadges(){ BADGE_LIST.forEach(b => { if (!BADGES.includes(b.id) && b.test()) award(b.id); }); }
function bumpCount(k){ CNT[k] = (CNT[k] || 0) + 1; store.setJSON('pep_cnt', CNT); checkBadges(); }

/* ─── XP ─────────────────────────────────────────────────────────── */
const XP_M = {flashcard:0.3,quiz:0.7,listening:1.0,roleplay:1.0,world:1.0,recipe:1.3,rush:1.5,translation:0.8,conversion:1.2,memory:1.0};
const MAX_D = 380;

function checkDailyReset(){
    const today = todayStr();
    if (store.get('pep_date','') !== today){
        S.dailyXP = 0; S.limitShown = false;
        store.set('pep_day','0'); store.set('pep_date', today);
    }
}

function earnXP(base, mode){
    checkDailyReset();
    touchDay();
    if (mode !== 'flashcard' && mode !== 'translation') S.streak++;
    if (S.dailyXP >= MAX_D){
        if (!S.limitShown){ S.limitShown = true; popup("🎉 Objectif du jour atteint ! Pratique libre, sans XP", 0, 2600); }
        save(); updateHUD(); return;
    }
    const m = XP_M[mode] || 1, sb = 1 + Math.min(S.streak * 0.05, 0.4);
    const sp = (Date.now() - S.lastAnswer) < 3000 ? 0.4 : 1.0;
    S.lastAnswer = Date.now();
    const amt = Math.min(Math.max(1, Math.round(base * m * sb * sp)), MAX_D - S.dailyXP);
    S.xp += amt; S.dailyXP += amt; S.sess.xp += amt;
    save(); updateHUD(); popup(`+${amt} XP`, amt);
    checkBadges();
}
function loseStreak(){ S.streak = 0; save(); updateHUD(); }

function save(){
    store.set('pep_xp',  S.xp);
    store.set('pep_str', S.streak);
    store.set('pep_day', S.dailyXP);
}

function popup(txt, amt, ms){
    document.querySelectorAll('.xp-pop').forEach(e => e.remove());
    const el = document.createElement('div');
    el.className = 'xp-pop'; el.textContent = txt;
    el.style.color = amt > 0 ? 'var(--gold2)' : '#FF8C42';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms || 1300);
}

function getLevel(){
    for (let i = 5; i >= 1; i--) if (S.xp >= LEVELS[i].xp) return { ...LEVELS[i], lvl:i, next:LEVELS[i+1] };
    return { ...LEVELS[1], lvl:1, next:LEVELS[2] };
}

function updateHUD(){
    const L = getLevel();
    document.getElementById('lvl-icon').textContent = L.icon;
    document.getElementById('lvl-name').textContent = `Niveau ${L.lvl} · ${L.name}`;
    document.getElementById('lvl-sub').textContent = L.full;
    document.getElementById('xp-pill').textContent = `${S.xp} XP`;
    const sb = document.getElementById('streak-bar');
    const d = daysAlive();
    sb.textContent = `🔥 ${d} j · ⚡ ${S.streak}`;
    sb.className = 'streak-bar' + (d >= 3 || S.streak >= 5 ? ' hot' : '');
    sb.setAttribute('aria-label', `${d} jours de suite, ${S.streak} bonnes réponses d'affilée`);
    const prev = L.xp;
    const pct = L.next ? Math.min(100, ((S.xp - prev) / (L.next.xp - prev)) * 100) : 100;
    document.getElementById('prog-fill').style.width = pct + '%';
    const gp = Math.min(100, (S.dailyXP / MAX_D) * 100);
    document.getElementById('goal-fill').style.width = gp + '%';
    document.getElementById('goal-txt').textContent =
        S.dailyXP >= MAX_D ? '🎉 Objectif du jour atteint' : `Objectif du jour : ${S.dailyXP} / ${MAX_D} XP`;
    let dots = '';
    for (let i = 1; i <= 5; i++){
        const done = S.xp >= LEVELS[i].xp, now = i === L.lvl;
        dots += `<div class="lvl-dot ${done?'done':''} ${now?'now':''}">
                 <div class="lvl-dot-c">${LEVELS[i].icon}</div>
                 <span class="lvl-dot-lbl">${LEVELS[i].name}</span>
               </div>`;
    }
    document.getElementById('lvl-dots').innerHTML = dots;
}

/* ─── NAVIGATION ─────────────────────────────────────────────────── */
function stopTimers(){ clearInterval(S.rushTimer); clearTimeout(S.memTimer); try{ window.speechSynthesis.cancel(); }catch(e){} }

function goGame(){
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    checkDailyReset(); updateHUD(); setMode('flashcard');
}
function goHome(){
    stopTimers(); closeOverlay();
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    S.sess = { n:0, ok:0, xp:0, ko:{}, badges:[] };
    updateHomeStats();
}
function onBack(){
    if (S.sess.n > 0) showSummary(); else goHome();
}

const MODES = [
    ['flashcard','📚 Cards'],['quiz','❓ Quiz'],['review','🎯 Revoir'],['memory','🃏 Memory'],
    ['listening','👂 Audio'],['roleplay','🎭 Service'],['recipe','📜 Recipes'],
    ['rush','⏱️ Rush'],['translation','📖 Traduction'],['conversion','🔢 Calculs'],['world','🌍 World']
];
function renderModeMenu(){
    const menu = document.getElementById('mode-menu');
    menu.innerHTML = MODES.map(([m,l]) => `<button class="menu-btn ${S.mode===m?'active':''}" data-mode="${m}">${l}</button>`).join('');
    centerActive(menu);
}

function curDB(){ return S.mode === 'translation' ? DB_TRANS : DB; }
function curTheme(){ return S.mode === 'translation' ? S.transTheme : (S.mode === 'quiz' ? S.quizTheme : S.theme); }

function renderThemeMenu(show){
    const menu = document.getElementById('theme-menu');
    if (!show){ menu.style.display = 'none'; menu.innerHTML = ''; return; }
    menu.style.display = 'flex';
    const cur = curTheme();
    const keys = Object.keys(curDB());
    if (S.mode === 'quiz') keys.unshift(ALL_THEME);
    menu.innerHTML = keys.map(k => `<button class="menu-btn ${k===cur?'active':''}" data-theme="${esc(k)}">${esc(k)}</button>`).join('');
    centerActive(menu);
}
const QUIZ_TYPES = [['mix','🎲 Mixte'],['fr-en','FR → EN'],['en-fr','EN → FR'],['spell','✍️ Épeler'],['cloze','📝 Phrases']];
function renderTypeMenu(show){
    const menu = document.getElementById('type-menu');
    if (!show){ menu.style.display = 'none'; menu.innerHTML = ''; return; }
    menu.style.display = 'flex';
    menu.innerHTML = QUIZ_TYPES.map(([t,l]) => `<button class="menu-btn sm ${S.quizType===t?'active':''}" data-qt="${t}">${l}</button>`).join('');
    centerActive(menu);
}
function centerActive(menu){
    const a = menu.querySelector('.active');
    if (a) menu.scrollLeft = a.offsetLeft - (menu.clientWidth - a.clientWidth) / 2;
}

function setMode(m){
    stopTimers();
    S.mode = m; S.flipped = false; S.idx = 0;
    renderModeMenu();
    const usesThemes = (m === 'flashcard' || m === 'quiz' || m === 'translation');
    renderThemeMenu(usesThemes);
    renderTypeMenu(m === 'quiz' || m === 'review');
    if (m === 'flashcard' || m === 'translation') S.deck = shuffle([...curDB()[curTheme()]]);
    switch (m){
        case 'flashcard': case 'translation': renderFlashcard(); break;
        case 'quiz': case 'review': nextQuiz(); break;
        case 'listening': initListening(); break;
        case 'roleplay':  initRoleplay(); break;
        case 'recipe':    initRecipe(); break;
        case 'rush':      renderRush('idle'); break;
        case 'memory':    initMemory(); break;
        case 'conversion':initConversion(); break;
        case 'world':     initWorld(); break;
    }
}

function setTheme(th){
    if (S.mode === 'translation') S.transTheme = th;
    else if (S.mode === 'quiz') S.quizTheme = th;
    else S.theme = th;
    renderThemeMenu(true);
    if (S.mode === 'quiz'){ nextQuiz(); return; }
    S.deck = shuffle([...curDB()[th]]); S.idx = 0; S.flipped = false;
    renderFlashcard();
}
function setQuizType(t){
    S.quizType = t; store.set('pep_qt', t);
    renderTypeMenu(true); nextQuiz();
}

/* ─── FLASHCARD / TRADUCTION ─────────────────────────────────────── */
function renderFlashcard(){
    const item = S.deck[S.idx], trans = S.mode === 'translation';
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl ${trans?'lav':''}">${trans?'📖 Traduction':'📚 Flashcard'} · ${esc(curTheme())}</div>
        <div class="fc-count">🧁 ${S.idx+1} / ${S.deck.length}</div>
        <div class="fc-word ${S.flipped?'flip':''}" id="fc-w" role="button" tabindex="0">${esc(S.flipped?item.en:item.fr)}</div>
        ${S.flipped?`<div class="fc-ex">"${esc(item.ex)}"</div>`:`<div class="fc-hint">Touchez le mot pour retourner</div>`}
    `;
    const rate = (S.flipped && !trans) ? `
        <div class="btn-row" style="margin-bottom:8px">
            <button class="btn-nav danger" id="fc-ko">✗ À revoir</button>
            <button class="btn-nav success" id="fc-ok">✓ Je savais</button>
        </div>` : '';
    document.getElementById('ctrl-area').innerHTML = rate + `
        <div class="btn-row">
            <button class="btn-nav" id="fc-p" ${S.idx===0?'disabled':''} aria-label="Précédent">◀</button>
            <button class="btn-sound" id="fc-s" aria-label="Écouter">🔊</button>
            <button class="btn-nav" id="fc-n">Suivant ▶</button>
        </div>
    `;
    const flip = () => {
        S.flipped = !S.flipped;
        if (S.flipped){ earnXP(trans?5:3, trans?'translation':'flashcard'); speak(item.en); }
        renderFlashcard();
    };
    const next = () => {
        S.idx = (S.idx + 1) % S.deck.length;
        if (S.idx === 0) S.deck = shuffle(S.deck);
        S.flipped = false; renderFlashcard();
    };
    const w = document.getElementById('fc-w');
    w.addEventListener('click', flip);
    w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } });
    document.getElementById('fc-p').addEventListener('click', () => { if (S.idx > 0){ S.idx--; S.flipped = false; renderFlashcard(); } });
    document.getElementById('fc-n').addEventListener('click', next);
    document.getElementById('fc-s').addEventListener('click', () => speak(item.en));
    if (rate){
        document.getElementById('fc-ok').addEventListener('click', () => { recordAnswer(item, true);  next(); });
        document.getElementById('fc-ko').addEventListener('click', () => { recordAnswer(item, false); next(); });
    }
}

/* ─── QUIZ (4 formats) + MOTS DIFFICILES ─────────────────────────── */
function quizPool(){
    if (S.mode === 'review') return hardWords();
    return S.quizTheme === ALL_THEME ? ALL : ALL.filter(w => w.theme === S.quizTheme);
}
function clozeOf(item){
    const re = new RegExp('\\b' + item.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return re.test(item.ex) ? item.ex.replace(re, '_____') : null;
}
function buildOpts(item, type){
    const field = type === 'en-fr' ? 'fr' : 'en';
    const ans = item[field], seen = new Set([ans.toLowerCase()]), picks = [];
    const sib   = ALL.filter(w => w.theme === item.theme);
    const other = ALL.filter(w => w.theme !== item.theme);
    for (const w of shuffle(sib).concat(shuffle(other))){
        const t = w[field], k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k); picks.push(t);
        if (picks.length === 3) break;
    }
    return shuffle([ans, ...picks]);
}
function nextQuiz(){
    const pool = quizPool();
    if (!pool.length){ renderQuizEmpty(); return; }
    const item = smartPick(pool, S.mode === 'review');
    let type = S.quizType;
    if (type === 'mix') type = rnd(['fr-en','fr-en','en-fr','spell','cloze']);
    if (type === 'cloze' && !clozeOf(item)) type = 'fr-en';
    const q = { item, type, answered:false, ok:false, pick:-1, typed:'' };
    if (type !== 'spell') q.opts = buildOpts(item, type);
    S.q = q;
    renderQuiz();
}
function renderQuizEmpty(){
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl">🎯 Mots à revoir</div>
        <div style="text-align:center;padding:10px 0">
            <div style="font-size:3rem">🎉</div>
            <p style="color:var(--cream);font-weight:600;margin:8px 0">Aucun mot difficile pour le moment !</p>
            <p style="color:var(--muted);font-size:0.82rem;line-height:1.5">Les mots que vous ratez dans le Quiz, le Rush ou les Cards (« À revoir ») apparaîtront ici.</p>
        </div>`;
    document.getElementById('ctrl-area').innerHTML = `<button class="btn-nav action" id="rv-q">Aller au Quiz →</button>`;
    document.getElementById('rv-q').addEventListener('click', () => setMode('quiz'));
}
function quizHeader(){
    if (S.mode === 'review') return `🎯 Revoir · ${hardWords().length} mot(s) difficile(s)`;
    const pool = quizPool();
    return `❓ Quiz · ${esc(S.quizTheme)} · ${masteredCount(pool)}/${pool.length} maîtrisés`;
}
function renderQuiz(){
    const q = S.q, item = q.item, a = q.answered;
    const field = q.type === 'en-fr' ? 'fr' : 'en';
    let body = '';
    if (q.type === 'spell'){
        body = `
            <div class="quiz-q">Type the English word:<b>${esc(item.fr)}</b></div>
            <input class="rush-input" id="sp-in" type="text" placeholder="Type in English…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${a?'disabled':''} value="${esc(q.typed)}">
            ${a?`<div class="hint-box">${q.ok?'✓ Correct !':'✗ Answer: <b>'+esc(item.en)+'</b>'}<br><i>"${esc(item.ex)}"</i></div>`:''}`;
    } else {
        if (q.type === 'fr-en')      body = `<div class="quiz-q">Translate to English:<b>${esc(item.fr)}</b></div>`;
        else if (q.type === 'en-fr') body = `<div class="quiz-q">Traduisez en français :<b>${esc(item.en)}</b></div>`;
        else                         body = `<div class="quiz-q">Complete the sentence:<b class="cloze">${esc(a ? item.ex : clozeOf(item))}</b></div>`;
        body += `<div class="quiz-opts">${q.opts.map((o,i) => {
            let cls = 'quiz-opt';
            if (a){ if (o === item[field]) cls += ' correct'; else if (i === q.pick) cls += ' wrong'; }
            return `<button class="${cls}" data-qi="${i}" ${a?'disabled':''}>${esc(o)}</button>`;
        }).join('')}</div>`;
        if (a && q.type === 'cloze') body += `<div class="hint-box">${esc(item.fr)} = <b>${esc(item.en)}</b></div>`;
    }
    document.getElementById('game-card').innerHTML = `<div class="mode-lbl">${quizHeader()}</div>${body}`;

    const ctrl = document.getElementById('ctrl-area');
    if (!a){
        ctrl.innerHTML = q.type === 'spell'
            ? `<div class="btn-row"><button class="btn-nav" id="q-skip">Skip →</button><button class="btn-nav action" id="q-ok">Valider</button></div>`
            : `<button class="btn-nav" id="q-skip">Skip →</button>`;
        document.getElementById('q-skip').addEventListener('click', nextQuiz);
        if (q.type === 'spell'){
            const inp = document.getElementById('sp-in');
            inp.focus();
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitSpell(); });
            document.getElementById('q-ok').addEventListener('click', submitSpell);
        } else {
            document.querySelectorAll('[data-qi]').forEach(b => b.addEventListener('click', () => answerChoice(parseInt(b.dataset.qi))));
        }
    } else {
        ctrl.innerHTML = `<div class="btn-row">
            <button class="btn-sound" id="q-snd" aria-label="Écouter">🔊</button>
            <button class="btn-nav ${q.ok?'success':'danger'}" id="q-n">${q.ok?'✓ Correct ! Suivant →':'✗ '+esc(item[field])+' →'}</button></div>`;
        document.getElementById('q-snd').addEventListener('click', () => speak(item.en));
        document.getElementById('q-n').addEventListener('click', nextQuiz);
    }
}
function answerChoice(i){
    const q = S.q; if (q.answered) return;
    const field = q.type === 'en-fr' ? 'fr' : 'en';
    q.answered = true; q.pick = i; q.ok = q.opts[i] === q.item[field];
    finishQuiz();
}
function submitSpell(){
    const q = S.q; if (q.answered) return;
    const v = document.getElementById('sp-in').value;
    if (!v.trim()) return;
    q.answered = true; q.typed = v; q.ok = matches(v, q.item);
    finishQuiz();
}
function finishQuiz(){
    const q = S.q;
    recordAnswer(q.item, q.ok);
    if (q.ok){
        earnXP(q.type === 'spell' ? 12 : (q.type === 'cloze' ? 10 : 8), 'quiz');
        if (q.type === 'spell') bumpCount('spell');
    } else loseStreak();
    renderQuiz();
}

/* ─── LISTENING ──────────────────────────────────────────────────── */
function initListening(){
    const d = draw('listen', LISTENING.length);
    S.listenItem = LISTENING[d.i]; S.listenPos = d.pos;
    const r = shuffleWithIdx(S.listenItem.opts, S.listenItem.opts.indexOf(S.listenItem.ans));
    S.listenOpts = r.items; S.listenOk = r.ci;
    renderListening(null);
    speak(S.listenItem.audio);
}
function renderListening(sel){
    const item = S.listenItem, opts = S.listenOpts, ans = sel !== null;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl">👂 Listening · ${S.listenPos}/${LISTENING.length}</div>
        <p style="color:var(--muted);font-size:0.82rem;margin-bottom:4px;">Listen and choose:</p>
        <button class="listen-btn" id="la" aria-label="Écouter">🔊</button>
        <div class="quiz-opts">${opts.map((o,i)=>{let cls='quiz-opt';if(ans){if(i===S.listenOk)cls+=' correct';else if(i===sel)cls+=' wrong';}return`<button class="${cls}" data-li="${i}" ${ans?'disabled':''}>${esc(o)}</button>`;}).join('')}</div>
        ${ans?`<div class="hint-box">🔊 "${esc(item.audio)}"</div>`:''}
    `;
    document.getElementById('la').addEventListener('click', () => speak(item.audio));
    if (!ans) document.querySelectorAll('[data-li]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.dataset.li), ok = i === S.listenOk;
        sessionTick(ok);
        if (ok) earnXP(12, 'listening'); else loseStreak();
        renderListening(i);
    }));
    document.getElementById('ctrl-area').innerHTML = ans ? `<button class="btn-nav ${sel===S.listenOk?'success':'danger'}" id="la-n">${sel===S.listenOk?'✓ Correct ! Suivant →':'✗ '+esc(item.ans)+' → Suivant'}</button>` : '';
    if (ans) document.getElementById('la-n').addEventListener('click', initListening);
}

/* ─── ROLEPLAY (dialogues à 1, 2 ou 3 répliques) ─────────────────── */
function initRoleplay(){
    const d = draw('role', ROLE_ALL.length);
    S.roleItem = ROLE_ALL[d.i]; S.roleTurn = 0;
    prepRoleTurn(); renderRoleplay(null);
}
function prepRoleTurn(){
    const t = S.roleItem.turns[S.roleTurn];
    const r = shuffleWithIdx(t.opts, t.ok);
    S.roleOpts = r.items; S.roleOk = r.ci;
}
function renderRoleplay(sel){
    const item = S.roleItem, turn = item.turns[S.roleTurn], opts = S.roleOpts, ci = S.roleOk, ans = sel !== null;
    const multi = item.turns.length > 1, last = S.roleTurn === item.turns.length - 1;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl">🎭 Service Scenario${multi?` · ${S.roleTurn+1}/${item.turns.length}`:''}</div>
        <div class="role-box"><div class="role-scene">${esc(item.scene)}</div><div class="role-dialog">"${esc(turn.ctx)}"</div></div>
        <p style="font-size:0.76rem;color:var(--muted);margin-bottom:10px;">Choose the best response:</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${opts.map((o,i)=>{let s='';if(ans){if(i===ci)s='border-color:var(--green2);background:rgba(58,112,88,0.15);color:var(--green2)';else if(i===sel)s='border-color:var(--wrong2);background:rgba(136,40,40,0.15);color:var(--wrong2)';}return`<button class="quiz-opt" style="text-align:left;justify-content:flex-start;${s}" data-ri="${i}" ${ans?'disabled':''}>${esc(o)}</button>`;}).join('')}
        </div>
        ${ans?`<div class="hint-box">💡 ${esc(turn.tip)}</div>`:''}
    `;
    document.getElementById('ctrl-area').innerHTML = ans ? `<button class="btn-nav action" id="rp-n">${last?'Next Scenario →':'Continue the conversation →'}</button>` : '';
    if (!ans) document.querySelectorAll('[data-ri]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.dataset.ri), ok = i === ci;
        sessionTick(ok);
        if (ok) earnXP(15, 'roleplay'); else loseStreak();
        renderRoleplay(i);
    }));
    if (ans) document.getElementById('rp-n').addEventListener('click', () => {
        if (last) initRoleplay();
        else { S.roleTurn++; prepRoleTurn(); renderRoleplay(null); }
    });
}

/* ─── RECIPE ─────────────────────────────────────────────────────── */
function initRecipe(){
    const d = draw('recipe', RECIPES.length);
    S.recipeItem = RECIPES[d.i];
    let s, tries = 0;
    do { s = shuffle([...S.recipeItem.steps]); tries++; }
    while (s.every((x,i) => x === S.recipeItem.steps[i]) && tries < 20);
    S.userSteps = s; S.selStep = null; S.recipeDone = false; renderRecipe();
}
function renderRecipe(){
    const r = S.recipeItem, done = S.recipeDone;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl">📜 Put the steps in order</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:34px;height:34px;border-radius:50%;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🧁</div>
            <div><div style="font-size:0.62rem;color:var(--rose2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Recipe</div><div style="font-weight:600;color:var(--cream)">${esc(r.name)}</div></div>
        </div>
        <p style="font-size:0.74rem;color:var(--muted);margin-bottom:10px;">Tap 2 steps to swap them</p>
        <div style="display:flex;flex-direction:column;gap:6px;">
            ${S.userSteps.map((s,i)=>`<div class="recipe-step ${S.selStep===i?'selected':''} ${done?'done':''}" data-si="${i}" role="button" tabindex="0"><div class="step-num">${done?'✓':i+1}</div>${esc(s)}</div>`).join('')}
        </div>
    `;
    document.querySelectorAll('[data-si]').forEach(d => d.addEventListener('click', () => {
        if (S.recipeDone) return;
        const i = parseInt(d.dataset.si);
        if (S.selStep === null){ S.selStep = i; }
        else {
            [S.userSteps[S.selStep], S.userSteps[i]] = [S.userSteps[i], S.userSteps[S.selStep]];
            S.selStep = null;
            if (S.userSteps.every((s,k) => s === r.steps[k])){ S.recipeDone = true; sessionTick(true); earnXP(25, 'recipe'); }
        }
        renderRecipe();
    }));
    document.getElementById('ctrl-area').innerHTML = `<button class="btn-nav ${done?'success':'action'}" id="r-n">${done?'✓ Validated! New Recipe →':'🔄 New Recipe'}</button>`;
    document.getElementById('r-n').addEventListener('click', initRecipe);
}

/* ─── RUSH (temps adapté à la longueur du mot + indice) ──────────── */
function hintText(en){
    return en.split('').map((c,i) => (i === 0 || !/[A-Za-z0-9]/.test(c)) ? c : '_').join(' ');
}
function renderRush(state){
    const area = document.getElementById('game-card'), ctrl = document.getElementById('ctrl-area');
    clearInterval(S.rushTimer);
    if (state === 'idle'){
        area.innerHTML = `<div class="mode-lbl">⏱️ Rush Challenge</div><h3 style="font-family:'Libre Baskerville',serif;color:var(--cream);margin-bottom:8px;font-size:1.3rem;">🧁 Pastry Rush</h3><p style="color:var(--muted);font-size:0.82rem;line-height:1.5">Type the English word before the clock runs out. The time depends on the word length, and a hint appears after 7 seconds.</p>`;
        ctrl.innerHTML = `<button class="btn-nav action" id="rush-go">▶ Start</button>`;
        document.getElementById('rush-go').addEventListener('click', startRush); return;
    }
    if (state === 'win'){
        area.innerHTML = `<div style="text-align:center"><div style="font-size:3rem">✅</div><div style="color:var(--green2);font-weight:700;font-size:1.3rem;margin:8px 0">Correct!</div><div style="color:var(--muted)">${esc(S.rushItem.en)}</div></div>`;
        ctrl.innerHTML = `<button class="btn-nav success" id="rush-n">Next ▶</button>`;
        document.getElementById('rush-n').addEventListener('click', startRush); return;
    }
    if (state === 'lose'){
        area.innerHTML = `<div style="text-align:center"><div style="font-size:3rem">⏰</div><div style="color:var(--wrong2);font-weight:700;font-size:1.3rem;margin:8px 0">Time's up!</div><div style="color:var(--muted)">Answer: <strong style="color:var(--cream)">${esc(S.rushItem.en)}</strong></div></div>`;
        ctrl.innerHTML = `<button class="btn-nav action" id="rush-r">Next ▶</button>`;
        document.getElementById('rush-r').addEventListener('click', startRush); return;
    }
    area.innerHTML = `
        <div class="mode-lbl">⏱️ Rush</div>
        <div class="rush-timer ${S.rushLeft<5?'danger':''}" id="rush-t">${S.rushLeft.toFixed(1)}s</div>
        <div class="fc-word" style="color:var(--cream);cursor:default">${esc(S.rushItem.fr)}</div>
        <input class="rush-input" id="rush-i" type="text" placeholder="Type in English…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
        <div class="fc-hint" id="rush-h" style="text-align:center;min-height:1.2em;letter-spacing:0.12em"></div>
    `;
    ctrl.innerHTML = '';
    const inp = document.getElementById('rush-i'); inp.focus();
    inp.addEventListener('input', () => {
        if (matches(inp.value, S.rushItem)){
            clearInterval(S.rushTimer);
            recordAnswer(S.rushItem, true); bumpCount('rush'); earnXP(18, 'rush');
            renderRush('win');
        }
    });
    S.rushTimer = setInterval(() => {
        S.rushLeft -= 0.1;
        const t = document.getElementById('rush-t');
        if (t){ t.textContent = Math.max(0, S.rushLeft).toFixed(1) + 's'; t.className = 'rush-timer' + (S.rushLeft < 5 ? ' danger' : ''); }
        const h = document.getElementById('rush-h');
        if (h && !h.textContent && (S.rushTotal - S.rushLeft) >= 7) h.textContent = 'Hint: ' + hintText(S.rushItem.en);
        if (S.rushLeft <= 0){
            clearInterval(S.rushTimer);
            recordAnswer(S.rushItem, false); loseStreak();
            renderRush('lose');
        }
    }, 100);
}
function startRush(){
    S.rushItem = smartPick(ALL);
    S.rushTotal = Math.min(25, Math.max(10, Math.round(6 + S.rushItem.en.length * 0.7)));
    S.rushLeft = S.rushTotal;
    renderRush('play');
}

/* ─── MEMORY : retrouve les paires FR ↔ EN ───────────────────────── */
const MEM_PAIRS = 6;
function initMemory(){
    clearTimeout(S.memTimer);
    const seen = new Set();
    const pool = ALL.filter(x => {
        if (x.fr.length > 24 || x.en.length > 22 || seen.has(x.en) || seen.has(x.fr)) return false;
        seen.add(x.en); seen.add(x.fr); return true;
    });
    const picks = shuffle(pool).slice(0, MEM_PAIRS);
    const cards = [];
    picks.forEach((p,i) => {
        cards.push({ pair:i, lang:'fr', txt:p.fr, en:p.en });
        cards.push({ pair:i, lang:'en', txt:p.en, en:p.en });
    });
    S.mem = { cards:shuffle(cards), open:[], matched:[], moves:0, lock:false, done:false };
    renderMemory();
}
function renderMemory(){
    const m = S.mem;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl">🃏 Memory · Find the pairs</div>
        <div class="mem-info"><span>Coups : <b>${m.moves}</b></span><span>Paires : <b>${m.matched.length}/${MEM_PAIRS}</b></span></div>
        <div class="mem-grid">
            ${m.cards.map((c,i) => {
                const isM = m.matched.includes(c.pair), shown = isM || m.open.includes(i);
                const label = shown ? c.txt : 'Carte cachée';
                return `<button class="mem-card ${shown?'shown '+c.lang:''} ${isM?'matched':''}" data-mi="${i}" aria-label="${esc(label)}">${shown?esc(c.txt):'🧁'}</button>`;
            }).join('')}
        </div>
        <div class="mem-legend"><span class="f">● Français</span><span class="e">● English</span></div>
        ${m.done?`<div class="hint-box">🎉 Bravo ! Terminé en ${m.moves} coups.</div>`:''}
    `;
    document.getElementById('ctrl-area').innerHTML = `<button class="btn-nav ${m.done?'success':'action'}" id="mem-new">${m.done?'🎉 Rejouer':'🔄 Nouvelle partie'}</button>`;
    document.getElementById('mem-new').addEventListener('click', initMemory);
    document.querySelectorAll('[data-mi]').forEach(b => b.addEventListener('click', () => memClick(parseInt(b.dataset.mi))));
}
function memClick(i){
    const m = S.mem;
    if (!m || m.lock || m.done) return;
    const c = m.cards[i];
    if (m.open.includes(i) || m.matched.includes(c.pair)) return;
    m.open.push(i);
    if (c.lang === 'en') speak(c.txt);
    if (m.open.length === 2){
        m.moves++;
        const a = m.cards[m.open[0]], b = m.cards[m.open[1]];
        if (a.pair === b.pair){
            m.matched.push(a.pair); m.open = [];
            sessionTick(true);
            earnXP(10, 'memory');
            if (m.matched.length === MEM_PAIRS){
                m.done = true;
                earnXP(m.moves <= 8 ? 25 : (m.moves <= 12 ? 15 : 8), 'memory');
                if (m.moves <= 8) award('mem8');
            }
        } else {
            sessionTick(false);
            m.lock = true;
            S.memTimer = setTimeout(() => {
                if (S.mem !== m) return;
                m.open = []; m.lock = false; renderMemory();
            }, 1000);
        }
    }
    renderMemory();
}

/* ─── CALCULS CAP ────────────────────────────────────────────────── */
function initConversion(){
    const d = draw('conv', CONVERSIONS.length);
    S.convItem = CONVERSIONS[d.i]; S.convPos = d.pos;
    const r = shuffleWithIdx(S.convItem.opts, S.convItem.ok);
    S.convOpts = r.items; S.convOk = r.ci;
    renderConversion();
}
function renderConversion(){
    const ex = S.convItem, opts = S.convOpts;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl lav">🔢 Calculs CAP · ${S.convPos}/${CONVERSIONS.length}</div>
        <div style="background:var(--bg2);border-radius:var(--r);padding:13px;margin:8px 0;">
            <p style="color:var(--text);font-size:0.86rem;line-height:1.6">${esc(ex.q)}</p>
        </div>
        <div class="quiz-opts">
            ${opts.map((o,i) => `<button class="quiz-opt" data-ci="${i}" style="font-weight:600">${esc(o)}</button>`).join('')}
        </div>
        <div id="conv-res"></div>
    `;
    document.getElementById('ctrl-area').innerHTML = '';
    let answered = false;
    document.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => {
        if (answered) return; answered = true;
        const i = parseInt(b.dataset.ci), ok = i === S.convOk;
        document.querySelectorAll('[data-ci]').forEach(x => {
            const k = parseInt(x.dataset.ci); x.disabled = true;
            if (k === S.convOk) x.classList.add('correct'); else if (k === i) x.classList.add('wrong');
        });
        sessionTick(ok);
        if (ok) earnXP(15, 'conversion'); else loseStreak();
        document.getElementById('conv-res').innerHTML = `<div class="hint-box">💡 ${esc(ex.why)}</div>`;
        document.getElementById('ctrl-area').innerHTML = `<button class="btn-nav ${ok?'success':'action'}" id="cv-n">${ok?'✓ Correct ! Suivant →':'Suivant →'}</button>`;
        document.getElementById('cv-n').addEventListener('click', initConversion);
    }));
}

/* ─── WORLD ──────────────────────────────────────────────────────── */
function initWorld(){
    const d = draw('world', WORLD.length);
    S.worldItem = WORLD[d.i]; S.worldPos = d.pos;
    const others = shuffle(WORLD.filter(w => w.ans !== S.worldItem.ans).map(w => w.ans)).slice(0, 3);
    S.worldOpts = shuffle([S.worldItem.ans, ...others]);
    renderWorld(null);
}
function renderWorld(sel){
    const item = S.worldItem, opts = S.worldOpts, ans = sel !== null;
    document.getElementById('game-card').innerHTML = `
        <div class="mode-lbl lav">🌍 World Pastry · ${S.worldPos}/${WORLD.length}</div>
        <p style="color:var(--muted);font-size:0.82rem;margin-bottom:8px">What is this pastry?</p>
        <div class="world-q">${item.flag} ${esc(item.q)}</div>
        <div class="quiz-opts">${opts.map((o,i)=>{let cls='quiz-opt';if(ans){if(o===item.ans)cls+=' correct';else if(i===sel)cls+=' wrong';}return`<button class="${cls}" data-wo="${i}" ${ans?'disabled':''}>${esc(o)}</button>`;}).join('')}</div>
    `;
    if (!ans) document.querySelectorAll('[data-wo]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.dataset.wo), ok = opts[i] === item.ans;
        sessionTick(ok);
        if (ok) earnXP(12, 'world'); else loseStreak();
        renderWorld(i);
    }));
    document.getElementById('ctrl-area').innerHTML = ans ? `<button class="btn-nav ${opts[sel]===item.ans?'success':'action'}" id="wo-n">${opts[sel]===item.ans?'✓ Correct ! Next ▶':'Next ▶'}</button>` : '';
    if (ans) document.getElementById('wo-n').addEventListener('click', initWorld);
}

/* ─── RÉSUMÉ DE SESSION ──────────────────────────────────────────── */
function closeOverlay(){ const o = document.getElementById('overlay'); if (o) o.remove(); }
function showSummary(){
    closeOverlay();
    const s = S.sess, pct = s.n ? Math.round(s.ok / s.n * 100) : 0;
    const hard = Object.values(s.ko).slice(0, 8);
    const el = document.createElement('div');
    el.id = 'overlay'; el.className = 'overlay';
    el.innerHTML = `
        <div class="sheet" role="dialog" aria-modal="true" aria-label="Résumé de session">
            <div class="mode-lbl">📊 Résumé de session</div>
            <div class="sum-grid">
                <div><b>${s.n}</b><span>réponses</span></div>
                <div><b>${pct}%</b><span>réussite</span></div>
                <div><b>+${s.xp}</b><span>XP</span></div>
            </div>
            ${s.badges.length ? `<div class="hint-box">🏅 ${s.badges.map(b => esc(b.name)).join(' · ')}</div>` : ''}
            ${hard.length ? `<div class="sum-title">À revoir</div>
                <ul class="sum-list">${hard.map(w => `<li><span>${esc(w.fr)}</span><b>${esc(w.en)}</b></li>`).join('')}</ul>` :
                `<p style="color:var(--green2);font-size:0.85rem;margin-top:10px">Aucun mot raté, bravo ! 🎉</p>`}
            <div class="btn-row" style="margin-top:16px">
                <button class="btn-nav" id="sum-go">Continuer</button>
                <button class="btn-nav action" id="sum-home">Accueil</button>
            </div>
        </div>`;
    document.body.appendChild(el);
    document.getElementById('sum-go').addEventListener('click', closeOverlay);
    document.getElementById('sum-home').addEventListener('click', goHome);
}

/* ─── ACCUEIL, SAUVEGARDE, INSTALLATION ──────────────────────────── */
function updateHomeStats(){
    checkDailyReset();
    const due = dueCount(), d = daysAlive();
    if (S.xp > 0){
        const L = getLevel();
        document.getElementById('home-stats').style.display = 'block';
        document.getElementById('h-icon').textContent = L.icon;
        document.getElementById('h-name').textContent = `Niveau ${L.lvl} · ${L.name}`;
        document.getElementById('h-xp').textContent = `${S.xp} XP${d>0?' · 🔥 '+d+' j':''}`;
        document.getElementById('h-extra').textContent = due > 0 ? `📌 ${due} mot${due>1?'s':''} à réviser aujourd'hui` : '✨ Rien à réviser pour le moment';
        document.getElementById('h-badges').innerHTML = BADGE_LIST.map(b =>
            `<span class="badge ${BADGES.includes(b.id)?'on':''}" title="${esc(b.name)}">${b.icon}</span>`).join('');
    }
}
function countTerms(){ return ALL.length + Object.values(DB_TRANS).flat().length; }

function exportProgress(){
    const data = {};
    try{ for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k.startsWith('pep_')) data[k] = localStorage.getItem(k); } }catch(e){}
    const blob = new Blob([JSON.stringify({ app:'pastry-english-pro', v:5, date:todayStr(), data }, null, 1)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pastry-english-pro-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importProgress(file){
    const rd = new FileReader();
    rd.onload = () => {
        try{
            const o = JSON.parse(rd.result);
            if (o.app !== 'pastry-english-pro' || !o.data) throw 0;
            Object.entries(o.data).forEach(([k,v]) => { if (k.startsWith('pep_') && typeof v === 'string') store.set(k, v); });
            popup('✓ Progression restaurée', 1, 1500);
            setTimeout(() => location.reload(), 1200);
        }catch(e){ popup('✗ Fichier non valide', 0, 2200); }
    };
    rd.readAsText(file);
}

let deferredInstall = null;
function setupInstall(){
    const standalone = window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (standalone) return;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const btn = document.getElementById('btn-install'), hint = document.getElementById('install-hint');
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault(); deferredInstall = e; btn.style.display = 'block';
    });
    btn.addEventListener('click', async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        try{ await deferredInstall.userChoice; }catch(e){}
        deferredInstall = null; btn.style.display = 'none';
    });
    if (isIOS){
        hint.style.display = 'block';
        hint.innerHTML = "📲 Pour installer l'app : touchez <b>Partager</b> (carré avec une flèche) puis <b>« Sur l'écran d'accueil »</b>.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkDailyReset(); updateHomeStats(); checkBadges();
    document.getElementById('home-count').textContent = `${countTerms()} termes · ${MODES.length} exercices`;
    document.getElementById('btn-start').addEventListener('click', goGame);
    document.getElementById('btn-back').addEventListener('click', onBack);
    document.getElementById('mode-menu').addEventListener('click', e => {
        const btn = e.target.closest('[data-mode]'); if (btn) setMode(btn.dataset.mode);
    });
    document.getElementById('theme-menu').addEventListener('click', e => {
        const btn = e.target.closest('[data-theme]'); if (btn) setTheme(btn.dataset.theme);
    });
    document.getElementById('type-menu').addEventListener('click', e => {
        const btn = e.target.closest('[data-qt]'); if (btn) setQuizType(btn.dataset.qt);
    });
    document.getElementById('btn-export').addEventListener('click', exportProgress);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', e => { if (e.target.files[0]) importProgress(e.target.files[0]); });
    setupInstall();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});

/* Light in Bethlehem: rehearsal site.
   Everything is built from script.md and songs.json, so the director only edits those two files. */
(function () {
  'use strict';

  // ---------- Roles ----------
  // id: the speaker name as written in the script (**MARY:**)
  // keys: words that, in a stage direction, mean this role is on stage
  // color: index into the --c0 … --c11 character colours
  var ROLE_DEFS = [
    { id: 'NARRATOR 1', label: 'Narrator 1', keys: ['narrator 1', 'narrators'], color: 7 },
    { id: 'NARRATOR 2', label: 'Narrator 2', keys: ['narrator 2', 'narrators'], color: 9 },
    { id: 'MARY', label: 'Mary', keys: ['mary'], color: 11 },
    { id: 'JOSEPH', label: 'Joseph', keys: ['joseph'], color: 5 },
    { id: 'GABRIEL', label: 'Angel Gabriel', keys: ['gabriel'], color: 1 },
    { id: 'ISAIAH', label: 'Prophet Isaiah', keys: ['isaiah', 'prophets'], color: 3 },
    { id: 'MICAH', label: 'Prophet Micah', keys: ['micah', 'prophets'], color: 10 },
    { id: 'TOWN CRIER', label: 'Town Crier', keys: ['town crier'], color: 0 },
    { id: 'MADAM CHIOMA', label: 'Madam Chioma', keys: ['madam chioma', 'innkeepers'], color: 10 },
    { id: 'BABA TUNDE', label: 'Baba Tunde', keys: ['baba tunde', 'innkeepers'], color: 2 },
    { id: 'MALLAM SANI', label: 'Mallam Sani', keys: ['mallam sani', 'innkeepers'], color: 6 },
    { id: 'NGOZI', label: 'Ngozi', keys: ['ngozi', 'shepherds'], color: 10 },
    { id: 'EMEKA', label: 'Emeka', keys: ['emeka', 'shepherds'], color: 6 },
    { id: 'SHEPHERD 3', label: 'Shepherd 3', keys: ['shepherds'], color: 2 },
    { id: 'ANGEL CHOIR', label: 'Angel choir', keys: ['angel choir', 'angels'], color: 8 },
    { id: 'HEROD', label: 'King Herod', keys: ['herod'], color: 0 },
    { id: 'ADVISER', label: "Herod's Adviser", keys: ['adviser'], color: 4 },
    { id: 'WISE MAN 1', label: 'Wise Man 1', keys: ['wise men'], color: 1 },
    { id: 'WISE MAN 2', label: 'Wise Man 2', keys: ['wise men'], color: 6 },
    { id: 'WISE MAN 3', label: 'Wise Man 3', keys: ['wise men'], color: 9 },
    { id: 'DRUMMER BOY', label: 'Drummer Boy', keys: ['drummer boy'], color: 3 },
    { id: 'CHILDREN', label: "Children's group", keys: ["children's group", 'children'], color: 4, ensemble: true },
    { id: 'CHOIR', label: 'Full cast choir', keys: ['full cast', 'whole cast', 'everyone', 'choir'], color: 8, ensemble: true }
  ];
  var VIEWS = ['script', 'my-part', 'songs', 'cast'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var state = { notesOpen: store.get('lib.notesOpen', false), doc: null, songs: {}, roles: [], byId: {}, role: null, practice: store.get('lib.practice', false), view: 'script', cast: [] };

  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v13"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    clapper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11h16v9H4z"/><path d="M4 11l1.5-5.5 15 4L20 11M9 6.8l2 4M14 8.2l2 2.8"/></svg>',
    star: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // ---------- Helpers ----------
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function slug(s) { return s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var REF_RE = /^\((?:[1-3] )?[A-Z][a-z]+ \d+:\d+[^)]*\)$/;
  function inline(text) {
    var s = esc(text);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, function (m, inner) {
      if (REF_RE.test(inner.trim())) return '<span class="ref">' + inner.replace(/^\(|\)$/g, '') + '</span>';
      return '<em' + (inner.charAt(0) === '(' ? ' class="paren"' : '') + '>' + inner + '</em>';
    });
    return s;
  }
  function plainForSpeech(text) {
    return text
      .replace(/\*\([^)]*\)\*/g, ' ')
      .replace(/\([^)]*\d+:\d+[^)]*\)/g, ' ')
      .replace(/\*+/g, '')
      .replace(/\b([A-Z]{2,})\b/g, function (w) { return w.charAt(0) + w.slice(1).toLowerCase(); })
      .replace(/\.\.\./g, '…')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function initials(label) {
    var words = label.replace(/\(.*?\)/g, '').replace(/^(Angel|Prophet|King|Madam|Baba|Mallam)\s+(?=[A-Z])/, '').replace(/'s\b/, '').trim().split(/\s+/);
    if (words.length > 1 && /^\d+$/.test(words[words.length - 1])) return (words[0][0] + words[words.length - 1]).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  }
  function avatar(role, cls) {
    return '<span class="avatar' + (cls ? ' ' + cls : '') + '" style="--c:var(--c' + role.color + ')" aria-hidden="true">' + esc(initials(role.label)) + '</span>';
  }
  function parseTime(t) {
    if (t === undefined || t === null || t === '') return null;
    if (typeof t === 'number') return t;
    var parts = String(t).trim().split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce(function (a, n) { return a * 60 + n; }, 0);
  }
  function fmtTime(sec) { var m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function toast(msg) {
    $$('.toast').forEach(function (t) { t.remove(); });
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  // ---------- Song links ----------
  function youtubeInfo(v) {
    if (!v) return null;
    v = String(v).trim();
    if (/^[\w-]{11}$/.test(v)) return { id: v, t: null };
    try {
      var u = new URL(v), id = null;
      if (u.hostname.indexOf('youtu.be') !== -1) id = u.pathname.slice(1, 12);
      else if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else { var m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/); if (m) id = m[1]; }
      if (!id) return null;
      var t = u.searchParams.get('t') || u.searchParams.get('start');
      return { id: id, t: t ? parseInt(t, 10) || null : null };
    } catch (e) { return null; }
  }
  function soundcloudUrl(v) {
    if (!v) return null;
    try {
      var u = new URL(String(v).trim());
      if (!/(^|\.)soundcloud\.com$/.test(u.hostname)) return null;
      u.hostname = 'soundcloud.com'; u.search = '';
      return u.toString();
    } catch (e) { return null; }
  }
  // Accepts a song page link (audiomack.com/artist/song/slug), an embed link, or a pasted <iframe> code.
  function audiomackInfo(v) {
    if (!v) return null;
    v = String(v).trim();
    var src = v.match(/src=["']([^"']+)["']/);
    if (src) v = src[1];
    try {
      var u = new URL(v);
      if (!/(^|\.)audiomack\.com$/.test(u.hostname)) return null;
      var p = u.pathname.split('/').filter(Boolean);
      if (/^embed/.test(p[0])) return { embed: u.origin + u.pathname + u.search, page: p[1] === 'song' && p[3] ? 'https://audiomack.com/' + p[2] + '/song/' + p[3] : u.href };
      if (p[1] === 'song' && p[2]) return { embed: 'https://audiomack.com/embed/song/' + p[0] + '/' + p[2], page: 'https://audiomack.com/' + p[0] + '/song/' + p[2] };
      if (p[0] === 'song' && p[2]) return { embed: 'https://audiomack.com/embed/song/' + p[1] + '/' + p[2], page: 'https://audiomack.com/' + p[1] + '/song/' + p[2] };
      return null;
    } catch (e) { return null; }
  }
  function songSource(cfg) {
    cfg = cfg || {};
    var am = audiomackInfo(cfg.audiomack); if (am) return { type: 'am', am: am, label: 'Audiomack' };
    var sc = soundcloudUrl(cfg.soundcloud); if (sc) return { type: 'sc', url: sc, label: 'SoundCloud' };
    var yt = youtubeInfo(cfg.youtube); if (yt) return { type: 'yt', yt: yt, label: 'YouTube' };
    return null;
  }

  // ---------- Parse script.md ----------
  function parseSpeakers(name) {
    var clean = name.replace(/\s+together$/i, '').trim();
    var parts = clean.split(/\s+and\s+/i);
    if (parts.length < 2) return [clean.toUpperCase()];
    var base = parts[0].replace(/\s*\d+$/, '');
    return parts.map(function (p) { p = p.trim(); return (/^\d+$/.test(p) ? base + ' ' + p : p).toUpperCase(); });
  }

  function parseScript(md) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var doc = { title: 'Light in Bethlehem', overview: [], acts: [], notes: [] };
    var act = null, section = null, inOverview = false, used = {};
    function uid(base) { var id = base || 'section', n = 2; while (used[id] || VIEWS.indexOf(id) !== -1) id = base + '-' + n++; used[id] = true; return id; }
    function newSection(title, implicit) {
      var m, kind = 'scene', song = null, num = null, name = title;
      if ((m = title.match(/^Song\s+(\w+)\s*:\s*(.+)$/i))) { kind = 'song'; song = { key: m[1].toLowerCase(), num: m[1], name: m[2].trim(), label: 'Song ' + m[1] }; name = song.name; }
      else if ((m = title.match(/^Curtain Call\s*:\s*(.+)$/i))) { kind = 'song'; song = { key: 'curtain', num: '★', name: m[1].trim(), label: 'Curtain call' }; name = song.name; }
      else if (/director/i.test(title)) kind = 'info';
      else if ((m = title.match(/^Scene\s+(\w+)\s*:\s*(.+)$/i))) { num = m[1]; name = m[2].trim(); }
      if (implicit) name = 'Opening';
      section = { id: uid(slug(implicit ? act.title + ' opening' : title)), title: title, name: name, num: num, kind: kind, song: song, blocks: [], implicit: !!implicit, act: act };
      if (kind === 'info') doc.notes.push(section); else act.sections.push(section);
    }
    // Dialogue after a song belongs to the scene that was playing before it, not to the song.
    function continueScene() {
      var prev = null;
      act.sections.forEach(function (s) { if (s.kind !== 'song') prev = s; });
      var name = prev ? (prev.implicit ? act.name : prev.name) : act.name;
      section = { id: uid(slug(name + ' continued')), title: name, name: name, num: null, kind: 'scene', song: null, blocks: [], cont: true, act: act };
      act.sections.push(section);
    }
    lines.forEach(function (raw) {
      var line = raw.trim(), m;
      if (!line) return;
      if (/^#\s/.test(line)) { doc.title = line.slice(2).trim(); return; }
      if (/^##\s/.test(line)) {
        var t = line.slice(3).trim();
        inOverview = /^overview$/i.test(t);
        if (inOverview) return;
        var am = t.match(/^Act\s+(\w+)\s*:\s*(.+)$/i);
        act = { id: uid(slug(t)), title: t, num: am ? am[1] : null, name: am ? am[2].trim() : t, sections: [] };
        doc.acts.push(act); section = null;
        return;
      }
      if (inOverview) { doc.overview.push(raw); return; }
      if (!act) return;
      if (/^###\s/.test(line)) { newSection(line.slice(4).trim()); return; }
      if (!section) newSection(act.title, true);
      if ((m = line.match(/^>\s?(.*)/))) { section.blocks.push({ type: 'note', text: m[1] }); return; }
      if (section.kind === 'song' && /^\*\*[^*]+?:\*\*/.test(line)) continueScene();
      if ((m = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/))) { section.blocks.push({ type: 'line', name: m[1].trim(), speakers: parseSpeakers(m[1]), text: m[2] }); return; }
      if (/^\*[^*].*\*$/.test(line)) { section.blocks.push({ type: 'direction', text: line.slice(1, -1) }); return; }
      if ((m = line.match(/^[-*]\s+(.*)/))) { section.blocks.push({ type: 'li', text: m[1] }); return; }
      section.blocks.push({ type: 'para', text: line });
    });
    doc.acts.forEach(function (a) { var prev = null; a.sections.forEach(function (s) { if (s.kind === 'song') s.after = prev; else prev = s; }); });
    return doc;
  }
  function allSectionsOf(doc) { var out = []; doc.acts.forEach(function (a) { out = out.concat(a.sections); }); return out; }
  function allSections() { return allSectionsOf(state.doc); }

  // Overview: split into ### subsections
  function overviewParts(lines) {
    var parts = { intro: [] }, cur = 'intro';
    lines.forEach(function (l) {
      var m = l.trim().match(/^###\s+(.+)/);
      if (m) { cur = m[1].trim().toLowerCase(); parts[cur] = []; return; }
      parts[cur].push(l);
    });
    return parts;
  }
  function parseCastTable(lines) {
    var rows = (lines || []).map(function (l) { return l.trim(); }).filter(function (l) { return /^\|/.test(l); });
    return rows.slice(1).filter(function (r) { return !/^\|[\s:|-]+\|$/.test(r); }).map(function (r) {
      var c = r.replace(/^\||\|$/g, '').split('|').map(function (x) { return x.trim(); });
      return { name: c[0] || '', size: c[1] || '', notes: c[2] || '' };
    });
  }

  function buildRoles(doc) {
    var roles = ROLE_DEFS.map(function (r) { return { id: r.id, label: r.label, keys: r.keys, color: r.color, ensemble: !!r.ensemble, lines: 0, sections: [] }; });
    var byId = {};
    roles.forEach(function (r) { byId[r.id] = r; });
    var nextColor = 0;
    // Any speaker added to the script later gets a role automatically.
    allSectionsOf(doc).forEach(function (s) { s.blocks.forEach(function (b) {
      if (b.type !== 'line') return;
      b.speakers.forEach(function (sp) {
        if (!byId[sp]) {
          var label = sp.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          byId[sp] = { id: sp, label: label, keys: [sp.toLowerCase()], color: nextColor++ % 12, lines: 0, sections: [] };
          roles.push(byId[sp]);
        }
      });
    }); });
    var keyRes = {};
    roles.forEach(function (r) { keyRes[r.id] = r.keys.map(function (k) { return new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); }); });
    allSectionsOf(doc).forEach(function (s) {
      var directions = s.blocks.filter(function (b) { return b.type === 'direction'; }).map(function (b) { return b.text; }).join(' ');
      roles.forEach(function (r) {
        var speaks = 0;
        s.blocks.forEach(function (b) { if (b.type === 'line' && b.speakers.indexOf(r.id) !== -1) speaks++; });
        var onStage = keyRes[r.id].some(function (re) { return re.test(directions); });
        if (speaks || onStage) { r.lines += speaks; r.sections.push({ section: s, speaks: speaks }); }
      });
    });
    state.byId = byId;
    return roles;
  }
  function roleFor(id) { return state.byId[id] || { id: id, label: id, color: 7, keys: [] }; }
  function castRowFor(role) {
    var keys = [role.label.replace(/\s*\(.*\)/, '')].concat(role.keys || []);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i].toLowerCase();
      for (var j = 0; j < state.cast.length; j++) {
        var row = state.cast[j];
        if ((row.name + ' ' + row.notes).toLowerCase().indexOf(k) !== -1) return row;
      }
    }
    return null;
  }
  function sectionRoles(s) {
    return state.roles.filter(function (r) { return r.sections.some(function (x) { return x.section === s; }); });
  }
  function whereLabel(s) {
    var act = s.act.num ? 'Act ' + s.act.num : s.act.title;
    if (s.kind === 'song') return act + (s.after ? ' · after ' + (s.after.implicit || (s.after.cont && s.after.name === s.act.name) ? 'the opening' : s.after.name) : '');
    return act + (s.implicit ? ' · Opening' : ' · ' + (s.num ? 'Scene ' + s.num + ': ' : '') + s.name + (s.cont ? ' (continued)' : ''));
  }

  // ---------- Progress ----------
  function learnedSet() {
    if (!state.role) return {};
    var set = {};
    store.get('lib.learned.' + state.role.id, []).forEach(function (id) { set[id] = true; });
    return set;
  }
  function setLearned(id, on) {
    var set = learnedSet();
    if (on) set[id] = true; else delete set[id];
    store.set('lib.learned.' + state.role.id, Object.keys(set));
  }

  // ---------- Players ----------
  function playerHTML(s) {
    var cfg = state.songs[s.song.key] || {};
    var src = songSource(cfg);
    if (!src) {
      var q = cfg.search || s.song.name;
      return '<div class="player"><div class="no-link">No recording yet. <a href="https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">Search YouTube</a></div></div>';
    }
    if (window.LIB_NO_EMBEDS) {
      // Preview hosts that block embedded players: link out instead.
      var href = src.type === 'am' ? src.am.page : src.type === 'sc' ? src.url : 'https://www.youtube.com/watch?v=' + src.yt.id;
      return '<div class="player"><div class="player-row"><a class="play" href="' + esc(href) + '" target="_blank" rel="noopener"><span class="disc">' + ICON.play + '</span>Listen on ' + src.label + '</a></div>' +
        '<p class="hint">In this preview, songs open in a new tab. On the real site they play right here.</p></div>';
    }
    var start = parseTime(cfg.start), end = parseTime(cfg.end);
    if (start === null && src.type === 'yt' && src.yt.t) start = src.yt.t;
    var data = ' data-type="' + src.type + '" data-start="' + (start || '') + '" data-end="' + (end || '') + '"' +
      (src.type === 'am' ? ' data-src="' + esc(src.am.embed) + '"' : src.type === 'sc' ? ' data-src="' + esc(src.url) + '"' : ' data-yt="' + src.yt.id + '"');
    var canLoop = src.type !== 'am';
    return '<div class="player"' + data + '>' +
      '<div class="frame" hidden></div>' +
      '<div class="player-row">' +
        '<button class="play" type="button" data-act="load"><span class="disc">' + ICON.play + '</span><span>Play song</span></button>' +
        (canLoop ? '<div class="tools" hidden><button class="btn small" type="button" data-act="restart">↺ From the top</button>' +
          '<label class="toggle"><input type="checkbox" data-act="loop"><span class="knob"></span><span>Loop</span></label></div>' : '') +
        (start || end ? '<span class="range">Plays ' + fmtTime(start || 0) + (end ? '–' + fmtTime(end) : ' to the end') + '</span>' : '') +
      '</div>' +
      '<p class="hint">' + (src.type === 'yt' ? 'A small video plays while the song is on. ' : 'Audio only. ') + 'Uses mobile data, so keep the screen on.</p>' +
    '</div>';
  }

  var ytReady = null, scReady = null, ytPlayers = [];
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      window.onYouTubeIframeAPIReady = function () { resolve(window.YT); };
      loadScript('https://www.youtube.com/iframe_api').catch(function (e) { ytReady = null; reject(e); });
    });
    return ytReady;
  }
  function loadSC() {
    if (scReady) return scReady;
    scReady = window.SC && window.SC.Widget ? Promise.resolve(window.SC) :
      loadScript('https://w.soundcloud.com/player/api.js').then(function () { return window.SC; }, function (e) { scReady = null; throw e; });
    return scReady;
  }
  function pauseOthers(except) {
    ytPlayers.forEach(function (p) { if (p !== except && p.pauseVideo) p.pauseVideo(); });
    $$('.player').forEach(function (b) { if (b._sc && b._sc !== except) b._sc.pause(); });
  }
  function showTools(box) { var t = $('.tools', box); if (t) t.hidden = false; }
  function playerFailed(box, msg) {
    var btn = $('[data-act="load"]', box);
    if (btn) { btn.hidden = false; $('span:last-child', btn).textContent = 'Try again'; }
    $('.hint', box).textContent = msg;
  }

  function startPlayer(box) {
    var btn = $('[data-act="load"]', box);
    $('span:last-child', btn).textContent = 'Loading…';
    var type = box.dataset.type;
    if (type === 'am') return startAudiomack(box);
    if (type === 'sc') return startSoundCloud(box);
    return startYouTube(box);
  }
  function startAudiomack(box) {
    var frame = $('.frame', box);
    frame.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.title = 'Song player';
    iframe.src = box.dataset.src;
    iframe.height = '252';
    iframe.setAttribute('scrolling', 'no');
    iframe.allow = 'autoplay';
    frame.appendChild(iframe);
    frame.hidden = false;
    $('[data-act="load"]', box).hidden = true;
    $('.hint', box).textContent = 'Press play in the player above. If it stays blank, tell your director so they can change the link.';
  }
  function startSoundCloud(box) {
    var frame = $('.frame', box);
    var start = (parseFloat(box.dataset.start) || 0) * 1000;
    var end = parseFloat(box.dataset.end) ? parseFloat(box.dataset.end) * 1000 : null;
    loadSC().then(function (SC) {
      frame.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.title = 'Song player'; iframe.allow = 'autoplay'; iframe.height = '120';
      iframe.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(box.dataset.src) +
        '&color=%23c2442a&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false';
      frame.appendChild(iframe);
      frame.hidden = false;
      var w = SC.Widget(iframe);
      box._sc = w;
      w.bind(SC.Widget.Events.READY, function () {
        pauseOthers(w);
        if (start) w.seekTo(start);
        w.play();
        $('[data-act="load"]', box).hidden = true;
        showTools(box);
      });
      w.bind(SC.Widget.Events.PLAY, function () { pauseOthers(w); });
      w.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
        if (end && e.currentPosition >= end) {
          if ($('[data-act="loop"]', box).checked) w.seekTo(start); else { w.pause(); w.seekTo(start); }
        }
      });
      w.bind(SC.Widget.Events.FINISH, function () { if ($('[data-act="loop"]', box).checked) { w.seekTo(start); w.play(); } });
      w.bind(SC.Widget.Events.ERROR, function () { playerFailed(box, 'This song can\'t play inside the site right now. Please tell your director.'); });
    }).catch(function () { playerFailed(box, 'Couldn\'t load the song. Check your connection and try again.'); });
  }
  function startYouTube(box) {
    var frame = $('.frame', box);
    var start = parseFloat(box.dataset.start) || 0;
    var end = parseFloat(box.dataset.end) || undefined;
    loadYT().then(function (YT) {
      frame.innerHTML = '';
      frame.classList.add('yt');
      frame.hidden = false;
      var mount = document.createElement('div');
      frame.appendChild(mount);
      var player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: box.dataset.yt,
        playerVars: { start: Math.floor(start), end: end ? Math.floor(end) : undefined, playsinline: 1, rel: 0 },
        events: {
          onReady: function (e) { pauseOthers(player); e.target.playVideo(); },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.PLAYING) pauseOthers(player);
            if (e.data === YT.PlayerState.ENDED && $('[data-act="loop"]', box).checked) { player.seekTo(start, true); player.playVideo(); }
          },
          onError: function () { frame.hidden = true; playerFailed(box, 'This video can\'t play inside the site. Please tell your director so they can swap the link.'); }
        }
      });
      ytPlayers.push(player);
      box._yt = player;
      $('[data-act="load"]', box).hidden = true;
      showTools(box);
    }).catch(function () { playerFailed(box, 'Couldn\'t reach YouTube. Check your connection and try again.'); });
  }
  function restartPlayer(box) {
    var start = parseFloat(box.dataset.start) || 0;
    if (box._sc) { box._sc.seekTo(start * 1000); box._sc.play(); }
    else if (box._yt) { box._yt.seekTo(start, true); box._yt.playVideo(); }
  }

  // ---------- Script view ----------
  // Director's notes sit behind a small pin on the line they belong to, so they don't break up the reading.
  var noteSeq = 0;
  function notesHTML(notes) {
    if (!notes || !notes.length) return '';
    var id = 'note-' + (++noteSeq);
    var who = notes.map(function (n) { return n.text.split(':')[0].trim().toLowerCase(); }).join('|');
    return '<button class="note-pin" type="button" aria-expanded="false" aria-controls="' + id + '" data-note-who="' + esc(who) + '" aria-label="Director\'s note" title="Director\'s note">' + ICON.clapper + '</button>' +
      '<div class="note-body" id="' + id + '">' + notes.map(function (n) {
        return '<p><span class="label">Director\'s note</span>' + inline(n.text) + '</p>';
      }).join('') + '</div>';
  }
  function blockHTML(b, notes) {
    var pin = notesHTML(notes), has = pin ? ' has-note' : '';
    if (b.type === 'line') {
      var r = roleFor(b.speakers[0]);
      return '<div class="line' + has + '" data-speakers="' + esc(b.speakers.join('|')) + '" style="--c:var(--c' + r.color + ')">' +
        '<div class="who">' + esc(b.name) + '</div><p class="txt">' + inline(b.text) + '</p>' + pin + '</div>';
    }
    if (b.type === 'direction') return '<div class="direction' + has + '"><p>' + inline(b.text) + '</p>' + pin + '</div>';
    if (b.type === 'note') return '<div class="note-solo has-note">' + pin + '</div>';
    if (b.type === 'li') return '<li>' + inline(b.text) + '</li>';
    return '<p class="para">' + inline(b.text) + '</p>';
  }
  // Attach each run of director's notes to the block just before it.
  function blocksHTML(blocks) {
    var out = '', inList = false, items = [];
    blocks.forEach(function (b) {
      var last = items[items.length - 1];
      if (b.type === 'note') {
        if (last && last.b.type !== 'li') { last.notes.push(b); return; }
        items.push({ b: { type: 'note' }, notes: [b] }); return;
      }
      items.push({ b: b, notes: [] });
    });
    items.forEach(function (it) {
      var b = it.b;
      if (b.type === 'li' && !inList) { out += '<ul class="list">'; inList = true; }
      if (b.type !== 'li' && inList) { out += '</ul>'; inList = false; }
      out += blockHTML(b, it.notes);
    });
    return out + (inList ? '</ul>' : '');
  }
  function castStack(s, max) {
    var roles = sectionRoles(s).filter(function (r) { return !r.ensemble; });
    if (!roles.length) return '';
    max = max || 6;
    return '<span class="avatar-stack" title="' + esc(roles.map(function (r) { return r.label; }).join(', ')) + '">' +
      roles.slice(0, max).map(function (r) { return avatar(r, 'xs'); }).join('') +
      (roles.length > max ? '<span class="more">+' + (roles.length - max) + '</span>' : '') + '</span>';
  }
  function sceneTools(s) {
    var hasLines = s.blocks.some(function (b) { return b.type === 'line'; });
    return '<div class="scene-meta">' + castStack(s) +
      '<span class="you-pill" data-you hidden>You\'re in this</span>' +
      '<label class="learned" data-learned-wrap hidden><input type="checkbox" data-learned="' + s.id + '"> I know this</label>' +
      (hasLines && 'speechSynthesis' in window ? '<button class="btn small" type="button" data-rehearse="' + s.id + '">' + ICON.mic + 'Rehearse</button>' : '') +
      '</div>';
  }
  function songCardHTML(s, opts) {
    opts = opts || {};
    var cfg = state.songs[s.song.key] || {};
    return '<section class="song-card" ' + (opts.noId ? '' : 'id="' + s.id + '" ') + 'data-section="' + s.id + '">' +
      '<div class="song-head"><div class="song-num">' + esc(s.song.num) + '</div><div class="song-titles">' +
        '<span class="eyebrow">' + (opts.where ? esc(whereLabel(s)) : esc(s.song.label)) + '</span>' +
        '<h3>' + esc(s.song.name) + '</h3>' + (cfg.artist ? '<div class="artist">' + esc(cfg.artist) + '</div>' : '') +
      '</div></div>' +
      blocksHTML(s.blocks) +
      playerHTML(s) +
      (opts.where ? '<div class="scene-meta">' + castStack(s) + '<a class="btn small quiet" href="#' + s.id + '">See it in the script' + ICON.arrow + '</a></div>' : sceneTools(s)) +
    '</section>';
  }

  function heroHTML() {
    var parts = overviewParts(state.doc.overview);
    var intro = (parts.intro.find(function (l) { return l.trim(); }) || '').trim();
    var title = state.doc.title.split(':');
    var main = title[0].trim(), lastWord = (main.match(/(\S+)$/) || [''])[0];
    var songCount = allSections().filter(function (s) { return s.kind === 'song'; }).length;
    var speaking = state.roles.filter(function (r) { return r.lines > 0; }).length;
    var mins = (intro.match(/(\d+)\s*(?:to\s*\d+\s*)?minute/i) || [])[1];
    return '<header class="hero"><canvas id="sky" aria-hidden="true"></canvas><div class="hero-inner">' +
      '<span class="eyebrow">' + esc(title[1] ? title[1].trim() : 'A Christmas musical') + '</span>' +
      '<h1>' + esc(main.slice(0, main.length - lastWord.length).trim()) + ' <em>' + esc(lastWord) + '</em></h1>' +
      (intro ? '<p>' + inline(intro.split('. ')[0].replace(/\.$/, '') + '.') + '</p>' : '') +
      '<ul class="hero-facts"><li><b>' + state.doc.acts.filter(function (a) { return a.num; }).length + '</b>acts</li><li><b>' + songCount + '</b>songs</li><li><b>' + speaking + '</b>speaking roles</li>' +
        (mins ? '<li><b>' + mins + '+</b>minutes</li>' : '') + '</ul>' +
      '<div class="hero-actions" id="heroActions"></div>' +
    '</div></header>';
  }
  function renderHeroActions() {
    var el = $('#heroActions'); if (!el) return;
    if (!state.role) {
      el.innerHTML = '<button class="btn gold" type="button" data-open-roles>Pick your role</button><a class="btn on-night" href="#' + state.doc.acts[0].id + '">Start reading</a>';
      return;
    }
    var learned = learnedSet();
    var next = state.role.sections.find(function (x) { return !learned[x.section.id]; });
    el.innerHTML = (next ? '<a class="btn gold" href="#' + next.section.id + '">Your next part' + ICON.arrow + '</a>' : '<a class="btn gold" href="#my-part">You know it all ✦</a>') +
      '<a class="btn on-night" href="#my-part">My part</a>';
  }

  function renderScript() {
    var html = heroHTML() +
      '<div class="column"><div class="toolbar">' +
        '<label class="toggle"><input type="checkbox" id="practiceToggle"' + (state.practice ? ' checked' : '') + '><span class="knob"></span><span>Hide my lines</span></label>' +
        '<label class="toggle"><input type="checkbox" id="notesToggle"' + (state.notesOpen ? ' checked' : '') + '><span class="knob"></span><span>Show all notes</span></label>' +
        '<div class="group"><span class="size-btns" role="group" aria-label="Text size"><button type="button" data-size="-1" aria-label="Smaller text">A−</button><button type="button" data-size="1" aria-label="Larger text">A+</button></span>' +
        '<button class="btn small" type="button" data-open-scenes>' + ICON.list + 'Scenes</button></div>' +
      '</div><article class="script" id="script">';
    state.doc.acts.forEach(function (a) {
      html += '<header class="act" id="' + a.id + '"><div class="act-label">' +
        (a.num ? '<span class="act-num">Act<b>' + esc(a.num) + '</b></span>' : '<span class="act-num">The end</span>') + '</div>' +
        '<h2>' + esc(a.name) + '</h2><div class="band" aria-hidden="true"></div></header>';
      a.sections.forEach(function (s) {
        if (s.kind === 'song') { html += songCardHTML(s); return; }
        html += '<section class="scene" id="' + s.id + '" data-section="' + s.id + '"><div class="scene-head"><div>' +
          '<span class="eyebrow">' + (s.cont ? 'Continued' : s.implicit ? 'Opening' : s.num ? 'Scene ' + esc(s.num) : 'Scene') + '</span>' +
          '<h3>' + esc(s.implicit ? a.name : s.name) + '</h3></div>' + sceneTools(s) + '</div>' +
          blocksHTML(s.blocks) + '</section>';
      });
    });
    html += '</article></div>';
    $('#view-script').innerHTML = html;
    startSky($('#sky'));
  }

  function indexHTML() {
    var role = state.role, learned = learnedSet(), mine = {};
    if (role) role.sections.forEach(function (x) { mine[x.section.id] = true; });
    var html = '';
    state.doc.acts.forEach(function (a) {
      html += '<h4>' + esc(a.num ? 'Act ' + a.num + ' · ' + a.name : a.name) + '</h4>';
      a.sections.forEach(function (s) {
        if (s.cont) return;
        var song = s.kind === 'song';
        html += '<a href="#' + s.id + '" data-index="' + s.id + '"><span class="k' + (song ? ' song' : '') + '">' + (song ? '♪' : s.num || '•') + '</span>' +
          '<span class="t">' + esc(s.implicit ? 'Opening' : s.name) + '</span>' +
          (learned[s.id] ? '<span class="done" aria-label="learned">✓</span>' : mine[s.id] ? '<span class="mine" aria-label="you\'re in this"></span>' : '') + '</a>';
      });
    });
    return html;
  }
  function renderIndex() { var h = indexHTML(); $('#railIndex').innerHTML = h; $('#sheetIndex').innerHTML = h; spyCurrent = undefined; updateSpy(); }

  function applyRoleToScript() {
    var r = state.role, featured = {}, learned = learnedSet();
    if (r) r.sections.forEach(function (x) { featured[x.section.id] = true; });
    $$('.line').forEach(function (el) {
      el.classList.toggle('mine', !!r && el.dataset.speakers.split('|').indexOf(r.id) !== -1);
      el.classList.remove('revealed');
    });
    var keys = r ? [r.label.toLowerCase(), r.id.toLowerCase()].concat(r.keys) : [];
    $$('.note-pin').forEach(function (p) {
      var who = p.dataset.noteWho.split('|');
      p.classList.toggle('for-you', !!r && who.some(function (w) { return w === 'everyone' || keys.some(function (k) { return w.indexOf(k) !== -1; }); }));
      p.setAttribute('aria-expanded', String(state.notesOpen || p.parentElement.classList.contains('note-open')));
    });
    $$('#view-script [data-section]').forEach(function (el) {
      var id = el.dataset.section, on = !!featured[id];
      var you = $('[data-you]', el); if (you) you.hidden = !on;
      var lab = $('[data-learned-wrap]', el);
      if (lab) { lab.hidden = !on; $('input', lab).checked = !!learned[id]; }
    });
  }

  // ---------- My part view ----------
  function renderMyPart() {
    var el = $('#view-my-part');
    var r = state.role;
    if (!r) {
      el.innerHTML = '<div class="column"><div class="page-head"><span class="eyebrow">My part</span><h1>Your part, all in one place</h1>' +
        '<p>Pick your role to see your scenes, songs and director\'s notes, and to practise your lines.</p></div>' +
        '<div class="empty-state"><h2>Who are you playing?</h2><p>Choose your character and everything on this page fills in for you.</p>' +
        '<button class="btn gold" type="button" data-open-roles>Pick your role</button>' +
        '<ol class="steps"><li><span><b>Your lines turn gold</b> in the script, so you can spot them fast.</span></li>' +
        '<li><span><b>Cue cards</b> show the line before yours. Say your line, then check it.</span></li>' +
        '<li><span><b>Rehearse</b> makes the phone read everyone else\'s lines and wait for yours.</span></li></ol></div></div>';
      return;
    }
    var learned = learnedSet();
    var total = r.sections.length;
    var done = r.sections.filter(function (x) { return learned[x.section.id]; }).length;
    var songs = r.sections.filter(function (x) { return x.section.kind === 'song'; }).length;
    var row = castRowFor(r);
    var firstScene = r.sections.find(function (x) { return x.speaks; });
    var notes = [];
    allSections().forEach(function (s) { s.blocks.forEach(function (b) {
      if (b.type !== 'note') return;
      var who = b.text.split(':')[0].toLowerCase();
      var match = who === 'everyone' || [r.label.toLowerCase(), r.id.toLowerCase()].concat(r.keys).some(function (k) { return who.indexOf(k.toLowerCase()) !== -1; });
      if (match) notes.push({ s: s, text: b.text });
    }); });

    var items = r.sections.map(function (x) {
      var s = x.section, song = s.kind === 'song', isDone = !!learned[s.id];
      return '<div class="part-item' + (isDone ? ' done' : '') + '">' +
        '<span class="kind' + (song ? ' song' : '') + '">' + (isDone ? ICON.check : song ? '♪' : (s.num || '•')) + '</span>' +
        '<a class="info" href="#' + s.id + '" style="text-decoration:none"><b>' + esc(s.implicit ? s.act.name + ' (opening)' : s.cont ? s.name + ' (continued)' : s.name) + '</b>' +
        '<small>' + esc(s.act.num ? 'Act ' + s.act.num : s.act.name) + ' · ' + (song ? 'Song' : x.speaks ? plural(x.speaks, 'line') : 'On stage') + '</small></a>' +
        '<button class="check" type="button" aria-pressed="' + isDone + '" data-toggle-learned="' + s.id + '" aria-label="Mark ' + esc(s.name) + ' as learned">' + ICON.check + '</button>' +
      '</div>';
    }).join('');

    el.innerHTML = '<div class="column">' +
      '<div class="part-hero">' + avatar(r, 'lg') + '<div><span class="eyebrow">You\'re playing</span><h1>' + esc(r.label) + '</h1>' +
        (row ? '<p>' + inline(row.notes) + '</p>' : '') + '</div></div>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + r.lines + '</b><span>lines</span></div>' +
        '<div class="stat"><b>' + (total - songs) + '</b><span>scenes</span></div>' +
        '<div class="stat"><b>' + songs + '</b><span>songs</span></div>' +
        '<div class="stat progress"><b>' + done + '/' + total + '</b><span>learned</span><div class="meter"><span style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></span></div></div>' +
      '</div>' +
      '<div class="actions">' +
        (r.lines ? '<button class="action primary" type="button" data-cards>' + ICON.cards + '<b>Practise with cue cards</b><span>See the line before yours, say yours, then check it.</span></button>' : '') +
        (firstScene && 'speechSynthesis' in window ? '<button class="action" type="button" data-rehearse="' + firstScene.section.id + '">' + ICON.mic + '<b>Rehearse out loud</b><span>The phone reads the other parts and waits for you.</span></button>' : '') +
        '<button class="action" type="button" data-share-role>' + ICON.arrow + '<b>Share my link</b><span>Opens straight on ' + esc(r.label) + ' on any phone.</span></button>' +
        '<button class="action" type="button" data-open-roles>' + avatar(r, 'xs') + '<b>Change role</b><span>Playing someone else, or more than one part?</span></button>' +
      '</div>' +
      '<h2 class="section-title">Your scenes and songs</h2><div class="part-list">' + (items || '<p class="muted">Nothing in the script mentions this role yet.</p>') + '</div>' +
      (notes.length ? '<h2 class="section-title">Director\'s notes for you</h2><div class="notes-list">' + notes.map(function (n) {
        return '<aside class="note">' + ICON.clapper + '<div><span class="label">' + esc(n.s.implicit ? n.s.act.name : n.s.name) + '</span><p>' + inline(n.text) + '</p></div></aside>';
      }).join('') + '</div>' : '') +
      '<p class="muted" style="font-size:.8rem;margin-top:24px">Scenes come from your lines and the stage directions, so check with your director if one looks wrong. Your progress is saved on this phone only.</p>' +
    '</div>';
  }

  // ---------- Songs view ----------
  function renderSongs() {
    var songs = allSections().filter(function (s) { return s.kind === 'song'; });
    var linked = songs.filter(function (s) { return songSource(state.songs[s.song.key]); }).length;
    $('#view-songs').innerHTML = '<div class="column"><div class="page-head"><span class="eyebrow">Songs</span><h1>The soundtrack</h1>' +
      '<p>All ' + songs.length + ' songs in show order. ' + (linked < songs.length ? (songs.length - linked) + ' still need a recording.' : 'Every song has a recording.') + ' Learn the songs before blocking.</p></div>' +
      songs.map(function (s) { return songCardHTML(s, { where: true, noId: true }); }).join('') + '</div>';
  }

  // ---------- Cast view ----------
  function mdBlock(lines) {
    var html = '', i = 0;
    while (i < lines.length) {
      var l = lines[i].trim(), m;
      if (!l || /^\|/.test(l)) { i++; continue; }
      if (/^(\d+\.|[-*])\s/.test(l)) {
        var ordered = /^\d+\./.test(l), items = [];
        while (i < lines.length && /^(\d+\.|[-*])\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^(\d+\.|[-*])\s+/, '')); i++; }
        html += (ordered ? '<ol>' : '<ul>') + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + (ordered ? '</ol>' : '</ul>');
        continue;
      }
      if ((m = l.match(/^#+\s+(.+)/))) { html += '<h3 class="section-title">' + inline(m[1]) + '</h3>'; i++; continue; }
      html += '<p>' + inline(l) + '</p>'; i++;
    }
    return html;
  }
  function renderCast() {
    var parts = overviewParts(state.doc.overview);
    var cards = state.cast.map(function (row) {
      var role = state.roles.find(function (r) { return castRowFor(r) === row; });
      var size = row.size.toLowerCase();
      return '<article class="cast-card"><header>' + (role ? avatar(role) : '') + '<b>' + esc(row.name) + '</b>' +
        '<span class="size ' + (/large/.test(size) ? 'large' : /chorus/.test(size) ? 'chorus' : '') + '">' + esc(row.size) + '</span></header>' +
        '<p>' + inline(row.notes) + '</p></article>';
    }).join('');
    var staging = parts['staging and props'] || [];
    var general = state.doc.notes.map(function (s) { return blocksHTML(s.blocks); }).join('');
    $('#view-cast').innerHTML = '<div class="column"><div class="page-head"><span class="eyebrow">The company</span><h1>Cast &amp; production</h1>' +
      '<p>' + inline((parts.intro.find(function (l) { return l.trim(); }) || '').trim()) + '</p></div>' +
      '<h2 class="section-title">Characters</h2><div class="cast-grid">' + cards + '</div>' +
      (staging.length ? '<h2 class="section-title">Staging and props</h2><div class="prose">' + mdBlock(staging) + '</div>' : '') +
      (general ? '<h2 class="section-title">Director\'s notes</h2><div class="prose">' + general + '</div>' : '') +
    '</div>';
  }

  // ---------- Role picker ----------
  function renderRoleList() {
    function card(r) {
      var detail = r.lines ? plural(r.lines, 'line') : r.sections.length ? 'Sings / on stage' : '';
      return '<button class="role-card" type="button" data-role="' + esc(r.id) + '" aria-pressed="' + (state.role === r) + '">' + avatar(r) +
        '<span><b>' + esc(r.label) + '</b><small>' + detail + '</small></span></button>';
    }
    var speaking = state.roles.filter(function (r) { return !r.ensemble; });
    var groups = state.roles.filter(function (r) { return r.ensemble; });
    $('#roleList').innerHTML = '<div class="role-grid">' + speaking.map(card).join('') + '</div>' +
      (groups.length ? '<h3>Choirs and groups</h3><div class="role-grid">' + groups.map(card).join('') + '</div>' : '') +
      (state.role ? '<h3>Not acting?</h3><button class="btn" type="button" data-role="">Just reading, no role</button>' : '');
  }
  function openSheet(id) {
    var sh = $('#' + id);
    sh._return = document.activeElement;
    sh.hidden = false;
    var f = $('[aria-pressed="true"]', sh) || $('.sheet-panel button, .sheet-panel a', sh);
    if (f) f.focus();
  }
  function closeSheet(sh) { if (!sh) return; sh.hidden = true; if (sh._return && sh._return.focus) sh._return.focus(); }

  function renderRoleChip() {
    var chip = $('#roleChip'), r = state.role;
    chip.classList.toggle('empty', !r);
    chip.innerHTML = r ? avatar(r, 'xs') + '<span>' + esc(r.label) + '</span>' : '<span>Pick your role</span>';
    chip.setAttribute('aria-label', r ? 'Playing ' + r.label + '. Change role' : 'Pick your role');
  }

  function setRole(id, opts) {
    state.role = id ? state.byId[id] || null : null;
    store.set('lib.role', state.role ? state.role.id : null);
    try {
      var url = new URL(location.href);
      if (state.role) url.searchParams.set('role', state.role.label); else url.searchParams.delete('role');
      history.replaceState(null, '', url);
    } catch (e) { /* some hosts block URL changes */ }
    refreshRole();
    if (state.role && !(opts && opts.quiet)) toast('You\'re playing ' + state.role.label);
  }
  function refreshRole() {
    renderRoleChip();
    applyRoleToScript();
    renderIndex();
    renderHeroActions();
    renderMyPart();
  }

  // ---------- Views + routing ----------
  function showView(v, opts) {
    opts = opts || {};
    if (VIEWS.indexOf(v) === -1) v = 'script';
    state.view = v;
    VIEWS.forEach(function (n) { $('#view-' + n).hidden = n !== v; });
    $$('.tab').forEach(function (t) { t.setAttribute('aria-current', t.dataset.view === v ? 'page' : 'false'); });
    $('#shell').classList.toggle('with-rail', v === 'script');
    if (v !== 'script') $('#appSub').textContent = { 'my-part': 'My part', songs: 'Songs', cast: 'Cast & production' }[v];
    if (opts.scroll !== false) window.scrollTo(0, 0);
    if (v === 'script') updateSpy();
  }
  function route() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (VIEWS.indexOf(h) !== -1) { showView(h); return; }
    var target = h && document.getElementById(h);
    if (target && $('#view-script').contains(target)) {
      showView('script', { scroll: false });
      requestAnimationFrame(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      return;
    }
    showView('script');
  }

  // Scroll spy: show the current scene in the top bar and the scene rail
  var spyCurrent;
  function updateSpy() {
    if (!state.doc || state.view !== 'script') return;
    var probe = window.innerHeight * 0.35, best = null;
    $$('#view-script [data-section], #view-script .act').forEach(function (el) {
      if (el.getBoundingClientRect().top - probe <= 0) best = el;
    });
    var label = '';
    if (best) {
      var sid = best.dataset.section;
      var s = sid ? allSections().find(function (x) { return x.id === sid; }) : null;
      var a = s ? s.act : state.doc.acts.find(function (x) { return x.id === best.id; });
      if (a) label = (a.num ? 'Act ' + a.num + ' · ' : '') + (s ? (s.implicit ? a.name : s.name) : a.name);
    }
    $('#appSub').textContent = label;
    var id = best ? best.dataset.section || null : null;
    if (id !== spyCurrent) {
      spyCurrent = id;
      $$('[data-index]').forEach(function (a) { a.classList.toggle('active', a.dataset.index === id); });
      var act = $('#railIndex .active');
      if (act && window.innerWidth >= 1000) {
        var rail = act.closest('.rail'), top = act.offsetTop;
        if (top < rail.scrollTop + 40 || top > rail.scrollTop + rail.clientHeight - 80) rail.scrollTop = top - rail.clientHeight / 3;
      }
    }
  }

  // ---------- Night sky ----------
  function startSky(canvas) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d'), w = 0, h = 0, stars = [], roofs = [], visible = true, raf = null;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resize() {
      var r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      var n = Math.round(w * h / 2600);
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h * 0.85, r: Math.random() * 1.1 + 0.3, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.4 });
      roofs = []; var x = -10;
      while (x < w + 20) { var bw = 26 + Math.random() * 46; roofs.push({ x: x, w: bw, h: 12 + Math.random() * 26, dome: Math.random() < 0.12 }); x += bw - 2; }
      draw(performance.now());
    }
    function starShape(cx, cy, R, r, rot) {
      ctx.beginPath();
      for (var i = 0; i < 8; i++) {
        var rad = i % 2 ? r : R, a = rot + i * Math.PI / 4;
        ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill();
    }
    function draw(t) {
      if (!w) return;
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (s) {
        ctx.globalAlpha = reduce ? 0.7 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.p + t / 1000 * s.s));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
      var cx = w > 700 ? w * 0.8 : w * 0.84, cy = Math.min(h * 0.2, 76), pulse = reduce ? 1 : 1 + 0.05 * Math.sin(t / 650);
      // the beam from the star down to the stable
      var beam = ctx.createLinearGradient(0, cy, 0, h);
      beam.addColorStop(0, 'rgba(245,196,81,0.26)'); beam.addColorStop(1, 'rgba(245,196,81,0.02)');
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx + 40, h); ctx.lineTo(cx - 40, h); ctx.closePath(); ctx.fill();
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse);
      g.addColorStop(0, 'rgba(255,240,190,0.95)'); g.addColorStop(0.18, 'rgba(245,196,81,0.4)'); g.addColorStop(1, 'rgba(245,196,81,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 80 * pulse, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff7dc'; starShape(cx, cy, 30 * pulse, 4, -Math.PI / 2);
      ctx.fillStyle = 'rgba(255,247,220,0.6)'; starShape(cx, cy, 15 * pulse, 3, -Math.PI / 2 + Math.PI / 8);
      // Bethlehem rooftops, with the stable under the star
      ctx.fillStyle = '#05061a';
      roofs.forEach(function (r) {
        ctx.fillRect(r.x, h - r.h, r.w, r.h);
        if (r.dome) { ctx.beginPath(); ctx.arc(r.x + r.w / 2, h - r.h, r.w / 3.2, Math.PI, 0); ctx.fill(); }
      });
      ctx.beginPath(); ctx.moveTo(cx - 40, h - 20); ctx.lineTo(cx, h - 52); ctx.lineTo(cx + 40, h - 20); ctx.lineTo(cx + 40, h); ctx.lineTo(cx - 40, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(245,196,81,0.9)'; ctx.fillRect(cx - 8, h - 20, 16, 20);
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }
    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { cancelAnimationFrame(raf); resize(); }, 150); });
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(draw);
      }).observe(canvas);
    }
  }

  // ---------- Rehearse (read-along) ----------
  var rh = { active: false, queue: [], i: 0, paused: false, waiting: null, token: 0 };
  var voices = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    var all = speechSynthesis.getVoices();
    voices = all.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    if (!voices.length) voices = all;
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function speak(text, speaker, done) {
    var token = ++rh.token;
    speechSynthesis.cancel();
    var chunks = (text.match(/[^.!?…]+[.!?…]*["”']?\s*/g) || [text]).map(function (c) { return c.trim(); }).filter(Boolean);
    var h = hash(speaker || 'x'), voice = voices.length ? voices[h % voices.length] : null;
    var pitch = 0.8 + (h % 6) * 0.1, rate = parseFloat($('#dockRate').value) || 1, idx = 0;
    function next() {
      if (token !== rh.token) return;
      if (idx >= chunks.length) { done(); return; }
      var u = new SpeechSynthesisUtterance(chunks[idx++]);
      if (voice) u.voice = voice;
      u.pitch = pitch; u.rate = rate;
      u.onend = function () { setTimeout(next, 60); };
      u.onerror = function () { setTimeout(next, 60); };
      rh.current = u; // keep a reference so the browser doesn't drop it
      speechSynthesis.speak(u);
    }
    next();
  }
  function buildQueue(fromId) {
    var q = [], started = false;
    allSections().forEach(function (s) {
      if (s.id === fromId) started = true;
      if (!started) return;
      var el = document.getElementById(s.id);
      if (s.kind === 'song') { q.push({ type: 'song', el: el, name: s.song.name }); return; }
      var lineEls = $$('.line', el), li = 0;
      s.blocks.forEach(function (b) { if (b.type === 'line') q.push({ type: 'line', el: lineEls[li++], speakers: b.speakers, name: b.name, text: b.text }); });
    });
    return q;
  }
  function dockStatus(html, role) { $('#dockStatus').innerHTML = (role ? avatar(role, 'xs') : '') + '<span>' + html + '</span>'; }
  function clearNow() { $$('.now').forEach(function (el) { el.classList.remove('now'); }); }
  function step() {
    if (!rh.active || rh.paused) return;
    clearNow();
    var nextBtn = $('#dockNext');
    if (rh.i >= rh.queue.length) { dockStatus('That\'s the end. Well done! ✦'); nextBtn.textContent = 'Close'; rh.waiting = 'end'; return; }
    var item = rh.queue[rh.i];
    if (item.el) { item.el.classList.add('now'); item.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    nextBtn.textContent = 'Next';
    if (item.type === 'song') { rh.waiting = 'song'; dockStatus('♪ <b>' + esc(item.name) + '</b>. Play it and sing along, then tap Next.'); return; }
    var mine = state.role && item.speakers.indexOf(state.role.id) !== -1;
    if (mine) {
      var hidden = state.practice && !item.el.classList.contains('revealed');
      rh.waiting = hidden ? 'mine-hidden' : 'mine';
      dockStatus('<b>Your line.</b> Say it out loud, then tap ' + (hidden ? 'Check' : 'Next') + '.', state.role);
      if (hidden) nextBtn.textContent = 'Check';
      return;
    }
    rh.waiting = null;
    var who = roleFor(item.speakers[0]);
    dockStatus('<b>' + esc(item.name.charAt(0) + item.name.slice(1).toLowerCase()) + '</b> is speaking…', who);
    var text = plainForSpeech(item.text);
    if (!text) { rh.i++; step(); return; }
    speak(text, item.speakers.join('+'), function () { rh.i++; step(); });
  }
  function startRehearse(fromId) {
    if (!('speechSynthesis' in window)) return;
    if (state.view !== 'script') showView('script', { scroll: false });
    loadVoices();
    rh.queue = buildQueue(fromId); rh.i = 0; rh.active = true; rh.paused = false;
    $('#dock').hidden = false;
    $('#dockPause').textContent = 'Pause';
    if (!state.role) toast('Tip: pick your role so the phone waits for your lines');
    step();
  }
  function stopRehearse() {
    rh.active = false; rh.token++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    clearNow();
    $('#dock').hidden = true;
  }

  // ---------- Cue cards ----------
  var deck = null;
  function buildDeck(role) {
    var cards = [];
    allSections().forEach(function (s) {
      if (s.kind !== 'scene') return;
      var cue = null, firstDirection = null;
      s.blocks.forEach(function (b) {
        if (b.type === 'direction' && !cue && !firstDirection) firstDirection = b;
        if (b.type !== 'line') return;
        if (b.speakers.indexOf(role.id) !== -1) cards.push({ s: s, cue: cue, direction: cue ? null : firstDirection, line: b });
        cue = b;
      });
    });
    return cards;
  }
  function openCards() {
    if (!state.role) { openRoleSheet(); return; }
    var cards = buildDeck(state.role);
    deck = { queue: cards.slice(), total: cards.length, done: 0, revealed: false };
    $('#cards').hidden = false;
    document.body.style.overflow = 'hidden';
    renderCard();
  }
  function closeCards() { $('#cards').hidden = true; document.body.style.overflow = ''; deck = null; }
  function renderCard() {
    var el = $('#cards'), r = state.role;
    var top = '<div class="cards-top"><button class="btn small" type="button" data-cards-close>' + ICON.close + 'Close</button>' +
      '<span class="cards-count">' + Math.min(deck.done + 1, deck.total) + ' of ' + deck.total + '</span></div>' +
      '<div class="cards-meter"><span style="width:' + (deck.total ? deck.done / deck.total * 100 : 0) + '%"></span></div>';
    if (!deck.queue.length) {
      el.innerHTML = top + '<div class="cards-body cards-done"><div class="big-star">' + ICON.star + '</div>' +
        '<h2>That\'s every line!</h2><p class="muted">You went through all ' + plural(deck.total, 'line') + ' for ' + esc(r.label) + '.</p></div>' +
        '<div class="cards-actions"><button class="btn" type="button" data-cards-restart>Go again</button><button class="btn gold" type="button" data-cards-close>Done</button></div>';
      $('[data-cards-close]', el).focus();
      return;
    }
    var c = deck.queue[0];
    var cueRole = c.cue ? roleFor(c.cue.speakers[0]) : null;
    el.innerHTML = top + '<div class="cards-body">' +
      '<p class="card-scene">' + esc(whereLabel(c.s)) + '</p>' +
      (c.cue ? '<div class="cue" style="--c:var(--c' + cueRole.color + ')"><div class="who">' + esc(c.cue.name) + '</div><p>' + inline(c.cue.text) + '</p></div>'
        : '<div class="cue direction-cue"><div class="who">Scene starts</div><p>' + (c.direction ? inline(c.direction.text) : 'You speak first.') + '</p></div>') +
      '<div class="answer' + (deck.revealed ? '' : ' hidden') + '"' + (deck.revealed ? '' : ' aria-hidden="true"') + '><div class="who">You · ' + esc(r.label) + '</div><p>' + inline(c.line.text) + '</p></div>' +
    '</div>' +
    '<div class="cards-actions">' + (deck.revealed
      ? '<button class="btn" type="button" data-cards-again>Again later</button><button class="btn good" type="button" data-cards-got>' + ICON.check + 'Got it</button>'
      : '<button class="btn gold wide" type="button" data-cards-show>Show my line</button>') + '</div>';
    var f = $('[data-cards-show], [data-cards-got]', el); if (f) f.focus();
  }

  // ---------- Events ----------
  function openRoleSheet() { renderRoleList(); openSheet('roleSheet'); }
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-close]'))) { closeSheet(el.closest('.sheet')); return; }
      if (t.closest('[data-open-roles]') || t.closest('#roleChip')) { openRoleSheet(); return; }
      if ((el = t.closest('[data-role]'))) { closeSheet($('#roleSheet')); setRole(el.dataset.role); return; }
      if (t.closest('[data-open-scenes]')) { openSheet('sceneSheet'); return; }
      if (t.closest('#sheetIndex a')) { closeSheet($('#sceneSheet')); return; }
      if ((el = t.closest('[data-rehearse]'))) { startRehearse(el.dataset.rehearse); return; }
      if (t.closest('[data-cards]')) { openCards(); return; }
      if (t.closest('[data-cards-close]')) { closeCards(); return; }
      if (t.closest('[data-cards-show]')) { deck.revealed = true; renderCard(); return; }
      if (t.closest('[data-cards-got]')) { deck.queue.shift(); deck.done++; deck.revealed = false; renderCard(); return; }
      if (t.closest('[data-cards-again]')) { deck.queue.push(deck.queue.shift()); deck.revealed = false; renderCard(); return; }
      if (t.closest('[data-cards-restart]')) { openCards(); return; }
      if ((el = t.closest('[data-toggle-learned]'))) {
        var on = el.getAttribute('aria-pressed') !== 'true';
        setLearned(el.dataset.toggleLearned, on);
        if (on) toast('Nice! Marked as learned');
        refreshRole(); return;
      }
      if (t.closest('[data-share-role]')) {
        var link = location.href.split('#')[0];
        if (navigator.share) navigator.share({ title: document.title, text: 'My part in ' + document.title, url: link }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { toast('Link copied'); }, function () { toast(link); });
        else toast(link);
        return;
      }
      if ((el = t.closest('[data-size]'))) {
        var fs = Math.max(0.9, Math.min(1.5, store.get('lib.fs', 1.06) + parseInt(el.dataset.size, 10) * 0.08));
        fs = Math.round(fs * 100) / 100;
        store.set('lib.fs', fs); document.documentElement.style.setProperty('--fs', fs + 'rem'); return;
      }
      if ((el = t.closest('.player [data-act="load"]'))) { startPlayer(el.closest('.player')); return; }
      if ((el = t.closest('.player [data-act="restart"]'))) { restartPlayer(el.closest('.player')); return; }
      if ((el = t.closest('.note-pin'))) {
        var host = el.parentElement, open = !host.classList.contains('note-open');
        host.classList.toggle('note-open', open);
        el.setAttribute('aria-expanded', String(open || state.notesOpen));
        return;
      }
      if (t.closest('.note-body')) return;
      if ((el = t.closest('body.practice .line.mine'))) { el.classList.toggle('revealed'); return; }
    });
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.learned && state.role) { setLearned(t.dataset.learned, t.checked); if (t.checked) toast('Nice! Marked as learned'); renderIndex(); renderHeroActions(); renderMyPart(); return; }
      if (t.id === 'notesToggle') {
        state.notesOpen = t.checked; store.set('lib.notesOpen', state.notesOpen);
        document.body.classList.toggle('notes-open', state.notesOpen);
        $$('.note-pin').forEach(function (p) { p.setAttribute('aria-expanded', String(state.notesOpen || p.parentElement.classList.contains('note-open'))); });
        return;
      }
      if (t.id === 'practiceToggle') {
        state.practice = t.checked; store.set('lib.practice', state.practice);
        document.body.classList.toggle('practice', state.practice);
        $$('.line.revealed').forEach(function (l) { l.classList.remove('revealed'); });
        if (state.practice && !state.role) openRoleSheet();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = $$('.sheet').find(function (s) { return !s.hidden; });
      if (open) closeSheet(open); else if (!$('#cards').hidden) closeCards();
    });
    window.addEventListener('hashchange', route);
    var spyRaf = null;
    window.addEventListener('scroll', function () { if (!spyRaf) spyRaf = requestAnimationFrame(function () { spyRaf = null; updateSpy(); }); }, { passive: true });

    $('#dockNext').addEventListener('click', function () {
      if (rh.waiting === 'end') { stopRehearse(); return; }
      if (rh.waiting === 'mine-hidden') {
        rh.queue[rh.i].el.classList.add('revealed'); rh.waiting = 'mine';
        $('#dockNext').textContent = 'Next';
        dockStatus('<b>How did you do?</b> Tap Next to carry on.', state.role);
        return;
      }
      rh.token++; speechSynthesis.cancel();
      rh.paused = false; $('#dockPause').textContent = 'Pause';
      rh.i++; step();
    });
    $('#dockPause').addEventListener('click', function () {
      if (!rh.paused) { rh.paused = true; rh.token++; speechSynthesis.cancel(); $('#dockPause').textContent = 'Resume'; dockStatus('Paused.'); }
      else { rh.paused = false; $('#dockPause').textContent = 'Pause'; step(); }
    });
    $('#dockStop').addEventListener('click', stopRehearse);
    if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  }

  // ---------- Boot ----------
  function boot() {
    bind();
    document.body.classList.toggle('practice', state.practice);
    document.body.classList.toggle('notes-open', state.notesOpen);
    document.documentElement.style.setProperty('--fs', store.get('lib.fs', 1.06) + 'rem');
    var bust = '?v=' + Date.now().toString(36).slice(0, -3); // changes about once a minute, so edits show up quickly
    Promise.all([
      fetch('script.md' + bust).then(function (r) { if (!r.ok) throw new Error('script.md: ' + r.status); return r.text(); }),
      fetch('songs.json' + bust).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (res) {
      state.doc = parseScript(res[0]);
      state.songs = res[1] || {};
      state.cast = parseCastTable(overviewParts(state.doc.overview).cast);
      state.roles = buildRoles(state.doc);
      var short = state.doc.title.split(':')[0];
      document.title = short; $('#appTitle').textContent = short;
      renderScript(); renderSongs(); renderCast();
      var wanted = new URLSearchParams(location.search).get('role');
      var match = wanted && state.roles.find(function (r) { return r.label.toLowerCase() === wanted.toLowerCase() || r.id.toLowerCase() === wanted.toLowerCase(); });
      state.role = state.byId[match ? match.id : store.get('lib.role', null)] || null;
      refreshRole();
      route();
    }).catch(function (err) {
      $('#view-script').innerHTML = '<p class="loading">The script couldn\'t load (' + esc(err.message) + '). Check your connection and refresh the page.</p>';
    });
  }
  boot();
})();

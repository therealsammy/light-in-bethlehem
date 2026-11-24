/* Light in Bethlehem: rehearsal site.
   Reads script.md and songs.json and builds the page from them,
   so the director only ever edits those two files. */
(function () {
  'use strict';

  // ---------- Roles ----------
  // id = the speaker name exactly as written in the script (**MARY:**).
  // keys = words that, when they appear in a stage direction, mean this role is on stage.
  var ROLE_DEFS = [
    { id: 'NARRATOR 1', label: 'Narrator 1', keys: ['narrator 1', 'narrators'] },
    { id: 'NARRATOR 2', label: 'Narrator 2', keys: ['narrator 2', 'narrators'] },
    { id: 'MARY', label: 'Mary', keys: ['mary'] },
    { id: 'JOSEPH', label: 'Joseph', keys: ['joseph'] },
    { id: 'GABRIEL', label: 'Angel Gabriel', keys: ['gabriel'] },
    { id: 'ISAIAH', label: 'Prophet Isaiah', keys: ['isaiah', 'prophets'] },
    { id: 'MICAH', label: 'Prophet Micah', keys: ['micah', 'prophets'] },
    { id: 'TOWN CRIER', label: 'Town Crier', keys: ['town crier'] },
    { id: 'MADAM CHIOMA', label: 'Madam Chioma', keys: ['madam chioma', 'innkeepers'] },
    { id: 'BABA TUNDE', label: 'Baba Tunde', keys: ['baba tunde', 'innkeepers'] },
    { id: 'MALLAM SANI', label: 'Mallam Sani', keys: ['mallam sani', 'innkeepers'] },
    { id: 'NGOZI', label: 'Ngozi (shepherd)', keys: ['ngozi', 'shepherds'] },
    { id: 'EMEKA', label: 'Emeka (shepherd)', keys: ['emeka', 'shepherds'] },
    { id: 'SHEPHERD 3', label: 'Shepherd 3', keys: ['shepherds'] },
    { id: 'ANGEL CHOIR', label: 'Angel choir', keys: ['angel choir', 'angels'] },
    { id: 'HEROD', label: 'King Herod', keys: ['herod'] },
    { id: 'ADVISER', label: "Herod's Adviser", keys: ['adviser'] },
    { id: 'WISE MAN 1', label: 'Wise Man 1', keys: ['wise men'] },
    { id: 'WISE MAN 2', label: 'Wise Man 2', keys: ['wise men'] },
    { id: 'WISE MAN 3', label: 'Wise Man 3', keys: ['wise men'] },
    { id: 'DRUMMER BOY', label: 'Drummer Boy', keys: ['drummer boy'] },
    { id: 'CHILDREN', label: "Children's group", keys: ["children's group", 'children'] },
    { id: 'CHOIR', label: 'Full cast choir', keys: ['full cast', 'whole cast', 'everyone', 'choir'] }
  ];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  var state = {
    doc: null,
    songs: {},
    roles: [],
    role: null,
    practice: store.get('lib.practice', false)
  };

  // ---------- Helpers ----------
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function slug(s) {
    return s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  var REF_RE = /^\((?:[1-3] )?[A-Z][a-z]+ \d+:\d+[^)]*\)$/;
  function inline(text) {
    var s = esc(text);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, function (m, inner) {
      var plain = inner.replace(/&amp;/g, '&');
      if (REF_RE.test(plain.trim())) return '<span class="ref">' + inner.replace(/^\(|\)$/g, '') + '</span>';
      return '<em' + (inner.charAt(0) === '(' ? ' class="paren"' : '') + '>' + inner + '</em>';
    });
    return s;
  }
  function plainForSpeech(text) {
    return text
      .replace(/\*\([^)]*\)\*/g, ' ')        // stage parentheticals
      .replace(/\([^)]*\d+:\d+[^)]*\)/g, ' ') // scripture refs
      .replace(/\*+/g, '')
      .replace(/\b([A-Z]{2,})\b/g, function (w) { return w.charAt(0) + w.slice(1).toLowerCase(); })
      .replace(/\.\.\./g, '…')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function parseTime(t) {
    if (t === undefined || t === null || t === '') return null;
    if (typeof t === 'number') return t;
    var parts = String(t).trim().split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce(function (acc, n) { return acc * 60 + n; }, 0);
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function youtubeInfo(v) {
    if (!v) return null;
    v = String(v).trim();
    if (/^[\w-]{11}$/.test(v)) return { id: v, t: null };
    try {
      var u = new URL(v);
      var id = null;
      if (u.hostname.indexOf('youtu.be') !== -1) id = u.pathname.slice(1, 12);
      else if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else {
        var m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
        if (m) id = m[1];
      }
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
      u.hostname = 'soundcloud.com'; // m.soundcloud.com links work too
      u.search = '';
      return u.toString();
    } catch (e) { return null; }
  }

  // ---------- Parse script.md ----------
  function parseSpeakers(name) {
    // "NARRATOR 1 and 2 together" -> ["NARRATOR 1", "NARRATOR 2"]
    var clean = name.replace(/\s+together$/i, '').trim();
    var parts = clean.split(/\s+and\s+/i);
    if (parts.length < 2) return [clean.toUpperCase()];
    var base = parts[0].replace(/\s*\d+$/, '');
    return parts.map(function (p) {
      p = p.trim();
      return (/^\d+$/.test(p) ? base + ' ' + p : p).toUpperCase();
    });
  }

  function parseScript(md) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var doc = { title: 'Light in Bethlehem', overview: [], acts: [] };
    var act = null, section = null, inOverview = false;
    var usedIds = {};
    function uid(base) {
      var id = base || 'section', n = 2;
      while (usedIds[id]) id = base + '-' + n++;
      usedIds[id] = true;
      return id;
    }
    function newSection(title, implicit) {
      var m, kind = 'scene', song = null;
      if ((m = title.match(/^Song\s+([\w]+)\s*:\s*(.+)$/i))) { kind = 'song'; song = { key: m[1].toLowerCase(), name: m[2].trim(), label: 'Song ' + m[1] }; }
      else if ((m = title.match(/^Curtain Call\s*:\s*(.+)$/i))) { kind = 'song'; song = { key: 'curtain', name: m[1].trim(), label: 'Curtain call' }; }
      else if (/director/i.test(title)) kind = 'info';
      section = { id: uid(slug(title)), title: title, kind: kind, song: song, blocks: [], implicit: !!implicit, act: act };
      act.sections.push(section);
    }

    lines.forEach(function (raw) {
      var line = raw.trim();
      var m;
      if (!line) return;
      if ((m = line.match(/^#\s+(.+)/)) && !/^##/.test(line)) { doc.title = m[1].trim(); return; }
      if ((m = line.match(/^##\s+(.+)/)) && !/^###/.test(line)) {
        var t = m[1].trim();
        inOverview = /^overview$/i.test(t);
        if (inOverview) return;
        act = { id: uid(slug(t)), title: t, sections: [] };
        doc.acts.push(act);
        section = null;
        return;
      }
      if (inOverview) { doc.overview.push(raw); return; }
      if (!act) return;
      if ((m = line.match(/^###\s+(.+)/))) { newSection(m[1].trim()); return; }
      if (!section) newSection(act.title, true);

      if ((m = line.match(/^>\s?(.*)/))) { section.blocks.push({ type: 'note', text: m[1] }); return; }
      if ((m = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/))) {
        section.blocks.push({ type: 'line', name: m[1].trim(), speakers: parseSpeakers(m[1]), text: m[2] });
        return;
      }
      if ((m = line.match(/^[-*]\s+(.*)/)) && !/^\*[^*].*\*$/.test(line)) { section.blocks.push({ type: 'li', text: m[1] }); return; }
      if (/^\*[^*].*\*$/.test(line)) { section.blocks.push({ type: 'direction', text: line.slice(1, -1) }); return; }
      section.blocks.push({ type: 'para', text: line });
    });
    return doc;
  }

  function buildRoles(doc) {
    var roles = ROLE_DEFS.map(function (r) { return { id: r.id, label: r.label, keys: r.keys, lines: 0, sections: [] }; });
    var byId = {};
    roles.forEach(function (r) { byId[r.id] = r; });
    // Any speaker added to the script later gets a role automatically.
    doc.acts.forEach(function (a) { a.sections.forEach(function (s) { s.blocks.forEach(function (b) {
      if (b.type !== 'line') return;
      b.speakers.forEach(function (sp) {
        if (!byId[sp]) {
          var label = sp.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          byId[sp] = { id: sp, label: label, keys: [sp.toLowerCase()], lines: 0, sections: [] };
          roles.push(byId[sp]);
        }
      });
    }); }); });

    var keyRes = {};
    roles.forEach(function (r) {
      keyRes[r.id] = r.keys.map(function (k) { return new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); });
    });

    doc.acts.forEach(function (a) {
      a.sections.forEach(function (s) {
        if (s.kind === 'info') return;
        var directions = s.blocks.filter(function (b) { return b.type === 'direction'; }).map(function (b) { return b.text; }).join(' ');
        roles.forEach(function (r) {
          var speaks = 0;
          s.blocks.forEach(function (b) { if (b.type === 'line' && b.speakers.indexOf(r.id) !== -1) speaks++; });
          var onStage = keyRes[r.id].some(function (re) { return re.test(directions); });
          if (speaks || onStage) {
            r.lines += speaks;
            r.sections.push({ section: s, speaks: speaks });
          }
        });
      });
    });
    return roles;
  }

  // ---------- Render script ----------
  function renderBlock(b) {
    if (b.type === 'line') {
      return '<div class="line" data-speakers="' + esc(b.speakers.join('|')) + '">' +
        '<div class="who">' + esc(b.name.toUpperCase()) + '</div>' +
        '<div class="txt">' + inline(b.text) + '</div></div>';
    }
    if (b.type === 'direction') return '<p class="direction">' + inline(b.text) + '</p>';
    if (b.type === 'note') return '<details class="note" open><summary>Director\'s note</summary><p>' + inline(b.text) + '</p></details>';
    if (b.type === 'li') return '<li>' + inline(b.text) + '</li>';
    return '<p class="para">' + inline(b.text) + '</p>';
  }
  function renderBlocks(blocks) {
    var out = '', inList = false;
    blocks.forEach(function (b) {
      if (b.type === 'li' && !inList) { out += '<ul class="list">'; inList = true; }
      if (b.type !== 'li' && inList) { out += '</ul>'; inList = false; }
      out += renderBlock(b);
    });
    if (inList) out += '</ul>';
    return out;
  }

  function sectionTools(s) {
    var tools = '';
    if (s.kind !== 'info' && s.blocks.some(function (b) { return b.type === 'line'; }) && 'speechSynthesis' in window) {
      tools += '<button class="btn small" data-rehearse="' + s.id + '" title="The phone reads the other parts aloud and waits for your lines">▶ Rehearse from here</button>';
    }
    tools += '<label class="learned" hidden><input type="checkbox" data-learned="' + s.id + '"> I know this</label>';
    return '<div class="section-tools">' + tools + '</div>';
  }

  function renderSong(s) {
    var cfg = state.songs[s.song.key] || {};
    var yt = youtubeInfo(cfg.youtube);
    var start = parseTime(cfg.start);
    if (start === null && yt && yt.t) start = yt.t;
    var end = parseTime(cfg.end);
    var query = cfg.search || s.song.name;
    var searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    var player;
    var sc = soundcloudUrl(cfg.soundcloud);
    if (window.LIB_NO_EMBEDS && (sc || yt)) {
      // Preview hosts that block embedded players: link out instead.
      player = '<div class="player"><div class="controls">' +
        (sc ? '<a class="btn primary" href="' + esc(sc) + '" target="_blank" rel="noopener">▶ Listen on SoundCloud</a>' : '') +
        (yt ? '<a class="btn' + (sc ? ' ghost' : ' primary') + '" href="https://www.youtube.com/watch?v=' + yt.id + '" target="_blank" rel="noopener">▶ YouTube</a>' : '') +
        '</div><p class="hint">Opens in a new tab.</p></div>';
    } else if (sc) {
      player = '<div class="player" data-sc="' + esc(sc) + '" data-start="' + (start || '') + '" data-end="' + (end || '') + '">' +
        '<div class="sc-frame" hidden></div>' +
        '<div class="controls">' +
          '<button class="btn primary" data-act="load">▶ Play song</button>' +
          '<button class="btn" data-act="restart" hidden>↺ From the top</button>' +
          '<label class="switch" data-loopwrap hidden><input type="checkbox" data-act="loop"> <span>Loop</span></label>' +
          (yt ? '<a class="btn ghost" href="https://www.youtube.com/watch?v=' + yt.id + '" target="_blank" rel="noopener">YouTube</a>' : '') +
          (start || end ? '<span class="range">Plays ' + fmtTime(start || 0) + (end ? '–' + fmtTime(end) : ' to the end') + '</span>' : '') +
        '</div>' +
        '<p class="hint">Audio only. Uses mobile data. Keep the screen on while it plays.</p>' +
      '</div>';
    } else if (yt) {
      var watch = 'https://www.youtube.com/watch?v=' + yt.id + (start ? '&t=' + start + 's' : '');
      player = '<div class="player" data-yt="' + yt.id + '" data-start="' + (start || '') + '" data-end="' + (end || '') + '">' +
        '<div class="frame" hidden></div>' +
        '<div class="controls">' +
          '<button class="btn primary" data-act="load">▶ Play song</button>' +
          '<button class="btn" data-act="restart" hidden>↺ From the top</button>' +
          '<label class="switch" data-loopwrap hidden><input type="checkbox" data-act="loop"> <span>Loop</span></label>' +
          '<a class="btn ghost" href="' + watch + '" target="_blank" rel="noopener">Open on YouTube</a>' +
          (start || end ? '<span class="range">Plays ' + fmtTime(start || 0) + (end ? '–' + fmtTime(end) : ' to the end') + '</span>' : '') +
        '</div>' +
        '<p class="hint">Uses mobile data. Keep the screen on while it plays.</p>' +
      '</div>';
    } else {
      player = '<div class="player"><div class="controls">' +
        '<a class="btn primary" href="' + searchUrl + '" target="_blank" rel="noopener">Find on YouTube</a></div>' +
        '<p class="hint">No song link yet, so this searches YouTube. Your director can add a link in songs.json.</p></div>';
    }
    return '<section class="section song-card" id="' + s.id + '" data-section="' + s.id + '" data-kind="song">' +
      '<div class="section-head"><div><div class="eyebrow">' + esc(s.song.label) + '</div>' +
      '<h3>' + esc(s.song.name) + '</h3>' +
      (cfg.artist ? '<div class="artist">' + esc(cfg.artist) + '</div>' : '') + '</div>' + sectionTools(s) + '</div>' +
      renderBlocks(s.blocks) + player + '</section>';
  }

  function renderScript() {
    var doc = state.doc;
    var overviewIntro = doc.overview.find(function (l) { return l.trim() && !/^#/.test(l.trim()); }) || '';
    var html = '<header class="title-block"><h1>' + esc(doc.title) + '</h1>' +
      (overviewIntro ? '<p>' + inline(overviewIntro.trim()) + '</p>' : '') + '</header>';
    doc.acts.forEach(function (a) {
      html += '<h2 class="act-title" id="' + a.id + '">' + esc(a.title) + '</h2>';
      a.sections.forEach(function (s) {
        if (s.kind === 'song') { html += renderSong(s); return; }
        html += '<section class="section" id="' + s.id + '" data-section="' + s.id + '">';
        if (!s.implicit) html += '<div class="section-head"><h3>' + esc(s.title) + '</h3>' + sectionTools(s) + '</div>';
        else html += '<div class="section-head"><span></span>' + sectionTools(s) + '</div>';
        html += renderBlocks(s.blocks) + '</section>';
      });
    });
    $('#script').innerHTML = html;
    $('#brandTitle').textContent = doc.title.split(':')[0];
    document.title = doc.title.split(':')[0];
  }

  function renderNav() {
    var role = state.role;
    var learned = role ? learnedSet() : {};
    var featured = {};
    if (role) role.sections.forEach(function (x) { featured[x.section.id] = x.speaks; });
    var html = '';
    state.doc.acts.forEach(function (a) {
      html += '<h3>' + esc(a.title) + '</h3>';
      a.sections.forEach(function (s) {
        var label = s.kind === 'song' ? s.song.name : (s.implicit ? 'Opening' : s.title.replace(/^Scene \d+:\s*/, ''));
        var icon = s.kind === 'song' ? '♪' : s.kind === 'info' ? '✎' : '•';
        var tag = '';
        if (s.id in featured) tag = learned[s.id] ? '<span class="tag done">✓</span>' : '<span class="tag">' + (featured[s.id] ? featured[s.id] + ' line' + (featured[s.id] > 1 ? 's' : '') : 'on stage') + '</span>';
        html += '<a href="#' + s.id + '"><span class="kind">' + icon + '</span><span>' + esc(label) + '</span>' + tag + '</a>';
      });
    });
    $('#navList').innerHTML = html;
  }

  // ---------- Intro + role panel ----------
  function renderIntro() {
    if (store.get('lib.introDismissed', false)) { $('#intro').innerHTML = ''; return; }
    $('#intro').innerHTML = '<div class="card"><h2>Welcome, cast!</h2><ol>' +
      '<li><b>Pick your role</b> (top right). Your lines turn yellow.</li>' +
      '<li>Turn on <b>practice mode</b> to hide your lines and test yourself. Tap a line to check it.</li>' +
      '<li>Tap <b>Rehearse from here</b> on any scene: the phone reads everyone else\'s lines and waits for yours.</li>' +
      '<li>Songs have a play button right where they come in.</li></ol>' +
      '<div class="row"><button class="btn primary" data-open-roles>Pick my role</button><button class="btn ghost" data-dismiss-intro>Got it, hide this</button></div></div>';
  }

  function learnedSet() {
    if (!state.role) return {};
    var arr = store.get('lib.learned.' + state.role.id, []);
    var set = {};
    arr.forEach(function (id) { set[id] = true; });
    return set;
  }
  function setLearned(id, on) {
    var set = learnedSet();
    if (on) set[id] = true; else delete set[id];
    store.set('lib.learned.' + state.role.id, Object.keys(set));
  }

  function renderRolePanel() {
    var r = state.role;
    var panel = $('#rolePanel');
    if (!r) { panel.innerHTML = ''; return; }
    var learned = learnedSet();
    var total = r.sections.length;
    var done = r.sections.filter(function (x) { return learned[x.section.id]; }).length;
    var songs = r.sections.filter(function (x) { return x.section.kind === 'song'; }).length;
    var next = r.sections.find(function (x) { return !learned[x.section.id]; });
    var chips = r.sections.map(function (x) {
      var s = x.section;
      var label = s.kind === 'song' ? '♪ ' + s.song.name : (s.implicit ? s.act.title : s.title.replace(/^Scene \d+:\s*/, ''));
      return '<a class="chip' + (learned[s.id] ? ' done' : '') + (s.kind === 'song' ? ' song' : '') + '" href="#' + s.id + '">' + (learned[s.id] ? '✓ ' : '') + esc(label) + '</a>';
    }).join('');
    panel.innerHTML = '<div class="card"><h2>You\'re playing ' + esc(r.label) + '</h2>' +
      '<div class="stats"><div><b>' + r.lines + '</b>lines</div><div><b>' + (total - songs) + '</b>scenes</div><div><b>' + songs + '</b>songs</div><div><b>' + done + '/' + total + '</b>learned</div></div>' +
      '<div class="progress"><span style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></span></div>' +
      (total ? '<div class="chips">' + chips + '</div>' : '<p class="muted">No lines or stage directions mention this role yet.</p>') +
      '<div class="row">' + (next ? '<a class="btn primary" href="#' + next.section.id + '">Go to my next part</a>' : '') +
      '<button class="btn" data-share-role>Share this role\'s link</button></div>' +
      '<p class="muted" style="font-size:.8rem;margin:8px 0 0">Scenes are picked from your lines and the stage directions, so check with your director if one looks wrong. Progress is saved on this phone only.</p></div>';
  }

  function applyRole() {
    var r = state.role;
    $('.role-label').textContent = r ? r.label : 'Pick your role';
    var featured = {};
    if (r) r.sections.forEach(function (x) { featured[x.section.id] = true; });
    var learned = learnedSet();
    $$('.line').forEach(function (el) {
      var mine = !!r && el.dataset.speakers.split('|').indexOf(r.id) !== -1;
      el.classList.toggle('mine', mine);
      el.classList.remove('revealed');
    });
    $$('[data-section]').forEach(function (el) {
      var id = el.dataset.section;
      el.classList.toggle('featured', !!featured[id]);
      var lab = $('.learned', el);
      if (lab) {
        lab.hidden = !featured[id];
        $('input', lab).checked = !!learned[id];
      }
    });
    renderRolePanel();
    renderNav();
  }

  function setRole(id, opts) {
    state.role = state.roles.find(function (r) { return r.id === id; }) || null;
    store.set('lib.role', state.role ? state.role.id : null);
    var url = new URL(location.href);
    if (state.role) url.searchParams.set('role', state.role.label); else url.searchParams.delete('role');
    try { history.replaceState(null, '', url); } catch (e) { /* some hosts block URL changes */ }
    applyRole();
    if (state.role && !(opts && opts.quiet)) {
      showView('script');
      $('#rolePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openRoleDialog() {
    $('#roleList').innerHTML = state.roles.map(function (r) {
      var detail = r.lines ? r.lines + ' line' + (r.lines > 1 ? 's' : '') : (r.sections.length ? 'sings / on stage' : '');
      return '<button type="button" data-role="' + esc(r.id) + '" class="' + (state.role && state.role.id === r.id ? 'current' : '') + '">' + esc(r.label) + (detail ? '<small>' + detail + '</small>' : '') + '</button>';
    }).join('');
    var dlg = $('#roleDialog');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  // ---------- Info view ----------
  function mdBlock(lines) {
    var html = '', i = 0;
    while (i < lines.length) {
      var l = lines[i].trim();
      if (!l) { i++; continue; }
      var m;
      if ((m = l.match(/^###\s+(.+)/))) { html += '<h3>' + inline(m[1]) + '</h3>'; i++; continue; }
      if (/^\|/.test(l)) {
        var rows = [];
        while (i < lines.length && /^\|/.test(lines[i].trim())) { rows.push(lines[i].trim()); i++; }
        var cells = function (r) { return r.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
        var head = cells(rows[0]);
        var body = rows.slice(1).filter(function (r) { return !/^\|[\s:|-]+\|$/.test(r); });
        html += '<div class="table-wrap"><table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          body.map(function (r) { return '<tr>' + cells(r).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
        continue;
      }
      if (/^(\d+\.|[-*])\s/.test(l)) {
        var ordered = /^\d+\./.test(l);
        var items = [];
        while (i < lines.length && /^(\d+\.|[-*])\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^(\d+\.|[-*])\s+/, '')); i++; }
        html += (ordered ? '<ol>' : '<ul>') + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + (ordered ? '</ol>' : '</ul>');
        continue;
      }
      html += '<p>' + inline(l) + '</p>';
      i++;
    }
    return html;
  }

  function renderInfo() {
    var songSections = [];
    state.doc.acts.forEach(function (a) { a.sections.forEach(function (s) { if (s.kind === 'song') songSections.push(s); }); });
    function source(cfg) {
      if (soundcloudUrl(cfg.soundcloud)) return 'SoundCloud';
      if (youtubeInfo(cfg.youtube)) return 'YouTube';
      return null;
    }
    var withLink = songSections.filter(function (s) { return source(state.songs[s.song.key] || {}); }).length;
    var songRows = songSections.map(function (s) {
      var cfg = state.songs[s.song.key] || {};
      var src = source(cfg);
      return '<tr><td>' + esc(s.song.label) + '</td><td><a href="#' + s.id + '" data-goto>' + esc(s.song.name) + '</a><br><span class="muted">' + esc(cfg.artist || '') + '</span></td><td class="' + (src ? 'ok">✓ ' + src : 'missing">No link yet') + '</td></tr>';
    }).join('');
    $('#info').innerHTML = '<h2>' + esc(state.doc.title) + '</h2>' + mdBlock(state.doc.overview) +
      '<h3>Song links</h3><p class="muted">' + withLink + ' of ' + songSections.length + ' songs have a SoundCloud or YouTube link. Links live in <code>songs.json</code>.</p>' +
      '<div class="table-wrap"><table><thead><tr><th>#</th><th>Song</th><th>Player</th></tr></thead><tbody>' + songRows + '</tbody></table></div>';
  }

  function showView(name) {
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.view === name); });
    $('#view-script').hidden = name !== 'script';
    $('#view-info').hidden = name !== 'info';
  }

  // ---------- YouTube players ----------
  var ytReady = null;
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      window.onYouTubeIframeAPIReady = function () { resolve(window.YT); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = function () { ytReady = null; reject(new Error('YouTube could not load')); };
      document.head.appendChild(s);
    });
    return ytReady;
  }
  var players = [];
  function startPlayer(box) {
    var frame = $('.frame', box);
    var start = parseFloat(box.dataset.start) || 0;
    var end = parseFloat(box.dataset.end) || undefined;
    var loadBtn = $('[data-act="load"]', box);
    loadBtn.textContent = 'Loading…';
    loadYT().then(function (YT) {
      frame.hidden = false;
      var mount = document.createElement('div');
      frame.appendChild(mount);
      var player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: box.dataset.yt,
        playerVars: { start: Math.floor(start), end: end ? Math.floor(end) : undefined, playsinline: 1, rel: 0 },
        events: {
          onReady: function (e) {
            players.forEach(function (p) { if (p !== player && p.pauseVideo) p.pauseVideo(); });
            e.target.playVideo();
          },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.PLAYING) players.forEach(function (p) { if (p !== player && p.pauseVideo) p.pauseVideo(); });
            if (e.data === YT.PlayerState.ENDED && $('[data-act="loop"]', box).checked) {
              player.seekTo(start, true); player.playVideo();
            }
          },
          onError: function () {
            frame.hidden = true;
            $('.hint', box).textContent = 'This video can\'t play inside the site. Use "Open on YouTube" instead, and tell your director so they can swap the link.';
          }
        }
      });
      players.push(player);
      box._player = player;
      loadBtn.hidden = true;
      $('[data-act="restart"]', box).hidden = false;
      $('[data-loopwrap]', box).hidden = false;
    }).catch(function () {
      loadBtn.textContent = '▶ Play song';
      $('.hint', box).textContent = 'Couldn\'t reach YouTube. Check your connection, or use "Open on YouTube".';
    });
  }

  // ---------- SoundCloud players ----------
  var scReady = null;
  function loadSC() {
    if (scReady) return scReady;
    scReady = new Promise(function (resolve, reject) {
      if (window.SC && window.SC.Widget) return resolve(window.SC);
      var s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = function () { resolve(window.SC); };
      s.onerror = function () { scReady = null; reject(new Error('SoundCloud could not load')); };
      document.head.appendChild(s);
    });
    return scReady;
  }
  function pauseOthers(except) {
    players.forEach(function (p) { if (p !== except && p.pauseVideo) p.pauseVideo(); });
    $$('.player').forEach(function (b) { if (b._sc && b._sc !== except) b._sc.pause(); });
  }
  // Only shown when a song can't play inside the page, so nobody is stuck.
  function scFallback(box, message) {
    var hint = $('.hint', box);
    hint.textContent = message + ' ';
    var a = document.createElement('a');
    a.href = box.dataset.sc; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Listen on SoundCloud instead';
    hint.appendChild(a);
  }
  function startSoundCloud(box) {
    var frame = $('.sc-frame', box);
    var start = (parseFloat(box.dataset.start) || 0) * 1000;
    var end = parseFloat(box.dataset.end) ? parseFloat(box.dataset.end) * 1000 : null;
    var loadBtn = $('[data-act="load"]', box);
    loadBtn.textContent = 'Loading…';
    loadSC().then(function (SC) {
      var iframe = document.createElement('iframe');
      iframe.title = 'Song player';
      iframe.allow = 'autoplay';
      iframe.width = '100%';
      iframe.height = '120';
      iframe.style.border = '0';
      iframe.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(box.dataset.sc) +
        '&color=%238d6cc8&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false';
      frame.appendChild(iframe);
      frame.hidden = false;
      var w = SC.Widget(iframe);
      box._sc = w;
      w.bind(SC.Widget.Events.READY, function () {
        pauseOthers(w);
        if (start) w.seekTo(start);
        w.play();
        loadBtn.hidden = true;
        $('[data-act="restart"]', box).hidden = false;
        $('[data-loopwrap]', box).hidden = false;
      });
      w.bind(SC.Widget.Events.PLAY, function () { pauseOthers(w); });
      w.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
        if (end && e.currentPosition >= end) {
          if ($('[data-act="loop"]', box).checked) w.seekTo(start); else { w.pause(); w.seekTo(start); }
        }
      });
      w.bind(SC.Widget.Events.FINISH, function () {
        if ($('[data-act="loop"]', box).checked) { w.seekTo(start); w.play(); }
      });
      w.bind(SC.Widget.Events.ERROR, function () {
        scFallback(box, 'This song can\'t play inside the site right now. Please tell your director.');
      });
    }).catch(function () {
      loadBtn.textContent = '▶ Play song';
      scFallback(box, 'Couldn\'t load the song. Check your connection and tap Play song again.');
    });
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
    var h = hash(speaker || 'x');
    var voice = voices.length ? voices[h % voices.length] : null;
    var pitch = 0.8 + (h % 6) * 0.1;
    var rate = parseFloat($('#rbRate').value) || 1;
    var idx = 0;
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
    state.doc.acts.forEach(function (a) {
      a.sections.forEach(function (s) {
        if (s.id === fromId) started = true;
        if (!started || s.kind === 'info') return;
        var el = document.getElementById(s.id);
        if (s.kind === 'song') { q.push({ type: 'song', el: el, name: s.song.name }); return; }
        var lineEls = $$('.line', el), li = 0;
        s.blocks.forEach(function (b) {
          if (b.type === 'line') q.push({ type: 'line', el: lineEls[li++], speakers: b.speakers, name: b.name, text: b.text });
        });
      });
    });
    return q;
  }

  function setStatus(html) { $('#rbStatus').innerHTML = html; }
  function clearNow() { $$('.now').forEach(function (el) { el.classList.remove('now'); }); }

  function step() {
    if (!rh.active || rh.paused) return;
    clearNow();
    if (rh.i >= rh.queue.length) { setStatus('That\'s the end. Well done! ✦'); $('#rbNext').textContent = 'Close'; rh.waiting = 'end'; return; }
    var item = rh.queue[rh.i];
    if (item.el) { item.el.classList.add('now'); item.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    $('#rbNext').textContent = 'Next';
    if (item.type === 'song') {
      rh.waiting = 'song';
      setStatus('♪ <b>' + esc(item.name) + '</b>. Play it and sing along, then tap Next.');
      return;
    }
    var mine = state.role && item.speakers.indexOf(state.role.id) !== -1;
    if (mine) {
      var hidden = state.practice && !item.el.classList.contains('revealed');
      rh.waiting = hidden ? 'mine-hidden' : 'mine';
      setStatus('<b>Your line.</b> Say it out loud, then tap ' + (hidden ? 'Check' : 'Next') + '.');
      if (hidden) $('#rbNext').textContent = 'Check';
      return;
    }
    rh.waiting = null;
    setStatus('<b>' + esc(item.name.toUpperCase()) + '</b> is speaking…');
    var text = plainForSpeech(item.text);
    if (!text) { rh.i++; step(); return; }
    speak(text, item.speakers.join('+'), function () { rh.i++; step(); });
  }

  function startRehearse(fromId) {
    if (!('speechSynthesis' in window)) return;
    loadVoices();
    rh.queue = buildQueue(fromId);
    rh.i = 0; rh.active = true; rh.paused = false;
    $('#rehearseBar').hidden = false;
    $('#rbPause').textContent = 'Pause';
    if (!state.role) setStatus('Tip: pick your role first so the phone waits for your lines.');
    step();
  }
  function stopRehearse() {
    rh.active = false; rh.token++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    clearNow();
    $('#rehearseBar').hidden = true;
  }

  // ---------- Events ----------
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var el;
      if ((el = t.closest('[data-open-roles]'))) { openRoleDialog(); return; }
      if ((el = t.closest('[data-dismiss-intro]'))) { store.set('lib.introDismissed', true); renderIntro(); return; }
      if ((el = t.closest('[data-role]'))) { $('#roleDialog').close(); setRole(el.dataset.role); return; }
      if ((el = t.closest('[data-rehearse]'))) { startRehearse(el.dataset.rehearse); return; }
      if ((el = t.closest('[data-goto]'))) { showView('script'); return; }
      if ((el = t.closest('[data-share-role]'))) {
        var link = location.href.split('#')[0];
        if (navigator.share) navigator.share({ title: document.title, text: 'Your part in ' + document.title, url: link }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { el.textContent = 'Link copied ✓'; });
        return;
      }
      if ((el = t.closest('.player [data-act="load"]'))) {
        var pbox = el.closest('.player');
        if (pbox.dataset.sc) startSoundCloud(pbox); else startPlayer(pbox);
        return;
      }
      if ((el = t.closest('.player [data-act="restart"]'))) {
        var box = el.closest('.player');
        if (box._sc) { box._sc.seekTo((parseFloat(box.dataset.start) || 0) * 1000); box._sc.play(); }
        else if (box._player) { box._player.seekTo(parseFloat(box.dataset.start) || 0, true); box._player.playVideo(); }
        return;
      }
      if ((el = t.closest('body.practice .line.mine'))) { el.classList.toggle('revealed'); return; }
      if ((el = t.closest('.nav a')) && window.innerWidth < 1000) { toggleNav(false); showView('script'); return; }
      if ((el = t.closest('.nav a'))) { showView('script'); return; }
    });

    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.learned && state.role) { setLearned(t.dataset.learned, t.checked); renderRolePanel(); renderNav(); }
    });

    $('#roleBtn').addEventListener('click', openRoleDialog);
    $('#clearRole').addEventListener('click', function () { setRole(null); });
    $$('.tab').forEach(function (b) { b.addEventListener('click', function () { showView(b.dataset.view); window.scrollTo(0, 0); }); });

    var pt = $('#practiceToggle');
    pt.checked = state.practice;
    document.body.classList.toggle('practice', state.practice);
    pt.addEventListener('change', function () {
      state.practice = pt.checked;
      store.set('lib.practice', state.practice);
      document.body.classList.toggle('practice', state.practice);
      $$('.line.revealed').forEach(function (el) { el.classList.remove('revealed'); });
      if (state.practice && !state.role) openRoleDialog();
    });

    $('#navBtn').addEventListener('click', function () { toggleNav(); });

    $('#rbNext').addEventListener('click', function () {
      if (rh.waiting === 'end') { stopRehearse(); return; }
      if (rh.waiting === 'mine-hidden') {
        rh.queue[rh.i].el.classList.add('revealed');
        rh.waiting = 'mine';
        $('#rbNext').textContent = 'Next';
        setStatus('<b>How did you do?</b> Tap Next to carry on.');
        return;
      }
      rh.token++;
      speechSynthesis.cancel();
      rh.paused = false;
      $('#rbPause').textContent = 'Pause';
      rh.i++;
      step();
    });
    $('#rbPause').addEventListener('click', function () {
      if (!rh.paused) {
        rh.paused = true; rh.token++; speechSynthesis.cancel();
        $('#rbPause').textContent = 'Resume';
        setStatus('Paused.');
      } else {
        rh.paused = false;
        $('#rbPause').textContent = 'Pause';
        step();
      }
    });
    $('#rbStop').addEventListener('click', stopRehearse);

    if ('speechSynthesis' in window) {
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function toggleNav(force) {
    var nav = $('#nav');
    var open = typeof force === 'boolean' ? force : !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    $('#navBtn').setAttribute('aria-expanded', String(open));
  }

  // ---------- Boot ----------
  function boot() {
    bind();
    var bust = '?v=' + Date.now().toString(36).slice(0, -3); // changes about once a minute, so script edits show up without stale caches
    Promise.all([
      fetch('script.md' + bust).then(function (r) { if (!r.ok) throw new Error('script.md: ' + r.status); return r.text(); }),
      fetch('songs.json' + bust).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (res) {
      state.doc = parseScript(res[0]);
      state.songs = res[1] || {};
      state.roles = buildRoles(state.doc);
      renderScript();
      renderInfo();
      renderIntro();
      var params = new URLSearchParams(location.search);
      var wanted = params.get('role');
      var match = wanted && state.roles.find(function (r) { return r.label.toLowerCase() === wanted.toLowerCase() || r.id.toLowerCase() === wanted.toLowerCase(); });
      var saved = store.get('lib.role', null);
      setRole(match ? match.id : saved, { quiet: true });
      if (location.hash) { var target = document.getElementById(location.hash.slice(1)); if (target) target.scrollIntoView(); }
    }).catch(function (err) {
      $('#script').innerHTML = '<p class="loading">Sorry, the script couldn\'t load (' + esc(err.message) + '). If you opened this file directly, use the website link instead.</p>';
    });
  }

  boot();
})();

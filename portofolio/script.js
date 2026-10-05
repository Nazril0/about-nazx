/* ===== Nazx — Personal Space (iOS) ===== */
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  let toastT;
  const toast = (msg) => {
    const t = $('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1700);
  };
  const buzz = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  /* ---------- Scroll reveal ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));

  /* ---------- Menu + halaman ---------- */
  // Bisa ditambah di collections.json (type: "collection" + dir). Ini cadangan kalau file itu tidak terbaca.
  const DEFAULT_CONFIG = [
    { id: 'profil', title: 'Profil', emoji: '👤', type: 'profile' },
    { id: 'game', title: 'Game', emoji: '🎮', type: 'collection', dir: 'games' },
    { id: 'gallery', title: 'Gallery', emoji: '🖼️', type: 'gallery', dir: 'gallery' },
    { id: 'tools', title: 'Tools', emoji: '🧰', type: 'collection', dir: 'tools' }
  ];
  // Ikon garis ala SF Symbols. Kategori baru tanpa ikon di sini otomatis pakai emojinya.
  const ICONS = {
    profil: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.2c1.3-2.2 3.2-3.2 5.8-3.2s4.5 1 5.8 3.2"/>',
    game: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11.2" r=".8" fill="currentColor"/><circle cx="17.5" cy="13" r=".8" fill="currentColor"/>',
    gallery: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5L21 16"/>',
    tools: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'
  };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['blue', 'orange', 'green', 'pink', 'purple', 'teal', 'indigo', 'red'];

  let config = DEFAULT_CONFIG;
  const sideNav = $('sideNav'), main = $('main'), navbar = $('navbar');
  const loaded = new Set();
  let current = 'profil';

  const buildSidebar = () => {
    sideNav.innerHTML = '';
    config.forEach((c) => {
      const a = document.createElement('a');
      a.href = '#' + c.id; a.className = 'side-item'; a.dataset.view = c.id;
      const ic = document.createElement('span'); ic.className = 'side-ic'; ic.setAttribute('aria-hidden', 'true');
      const path = ICONS[c.id] || (c.type === 'profile' && ICONS.profil) || (c.type === 'gallery' && ICONS.gallery);
      if (path) {
        const svg = document.createElementNS(SVG_NS, 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.innerHTML = path; ic.appendChild(svg);
      } else ic.textContent = c.emoji;
      const tx = document.createElement('span'); tx.textContent = c.title;
      a.append(ic, tx);
      sideNav.appendChild(a);
    });
  };
  const buildViews = () => {
    config.filter((c) => c.type === 'collection').forEach((c) => {
      if ($('view-' + c.id)) return;
      const sec = document.createElement('section');
      sec.className = 'view'; sec.id = 'view-' + c.id; sec.dataset.view = c.id; sec.hidden = true;
      sec.innerHTML = '<div class="wrap wide"><h2 class="large"></h2>' +
        '<label class="search" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" placeholder="Cari" aria-label="Cari"></label>' +
        '<ul class="apps"></ul></div>';
      sec.querySelector('h2').textContent = `${c.title} ${c.emoji}`;
      sec.querySelector('ul').id = 'list-' + c.id;
      main.appendChild(sec);
    });
  };

  const onScroll = () => navbar.classList.toggle('scrolled', scrollY > (current === 'profil' ? 170 : 34));
  addEventListener('scroll', onScroll, { passive: true });

  const showView = (id) => {
    const c = config.find((x) => x.id === id) || config[0];
    current = c.id;
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== c.id; });
    sideNav.querySelectorAll('.side-item').forEach((a) => {
      const on = a.dataset.view === c.id;
      a.classList.toggle('active', on);
      if (on) { a.setAttribute('aria-current', 'page'); a.scrollIntoView({ inline: 'center', block: 'nearest' }); } else a.removeAttribute('aria-current');
    });
    $('navTitle').textContent = c.title;
    window.scrollTo(0, 0); onScroll();
    if (c.type === 'collection' && !loaded.has(c.id)) { loaded.add(c.id); loadCollection(c); }
  };
  const route = () => showView(location.hash.replace('#', '') || 'profil');
  addEventListener('hashchange', route);

  /* ---------- Isi koleksi (otomatis) ---------- */
  const prettyName = (f) => f.replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^./, (m) => m.toUpperCase());
  const loadList = async (c) => {   // daftar ditulis manual di <folder>/list.json
    try {
      const r = await fetch(`${c.dir}/list.json`, { cache: 'no-cache' });
      if (!r.ok) return [];
      const j = await r.json();
      if (!Array.isArray(j)) return [];
      return j.map((x) => (typeof x === 'string' ? { file: x } : x))
        .filter((x) => x && x.file)
        .map((x) => ({ ...x, title: x.title || prettyName(x.file) }));
    } catch (_) { return []; }
  };
  const loadCollection = async (c) => {
    const list = $('list-' + c.id);
    const items = await loadList(c);
    list.innerHTML = '';
    if (!items.length) {
      const li = document.createElement('li'); li.className = 'empty';
      li.innerHTML = '<b aria-hidden="true">🌱</b>Belum ada isinya';
      list.appendChild(li); return;
    }
    const lis = items.map((g, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'app';
      const ic = document.createElement('span'); ic.className = 'app-ic g-' + (g.color || COLORS[i % COLORS.length]); ic.setAttribute('aria-hidden', 'true'); ic.textContent = g.emoji || c.emoji;
      const t = document.createElement('span'); t.className = 'app-t'; t.textContent = g.title;
      btn.append(ic, t);
      btn.addEventListener('click', () => { buzz(); openItem(c, g); });
      li.appendChild(btn); list.appendChild(li);
      return { li, title: g.title.toLowerCase() };
    });
    if (items.length > 6) {   // kolom cari muncul kalau isinya banyak
      const sec = $('view-' + c.id), box = sec.querySelector('.search'), inp = box.querySelector('input');
      box.hidden = false;
      inp.addEventListener('input', () => {
        const q = inp.value.trim().toLowerCase();
        lis.forEach((x) => { x.li.hidden = !!q && !x.title.includes(q); });
      });
    }
  };

  /* ---------- Sheet pemutar ---------- */
  // Bisa ditutup dengan: tombol Selesai, ketuk area kosong di atas, tarik header ke bawah,
  // tombol Kembali (HP / browser), atau tombol Esc.
  const player = $('player');
  let frame = $('plFrame');
  let resumeMusic = false, pushed = false, pendingBack = 0, lastClosed = 0;
  // Tiap kali buka/tutup, iframe diganti yang baru (bukan diarahkan ulang) supaya isi lama
  // (mis. tools sebelumnya) tidak sempat muncul sekejap sebelum game yang dipilih tampil.
  // Iframe baru juga tidak menambah riwayat browser, jadi tombol Kembali tetap pas.
  const setFrame = (url) => {
    const f = document.createElement('iframe');
    f.id = 'plFrame';
    f.title = frame.title || 'Isi';
    const allow = frame.getAttribute('allow');
    if (allow) f.setAttribute('allow', allow);
    f.src = url;
    frame.replaceWith(f);
    frame = f;
  };
  const openItem = (c, g) => {
    if (player.open || Date.now() - lastClosed < 400) return;   // cegah buka dobel / ketukan hantu setelah tutup
    resumeMusic = isPlaying();          // musik dimatikan selama main, lanjut lagi setelah ditutup
    bgm.pause();
    const url = `${c.dir}/${encodeURIComponent(g.file)}`;
    $('plTitle').textContent = `${g.emoji || c.emoji} ${g.title}`;
    $('plOpen').href = url;
    player.style.transform = '';
    setFrame(url);
    player.showModal();
    try { history.pushState({ sheet: 1 }, ''); pushed = true; } catch (_) { pushed = false; }
  };
  // Tutup langsung (tanpa jeda animasi) supaya tidak ada ketukan/Kembali yang menumpuk
  const closeSheet = () => {
    if (!player.open) return;
    player.classList.remove('closing');
    player.style.transform = '';
    player.close();
  };
  $('plClose').addEventListener('click', closeSheet);
  player.addEventListener('click', (e) => { if (e.target === player) closeSheet(); });   // ketuk area kosong di atas
  player.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });        // tombol Esc
  addEventListener('popstate', () => {                                                    // tombol Kembali
    if (pendingBack > 0) { pendingBack--; return; }   // popstate dari history.back() buatan kita sendiri -> abaikan
    if (pushed && player.open) { pushed = false; closeSheet(); }
  });
  player.addEventListener('close', () => {
    lastClosed = Date.now();
    setFrame('about:blank');
    if (pushed) {                                      // rapikan riwayat kalau ditutup lewat tombol/cara lain
      pushed = false; pendingBack++;
      try { history.back(); } catch (_) { pendingBack--; }
      setTimeout(() => { if (pendingBack > 0) pendingBack--; }, 800);   // jaga-jaga popstate tidak pernah datang
    }
    if (resumeMusic) { resumeMusic = false; startAudible(); }
  });

  // Tarik header ke bawah untuk menutup (seperti sheet iOS)
  (() => {
    const hd = player.querySelector('.sheet-hd');
    let y0 = null, dy = 0, t0 = 0;
    hd.addEventListener('touchstart', (e) => {
      if (e.target.closest('a,button')) return;
      y0 = e.touches[0].clientY; dy = 0; t0 = Date.now();
      player.style.transition = 'none';
    }, { passive: true });
    hd.addEventListener('touchmove', (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      player.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    const end = () => {
      if (y0 === null) return;
      const fast = dy / Math.max(1, Date.now() - t0) > 0.6;
      y0 = null; player.style.transition = '';
      if (dy > 110 || (fast && dy > 30)) closeSheet();
      else { player.style.transform = ''; }
    };
    hd.addEventListener('touchend', end);
    hd.addEventListener('touchcancel', end);
  })();

  // Mulai: tampilkan menu bawaan dulu, lalu pakai collections.json kalau ada
  buildSidebar(); buildViews(); route();
  fetch('collections.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => {
      if (!Array.isArray(cfg) || !cfg.length || JSON.stringify(cfg) === JSON.stringify(config)) return;
      config = cfg; buildSidebar(); buildViews(); loaded.clear(); route();
    })
    .catch(() => {});

  /* ---------- Musik ---------- */
  const bgm = $('bgm'), musicBtn = $('musicBtn'), musicText = $('musicText'), navMusic = $('navMusic');
  const VOL = 0.18;
  bgm.volume = VOL;
  const isPlaying = () => !bgm.paused && !bgm.muted;
  const renderMusic = () => {
    const on = isPlaying();
    [musicBtn, navMusic].forEach((b) => {
      b.classList.toggle('playing', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Jeda musik latar' : 'Putar musik latar');
    });
    musicText.textContent = on ? 'Diputar' : 'Musik';
  };
  const startAudible = async () => {
    bgm.muted = false; bgm.volume = VOL; bgm.loop = true;
    try { await bgm.play(); } catch (_) { /* diblokir browser: tunggu ketukan berikutnya */ }
    renderMusic();
  };
  const toggleMusic = () => { buzz(); if (isPlaying()) bgm.pause(); else startAudible(); };
  bgm.muted = true;                                   // autoplay muted diizinkan browser
  const ap = bgm.play(); if (ap && ap.catch) ap.catch(() => {});
  ['play', 'pause', 'volumechange'].forEach((ev) => bgm.addEventListener(ev, renderMusic));
  musicBtn.addEventListener('click', toggleMusic);
  navMusic.addEventListener('click', toggleMusic);

  /* ---------- Gerbang masuk ---------- */
  const gate = $('gate');
  const openSite = () => {
    gate.classList.add('hide');
    document.body.classList.remove('is-locked');
    setTimeout(() => gate.remove(), 700);
    document.querySelectorAll('.profile .reveal').forEach((el) => el.classList.add('in'));
  };
  $('gateBtn').addEventListener('click', () => { startAudible(); openSite(); });
  $('gateBtn').focus({ preventScroll: true });

  /* ---------- Chips ---------- */
  document.querySelectorAll('#pills button').forEach((b) => {
    b.addEventListener('click', () => { buzz(); b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); });
  });

  /* ---------- Random fact ---------- */
  const facts = [
    'Lebih suka ayam geprek daripada mie ayam',
    'Aku ganteng',
    'Hero ml ku full🤭',
    'Lebih suka scroll tiktok daripada ig'
  ];
  const factText = $('factText'), factBtn = $('factBtn');
  let fi = 0;
  if (factText && factBtn) factBtn.addEventListener('click', () => {
    buzz();
    fi = (fi + 1) % facts.length;
    factText.classList.add('out');
    setTimeout(() => { factText.textContent = facts[fi]; factText.classList.remove('out'); }, reduce ? 0 : 300);
  });

  /* ---------- Salin ID (semua elemen dengan data-copy) ---------- */
  document.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = el.dataset.copy;
      try { await navigator.clipboard.writeText(id); toast('ID tersalin ✓'); }
      catch (_) { toast('ID: ' + id); }
      buzz(12);
    });
  });
})();

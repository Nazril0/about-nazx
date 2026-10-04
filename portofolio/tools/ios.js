/* ===== Nazx Tools — helper iOS ===== */
window.iOS = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const buzz = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  // Segmented control: <div class="seg"><button>..</button>...</div>
  const seg = (el, onChange, start = 0) => {
    const btns = [...el.querySelectorAll('button')];
    el.style.setProperty('--n', btns.length);
    const set = (i, silent) => {
      btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      el.style.setProperty('--i', i);
      if (!silent && onChange) onChange(i, btns[i]);
    };
    btns.forEach((b, i) => b.addEventListener('click', () => { buzz(); set(i); }));
    set(start, true);
    return { set };
  };

  // Toast singkat di bawah layar
  let tt, toastEl;
  const toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 1700);
  };

  const copy = async (text, msg = 'Tersalin ✓') => {
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (__) {} t.remove();
    }
    buzz(12); toast(msg);
  };

  // Isi warna slider (bagian kiri biru)
  const fillRange = (r) => { const p = ((r.value - r.min) / (r.max - r.min)) * 100; r.style.setProperty('--p', p + '%'); };

  // Penyimpanan aman (kalau diblokir, tetap jalan di memori)
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (_) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };

  return { $, seg, toast, copy, buzz, fillRange, store };
})();

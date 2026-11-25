/* widgets.js — UI wrappers for the simulators. Each SimUI.* mounts into a container element.
 * Requires (as needed): bptree.js, buffer.js, exthash.js, extsort.js */
(function () {
  'use strict';
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const num = (el, sel) => +el.querySelector(sel).value;
  const fmt = (x, d) => (d === undefined ? x : Number(x).toLocaleString('el-GR', { maximumFractionDigits: d }));

  const SimUI = {};

  /* ───────── B+ tree playground ───────── */
  SimUI.bptree = function (el, cfg) {
    cfg = cfg || {};
    el.classList.add('sim');
    el.innerHTML = `
      <div class="sim-title">🌳 ${cfg.title || 'B+ Tree Simulator'}</div>
      <div class="sim-controls">
        <label>φύλλο: max εγγραφές <input type="number" class="lc" min="2" max="8" value="${cfg.leafCap || 4}"></label>
        <label>εσωτ.: max κλειδιά <input type="number" class="kc" min="2" max="8" value="${cfg.keyCap || 4}"></label>
        <button class="sim-btn rebuild">↺ Νέο κενό δέντρο</button>
        ${cfg.spec ? '<button class="sim-btn preset">📄 Παράδειγμα</button>' : ''}
      </div>
      <div class="sim-controls">
        <label>κλειδί <input type="number" class="key" value="${cfg.firstKey || 8}"></label>
        <button class="sim-btn primary ins">➕ Εισαγωγή</button>
        <button class="sim-btn danger del">➖ Διαγραφή</button>
        <button class="sim-btn find">🔍 Αναζήτηση</button>
        <button class="sim-btn undo">↶ Αναίρεση</button>
        <button class="sim-btn rnd">🎲 +5 τυχαία</button>
      </div>
      <div class="bpt-host"></div>
      <div class="sim-kpis"><div class="sim-kpi"><div class="v h">-</div><div class="l">ύψος (επίπεδα)</div></div>
        <div class="sim-kpi"><div class="v n">-</div><div class="l">κλειδιά</div></div>
        <div class="sim-kpi"><div class="v mins">-</div><div class="l">ελάχιστα (φύλλο / εσωτ.)</div></div></div>
      <ol class="sim-log"></ol>
      <div class="sim-note">Σύμβαση: στον εσωτερικό κόμβο, ο δείκτης <em>δεξιά</em> ενός κλειδιού K οδηγεί σε τιμές ≥ K. Split φύλλου → COPY-UP, split εσωτερικού → PUSH-UP. Διαγραφή: δανεισμός πρώτα από αριστερό, μετά από δεξιό αδελφό, αλλιώς συγχώνευση.</div>`;
    const host = el.querySelector('.bpt-host'), log = el.querySelector('.sim-log');
    let tree, hist = [];
    const fresh = () => new BPlusTree(num(el, '.lc'), num(el, '.kc'));
    function draw(extra) {
      renderBPTree(host, tree, Object.assign({ pad: cfg.pad || 0 }, extra || {}));
      el.querySelector('.h').textContent = tree.height();
      el.querySelector('.n').textContent = tree.allKeys().length;
      el.querySelector('.mins').textContent = tree.minLeaf + ' / ' + tree.minKeys;
      log.innerHTML = (tree.log || []).map(x => `<li>${x}</li>`).join('');
    }
    function loadPreset() {
      if (cfg.spec) { el.querySelector('.lc').value = cfg.leafCap; el.querySelector('.kc').value = cfg.keyCap; tree = BPlusTree.fromSpec(cfg.spec, cfg.leafCap, cfg.keyCap); }
      else { tree = fresh(); (cfg.keys || []).forEach(k => tree.insert(k)); tree.log = []; tree.touched = new Set(); }
      hist = []; draw();
    }
    el.querySelector('.rebuild').onclick = () => { tree = fresh(); hist = []; tree.log = ['Κενό δέντρο: η ρίζα είναι ένα (άδειο) φύλλο.']; draw(); };
    if (cfg.spec) el.querySelector('.preset').onclick = loadPreset;
    el.querySelector('.ins').onclick = () => { hist.push(tree.clone()); tree.insert(num(el, '.key')); draw({ mark: num(el, '.key') }); };
    el.querySelector('.del').onclick = () => { hist.push(tree.clone()); tree.delete(num(el, '.key')); draw(); };
    el.querySelector('.find').onclick = () => { const r = tree.search(num(el, '.key')); tree.log = [`Διαδρομή ρίζα→φύλλο: ${r.visited.length} κόμβοι = ${r.visited.length} I/O. ${r.found ? 'Βρέθηκε ✅' : 'Δεν υπάρχει ❌'}`]; tree.touched = new Set(); draw({ path: r.visited, mark: num(el, '.key') }); };
    el.querySelector('.undo').onclick = () => { if (hist.length) { tree = hist.pop(); tree.log = ['↶ Αναίρεση.']; tree.touched = new Set(); draw(); } };
    el.querySelector('.rnd').onclick = () => { hist.push(tree.clone()); const logs = []; for (let i = 0; i < 5; i++) { const k = Math.floor(Math.random() * 99) + 1; tree.insert(k); logs.push(`+${k}`); } tree.log = ['Εισαγωγές: ' + logs.join(' ')]; draw(); };
    loadPreset();
  };

  /* ───────── exam-style B+ question (insert A / delete Γ) ───────── */
  SimUI.bptExam = function (el, cfg) {
    el.classList.add('sim');
    const isDel = cfg.mode === 'delete';
    el.innerHTML = `
      <div class="sim-title">🎯 ${cfg.title}</div>
      <div class="sim-controls">
        <label>2 τελευταία ψηφία ΑΜ <input type="number" class="am" min="0" max="99" value="${cfg.am || 58}"></label>
        <button class="sim-btn primary go">▶ Λύσε</button>
        <button class="sim-btn reset">↺ Αρχικό δέντρο</button>
      </div>
      <div class="sim-out ans">—</div>
      <div class="bpt-host"></div>
      <ol class="sim-log"></ol>`;
    const host = el.querySelector('.bpt-host'), log = el.querySelector('.sim-log'), ans = el.querySelector('.ans');
    const pad = 3, P = (k) => String(k).padStart(3, '0');
    function reset() { const t = BPlusTree.fromSpec(cfg.spec, cfg.leafCap, cfg.keyCap); t.touched = new Set(); renderBPTree(host, t, { pad }); log.innerHTML = ''; ans.innerHTML = 'Δώσε τα 2 τελευταία ψηφία του ΑΜ και πάτα «Λύσε».'; }
    el.querySelector('.reset').onclick = reset;
    el.querySelector('.go').onclick = () => {
      const t = BPlusTree.fromSpec(cfg.spec, cfg.leafCap, cfg.keyCap);
      let d = num(el, '.am'); if (cfg.zeroAsTen && d === 0) d = 10;
      const A = d * 10;
      let target = A, extra = `A = ${d}×10 = <b>${A}</b>`;
      if (isDel) {
        const keys = t.allKeys(); const g = keys.find(k => k > A);
        if (g === undefined) { ans.innerHTML = extra + ' — δεν υπάρχει μεγαλύτερη τιμή στο αρχείο.'; return; }
        target = g; extra += ` → Γ = αμέσως μεγαλύτερη τιμή στο αρχείο = <b>${P(g)}</b>`;
        t.delete(g);
      } else {
        if (!t.insert(A)) { ans.innerHTML = extra + ' — υπάρχει ήδη.'; return; }
      }
      const rootKeys = t.root.keys.map(P);
      ans.innerHTML = `${extra}<br>Νέα ρίζα: <span class="sim-big">[ ${rootKeys.join(' | ')} ]</span> &nbsp; (ύψος ${t.height()} επίπεδα)`;
      renderBPTree(host, t, { pad, mark: isDel ? null : target });
      log.innerHTML = t.log.map(x => `<li>${x}</li>`).join('');
    };
    reset();
  };

  /* ───────── buffer: nested-loop join I/O ───────── */
  SimUI.bufferNL = function (el, cfg) {
    cfg = cfg || {};
    el.classList.add('sim');
    el.innerHTML = `
      <div class="sim-title">🔁 Nested-Loop Join & Πολιτικές Αντικατάστασης</div>
      <div class="sim-controls">
        <label>p(R) εξωτ. <input type="number" class="pr" min="1" max="40" value="${cfg.pR || 2}"></label>
        <label>p(S) εσωτ. <input type="number" class="ps" min="1" max="40" value="${cfg.pS || 4}"></label>
        <label>μοντέλο <select class="model"><option value="shared">κοινή δεξαμενή M</option><option value="part">χωριστά πλαίσια R / S</option></select></label>
        <label class="mshared">M <input type="number" class="m" min="2" max="60" value="${cfg.M || 4}"></label>
        <label class="mpart" style="display:none">για R <input type="number" class="mo" min="1" max="40" value="2"> για S <input type="number" class="mi" min="1" max="40" value="2"></label>
        <label>πολιτική <select class="pol"><option>LRU</option><option>MRU</option><option>FIFO</option><option>CLOCK</option><option value="LRU2">LRU-2</option></select></label>
        <label><input type="checkbox" class="pin"> καρφίτσωμα εξωτ. μπλοκ</label>
      </div>
      <div class="sim-out res"></div>
      <div class="sim-out cmp"></div>
      <details style="margin-top:10px"><summary style="cursor:pointer;color:var(--purple)">Βήμα-βήμα πίνακας πλαισίων (κόκκινο = I/O)</summary><div class="steps" style="overflow-x:auto;margin-top:8px"></div></details>`;
    const q = (s) => el.querySelector(s);
    function run() {
      const pR = num(el, '.pr'), pS = num(el, '.ps'), pol = q('.pol').value, part = q('.model').value === 'part';
      q('.mshared').style.display = part ? 'none' : ''; q('.mpart').style.display = part ? '' : 'none';
      const refs = BufferSim.nestedLoopRefs(pR, pS);
      const pols = ['LRU', 'MRU', 'FIFO', 'CLOCK', 'LRU2'];
      const go = (p) => part ? BufferSim.simulatePartitioned(refs, num(el, '.mo'), num(el, '.mi'), p) : BufferSim.simulate(refs, num(el, '.m'), p, { pinOuter: q('.pin').checked });
      const r = go(pol);
      const ideal = pR + pS, worst = pR + pR * pS;
      q('.res').innerHTML = `Αιτήσεις σελίδων: <b>${refs.length}</b> · Κόστος (I/O = αστοχίες): <span class="sim-big">${r.misses}</span>
        <br><span style="color:var(--muted);font-size:.85rem">Ελάχιστο δυνατό p(R)+p(S) = ${ideal} · Χειρότερο (κάθε αίτηση I/O) p(R)+p(R)·p(S) = ${worst}${!part && pol === 'LRU' ? ` · Τύπος LRU: ${BufferSim.nlLRUFormula(pR, pS, num(el, '.m'))}` : ''}</span>`;
      q('.cmp').innerHTML = 'Σύγκριση: ' + pols.map(p => `<b style="color:${p === pol ? 'var(--yellow)' : 'var(--txt)'}">${p === 'LRU2' ? 'LRU-2' : p}</b> ${go(p).misses}`).join(' · ');
      const steps = part ? null : r.steps;
      if (steps) {
        const M = num(el, '.m');
        let h = '<table class="buf-table"><tr><th>t</th><th>σελίδα</th><th>;</th>' + Array.from({ length: M }, (_, i) => `<th>f${i}</th>`).join('') + '<th>θύμα</th></tr>';
        steps.forEach(s => {
          h += `<tr class="${s.outer ? 'outer' : ''}"><td>${s.t}</td><td>${s.page}</td><td class="${s.hit ? 'hit' : 'miss'}">${s.hit ? 'hit' : 'I/O'}</td>` +
            s.frames.map((f, i) => `<td class="${i === s.frame ? 'newf' : ''}">${f || ''}${pol === 'CLOCK' && f ? `<sub>${s.bits[i]}</sub>` : ''}</td>`).join('') + `<td>${s.evicted || ''}</td></tr>`;
        });
        q('.steps').innerHTML = h + '</table>';
      } else q('.steps').innerHTML = '<p style="color:var(--muted)">(Στο μοντέλο χωριστών πλαισίων κάθε σχέση έχει δικά της πλαίσια: R → ' + r.outer.misses + ' I/O, S → ' + r.inner.misses + ' I/O.)</p>';
    }
    el.querySelectorAll('input,select').forEach(i => i.addEventListener('input', run));
    run();
  };

  /* ───────── reference string replacement ───────── */
  SimUI.refString = function (el, cfg) {
    cfg = cfg || {};
    el.classList.add('sim');
    el.innerHTML = `
      <div class="sim-title">🧮 Πολιτική αντικατάστασης σε ακολουθία αιτήσεων</div>
      <div class="sim-controls"><label style="flex:1;min-width:240px">αιτήσεις <input type="text" class="wide refs" value="${cfg.refs || 'A B C A D B E A B C D E'}"></label></div>
      <div class="sim-controls"><label>πλαίσια <input type="number" class="m" min="1" max="12" value="${cfg.M || 3}"></label>
      <label>πολιτική <select class="pol"><option>LRU</option><option>MRU</option><option>FIFO</option><option>CLOCK</option><option value="LRU2">LRU-2</option></select></label></div>
      <div class="sim-out res"></div><div class="steps" style="overflow-x:auto;margin-top:10px"></div>`;
    if (cfg.policy) el.querySelector('.pol').value = cfg.policy;
    function run() {
      const refs = el.querySelector('.refs').value.trim().split(/[\s,]+/).filter(Boolean), M = num(el, '.m'), pol = el.querySelector('.pol').value;
      const r = BufferSim.simulate(refs, M, pol);
      const all = ['LRU', 'MRU', 'FIFO', 'CLOCK', 'LRU2'].map(p => `${p === 'LRU2' ? 'LRU-2' : p}: ${BufferSim.simulate(refs, M, p).misses}`).join(' · ');
      el.querySelector('.res').innerHTML = `Αστοχίες (I/O): <span class="sim-big">${r.misses}</span> / ${refs.length} &nbsp; <span style="color:var(--muted);font-size:.85rem">(${all})</span>`;
      let h = '<table class="buf-table"><tr><th>t</th><th>σελίδα</th><th>;</th>' + Array.from({ length: M }, (_, i) => `<th>f${i}</th>`).join('') + '<th>θύμα</th></tr>';
      r.steps.forEach(s => {
        h += `<tr><td>${s.t}</td><td>${esc(s.page)}</td><td class="${s.hit ? 'hit' : 'miss'}">${s.hit ? 'hit' : 'I/O'}</td>` + s.frames.map((f, i) => {
          let sub = '';
          if (f && pol === 'CLOCK') sub = `<sub>ref=${s.bits[i]}</sub>${i === s.hand ? '◀' : ''}`;
          if (f && pol === 'LRU2') sub = `<sub>t1=${s.stamps[i][0]},t2=${s.stamps[i][1] === null ? '-∞' : s.stamps[i][1]}</sub>`;
          return `<td class="${i === s.frame ? 'newf' : ''}">${f ? esc(f) : ''}${sub}</td>`;
        }).join('') + `<td>${s.evicted ? esc(s.evicted) : ''}</td></tr>`;
      });
      el.querySelector('.steps').innerHTML = h + '</table>';
    }
    el.querySelectorAll('input,select').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── extendible hashing ───────── */
  SimUI.extHash = function (el, cfg) {
    el.classList.add('sim');
    const opts = (cfg.choices || []).map(([l, h]) => `<option value="${h}|${l}">${l} (${h})</option>`).join('');
    el.innerHTML = `
      <div class="sim-title">#️⃣ ${cfg.title || 'Επεκτατός Κατακερματισμός'}</div>
      <div class="sim-controls">
        ${opts ? `<label>εισαγωγή <select class="ch">${opts}</select></label><button class="sim-btn primary insc">➕ Εισαγωγή επιλογής</button>` : ''}
      </div>
      <div class="sim-controls"><label>ετικέτα <input type="text" class="lab" value="x"></label><label>hash (bits) <input type="text" class="hh" value="10110"></label>
        <button class="sim-btn ins">➕ Εισαγωγή</button><button class="sim-btn reset">↺ Αρχική κατάσταση</button></div>
      <div class="sim-kpis"><div class="sim-kpi"><div class="v D">-</div><div class="l">ολικό βάθος</div></div><div class="sim-kpi"><div class="v S">-</div><div class="l">μέγεθος πίνακα (κελιά)</div></div><div class="sim-kpi"><div class="v B">-</div><div class="l">μπλοκ δεδομένων</div></div></div>
      <div class="eh-grid" style="margin-top:12px"><div class="eh-dir"></div><div class="eh-buckets"></div></div>
      <ol class="sim-log"></ol>`;
    let eh, newIds = new Set();
    const init = () => { eh = cfg.make(); newIds = new Set(); draw(); el.querySelector('.sim-log').innerHTML = ''; };
    function draw() {
      el.querySelector('.D').textContent = eh.D; el.querySelector('.S').textContent = eh.dir.length; el.querySelector('.B').textContent = eh.buckets().length;
      el.querySelector('.eh-dir').innerHTML = eh.dir.map((b, i) => `<div><span>${eh.D ? i.toString(2).padStart(eh.D, '0') : 'ε'}</span><span class="ptr">→ ${b.name}</span></div>`).join('');
      el.querySelector('.eh-buckets').innerHTML = eh.buckets().map(b => `<div class="eh-bucket ${newIds.has(b.id) ? 'new' : ''}"><div class="hd">Κάδος ${b.name} · τοπικό βάθος d' = ${b.d} · ${b.items.length}/${eh.cap}</div>${b.items.map(it => `<span class="it">${esc(it.label)} <code>${it.h}</code></span>`).join('') || '<span class="it" style="color:var(--dim)">κενός</span>'}</div>`).join('');
    }
    function ins(label, h) {
      const before = new Set(eh.buckets().map(b => b.id));
      eh.insert(label, h); newIds = new Set(eh.buckets().filter(b => !before.has(b.id)).map(b => b.id));
      draw(); el.querySelector('.sim-log').innerHTML = eh.log.map(x => `<li>${x}</li>`).join('');
    }
    if (opts) el.querySelector('.insc').onclick = () => { const [h, l] = el.querySelector('.ch').value.split('|'); ins(l, h); };
    el.querySelector('.ins').onclick = () => { const h = el.querySelector('.hh').value.trim(); if (!/^[01]+$/.test(h)) return; ins(el.querySelector('.lab').value, h.padEnd(eh.bits, '0')); };
    el.querySelector('.reset').onclick = init;
    init();
  };

  /* ───────── external sort calculator ───────── */
  SimUI.extSortCalc = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">📊 Περάσματα & κόστος εξωτερικής ταξινόμησης</div>
      <div class="sim-controls"><label>N (σελίδες) <input type="number" class="n" min="1" value="108"></label><label>B (πλαίσια) <input type="number" class="b" min="3" value="5"></label></div>
      <div class="sim-out o"></div>`;
    function run() {
      const N = num(el, '.n'), B = num(el, '.b');
      const c = ExtSort.passes(N, B, 'classic'), s = ExtSort.passes(N, B, 'slides'), t = ExtSort.twoWay(N);
      el.querySelector('.o').innerHTML = `
        <b>Γενικευμένη (B-way) merge sort:</b><br>
        Πέρασμα 0: ⌈N/B⌉ = ⌈${N}/${B}⌉ = <b>${c.runs0}</b> ταξινομημένα runs (μήκους ${B} σελίδων)<br>
        Περάσματα συγχώνευσης: ⌈log<sub>${B - 1}</sub>${c.runs0}⌉ = <b>${c.passes - 1}</b> → σύνολο <b>${c.passes}</b> περάσματα<br>
        Κόστος = 2·N·(#περάσματα) = 2·${N}·${c.passes} = <span class="sim-big">${c.cost} I/O</span><br>
        <span style="color:var(--muted);font-size:.85rem">Με τον τύπο της διαφάνειας (⌈N/(B−1)⌉ runs): ${s.runs0} runs, ${s.passes} περάσματα, ${s.cost} I/O.</span><br><br>
        <b>2-way (3 πλαίσια):</b> 1 + ⌈log<sub>2</sub>${N}⌉ = <b>${t.passes}</b> περάσματα → 2·${N}·${t.passes} = <b>${t.cost}</b> I/O`;
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── merge visualisation ───────── */
  SimUI.mergeViz = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">🧩 Βήμα-βήμα: runs ανά πέρασμα</div>
      <div class="sim-controls"><label style="flex:1;min-width:220px">κλειδιά <input type="text" class="wide k" value="3 4 6 2 9 4 8 7 5 6 3 1 2"></label></div>
      <div class="sim-controls"><label>εγγραφές/σελίδα <input type="number" class="r" min="1" max="4" value="2"></label><label>B πλαίσια <input type="number" class="b" min="3" max="9" value="3"></label><label><input type="checkbox" class="one" checked> πέρασμα 0 ανά σελίδα (2-way διαφάνειας)</label><button class="sim-btn rnd">🎲 τυχαία</button></div>
      <div class="o"></div>`;
    function pages(arr, r) { const p = []; for (let i = 0; i < arr.length; i += r) p.push(arr.slice(i, i + r)); return p; }
    function run() {
      const keys = el.querySelector('.k').value.trim().split(/[\s,]+/).map(Number).filter(x => !isNaN(x));
      const r = num(el, '.r'), B = num(el, '.b');
      const pg = pages(keys, r); let html = '';
      const strip = (label, runs) => `<div class="strip"><span class="lbl">${label}</span>${runs.map((run, ri) => pages(run, r).map(p => `<span class="blk run${ri % 6}">${p.join(',')}</span>`).join('')).join('<span style="width:10px"></span>')}</div>`;
      html += strip('αρχείο', [keys]);
      const p0 = el.querySelector('.one').checked ? 1 : B;
      let runs = []; for (let i = 0; i < pg.length; i += p0) runs.push(pg.slice(i, i + p0).flat().sort((a, b) => a - b));
      html += strip('πέρασμα 0', runs);
      let pass = 1, io = 2 * pg.length;
      while (runs.length > 1) {
        const nr = []; for (let i = 0; i < runs.length; i += B - 1) nr.push(runs.slice(i, i + B - 1).flat().sort((a, b) => a - b));
        runs = nr; html += strip('πέρασμα ' + pass, runs); pass++; io += 2 * pg.length;
      }
      html += `<div class="sim-note">N = ${pg.length} σελίδες, ${pass} περάσματα, κόστος 2·N·περάσματα = <b>${io}</b> I/O. Κάθε χρώμα = ένα run. Πέρασμα 0: κάθε σελίδα (2-way) ή κάθε γέμισμα των B πλαισίων ταξινομείται στη μνήμη· μετά συγχωνεύουμε B−1 runs τη φορά (1 πλαίσιο για έξοδο).</div>`;
      el.querySelector('.o').innerHTML = html;
    }
    el.querySelector('.rnd').onclick = () => { el.querySelector('.k').value = Array.from({ length: 16 }, () => Math.floor(Math.random() * 40)).join(' '); run(); };
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── replacement selection ───────── */
  SimUI.replSel = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">♻️ Replacement Sort (replacement selection)</div>
      <div class="sim-controls"><label style="flex:1;min-width:220px">κλειδιά εισόδου <input type="text" class="wide k" value="28 23 22 26 25 21 20 16 31 32 14 17 13 18 12 19 27 34 11 29"></label></div>
      <div class="sim-controls"><label>εγγραφές στο current set <input type="number" class="c" min="2" max="20" value="10"></label><button class="sim-btn rnd">🎲 τυχαία</button></div>
      <div class="o"></div><details style="margin-top:8px"><summary style="cursor:pointer;color:var(--purple)">Ίχνος βήμα-βήμα</summary><ol class="sim-log tr"></ol></details>`;
    function run() {
      const keys = el.querySelector('.k').value.trim().split(/[\s,]+/).map(Number).filter(x => !isNaN(x)), c = num(el, '.c');
      const r = ExtSort.replacementSelection(keys, c), cl = ExtSort.chunkRuns(keys, c);
      const strip = (label, runs) => `<div class="strip"><span class="lbl">${label}</span>${runs.map((run, i) => `<span class="blk run${i % 6}">${run.join(' ')}</span>`).join('')}</div>`;
      el.querySelector('.o').innerHTML = strip('replacement', r.runs) + strip('κλασικό π.0', cl) +
        `<div class="sim-note">Replacement sort: <b>${r.runs.length}</b> runs (μέσο μήκος ${(keys.length / r.runs.length).toFixed(1)} εγγραφές) έναντι <b>${cl.length}</b> runs των ${c} με το κλασικό πέρασμα 0. Σε τυχαία είσοδο τα runs βγαίνουν ≈ 2× μεγαλύτερα από τη μνήμη.</div>`;
      el.querySelector('.tr').innerHTML = r.trace.map(s => s.type === 'end' ? `<li><b>Τέλος run</b>: κανένα κλειδί του current set ≥ l → ξεκινά νέο run.</li>` : `<li>έξοδος <b>${s.key}</b> (l=${s.key})${s.incoming !== null ? `, μπαίνει ${s.incoming}${s.incoming < s.key ? ' (μικρότερο από l → «παγώνει» για το επόμενο run)' : ''}` : ''} · set: {${s.set.join(', ')}}</li>`).join('');
    }
    el.querySelector('.rnd').onclick = () => { el.querySelector('.k').value = Array.from({ length: 24 }, () => Math.floor(Math.random() * 90) + 10).join(' '); run(); };
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── HDD timing ───────── */
  SimUI.hdd = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">💽 Χρόνος I/O σε HDD: τυχαία vs σειριακή ανάγνωση</div>
      <div class="sim-controls"><label>seek (ms) <input type="number" class="s" step="0.1" value="10.5"></label><label>RPM <input type="number" class="rpm" value="5400"></label>
      <label>ρυθμός (MB/s) <input type="number" class="tr" value="175"></label><label>μπλοκ (KB) <input type="number" class="bk" value="4"></label><label>#μπλοκ <input type="number" class="n" value="1000"></label></div>
      <div class="sim-out o"></div>`;
    function run() {
      const s = num(el, '.s'), rpm = num(el, '.rpm'), tr = num(el, '.tr'), bk = num(el, '.bk'), n = num(el, '.n');
      const rot = 60000 / rpm / 2, ttr = (bk / 1024) / tr * 1000;
      const rand = n * (s + rot + ttr), seq = s + rot + n * ttr;
      el.querySelector('.o').innerHTML = `μέση περιστροφική καθυστέρηση t<sub>r</sub> = ½ · 60000/${rpm} = <b>${rot.toFixed(2)} ms</b> · μεταφορά t<sub>tr</sub> = ${bk}KB / ${tr}MB/s = <b>${ttr.toFixed(4)} ms</b><br>
        Τυχαία: ${n}·(t<sub>s</sub>+t<sub>r</sub>+t<sub>tr</sub>) = <span class="sim-big">${fmt(rand, 0)} ms</span><br>
        Σειριακά: t<sub>s</sub>+t<sub>r</sub>+${n}·t<sub>tr</sub> = <span class="sim-big" style="color:var(--cyan)">${fmt(seq, 1)} ms</span> → <b>${(rand / seq).toFixed(0)}×</b> ταχύτερα`;
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── RAID ───────── */
  SimUI.raid = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">🗄️ RAID: χωρητικότητα & αξιοπιστία</div>
      <div class="sim-controls"><label>επίπεδο <select class="lv"><option value="0">RAID-0</option><option value="1">RAID-1</option><option value="01">RAID-0+1</option><option value="2">RAID-2</option><option value="3">RAID-3</option><option value="4">RAID-4</option><option value="5" selected>RAID-5</option><option value="6">RAID-6</option></select></label>
      <label>D δίσκοι δεδομένων <input type="number" class="d" min="1" max="32" value="4"></label><label>MTTF δίσκου (ώρες) <input type="number" class="mt" value="50000"></label></div>
      <div class="o"></div>`;
    const info = {
      '0': { c: () => 0, txt: 'Striping ανά μπλοκ, καμία πλεονασματικότητα. Μέγιστο bandwidth, μηδενική αξιοπιστία.' },
      '1': { c: (D) => D, txt: 'Mirroring: κάθε δίσκος έχει καθρέφτη. Δύο παράλληλες αναγνώσεις, εγγραφή και στα 2 αντίγραφα.' },
      '01': { c: (D) => D, txt: 'Striping + mirroring. Εγγραφές όπως RAID-1, αναγνώσεις με aggregate bandwidth.' },
      '2': { c: (D) => Math.ceil(Math.log2(D + 1)) + (D === 4 ? 0 : 0), txt: 'Striping ανά bit + κώδικας Hamming (ECC) για να βρεθεί ο χαλασμένος δίσκος. Για D=4 → C=3. Μόνο θεωρητικό ενδιαφέρον.' },
      '3': { c: () => 1, txt: 'Bit-interleaved parity, 1 δίσκος ελέγχου (ο controller ξέρει ποιος χάλασε). 1 I/O τη φορά.' },
      '4': { c: () => 1, txt: 'Block-interleaved parity, 1 δίσκος ελέγχου = σημείο συμφόρησης στις εγγραφές. NewParity = (OldData ⊕ NewData) ⊕ OldParity.' },
      '5': { c: () => 1, txt: 'Όπως RAID-4 αλλά η parity μοιράζεται round-robin σε όλους τους D+1 δίσκους → πολλές εγγραφές παράλληλα.' },
      '6': { c: () => 2, txt: 'P+Q (Reed-Solomon): αντέχει 2 ταυτόχρονες βλάβες. Μικρή εγγραφή = 6 I/O.' }
    };
    function run() {
      const lv = el.querySelector('.lv').value, D = num(el, '.d'), mt = num(el, '.mt');
      const C = lv === '2' ? (D === 4 ? 3 : Math.ceil(Math.log2(D)) + 1) : info[lv].c(D);
      const u = D / (D + C), N = D + C;
      let cells = '';
      for (let row = 0; row < 3; row++) {
        cells += '<div class="cells" style="margin:2px 0">';
        for (let d = 0; d < N; d++) {
          let cls = 'g', txt = 'd' + (row * D + d);
          if (lv === '1' || lv === '01') { cls = d < D ? 'g' : 'h'; txt = d < D ? 'b' + (row * D + d) : 'c' + (row * D + d - D); }
          else if (lv === '5') { const pd = (N - 1 - row % N); if (d === pd) { cls = 'y'; txt = 'P' + row; } else { cls = 'g'; txt = 'b' + (row * D + (d > pd ? d - 1 : d)); } }
          else if (lv === '6') { const p1 = (N - 1 - row % N), p2 = (N - 2 - row % N + N) % N; if (d === p1) { cls = 'y'; txt = 'P' + row; } else if (d === p2) { cls = 'r'; txt = 'Q' + row; } else { txt = 'b' + d; } }
          else if (d >= D) { cls = 'y'; txt = (lv === '2' ? 'ECC' : 'P') + row; }
          else txt = (lv === '2' || lv === '3' ? 'bit' : 'b') + (row * D + d);
          cells += `<span class="${cls}">${txt}</span>`;
        }
        cells += '</div>';
      }
      el.querySelector('.o').innerHTML = `<div style="overflow-x:auto;margin:6px 0">${Array.from({ length: N }, (_, i) => `<span style="display:inline-block;min-width:2.9em;font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono'">disk${i}</span>`).join('')}${cells}</div>
       <div class="sim-kpis"><div class="sim-kpi"><div class="v">${N}</div><div class="l">δίσκοι (D+C), C=${C}</div></div><div class="sim-kpi"><div class="v">${(u * 100).toFixed(0)}%</div><div class="l">αξιοποίηση χώρου D/(D+C)</div></div><div class="sim-kpi"><div class="v">${fmt(mt / N, 0)} h</div><div class="l">MTTF πίνακα ≈ MTTF/${N} (πρώτη βλάβη)</div></div></div>
       <p style="font-size:.9rem;color:var(--muted);margin:10px 0 0">${info[lv].txt}</p>`;
    }
    el.querySelectorAll('input,select').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── cost model heap vs sorted ───────── */
  SimUI.costModel = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">⚖️ Μοντέλο κόστους: Heap vs Sorted αρχείο</div>
      <div class="sim-controls"><label>B μπλοκ <input type="number" class="b" value="1000000"></label><label>R εγγρ./μπλοκ <input type="number" class="r" value="100"></label>
      <label>D (ms) <input type="number" class="d" step="0.1" value="5"></label><label>C (ns) <input type="number" class="c" value="50"></label></div><div class="o" style="overflow-x:auto"></div>`;
    function run() {
      const B = num(el, '.b'), R = num(el, '.r'), D = num(el, '.d'), C = num(el, '.c') / 1e6; // ms
      const scan = B * (D + R * C), lg = (x) => Math.log2(x);
      const f = (ms) => ms >= 1000 ? fmt(ms / 1000, 1) + ' s' : fmt(ms, 3) + ' ms';
      const rows = [
        ['Scan', 'B(D+RC)', scan, 'B(D+RC)', scan],
        ['Αναζήτηση ισότητας', '0.5·B(D+RC) (μέσος)', 0.5 * scan, 'D·log₂B + C·log₂R', D * lg(B) + C * lg(R)],
        ['Αναζήτηση εύρους', 'B(D+RC)', scan, 'D·log₂B + #μπλοκ αποτελέσματος', D * lg(B)],
        ['Εισαγωγή', '2D + C', 2 * D + C, 'B(D+RC)', scan],
        ['Διαγραφή (μπλοκ γνωστό)', 'C + D', C + D, 'B(D+RC)', scan]];
      el.querySelector('.o').innerHTML = `<table class="vtbl"><thead><tr><th>Πράξη</th><th style="color:var(--orange)">Heap: τύπος</th><th>χρόνος</th><th style="color:var(--blue)">Sorted: τύπος</th><th>χρόνος</th></tr></thead><tbody>${rows.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${f(r[2])}</td><td>${r[3]}</td><td>${f(r[4])}</td></tr>`).join('')}</tbody></table>`;
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* ───────── B+ capacity / height calculator ───────── */
  SimUI.bptCapacity = function (el) {
    el.classList.add('sim');
    el.innerHTML = `<div class="sim-title">📐 Fan-out & ύψος B+ δέντρου</div>
      <div class="sim-controls"><label>σελίδα (B) <input type="number" class="p" value="4096"></label><label>κλειδί (B) <input type="number" class="k" value="12"></label><label>δείκτης (B) <input type="number" class="ptr" value="8"></label><label>πληρότητα % <input type="number" class="u" value="67"></label><label>#εγγραφές <input type="number" class="n" value="100000000"></label></div><div class="sim-out o"></div>`;
    function run() {
      const P = num(el, '.p'), k = num(el, '.k'), p = num(el, '.ptr'), u = num(el, '.u') / 100, N = num(el, '.n');
      const n = Math.floor((P + k) / (k + p)); // max pointers: n*p + (n-1)*k <= P
      const d = Math.floor((n - 1) / 2), F = Math.round(n * u);
      let h = 0, cap = 1; while (cap < N) { cap *= F; h++; }
      el.querySelector('.o').innerHTML = `max δείκτες ανά κόμβο: n·${p} + (n−1)·${k} ≤ ${P} → n = <b>${n}</b> → 2d = n−1 = ${n - 1} κλειδιά → <b>d = ${d}</b><br>
        μέσο fan-out F = n · πληρότητα ≈ ${n}·${u.toFixed(2)} ≈ <b>${F}</b><br>
        Επίπεδα για ${fmt(N)} εγγραφές: F<sup>h</sup> ≥ N → h = ⌈log<sub>${F}</sub>N⌉ = <span class="sim-big">${h}</span> &nbsp;(F¹=${fmt(F)}, F²=${fmt(F * F)}, F³=${fmt(F ** 3)}, F⁴=${fmt(F ** 4)})<br>
        <span style="color:var(--muted);font-size:.85rem">Σύγκριση: δυαδική αναζήτηση σε ${fmt(N)} μπλοκ = ⌈log₂N⌉ = ${Math.ceil(Math.log2(N))} I/O.</span>`;
    }
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', run)); run();
  };

  /* static tree figure: data-spec JSON on the element */
  SimUI.staticTree = function (el, spec, leafCap, keyCap, opts) {
    const t = BPlusTree.fromSpec(spec, leafCap, keyCap); t.touched = new Set();
    el.classList.add('bpt-host');
    renderBPTree(el, t, opts || {});
  };
  SimUI.autoStatic = function () {
    document.querySelectorAll('[data-bpt]').forEach(el => {
      const c = JSON.parse(el.getAttribute('data-bpt'));
      const opts = { pad: c.pad || 0, mark: c.mark };
      const t = BPlusTree.fromSpec(c.spec, c.leaf, c.key); t.touched = new Set();
      if (c.hl) { // highlight nodes whose keys match any of the listed arrays
        const want = c.hl.map(a => a.join(','));
        t.levels().forEach(l => l.forEach(n => { if (want.includes(n.keys.join(','))) t.touched.add(n.id); }));
      }
      el.classList.add('bpt-host'); renderBPTree(el, t, opts);
    });
  };
  document.addEventListener('DOMContentLoaded', () => { if (window.BPlusTree) SimUI.autoStatic(); });

  window.SimUI = SimUI;
})();

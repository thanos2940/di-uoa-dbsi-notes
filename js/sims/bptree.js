/* bptree.js — B+ tree engine + HTML renderer (ΥΣΒΔ webnotes)
 * Conventions (same as the course slides & exams):
 *  - internal key K: left subtree < K, right subtree >= K
 *  - leaf split (L+1 entries): left keeps floor((L+1)/2), the rest go right,
 *    the FIRST key of the right leaf is COPIED UP
 *  - internal split: the middle key (index floor(n/2)) is PUSHED UP (not kept)
 *  - delete: borrow from left sibling, else right sibling, else merge
 *    (with left sibling if it exists, else right); keys in internal nodes are
 *    NOT refreshed after a plain delete (like the slides: 17 stays in the root)
 */
(function (global) {
  'use strict';

  let NODE_ID = 0;
  function mkLeaf(keys) { return { id: ++NODE_ID, leaf: true, keys: keys || [], next: null }; }
  function mkInner(keys, children) { return { id: ++NODE_ID, leaf: false, keys: keys || [], children: children || [] }; }

  class BPlusTree {
    /** leafCap = max entries per leaf, keyCap = max keys per internal node (pointers = keyCap+1) */
    constructor(leafCap, keyCap) {
      this.leafCap = leafCap;
      this.keyCap = keyCap;
      this.minLeaf = Math.ceil(leafCap / 2);
      this.minKeys = Math.ceil((keyCap + 1) / 2) - 1;
      this.root = mkLeaf([]);
      this.log = [];
      this.touched = new Set();
    }

    static fromSpec(spec, leafCap, keyCap) {
      // spec: array => leaf keys ; {k:[...], c:[...]} => internal node
      const t = new BPlusTree(leafCap, keyCap);
      const leaves = [];
      function build(s) {
        if (Array.isArray(s)) { const l = mkLeaf(s.slice()); leaves.push(l); return l; }
        return mkInner(s.k.slice(), s.c.map(build));
      }
      t.root = build(spec);
      for (let i = 0; i < leaves.length - 1; i++) leaves[i].next = leaves[i + 1];
      return t;
    }

    clone() {
      const t = new BPlusTree(this.leafCap, this.keyCap);
      const leaves = [];
      function cp(n) {
        if (n.leaf) { const l = { id: n.id, leaf: true, keys: n.keys.slice(), next: null }; leaves.push(l); return l; }
        return { id: n.id, leaf: false, keys: n.keys.slice(), children: n.children.map(cp) };
      }
      t.root = cp(this.root);
      for (let i = 0; i < leaves.length - 1; i++) leaves[i].next = leaves[i + 1];
      return t;
    }

    childIndex(node, k) { let i = 0; while (i < node.keys.length && k >= node.keys[i]) i++; return i; }

    findPath(k) {
      const path = []; let n = this.root;
      while (!n.leaf) { const i = this.childIndex(n, k); path.push({ node: n, idx: i }); n = n.children[i]; }
      return { leaf: n, path };
    }

    search(k) {
      const visited = []; let n = this.root;
      while (!n.leaf) { visited.push(n.id); n = n.children[this.childIndex(n, k)]; }
      visited.push(n.id);
      return { found: n.keys.includes(k), visited };
    }

    height() { let h = 1, n = this.root; while (!n.leaf) { h++; n = n.children[0]; } return h; }

    insert(k) {
      this.log = []; this.touched = new Set();
      const { leaf, path } = this.findPath(k);
      if (leaf.keys.includes(k)) { this.log.push(`Το ${k} υπάρχει ήδη — καμία αλλαγή.`); return false; }
      leaf.keys.push(k); leaf.keys.sort((a, b) => a - b); this.touched.add(leaf.id);
      this.log.push(`Κάθοδος στο φύλλο [${leaf.keys.filter(x => x !== k).join(', ')}] και τοποθέτηση του ${k}.`);
      if (leaf.keys.length <= this.leafCap) { this.log.push(`Χωράει (${leaf.keys.length}/${this.leafCap}) — τέλος.`); return true; }
      // split leaf
      const cut = Math.floor(leaf.keys.length / 2);
      const right = mkLeaf(leaf.keys.slice(cut));
      leaf.keys = leaf.keys.slice(0, cut);
      right.next = leaf.next; leaf.next = right;
      this.touched.add(right.id);
      let up = right.keys[0], newChild = right;
      this.log.push(`Υπερχείλιση φύλλου → SPLIT σε [${leaf.keys.join(', ')}] | [${right.keys.join(', ')}]. Το ${up} γίνεται <b>COPY-UP</b> (μένει και στο φύλλο).`);
      while (true) {
        const p = path.pop();
        if (!p) { // new root
          const old = this.root;
          this.root = mkInner([up], [old, newChild]); this.touched.add(this.root.id);
          this.log.push(`Δεν υπάρχει γονέας → νέα ρίζα [${up}]. Το ύψος αυξάνεται κατά 1.`);
          return true;
        }
        const node = p.node, i = p.idx;
        node.keys.splice(i, 0, up); node.children.splice(i + 1, 0, newChild); this.touched.add(node.id);
        if (node.keys.length <= this.keyCap) { this.log.push(`Το ${up} μπαίνει στον γονέα → [${node.keys.join(', ')}] — χωράει, τέλος.`); return true; }
        const mid = Math.floor(node.keys.length / 2);
        const pushed = node.keys[mid];
        const r = mkInner(node.keys.slice(mid + 1), node.children.slice(mid + 1));
        this.log.push(`Ο εσωτερικός κόμβος [${node.keys.join(', ')}] υπερχειλίζει → SPLIT σε [${node.keys.slice(0, mid).join(', ')}] | [${r.keys.join(', ')}]. Το ${pushed} γίνεται <b>PUSH-UP</b> (φεύγει από το επίπεδο).`);
        node.keys = node.keys.slice(0, mid); node.children = node.children.slice(0, mid + 1);
        this.touched.add(r.id);
        up = pushed; newChild = r;
      }
    }

    delete(k) {
      this.log = []; this.touched = new Set();
      const { leaf, path } = this.findPath(k);
      const pos = leaf.keys.indexOf(k);
      if (pos < 0) { this.log.push(`Το ${k} δεν υπάρχει στο δέντρο.`); return false; }
      leaf.keys.splice(pos, 1); this.touched.add(leaf.id);
      this.log.push(`Αφαίρεση του ${k} από το φύλλο → [${leaf.keys.join(', ')}].`);
      if (!path.length) { this.log.push('Το φύλλο είναι η ρίζα — τέλος.'); return true; }
      if (leaf.keys.length >= this.minLeaf) { this.log.push(`Το φύλλο έχει ${leaf.keys.length} ≥ ${this.minLeaf} (ελάχιστο) — τέλος. (Τα κλειδιά των εσωτερικών κόμβων ΔΕΝ αλλάζουν.)`); return true; }
      this.log.push(`Υποχείλιση φύλλου (${leaf.keys.length} < ${this.minLeaf}).`);
      let { node: parent, idx } = path.pop();
      const L = idx > 0 ? parent.children[idx - 1] : null;
      const R = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
      if (L && L.keys.length > this.minLeaf) {
        const x = L.keys.pop(); leaf.keys.unshift(x); parent.keys[idx - 1] = leaf.keys[0];
        this.touched.add(L.id); this.touched.add(parent.id);
        this.log.push(`Δανεισμός του ${x} από τον αριστερό αδελφό. Ο διαχωριστής στον γονέα γίνεται ${leaf.keys[0]}.`);
        return true;
      }
      if (R && R.keys.length > this.minLeaf) {
        const x = R.keys.shift(); leaf.keys.push(x); parent.keys[idx] = R.keys[0];
        this.touched.add(R.id); this.touched.add(parent.id);
        this.log.push(`Δανεισμός του ${x} από τον δεξιό αδελφό. Ο διαχωριστής στον γονέα γίνεται ${R.keys[0]}.`);
        return true;
      }
      if (L) {
        L.keys = L.keys.concat(leaf.keys); L.next = leaf.next;
        const sep = parent.keys.splice(idx - 1, 1)[0]; parent.children.splice(idx, 1);
        this.touched.add(L.id); this.touched.add(parent.id);
        this.log.push(`Ο αδελφός δεν μπορεί να δανείσει → ΣΥΓΧΩΝΕΥΣΗ με τον αριστερό: [${L.keys.join(', ')}]. Διαγράφεται ο διαχωριστής ${sep} από τον γονέα.`);
      } else {
        leaf.keys = leaf.keys.concat(R.keys); leaf.next = R.next;
        const sep = parent.keys.splice(idx, 1)[0]; parent.children.splice(idx + 1, 1);
        this.touched.add(parent.id);
        this.log.push(`Ο αδελφός δεν μπορεί να δανείσει → ΣΥΓΧΩΝΕΥΣΗ με τον δεξιό: [${leaf.keys.join(', ')}]. Διαγράφεται ο διαχωριστής ${sep} από τον γονέα.`);
      }
      // fix internal underflow upward
      let node = parent;
      while (true) {
        if (node === this.root) {
          if (node.keys.length === 0) { this.root = node.children[0]; this.log.push('Η ρίζα έμεινε χωρίς κλειδιά → αφαιρείται· το ύψος μειώνεται κατά 1.'); }
          return true;
        }
        if (node.keys.length >= this.minKeys) return true;
        this.log.push(`Υποχείλιση εσωτερικού κόμβου [${node.keys.join(', ')}] (< ${this.minKeys} κλειδιά).`);
        const g = path.pop(); const gp = g.node, i = g.idx;
        const LS = i > 0 ? gp.children[i - 1] : null;
        const RS = i < gp.children.length - 1 ? gp.children[i + 1] : null;
        this.touched.add(gp.id);
        if (LS && LS.keys.length > this.minKeys) {
          node.keys.unshift(gp.keys[i - 1]); node.children.unshift(LS.children.pop());
          gp.keys[i - 1] = LS.keys.pop(); this.touched.add(LS.id); this.touched.add(node.id);
          this.log.push(`Ανακατανομή μέσω γονέα από τον αριστερό αδελφό: ο διαχωριστής κατεβαίνει, το ${gp.keys[i - 1]} ανεβαίνει.`);
          return true;
        }
        if (RS && RS.keys.length > this.minKeys) {
          node.keys.push(gp.keys[i]); node.children.push(RS.children.shift());
          gp.keys[i] = RS.keys.shift(); this.touched.add(RS.id); this.touched.add(node.id);
          this.log.push(`Ανακατανομή μέσω γονέα από τον δεξιό αδελφό: ο διαχωριστής κατεβαίνει, το ${gp.keys[i]} ανεβαίνει.`);
          return true;
        }
        if (LS) {
          const sep = gp.keys.splice(i - 1, 1)[0]; gp.children.splice(i, 1);
          LS.keys = LS.keys.concat([sep], node.keys); LS.children = LS.children.concat(node.children);
          this.touched.add(LS.id);
          this.log.push(`Συγχώνευση εσωτερικών κόμβων: ο διαχωριστής ${sep} <b>κατεβαίνει</b> → [${LS.keys.join(', ')}].`);
        } else {
          const sep = gp.keys.splice(i, 1)[0]; gp.children.splice(i + 1, 1);
          node.keys = node.keys.concat([sep], RS.keys); node.children = node.children.concat(RS.children);
          this.touched.add(node.id);
          this.log.push(`Συγχώνευση εσωτερικών κόμβων: ο διαχωριστής ${sep} <b>κατεβαίνει</b> → [${node.keys.join(', ')}].`);
        }
        node = gp;
      }
    }

    levels() {
      const out = []; let cur = [this.root];
      while (cur.length) { out.push(cur); const nx = []; cur.forEach(n => { if (!n.leaf) nx.push(...n.children); }); cur = nx; }
      return out;
    }
    allKeys() { let n = this.root; while (!n.leaf) n = n.children[0]; const a = []; while (n) { a.push(...n.keys); n = n.next; } return a; }
  }

  /* ---------------- renderer ---------------- */
  function fmt(k, pad) { return pad ? String(k).padStart(pad, '0') : String(k); }

  function renderTree(container, tree, opts) {
    opts = opts || {};
    const pad = opts.pad || 0;
    const hl = opts.highlight || tree.touched || new Set();
    const path = new Set(opts.path || []);
    container.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'bpt-wrap';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'bpt-lines');
    wrap.appendChild(svg);
    const els = new Map();
    tree.levels().forEach((lvl, li) => {
      const row = document.createElement('div'); row.className = 'bpt-row';
      lvl.forEach(n => {
        const el = document.createElement('div');
        el.className = 'bpt-node ' + (n.leaf ? 'leaf' : 'inner') + (hl.has(n.id) ? ' hl' : '') + (path.has(n.id) ? ' path' : '') + (n === tree.root ? ' root' : '');
        if (n.leaf) {
          const cap = tree.leafCap;
          for (let i = 0; i < cap; i++) {
            const c = document.createElement('span'); c.className = 'bpt-key' + (i < n.keys.length ? '' : ' empty');
            c.textContent = i < n.keys.length ? fmt(n.keys[i], pad) : '·';
            if (opts.mark && n.keys[i] === opts.mark) c.classList.add('mark');
            el.appendChild(c);
          }
        } else {
          for (let i = 0; i <= tree.keyCap; i++) {
            const p = document.createElement('span'); p.className = 'bpt-ptr' + (i <= n.keys.length ? '' : ' empty'); el.appendChild(p);
            if (i < tree.keyCap) {
              const c = document.createElement('span'); c.className = 'bpt-key' + (i < n.keys.length ? '' : ' empty');
              c.textContent = i < n.keys.length ? fmt(n.keys[i], pad) : '·';
              if (opts.mark && n.keys[i] === opts.mark) c.classList.add('mark');
              el.appendChild(c);
            }
          }
        }
        els.set(n, el); row.appendChild(el);
      });
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
    function draw() {
      const wb = wrap.getBoundingClientRect();
      svg.setAttribute('width', wrap.scrollWidth); svg.setAttribute('height', wrap.scrollHeight);
      svg.innerHTML = '';
      tree.levels().forEach(lvl => lvl.forEach(n => {
        if (n.leaf) {
          if (n.next && els.get(n.next)) {
            const a = els.get(n).getBoundingClientRect(), b = els.get(n.next).getBoundingClientRect();
            const ln = document.createElementNS(svgNS, 'line');
            ln.setAttribute('x1', a.right - wb.left + wrap.scrollLeft); ln.setAttribute('y1', a.top + a.height / 2 - wb.top);
            ln.setAttribute('x2', b.left - wb.left + wrap.scrollLeft); ln.setAttribute('y2', b.top + b.height / 2 - wb.top);
            ln.setAttribute('class', 'bpt-next'); svg.appendChild(ln);
          }
          return;
        }
        const pe = els.get(n); const ptrs = pe.querySelectorAll('.bpt-ptr');
        n.children.forEach((c, i) => {
          const ce = els.get(c); if (!ce || !ptrs[i]) return;
          const a = ptrs[i].getBoundingClientRect(), b = ce.getBoundingClientRect();
          const ln = document.createElementNS(svgNS, 'line');
          ln.setAttribute('x1', a.left + a.width / 2 - wb.left + wrap.scrollLeft); ln.setAttribute('y1', a.bottom - wb.top);
          ln.setAttribute('x2', b.left + b.width / 2 - wb.left + wrap.scrollLeft); ln.setAttribute('y2', b.top - wb.top);
          ln.setAttribute('class', 'bpt-edge'); svg.appendChild(ln);
        });
      }));
    }
    requestAnimationFrame(draw);
    if (!container._bptResize) { container._bptResize = true; window.addEventListener('resize', () => { const t = container._bptLast; if (t) renderTree(container, t.tree, t.opts); }); }
    container._bptLast = { tree, opts };
  }

  global.BPlusTree = BPlusTree;
  global.renderBPTree = renderTree;
  if (typeof module !== 'undefined') module.exports = { BPlusTree };
})(typeof window !== 'undefined' ? window : globalThis);

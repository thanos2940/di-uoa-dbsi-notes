/* exthash.js — Extendible hashing engine (directory indexed by the MOST significant bits,
 * as in the past exam: "τα πρώτα (υψηλότερης τάξης) δυαδικά ψηφία") */
(function (global) {
  'use strict';
  let BID = 0;
  class ExtHash {
    constructor(cap, bits) { this.cap = cap; this.bits = bits || 5; this.D = 0; this.dir = []; this.log = []; }
    static fromBuckets(cap, bits, D, buckets) {
      // buckets: [{name, d, prefix:'0'|'100'..., items:[{label,h}]}]
      const e = new ExtHash(cap, bits); e.D = D; e.dir = new Array(1 << D);
      buckets.forEach(b => {
        const bk = { id: ++BID, name: b.name, d: b.d, items: b.items.slice() };
        for (let i = 0; i < (1 << D); i++) if (i.toString(2).padStart(D, '0').startsWith(b.prefix)) e.dir[i] = bk;
      });
      return e;
    }
    idx(h, D) { return D === 0 ? 0 : parseInt(h.slice(0, D), 2); }
    buckets() { const s = []; this.dir.forEach(b => { if (!s.includes(b)) s.push(b); }); return s; }
    insert(label, h) {
      this.log = []; let newNames = 0;
      while (true) {
        const i = this.idx(h, this.D); const b = this.dir[i];
        if (b.items.length < this.cap) {
          b.items.push({ label, h });
          this.log.push(`h=${h} → πρώτα ${this.D} bits <b>${h.slice(0, this.D) || 'ε'}</b> → κάδος ${b.name}: χωράει. Τέλος.`);
          return true;
        }
        this.log.push(`h=${h} → θέση <b>${h.slice(0, this.D)}</b> → κάδος ${b.name} γεμάτος (${b.items.length}/${this.cap}).`);
        if (b.d === this.D) {
          if (this.D >= this.bits) { this.log.push('Εξαντλήθηκαν τα bits — χρειάζεται αλυσίδα υπερχείλισης.'); return false; }
          const nd = new Array(1 << (this.D + 1));
          for (let k = 0; k < nd.length; k++) nd[k] = this.dir[k >> 1];
          this.dir = nd; this.D++;
          this.log.push(`Τοπικό βάθος = ολικό (${b.d}) → <b>ΔΙΠΛΑΣΙΑΣΜΟΣ</b> πίνακα: ολικό βάθος ${this.D}, ${1 << this.D} κελιά (κάθε κελί «αντιγράφεται» σε 2).`);
        }
        // split b on bit position b.d (0-based from the left)
        const bit = b.d;
        const nb = { id: ++BID, name: 'νέο' + (++newNames), d: b.d + 1, items: [] };
        b.d++;
        const all = b.items; b.items = [];
        all.forEach(it => (it.h[bit] === '1' ? nb : b).items.push(it));
        for (let k = 0; k < this.dir.length; k++) {
          if (this.dir[k] === b) { const kb = k.toString(2).padStart(this.D, '0'); if (kb[bit] === '1') this.dir[k] = nb; }
        }
        this.log.push(`<b>SPLIT</b> κάδου ${b.name} με βάση το bit #${bit + 1}: ${b.name}(d'=${b.d}) = {${b.items.map(x => x.label).join(', ')}}, ${nb.name}(d'=${nb.d}) = {${nb.items.map(x => x.label).join(', ')}}.`);
      }
    }
  }
  global.ExtHash = ExtHash;
  if (typeof module !== 'undefined') module.exports = { ExtHash };
})(typeof window !== 'undefined' ? window : globalThis);

/* buffer.js — Buffer-pool replacement simulator (FIFO, LRU, MRU, CLOCK, LRU-2)
 * Used for: nested-loop join I/O counting, reference-string exercises. */
(function (global) {
  'use strict';

  function nestedLoopRefs(pR, pS, rName, sName) {
    rName = rName || 'R'; sName = sName || 'S';
    const refs = [];
    for (let i = 1; i <= pR; i++) {
      refs.push({ page: rName + i, outer: true });
      for (let j = 1; j <= pS; j++) refs.push({ page: sName + j, outer: false });
    }
    return refs;
  }

  /** simulate(refs, M, policy, {pinOuter}) → {misses, steps[]} ; refs: [{page, outer}] or ['A','B',...] */
  function simulate(refs, M, policy, opt) {
    opt = opt || {};
    refs = refs.map(r => typeof r === 'string' ? { page: r } : r);
    const frames = new Array(M).fill(null); // {page, t1, t2, load, ref}
    let clockHand = 0, misses = 0, pinned = null;
    const steps = [];
    refs.forEach((r, ti) => {
      const t = ti + 1;
      if (opt.pinOuter && r.outer) pinned = null; // previous outer page is released
      let fi = frames.findIndex(f => f && f.page === r.page);
      let hit = fi >= 0, evicted = null;
      if (hit) {
        const f = frames[fi]; f.t2 = f.t1; f.t1 = t; f.ref = 1;
      } else {
        misses++;
        fi = frames.findIndex(f => f === null);
        if (fi < 0) {
          const cand = frames.map((f, i) => i).filter(i => !(pinned && frames[i].page === pinned));
          if (policy === 'FIFO') fi = cand.reduce((a, b) => frames[b].load < frames[a].load ? b : a);
          else if (policy === 'LRU') fi = cand.reduce((a, b) => frames[b].t1 < frames[a].t1 ? b : a);
          else if (policy === 'MRU') fi = cand.reduce((a, b) => frames[b].t1 > frames[a].t1 ? b : a);
          else if (policy === 'LRU2') {
            // max backward 2-distance; t2 = -inf => infinite; tie-break: earliest t1
            fi = cand.reduce((a, b) => {
              const da = frames[a].t2 === null ? Infinity : t - frames[a].t2;
              const db = frames[b].t2 === null ? Infinity : t - frames[b].t2;
              if (db > da) return b; if (db < da) return a;
              return frames[b].t1 < frames[a].t1 ? b : a;
            });
          } else if (policy === 'CLOCK') {
            let guard = 0;
            while (true) {
              const f = frames[clockHand];
              const isPinned = pinned && f.page === pinned;
              if (!isPinned && f.ref === 0) { fi = clockHand; clockHand = (clockHand + 1) % M; break; }
              if (!isPinned) f.ref = 0;
              clockHand = (clockHand + 1) % M;
              if (++guard > 3 * M) { fi = cand[0]; break; }
            }
          }
          evicted = frames[fi].page;
        }
        frames[fi] = { page: r.page, t1: t, t2: null, load: t, ref: policy === 'CLOCK' ? 0 : 1 };
        if (policy === 'CLOCK') frames[fi].ref = 1;
      }
      if (opt.pinOuter && r.outer) pinned = r.page;
      steps.push({ t, page: r.page, outer: !!r.outer, hit, evicted, frame: fi, frames: frames.map(f => f ? f.page : null),
        bits: frames.map(f => f ? f.ref : null), stamps: frames.map(f => f ? [f.t1, f.t2] : null), hand: clockHand, misses });
    });
    return { misses, steps };
  }

  /** closed-form for the exam model: nested loops, shared pool M, R outer, LRU */
  function nlLRUFormula(pR, pS, M) { return M >= pS + 1 ? pR + pS : pR + pR * pS; }

  /** partitioned memory (whiteboard model): Mo frames only for the outer relation, Mi only for the inner */
  function simulatePartitioned(refs, Mo, Mi, policy) {
    const o = simulate(refs.filter(r => r.outer), Mo, policy);
    const i = simulate(refs.filter(r => !r.outer), Mi, policy);
    return { misses: o.misses + i.misses, outer: o, inner: i };
  }

  global.BufferSim = { simulate, simulatePartitioned, nestedLoopRefs, nlLRUFormula };
  if (typeof module !== 'undefined') module.exports = global.BufferSim;
})(typeof window !== 'undefined' ? window : globalThis);

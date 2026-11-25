/* extsort.js — External merge sort helpers + replacement selection */
(function (global) {
  'use strict';
  function logCeil(x, base) { if (x <= 1) return 0; let p = 0, v = 1; while (v < x) { v *= base; p++; } return p; }
  /** general external merge sort with B frames (slides): pass0 runs = ceil(N/(B-1))?? → we expose both conventions */
  function passes(N, B, mode) {
    // mode 'slides'  : runs0 = ceil(N/(B-1)) , merge fan-in B-1  (Delis k18 slide 5)
    // mode 'classic' : runs0 = ceil(N/B)     , merge fan-in B-1  (Ramakrishnan)
    const runs0 = mode === 'classic' ? Math.ceil(N / B) : Math.ceil(N / (B - 1));
    const p = 1 + logCeil(runs0, B - 1);
    return { runs0, passes: p, cost: 2 * N * p };
  }
  function twoWay(N) { const p = 1 + logCeil(N, 2); return { runs0: N, passes: p, cost: 2 * N * p }; }

  /** Replacement selection. keys: array; cap = number of records in the current set */
  function replacementSelection(keys, cap) {
    const input = keys.slice(); const set = []; const runs = []; let run = []; let last = -Infinity;
    while (set.length < cap && input.length) set.push(input.shift());
    const trace = [];
    while (set.length) {
      const elig = set.filter(k => k >= last);
      if (!elig.length) { runs.push(run); trace.push({ type: 'end', run: run.slice() }); run = []; last = -Infinity; continue; }
      const m = Math.min(...elig);
      set.splice(set.indexOf(m), 1); run.push(m); last = m;
      let incoming = null;
      if (input.length) { incoming = input.shift(); set.push(incoming); }
      trace.push({ type: 'out', key: m, incoming, set: set.slice(), frozen: set.filter(k => k < last) });
    }
    if (run.length) runs.push(run);
    return { runs, trace };
  }
  /** classic pass-0: chunks of cap records each sorted */
  function chunkRuns(keys, cap) { const r = []; for (let i = 0; i < keys.length; i += cap) r.push(keys.slice(i, i + cap).sort((a, b) => a - b)); return r; }

  global.ExtSort = { passes, twoWay, replacementSelection, chunkRuns, logCeil };
  if (typeof module !== 'undefined') module.exports = global.ExtSort;
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Cost Calculator Logic
 */
class CostCalculator {
    constructor() {
        this.inputs = {
            pR: 1000,
            pS: 500,
            tR: 10000,
            tS: 5000,
            M: 100 // Buffers
        };
        this.bindEvents();
        this.calculate();
    }

    bindEvents() {
        // Bind inputs
        ['pR', 'pS', 'tR', 'tS', 'M'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = this.inputs[id];
                el.oninput = (e) => {
                    this.inputs[id] = parseInt(e.target.value) || 0;
                    this.calculate();
                };
            }
        });
    }

    calculate() {
        const { pR, pS, tR, tS, M } = this.inputs;

        // Formulas
        // Simple NL: p(R) + t(R)*p(S)
        const snl = pR + tR * pS;

        // Block NL: p(R) + ceil(p(R)/(M-2)) * p(S). (Assuming M-2 blocks for R, 1 for S, 1 output)
        // Usually BNL uses M-1 or M-2 blocks for outer.
        const blocksPerChunk = Math.max(1, M - 2);
        const chunks = Math.ceil(pR / blocksPerChunk);
        const bnl = pR + chunks * pS;

        // Sort Merge:
        // Sort R: 2 * p(R) * (1 + log)
        // Sort S: 2 * p(S) * (1 + log)
        // Merge: p(R) + p(S)
        const sortR = this.costSort(pR, M);
        const sortS = this.costSort(pS, M);
        const smj = sortR + sortS + pR + pS;

        // Hash Join:
        // Partitioning: 2 * (p(R) + p(S)) (read + write both)
        // Probing: p(R) + p(S)
        // Total: 3 * (p(R) + p(S))
        // Assumption: Partitions fit in memory. If recursive partitioning needed, cost is higher.
        // We assume optimal Hash Join here (Grace Hash Join with no recursion).
        const hj = 3 * (pR + pS);

        this.updateTable({ snl, bnl, smj, hj });
    }

    costSort(blocks, buffers) {
        if (blocks <= buffers) return 2 * blocks;
        const runs = Math.ceil(blocks / buffers); // Pass 0 produces 'runs' runs of size 'buffers'
        // Number of merge passes
        // Fan-in: M-1
        const passes = Math.ceil(Math.log(runs) / Math.log(buffers - 1));
        return 2 * blocks * (1 + passes);
    } // Note: Duplicated from db-utils for locality

    updateTable(costs) {
        document.getElementById('res-snl').innerText = costs.snl.toLocaleString();
        document.getElementById('res-bnl').innerText = costs.bnl.toLocaleString();
        document.getElementById('res-smj').innerText = costs.smj.toLocaleString();
        document.getElementById('res-hj').innerText = costs.hj.toLocaleString();

        // Highlight best
        const min = Math.min(costs.snl, costs.bnl, costs.smj, costs.hj);
        ['snl', 'bnl', 'smj', 'hj'].forEach(k => {
            const el = document.getElementById(`row-${k}`);
            if (costs[k] === min) el.classList.add('table-success');
            else el.classList.remove('table-success');
        });
    }
}

window.CostCalculator = CostCalculator;

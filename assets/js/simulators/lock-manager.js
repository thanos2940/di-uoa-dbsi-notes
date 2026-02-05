/**
 * 2PL Lock Manager Simulator
 */
class LockManagerSimulator extends SimulatorBase {
    constructor(canvasId) {
        super(canvasId);
        this.lockTable = {}; // item -> { mode: 'S'/'X', holders: [tid], waitQueue: [tid] }
        this.transactions = {}; // tid -> { state: 'Active', locks: [] }
    }

    startRequest(tid, op, item) {
        // Op: S (Shared), X (Exclusive), U (Unlock), C (Commit -> Unlock All)
        tid = parseInt(tid);
        if (!this.transactions[tid]) {
            this.transactions[tid] = { state: 'Active', locks: [] };
        }

        if (op === 'C') {
            this.commit(tid);
            return;
        }

        if (op === 'U') {
            this.releaseLock(tid, item);
            this.addStep(`T${tid} released lock on ${item}`, this.cloneState());
            this.updateUI();
            return;
        }

        // Lock Request
        this.requestLock(tid, op, item);
    }

    commit(tid) {
        // Release all locks
        const locks = [...this.transactions[tid].locks];
        locks.forEach(item => this.releaseLock(tid, item));
        this.transactions[tid].state = 'Committed';
        this.addStep(`Transaction T${tid} Committed`, this.cloneState());
        this.updateUI();
    }

    requestLock(tid, mode, item) {
        if (!this.lockTable[item]) {
            this.lockTable[item] = { mode: null, holders: [], waitQueue: [] };
        }
        const entry = this.lockTable[item];

        // Check grant
        let canGrant = false;
        if (entry.holders.length === 0 && entry.waitQueue.length === 0) {
            canGrant = true;
        } else if (entry.mode === 'S' && mode === 'S' && entry.waitQueue.length === 0) {
            canGrant = true;
        } else if (entry.holders.includes(tid)) {
            if (entry.mode === 'S' && mode === 'X') {
                if (entry.holders.length === 1) canGrant = true;
            }
        }

        if (canGrant) {
            if (!entry.holders.includes(tid)) entry.holders.push(tid);
            entry.mode = mode;
            if (!this.transactions[tid].locks.includes(item)) this.transactions[tid].locks.push(item);
            this.addStep(`T${tid} granted ${mode}-lock on ${item}`, this.cloneState());
        } else {
            if (!entry.waitQueue.find(w => w.tid === tid)) {
                entry.waitQueue.push({ tid, mode });
            }
            this.addStep(`T${tid} waiting for ${mode}-lock on ${item}`, this.cloneState());
        }
        this.updateUI();
    }

    releaseLock(tid, item) {
        const entry = this.lockTable[item];
        if (!entry) return;

        entry.holders = entry.holders.filter(h => h !== tid);
        if (entry.holders.length === 0) {
            entry.mode = null;
            if (entry.waitQueue.length > 0) {
                const next = entry.waitQueue.shift();
                entry.holders.push(next.tid);
                entry.mode = next.mode;
                if (!this.transactions[next.tid].locks.includes(item)) this.transactions[next.tid].locks.push(item);

                if (next.mode === 'S') {
                    while (entry.waitQueue.length > 0 && entry.waitQueue[0].mode === 'S') {
                        const n2 = entry.waitQueue.shift();
                        entry.holders.push(n2.tid);
                        if (!this.transactions[n2.tid].locks.includes(item)) this.transactions[n2.tid].locks.push(item);
                    }
                }
            }
        }
    }
    draw(step) {
        if (step && step.state) {
            this.lockTable = JSON.parse(JSON.stringify(step.state.lockTable));
            this.transactions = JSON.parse(JSON.stringify(step.state.transactions));
        }
        this.drawState();
    }

    cloneState() {
        return {
            lockTable: JSON.parse(JSON.stringify(this.lockTable)),
            transactions: JSON.parse(JSON.stringify(this.transactions))
        };
    }

    drawState() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Lock Table
        let y = 30;
        this.ctx.fillStyle = "black";
        this.ctx.font = "bold 16px Arial";
        this.ctx.fillText("Item", 20, y);
        this.ctx.fillText("Mode", 70, y);
        this.ctx.fillText("Holders", 130, y);
        this.ctx.fillText("Queue", 250, y);

        y += 30;
        this.ctx.font = "14px Arial";
        for (let item in this.lockTable) {
            const entry = this.lockTable[item];
            if (entry.holders.length === 0 && entry.waitQueue.length === 0) continue;

            this.ctx.fillText(item, 20, y);
            this.ctx.fillText(entry.mode || '-', 70, y);
            this.ctx.fillText(`[${entry.holders.join(',')}]`, 130, y);

            const q = entry.waitQueue.map(w => `T${w.tid}(${w.mode})`).join(',');
            this.ctx.fillText(q, 250, y);
            y += 25;
        }
    }

    generateRandomRequest() {
        const txns = [1, 2, 3];
        const ops = ['S', 'X', 'U', 'C'];
        const items = ['A', 'B', 'C'];

        const tid = txns[Math.floor(Math.random() * txns.length)];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const item = items[Math.floor(Math.random() * items.length)];

        return { tid, op, item };
    }

    resetState() {
        this.lockTable = {};
        this.transactions = {};
    }
}

window.LockManagerSimulator = LockManagerSimulator;

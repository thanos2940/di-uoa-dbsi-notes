/**
 * Serialization Graph Builder
 */
class SerializationGraphBuilder extends SimulatorBase {
    constructor(canvasId) {
        super(canvasId);
        this.nodes = []; // {id: 1, x: 0, y: 0}
        this.edges = []; // {from: 1, to: 2, type: 'RW'}
        this.schedule = []; // Parsed ops
    }

    parseSchedule(input) {
        // Input format: R1[X] W2[X] ...
        // Regex: ([RW])(\d+)\[(\w+)\]
        const regex = /([RW])(\d+)\[(\w+)\]/g;
        let match;
        this.schedule = [];

        while ((match = regex.exec(input)) !== null) {
            this.schedule.push({
                op: match[1], // R or W
                tid: parseInt(match[2]), // Transaction ID
                item: match[3], // Data Item
                raw: match[0],
                idx: this.schedule.length
            });
        }

        this.buildGraph();
    }

    buildGraph() {
        this.steps = [];
        this.currentStepIndex = -1;
        this.nodes = [];
        this.edges = [];
        const txns = new Set();

        // Find all Transactions
        this.schedule.forEach(op => txns.add(op.tid));

        // Position Nodes in a circle
        const txnArray = Array.from(txns).sort();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 100;

        txnArray.forEach((tid, i) => {
            const angle = (2 * Math.PI * i) / txnArray.length - Math.PI / 2;
            this.nodes.push({
                id: tid,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        });

        // Find Conflicts
        for (let i = 0; i < this.schedule.length; i++) {
            const ops1 = this.schedule[i];

            for (let j = i + 1; j < this.schedule.length; j++) {
                const ops2 = this.schedule[j];

                // Different Txn
                if (ops1.tid === ops2.tid) continue;

                // Same item
                if (ops1.item !== ops2.item) continue;

                // Conflict if at least one W
                const isConflict = (ops1.op === 'W' || ops2.op === 'W');

                if (isConflict) {
                    // Edge Ti -> Tj
                    // Check if edge exists
                    if (!this.edges.find(e => e.from === ops1.tid && e.to === ops2.tid)) {
                        this.edges.push({
                            from: ops1.tid,
                            to: ops2.tid,
                            reason: `${ops1.raw} -> ${ops2.raw}`
                        });
                    }
                }
            }
        }

        this.addStep(`Graph Built: ${this.schedule.length} operations`, this.cloneState());
        this.updateUI();
    }

    hasCycle() {
        // DFS
        const adj = {};
        this.edges.forEach(e => {
            if (!adj[e.from]) adj[e.from] = [];
            adj[e.from].push(e.to);
        });

        const visited = new Set();
        const recStack = new Set();

        const isCyclic = (v) => {
            if (recStack.has(v)) return true;
            if (visited.has(v)) return false;

            visited.add(v);
            recStack.add(v);

            const children = adj[v] || [];
            for (let c of children) {
                if (isCyclic(c)) return true;
            }

            recStack.delete(v);
            return false;
        };

        for (let node of this.nodes) {
            if (isCyclic(node.id)) return true;
        }
        return false;
    }

    draw(step) {
        if (step && step.state) {
            this.nodes = step.state.nodes;
            this.edges = step.state.edges;
        }
        this.drawState();
    }

    drawState() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Nodes
        this.nodes.forEach(n => {
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, 25, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.getColor(n.id);
            this.ctx.fill();
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("T" + n.id, n.x, n.y);
        });

        // Draw Edges
        this.edges.forEach(e => {
            const n1 = this.nodes.find(n => n.id === e.from);
            const n2 = this.nodes.find(n => n.id === e.to);
            if (n1 && n2) {
                // Shorten line to not overlap circle
                const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
                const startX = n1.x + 25 * Math.cos(angle);
                const startY = n1.y + 25 * Math.sin(angle);
                const endX = n2.x - 25 * Math.cos(angle);
                const endY = n2.y - 25 * Math.sin(angle);

                this.drawArrow(startX, startY, endX, endY, '#e74c3c');
            }
        });

        // Result
        const cyclic = this.hasCycle();
        this.ctx.fillStyle = cyclic ? 'red' : 'green';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(cyclic ? "Χ ΜΗ Σειριοποιήσιμο (Cycle Found)" : "✔ Σειριοποιήσιμo", 20, 20);
    }

    getColor(id) {
        const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];
        return colors[id % colors.length];
    }

    generateRandomSchedule(numOps = 6, numTxns = 3, numItems = 2) {
        const items = ['X', 'Y', 'Z'].slice(0, numItems);
        const ops = ['R', 'W'];
        let result = "";
        for (let i = 0; i < numOps; i++) {
            const op = ops[Math.floor(Math.random() * ops.length)];
            const tid = Math.floor(Math.random() * numTxns) + 1;
            const item = items[Math.floor(Math.random() * items.length)];
            result += `${op}${tid}[${item}] `;
        }
        return result.trim();
    }

    cloneState() {
        return {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            edges: JSON.parse(JSON.stringify(this.edges))
        };
    }

    resetState() {
        this.nodes = [];
        this.edges = [];
        this.schedule = [];
    }
}

window.SerializationGraphBuilder = SerializationGraphBuilder;

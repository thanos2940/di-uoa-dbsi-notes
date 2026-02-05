/**
 * Nested Loop Join Visualizer
 * Simple Tuple-based Nested Loop
 */
class NestedLoopSimulator extends SimulatorBase {
    constructor(canvasId) {
        super(canvasId);
        this.config = {
            rowHeight: 30,
            tableWidth: 120,
            spacing: 50
        };

        // Data
        this.R = [
            { id: 1, val: 'A' },
            { id: 2, val: 'B' },
            { id: 3, val: 'C' }
        ];
        this.S = [
            { id: 10, val: 'B' },
            { id: 20, val: 'A' },
            { id: 30, val: 'D' },
            { id: 40, val: 'A' }
        ];

        // State
        this.state = {
            rIndex: -1,
            sIndex: -1,
            matches: []
        };
    }

    start() {
        this.steps = [];
        this.currentStepIndex = -1;
        this.computeSteps();
        this.play();
    }

    computeSteps() {
        // Algorithm:
        // For each r in R:
        //    For each s in S:
        //       if r.val == s.val -> output

        for (let i = 0; i < this.R.length; i++) {
            const r = this.R[i];

            // Step: Select R tuple
            this.addStep(`Διάβασμα πλειάδας R[${i}]: (${r.id}, ${r.val})`, {
                rIndex: i, sIndex: -1, matches: [...this.state.matches]
            }, (ctx, state) => this.highlightRow(ctx, 'R', i, 'yellow'));

            for (let j = 0; j < this.S.length; j++) {
                const s = this.S[j];

                // Step: Compare with S tuple
                const isMatch = r.val === s.val;
                const matchMsg = isMatch ? "MATCH!" : "No match";

                if (isMatch) this.state.matches.push({ r: r, s: s });

                this.addStep(`Σύγκριση R[${i}](${r.val}) == S[${j}](${s.val}) -> ${matchMsg}`, {
                    rIndex: i, sIndex: j, matches: [...this.state.matches]
                }, (ctx, state) => {
                    this.highlightRow(ctx, 'R', i, 'orange');
                    this.highlightRow(ctx, 'S', j, isMatch ? 'green' : 'red');
                });
            }
        }

        this.addStep("Ολοκλήρωση Join.", {
            rIndex: -1, sIndex: -1, matches: [...this.state.matches]
        });
    }

    draw(step) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const state = step.state || this.state;

        // Draw Table R
        this.drawTable(50, 50, "R (Outer)", this.R, state.rIndex);

        // Draw Table S
        this.drawTable(250, 50, "S (Inner)", this.S, state.sIndex);

        // Draw Output
        this.drawOutput(450, 50, state.matches);
    }

    drawTable(x, y, title, data, activeIndex) {
        this.ctx.fillStyle = "black";
        this.ctx.font = "bold 16px Arial";
        this.ctx.fillText(title, x, y - 10);

        const w = this.config.tableWidth;
        const h = this.config.rowHeight;

        data.forEach((row, i) => {
            const dy = y + i * h;
            this.ctx.strokeStyle = "#333";
            this.ctx.strokeRect(x, dy, w, h);

            // Highlight? Handled by highlight callback usually, but we have activeIndex in state too
            /*if (i === activeIndex) {
                this.ctx.fillStyle = "#fff3cd";
                this.ctx.fillRect(x+1, dy+1, w-2, h-2);
            }*/

            this.ctx.fillStyle = "black";
            this.ctx.font = "14px Arial";
            this.ctx.fillText(`ID:${row.id}, ${row.val}`, x + 10, dy + 20);
        });
    }

    highlightRow(ctx, table, index, color) {
        const x = table === 'R' ? 50 : 250;
        const y = 50 + index * 30;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, 120 + 4, 30 + 4);
    }

    drawOutput(x, y, matches) {
        this.ctx.fillStyle = "black";
        this.ctx.font = "bold 16px Arial";
        this.ctx.fillText("Output", x, y - 10);

        matches.forEach((m, i) => {
            this.ctx.font = "14px Arial";
            this.ctx.fillText(`<${m.r.id}, ${m.r.val}, ${m.s.id}, ${m.s.val}>`, x, y + 20 + i * 20);
        });
    }

    generateRandomData(numR = 3, numS = 4) {
        const vals = ['A', 'B', 'C', 'D'];
        this.R = [];
        for (let i = 0; i < numR; i++) {
            this.R.push({ id: i + 1, val: vals[Math.floor(Math.random() * vals.length)] });
        }
        this.S = [];
        for (let i = 0; i < numS; i++) {
            this.S.push({ id: (i + 1) * 10, val: vals[Math.floor(Math.random() * vals.length)] });
        }
        this.state.matches = [];
        this.state.rIndex = -1;
        this.state.sIndex = -1;
        this.steps = [];
        this.currentStepIndex = -1;
        this.addStep("Random Data Generated", this.cloneState());
        this.currentStepIndex = 0;
        this.draw({ state: this.state });
    }

    resetState() {
        this.R = [];
        this.S = [];
        this.state.matches = [];
        this.state.rIndex = -1;
        this.state.sIndex = -1;
    }

    cloneState() {
        return {
            rIndex: this.state.rIndex,
            sIndex: this.state.sIndex,
            matches: [...this.state.matches]
        };
    }
}

window.NestedLoopSimulator = NestedLoopSimulator;

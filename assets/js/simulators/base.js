/**
 * Base Simulator Class
 */
class SimulatorBase {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            // Handle high DPI
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.width = rect.width;
            this.height = rect.height;
        }

        this.steps = [];
        this.currentStepIndex = -1;
        this.isPlaying = false;
        this.playbackSpeed = 1000;
        this.timer = null;

        // Bind UI if exists
        this.bindControls();
    }

    bindControls() {
        const prefix = this.canvas ? this.canvas.id.replace('-canvas', '') : '';

        // Helper to find element by prefix or fallback to generic if prefix is empty
        const findElement = (suffix) => {
            if (!prefix) return document.getElementById(suffix);
            return document.getElementById(`${prefix}-${suffix}`) || document.getElementById(suffix);
        };

        const btnNext = findElement('next');
        const btnPrev = findElement('prev');
        const btnPlay = findElement('play');
        const btnReset = findElement('reset');
        const btnClear = findElement('clear');
        const sliderSpeed = findElement('speed');

        if (btnNext) btnNext.onclick = () => this.nextStep();
        if (btnPrev) btnPrev.onclick = () => this.prevStep();
        if (btnPlay) btnPlay.onclick = () => this.togglePlay();
        if (btnReset) btnReset.onclick = () => this.reset();
        if (btnClear) btnClear.onclick = () => this.clear();
        if (sliderSpeed) {
            sliderSpeed.oninput = (e) => this.setSpeed(e.target.value);
            this.setSpeed(sliderSpeed.value);
        }
    }

    // Abstract methods to be implemented by children
    generateData() { console.warn('generateData not implemented'); }
    computeSteps() { console.warn('computeSteps not implemented'); }
    draw(step) { console.warn('draw not implemented'); }

    // Core logic
    addStep(description, stateData, highlightFunc = null) {
        this.steps.push({
            description,
            state: stateData, // Trust caller to handle cloning if needed
            highlight: highlightFunc
        });
        // If this is the first step and we haven't started yet, select it
        if (this.currentStepIndex === -1 && this.steps.length === 1) {
            this.currentStepIndex = 0;
            this.updateUI();
        }
    }

    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            this.updateUI();
        } else {
            this.pause();
        }
    }

    prevStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.updateUI();
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        const prefix = this.canvas ? this.canvas.id.replace('-canvas', '') : '';
        const btn = document.getElementById(`${prefix}-play`) || document.querySelector(`[id$="-play"]`);
        if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';

        this.timer = setInterval(() => {
            if (this.currentStepIndex < this.steps.length - 1) {
                this.nextStep();
            } else {
                this.pause();
            }
        }, this.playbackSpeed);
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.timer);
        const prefix = this.canvas ? this.canvas.id.replace('-canvas', '') : '';
        const btn = document.getElementById(`${prefix}-play`) || document.querySelector(`[id$="-play"]`);
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
    }

    reset() {
        this.pause();
        this.currentStepIndex = 0; // Go to initial state
        this.updateUI();
    }

    clear() {
        this.pause();
        this.steps = [];
        this.currentStepIndex = -1;
        this.resetState();
        this.addStep("Simulator Cleared", this.cloneTree ? this.cloneTree(this.root) : (this.cloneState ? this.cloneState() : null));
        this.currentStepIndex = 0;
        this.updateUI();
    }

    resetState() {
        console.warn('resetState not implemented');
    }

    setSpeed(val) {
        // val is 1-100 probably
        // 100 -> 100ms, 1 -> 2000ms
        this.playbackSpeed = 2000 - (val * 19);
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    updateUI() {
        if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
            const step = this.steps[this.currentStepIndex];
            const prefix = this.canvas ? this.canvas.id.replace('-canvas', '') : '';

            // Update Info Panel
            const info = document.getElementById(`${prefix}-info`) || document.querySelector('.simulator-info');
            if (info) info.innerHTML = `<p><strong>Step ${this.currentStepIndex + 1}/${this.steps.length}:</strong> ${step.description}</p>`;

            // Draw State
            this.draw(step);
        }
    }

    // Helper for drawing arrow
    drawArrow(fromX, fromY, toX, toY, color = '#000') {
        if (!this.ctx) return;
        const headlen = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.fill();
    }
}

/**
 * Extendible Hashing Simulator
 */
class ExtendibleHashingSimulator extends SimulatorBase {
    constructor(canvasId) {
        super(canvasId);
        this.config = {
            bucketCapacity: 2, // Low capacity to force splits
            boxWidth: 100,
            boxHeight: 40
        };

        // Initial State
        this.globalDepth = 1;
        this.directory = [
            { id: 'b1', depth: 1, values: [] }, // 0
            { id: 'b2', depth: 1, values: [] }  // 1
        ];
        // Directory maps index -> Bucket Object. 
        // Note: Multiple indices point to same bucket object.
    }

    // Hash function: return binary string of generic length, we slice what we need
    hash(key) {
        // Simple hash: key % 100 -> binary
        // Or just key -> binary
        // "Exams give hash values like H(38)=002".
        // Let's assume input is integer, handle up to sufficient bits.
        // We need Least Significant Bits (or MSB? Ext Hashing usually uses MSB or LSB depending on book).
        // Ramakrishnan uses Last bits? Silberschatz uses First bits?
        // Prompt says: "Hash(K) = binary, χρήση d bits -> entry".
        // Let's use **LSB** (Last Significant Bits) as it is common for simple expansion (0..0 -> 0..00, 1..0).
        // WAIT. Directory doubling usually implies MSB if we want 0 and 1 to become 00, 01, 10, 11 order.
        // Let's use **MSB** (Most Significant Bits) for visualization standard (growing downwards).
        // e.g., d=1: 0, 1. d=2: 00, 01, 10, 11.
        // If we duplicate directory:
        // 0 -> 00, 01 (points to same). 1 -> 10, 11 (points to same).

        let bin = parseInt(key).toString(2);
        // Pad to ensure we have enough bits (e.g. 5 bits)
        while (bin.length < 5) bin = "0" + bin;
        return bin;
    }

    getDirectoryIndex(keyBin, depth) {
        // Get first 'depth' bits
        // If depth=0, returns 0 (index 0)
        if (depth === 0) return 0;
        const prefix = keyBin.substr(keyBin.length - depth); // LSB ??
        // Let's stick to MSB: 
        const prefixMSB = keyBin.substr(0, depth);
        return parseInt(prefixMSB, 2);
    }

    // Helper: Clone state
    cloneState() {
        // Deep copy directory and buckets
        // Issues: Multiple directory entries point to SAME bucket object.
        // Map buckets to unique IDs to clone them once, then reconstruct directory.

        const bucketMap = new Map();
        this.directory.forEach(b => {
            if (!bucketMap.has(b.id)) {
                bucketMap.set(b.id, {
                    id: b.id,
                    depth: b.depth,
                    values: [...b.values]
                });
            }
        });

        // Rebuild dir
        const newDir = this.directory.map(b => bucketMap.get(b.id));
        return {
            globalDepth: this.globalDepth,
            directory: newDir
        };
    }

    startInsert(key) {
        this.steps = [];
        this.currentStepIndex = -1;
        key = parseInt(key);
        if (isNaN(key)) return;

        this.executeInsert(key);
        this.play();
    }

    executeInsert(key) {
        const bin = this.hash(key);

        // Step 1: Hash
        this.addStep(`Hash(${key}) = ...${bin}. Global Depth d = ${this.globalDepth}.`, this.cloneState());

        // Step 2: Find Directory Entry (MSB)
        // Taking MSB logic: 
        let idx = parseInt(bin.substr(0, this.globalDepth), 2);
        if (isNaN(idx)) idx = 0; // handle d=0 case or error

        let bucket = this.directory[idx];

        this.addStep(`Χρήση ${this.globalDepth} bits (${bin.substr(0, this.globalDepth)}) -> Index ${idx}. Πηγαίνουμε στον Bucket ${bucket.id}.`,
            this.cloneState(), (ctx, state) => this.highlightDir(ctx, idx));

        // Step 3: Insert or Split
        if (bucket.values.length < this.config.bucketCapacity) {
            // Case: Fits
            bucket.values.push(key);
            this.addStep(`Το bucket έχει χώρο. Εισαγωγή.`, this.cloneState(), (ctx, state) => this.highlightBucket(ctx, bucket.id, 'green'));
        } else {
            // Case: Overflow
            this.addStep(`Bucket ${bucket.id} γεμάτο! (${bucket.values.length} keys).`,
                this.cloneState(), (ctx, state) => this.highlightBucket(ctx, bucket.id, 'red'));

            this.handleSplit(bucket, idx, key, bin);
        }
    }

    handleSplit(bucket, dirIdx, key, keyBin) {
        // Check if Local Depth < Global Depth
        if (bucket.depth < this.globalDepth) {
            // Simple Split (Case A)
            this.addStep(`Local depth ${bucket.depth} < Global ${this.globalDepth}. Διάσπαση bucket χωρίς διπλασιασμό directory.`, this.cloneState());
            this.splitBucket(bucket);
            // Re-try insert formatted
            // We need to re-run the logic? Or just manually place?
            // Recursively call insert logic for this key? 
            // In a simulator, we should just continue steps.

            // Re-hash and insert (the key didn't get in yet)
            // But also need to redistribute EXISTING keys.
            // splitBucket already redistributes.
            // Now insert our new key.
            this.executeInsert(key); // Re-run insert from top for simplicity? It might duplicate "Hash" steps.
            // Better: continue logic.
        } else {
            // Directory Doubling needed (Case B)
            this.addStep(`Local depth ${bucket.depth} == Global ${this.globalDepth}. Διπλασιασμός Directory!`, this.cloneState());
            this.doubleDirectory();

            // Now apply Case A (Split bucket)
            // Find bucket again (indices changed)
            let newIdx = parseInt(keyBin.substr(0, this.globalDepth), 2);
            let newBucket = this.directory[newIdx]; // Should be same object as 'bucket' before split

            this.addStep(`Νέο global depth ${this.globalDepth}. Προσπάθεια διάσπασης bucket.`, this.cloneState());
            this.splitBucket(newBucket);

            // Retry insert
            this.executeInsert(key);
        }
    }

    doubleDirectory() {
        // [pt1, pt2] -> [pt1, pt1, pt2, pt2] (Example MSB logic?)
        // If MSB: 0->00,01. 1->10,11.
        // So pointers at I becomes pointers at 2*I and 2*I+1

        const newDir = [];
        this.directory.forEach(bucket => {
            newDir.push(bucket); // 0 -> 00
            newDir.push(bucket); // 0 -> 01
        });

        this.directory = newDir;
        this.globalDepth++;
    }

    splitBucket(bucket) {
        // 1. Create new bucket
        const newBucket = {
            id: Math.random().toString(36).substr(2, 5),
            depth: bucket.depth + 1,
            values: []
        };
        // Update old bucket depth
        bucket.depth++;

        // 2. Redistribute keys
        // We used d bits. Now use d+1 bits.
        // Keys in 'bucket' matched on first d bits.
        // The (d+1)th bit distinguishes them.

        const oldValues = [...bucket.values];
        bucket.values = []; // Clear

        // Redistribute existing
        oldValues.forEach(val => {
            const bin = this.hash(val);
            // Check (d+1)-th bit?
            // Actually, just verify which pointer in Directory points to which bucket now.
            // BUT wait. We haven't updated pointers yet! 
            // We MUST update pointers first or determines which keys go where.

            // Logic:
            // Indices in directory that pointed to 'bucket'.
            // Now half of them should point to 'newBucket'.
            // Which ones? 
            // The ones where the (d)th bit (0-indexed from MSB if depth is d+1 now) is 1?

            // Let's rely on re-hashing logic based on new depth.
            // Wait, we need to know WHICH directory entries point to this bucket.
        });

        // Update Directory Pointers
        // Iterate directory. If entry points to 'bucket', check (bucket.depth)-th bit of the index?
        // Index is K bits (Global Depth). bucket.depth is just incremented.
        // We distinguish based on the bit at 'bucket.depth - 1' (since 1-based depth).
        // e.g. Old depth 1. New depth 2. We check bit index 1 (0..1). (The new bit).

        // For MSB: 
        // 0 (00), 1 (01). Old matches 0. New bit is the 2nd one.

        /*
         Let's iterate all directory indices that point to 'bucket'.
         For each index I: 
         Check the bit that differentiates the new split.
         Wait, Global Depth might be much larger than Local Depth.
         We are splitting a bucket at local depth d -> d+1.
         The pointers form a block of size 2^(Global - Local_Old).
         We split this block in two halves.
         First half keeps pointing to 'bucket'.
         Second half points to 'newBucket'.
         
         Since we treat MSB:
         Indices are sorted naturally. 000, 001, 010...
         The pointers for a specific bucket are NOT necessarily contiguous in MSB if local depth is small?
         Actually yes, if we use standard MSB tries, they are contiguous ranges.
         00xx -> Bucket A. 01xx -> Bucket B.
         So we find the range [start, end] pointing to bucket.
         Split range in half.
         First half -> bucket.
         Second half -> newBucket.
         */

        // Find indices
        let indices = [];
        this.directory.forEach((b, i) => {
            if (b === bucket) indices.push(i);
        });

        const splitPoint = Math.floor(indices.length / 2);
        const secondHalf = indices.slice(splitPoint);

        secondHalf.forEach(idx => {
            this.directory[idx] = newBucket;
        });

        // Now redistribute values
        oldValues.forEach(val => {
            const bin = this.hash(val);
            const idx = parseInt(bin.substr(0, this.globalDepth), 2);
            // Which bucket does this index point to now?
            const target = this.directory[idx];
            target.values.push(val);
        });

        this.addStep(`Ανακατανομή εγγραφών βάσει του ${bucket.depth}-ου bit.`, this.cloneState());
    }

    // --- DRAWING ---
    draw(step) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const state = step.state;
        if (!state) return;

        const dirX = 20;
        const dirY = 40;
        const cellH = 30;
        const cellW = 80;

        this.ctx.font = "14px Arial";

        // Draw Global Depth
        this.ctx.fillStyle = "black";
        this.ctx.fillText(`Global Depth: ${state.globalDepth}`, 20, 20);

        // Check how many unique buckets to position them
        const uniqueBuckets = [];
        const bucketPos = new Map();

        state.directory.forEach(b => {
            if (!uniqueBuckets.find(ub => ub.id === b.id)) uniqueBuckets.push(b);
        });

        // Position buckets output to right
        const buckX = 250;
        uniqueBuckets.forEach((b, i) => {
            bucketPos.set(b.id, { x: buckX, y: 40 + i * 60, w: 120, h: 40 });
        });

        // Draw Directory
        state.directory.forEach((bucket, i) => {
            const y = dirY + i * cellH;

            // Box
            this.ctx.strokeStyle = "purple";
            this.ctx.strokeRect(dirX, y, cellW, cellH);

            // Index (Binary)
            let bin = i.toString(2);
            while (bin.length < state.globalDepth) bin = "0" + bin;

            this.ctx.fillStyle = "purple";
            this.ctx.fillText(bin, dirX + 10, y + 20);

            // Arrow to bucket
            const target = bucketPos.get(bucket.id);
            if (target) {
                this.drawArrow(dirX + cellW, y + 15, target.x, target.y + 20, "#9b59b6");
            }
        });

        // Draw Buckets
        uniqueBuckets.forEach(b => {
            const pos = bucketPos.get(b.id);

            this.ctx.fillStyle = "#e3f2fd";
            this.ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
            this.ctx.strokeStyle = "#3498db";
            this.ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);

            // Content
            this.ctx.fillStyle = "black";
            this.ctx.fillText(`d':${b.depth} | [${b.values.join(',')}]`, pos.x + 5, pos.y + 25);
        });

        // Highlight logic
        if (step.highlight) step.highlight(this.ctx, state);
    }

    highlightDir(ctx, idx) {
        // ...
        const dirX = 20;
        const dirY = 40;
        const cellH = 30;
        const cellW = 80;
        const y = dirY + idx * cellH;

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.strokeRect(dirX - 2, y - 2, cellW + 4, cellH + 4);
    }

    highlightBucket(ctx, bucketId, color) {
        const state = this.ctx.state || this.steps[this.currentStepIndex].state;
        const uniqueBuckets = [];
        state.directory.forEach(b => {
            if (!uniqueBuckets.find(ub => ub.id === b.id)) uniqueBuckets.push(b);
        });
        const index = uniqueBuckets.findIndex(b => b.id === bucketId);
        if (index >= 0) {
            const pos = { x: 250, y: 40 + index * 60, w: 120, h: 40 };
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(pos.x - 2, pos.y - 2, pos.w + 4, pos.h + 4);
        }
    }

    /**
     * Advanced Random Fill
     * @param {number} targetGlobalDepth Final global depth
     * @param {number} capacity Bucket capacity
     * @param {number} numItems Number of random items to insert
     */
    randomFill(targetGlobalDepth, capacity, numItems) {
        this.steps = [];
        this.currentStepIndex = -1;
        this.config.bucketCapacity = capacity;

        // Reset to minimal state
        this.globalDepth = 1;
        this.directory = [
            { id: 'b1', depth: 1, values: [] },
            { id: 'b2', depth: 1, values: [] }
        ];

        // 1. Force directory to target depth by inserting specific values if needed,
        // or just manually build a directory of that size.
        // Let's manually build it to guarantee the depth.
        while (this.globalDepth < targetGlobalDepth) {
            this.doubleDirectory();
        }

        // 2. Insert items
        for (let i = 0; i < numItems; i++) {
            const val = Math.floor(Math.random() * 100);
            this.executeInsert(val);
            // Clear steps generated by individual execution to only have the final state
            // OR keep them? The user requested "Random Fill", usually expects the result.
            // Let's just keep the final result for Fill.
        }

        this.steps = []; // Clear intermediate steps
        this.addStep(`Random Fill: Global Depth ${targetGlobalDepth}, Capacity ${capacity}, ${numItems} items`, this.cloneState());
        this.play();
    }

    resetState() {
        this.globalDepth = 1;
        this.directory = [
            { id: 'b1', depth: 1, values: [] },
            { id: 'b2', depth: 1, values: [] }
        ];
    }
}

window.ExtendibleHashingSimulator = ExtendibleHashingSimulator;

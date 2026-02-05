/**
 * B+ Tree Simulator
 * Extends SimulatorBase to provide B+ Tree specific visualization
 */
class BTreeSimulator extends SimulatorBase {
    constructor(canvasId) {
        super(canvasId);
        this.config = {
            orderInternal: 4, // Order N (Max Pointers). Max Keys = N-1.
            orderLeaf: 3,     // Max Values M. Max Keys = M.
            nodeWidth: 60,
            nodeHeight: 30,
            levelHeight: 80
        };
        // Derived min/max helpers are calculated dynamically where needed or getters can be used

        this.root = this.createNode(true);
        this.treeState = null;
    }

    createNode(isLeaf) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            keys: [],
            children: [],
            isLeaf: isLeaf,
            parent: null,
            next: null
        };
    }

    cloneTree(node) {
        if (!node) return null;
        let newNode = {
            id: node.id,
            keys: [...node.keys],
            isLeaf: node.isLeaf,
            children: [],
            next: null
        };
        if (!node.isLeaf) {
            newNode.children = node.children.map(child => this.cloneTree(child));
            // No parent pointers in clones to avoid circular references for snapshots
        }
        return newNode;
    }

    // --- INSERT LOGIC ---
    startInsert(key) {
        this.steps = [];
        this.currentStepIndex = -1;
        key = parseInt(key);
        if (isNaN(key)) return;
        this.executeInsert(key);
        this.play();
    }

    executeInsert(key) {
        let node = this.root;
        this.addStep(`Αναζήτηση για εισαγωγή: ${key}`, this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, root.id, 'yellow'));

        while (!node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) i++;
            node = node.children[i];
            let nodeId = node.id;
            this.addStep(`Μετάβαση στο παιδί ${i}`, this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, nodeId, 'yellow'));
        }

        this.insertIntoLeaf(node, key);

        // Check Overflow
        // Leaf Max Keys = orderLeaf
        // Internal Max Keys = orderInternal - 1
        let curr = node;
        let maxKeys = curr.isLeaf ? this.config.orderLeaf : (this.config.orderInternal - 1);

        while (curr.keys.length > maxKeys) {
            this.addStep(`Overflow στον ${curr.isLeaf ? 'φύλλο' : 'κόμβο'} (${curr.keys.length} > ${maxKeys}).`,
                this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, curr.id, 'red'));

            if (curr.isLeaf) this.splitLeaf(curr);
            else this.splitInternal(curr);

            curr = curr.parent;
            if (!curr) {
                this.addStep(`Δημιουργία νέας ρίζας.`, this.cloneTree(this.root));
                break;
            }

            // Re-evaluate maxKeys for the new current node (which is now parent, i.e., internal)
            maxKeys = this.config.orderInternal - 1;
        }
        this.addStep(`Εισαγωγή ${key} ολοκληρώθηκε.`, this.cloneTree(this.root));
    }

    insertIntoLeaf(leaf, key) {
        leaf.keys.push(key);
        leaf.keys.sort((a, b) => a - b);
    }

    splitLeaf(leaf) {
        // Standard B+ Tree split: Keep ceil((n+1)/2) in left?
        // Simple: Split in half.
        // If Max=3 (becomes 4 during overflow). 4/2 = 2. Left=2, Right=2.
        const midIndex = Math.floor(leaf.keys.length / 2);
        const rightKeys = leaf.keys.splice(midIndex);
        const newLeaf = this.createNode(true);
        newLeaf.keys = rightKeys;
        newLeaf.next = leaf.next;
        leaf.next = newLeaf;
        const promoteKey = newLeaf.keys[0]; // Copy UP
        this.insertIntoParent(leaf, promoteKey, newLeaf);
    }

    splitInternal(node) {
        const midIndex = Math.floor(node.keys.length / 2);
        const promoteKey = node.keys[midIndex]; // Push UP
        const rightKeys = node.keys.splice(midIndex + 1);
        node.keys.splice(midIndex, 1);
        const newNode = this.createNode(false);
        newNode.keys = rightKeys;
        const rightChildren = node.children.splice(midIndex + 1);
        newNode.children = rightChildren;
        newNode.children.forEach(child => child.parent = newNode);
        this.insertIntoParent(node, promoteKey, newNode);
    }

    insertIntoParent(leftNode, key, rightNode) {
        if (!leftNode.parent) {
            const newRoot = this.createNode(false);
            newRoot.keys = [key];
            newRoot.children = [leftNode, rightNode];
            leftNode.parent = newRoot;
            rightNode.parent = newRoot;
            this.root = newRoot;
        } else {
            const parent = leftNode.parent;
            const index = parent.children.indexOf(leftNode);
            parent.keys.splice(index, 0, key);
            parent.children.splice(index + 1, 0, rightNode);
            rightNode.parent = parent;
        }
    }

    // --- DELETE LOGIC ---

    startDelete(key) {
        this.steps = [];
        this.currentStepIndex = -1;
        key = parseInt(key);
        if (isNaN(key)) return;
        this.executeDelete(key);
        this.play();
    }

    executeDelete(key) {
        // 1. Find
        let node = this.root;
        this.addStep(`Αναζήτηση για διαγραφή: ${key}`, this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, root.id, 'yellow'));

        while (!node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) i++;
            node = node.children[i];
            let nodeId = node.id;
            this.addStep(`Traversing...`, this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, nodeId, 'yellow'));
        }

        // 2. Remove from leaf
        const idx = node.keys.indexOf(key);
        if (idx === -1) {
            this.addStep(`Το κλειδί ${key} δεν βρέθηκε.`, this.cloneTree(this.root));
            return;
        }

        this.addStep(`Το κλειδί βρέθηκε. Διαγραφή από το φύλλο.`, this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, node.id, 'red'));
        node.keys.splice(idx, 1);

        // 3. Check Underflow
        let curr = node;

        while (curr !== this.root) {
            // Min Keys Leaf: ceil(orderLeaf / 2) -> actually often floor((orderLeaf+1)/2)??
            // Let's stick to simple: ceil(max/2).
            // If Max=3. Ceil(1.5)=2.
            // If Max=4. Ceil(2)=2.
            const minKeys = curr.isLeaf
                ? Math.ceil(this.config.orderLeaf / 2)
                : Math.ceil(this.config.orderInternal / 2) - 1;

            if (curr.keys.length >= minKeys) break; // No underflow

            this.addStep(`Underflow! Ο κόμβος έχει ${curr.keys.length} κλειδιά (Min: ${minKeys}).`,
                this.cloneTree(this.root), (ctx, root) => this.highlightNode(ctx, curr.id, 'red'));

            this.handleUnderflow(curr, minKeys); // Pass minKeys if needed, but easier to recalc inside if convenient

            // If merged, parent changes, checking parent in next iteration
            if (curr.parent) curr = curr.parent;
            else break;
        }

        // Check empty root
        if (this.root.keys.length === 0 && !this.root.isLeaf) {
            if (this.root.children.length > 0) {
                this.addStep(`Η ρίζα άδειασε. Το παιδί γίνεται νέα ρίζα.`, this.cloneTree(this.root));
                this.root = this.root.children[0];
                this.root.parent = null;
            }
        }

        this.addStep(`Διαγραφή ολοκληρώθηκε.`, this.cloneTree(this.root));
    }

    handleUnderflow(node) {
        const parent = node.parent;
        const myIndex = parent.children.indexOf(node);
        const minKeys = node.isLeaf
            ? Math.ceil(this.config.orderLeaf / 2)
            : Math.ceil(this.config.orderInternal / 2) - 1;


        // Try Borrow Left
        if (myIndex > 0) {
            const leftSib = parent.children[myIndex - 1];
            if (leftSib.keys.length > minKeys) {
                this.addStep(`Δανεισμός από αριστερό αδελφό.`, this.cloneTree(this.root));
                this.borrowFromSibling(node, leftSib, myIndex - 1, true); // true = start borrowing from left
                return;
            }
        }

        // Try Borrow Right
        if (myIndex < parent.children.length - 1) {
            const rightSib = parent.children[myIndex + 1];
            if (rightSib.keys.length > minKeys) {
                this.addStep(`Δανεισμός από δεξιό αδελφό.`, this.cloneTree(this.root));
                this.borrowFromSibling(node, rightSib, myIndex, false);
                return;
            }
        }

        // Merge
        // Prefer merge with left
        if (myIndex > 0) {
            const leftSib = parent.children[myIndex - 1];
            this.addStep(`Συγχώνευση (Merge) με τον αριστερό αδελφό.`, this.cloneTree(this.root));
            this.mergeNodes(leftSib, node, myIndex - 1);
        } else {
            const rightSib = parent.children[myIndex + 1];
            this.addStep(`Συγχώνευση (Merge) με τον δεξιό αδελφό.`, this.cloneTree(this.root));
            this.mergeNodes(node, rightSib, myIndex);
        }
    }

    borrowFromSibling(node, sibling, separatorIndex, isLeft) {
        // separatorIndex is index of Key in parent that separates sibling and node
        // If left sibling (idx-1), separator is at parent.keys[idx-1]
        // If right sibling (idx+1), separator is at parent.keys[idx]

        const parent = node.parent;

        if (node.isLeaf) {
            if (isLeft) {
                const borrow = sibling.keys.pop();
                node.keys.unshift(borrow);
                parent.keys[separatorIndex] = node.keys[0]; // Update separator to new first key
            } else {
                const borrow = sibling.keys.shift();
                node.keys.push(borrow);
                // Separator (at separatorIndex) becomes new first of sibling?
                // Wait, if right sibling gave us a key, parent key should point to right sibling's NEW start
                parent.keys[separatorIndex] = sibling.keys[0];
            }
        } else {
            // Internal Node Borrow
            if (isLeft) {
                const borrowKey = sibling.keys.pop();
                const borrowChild = sibling.children.pop();

                // Move parent separator down to node
                node.keys.unshift(parent.keys[separatorIndex]);
                // Move borrowKey up to parent
                parent.keys[separatorIndex] = borrowKey;

                // Move child
                node.children.unshift(borrowChild);
                borrowChild.parent = node;
            } else {
                const borrowKey = sibling.keys.shift();
                const borrowChild = sibling.children.shift();

                node.keys.push(parent.keys[separatorIndex]);
                parent.keys[separatorIndex] = borrowKey;

                node.children.push(borrowChild);
                borrowChild.parent = node;
            }
        }
    }

    mergeNodes(left, right, separatorIndex) {
        // Merge right into left
        const parent = left.parent;

        if (left.isLeaf) {
            left.keys = left.keys.concat(right.keys);
            left.next = right.next; // Fix chain
        } else {
            // Pull down separator
            const separator = parent.keys[separatorIndex];
            left.keys.push(separator);
            left.keys = left.keys.concat(right.keys);
            left.children = left.children.concat(right.children);
            right.children.forEach(c => c.parent = left);
        }

        // Remove right from parent
        parent.keys.splice(separatorIndex, 1);
        parent.children.splice(separatorIndex + 1, 1);
    }

    // --- DRAWING from Previous Step ---
    draw(step) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const root = step.state;
        if (!root) return;
        this.calculateLayout(root, 0);
        this.centerTree(root, this.canvas.width / 2);
        this.drawNodeRecursive(root, step);
        if (step.highlight) step.highlight(this.ctx, root);
    }

    calculateLayout(node, level) {
        if (!node) return 0;
        node.width = Math.max(this.config.nodeWidth, node.keys.length * 20 + 20);
        if (node.isLeaf || node.children.length === 0) {
            node.subtreeWidth = node.width + 20;
        } else {
            let width = 0;
            node.children.forEach(c => {
                this.calculateLayout(c, level + 1);
                width += c.subtreeWidth;
            });
            node.subtreeWidth = width;
        }
        node.level = level;
    }

    centerTree(node, x) {
        if (!node) return;
        node.x = x;
        node.y = 50 + node.level * this.config.levelHeight;
        if (!node.isLeaf && node.children.length > 0) {
            let startX = x - node.subtreeWidth / 2;
            node.children.forEach(c => {
                let childX = startX + c.subtreeWidth / 2;
                this.centerTree(c, childX);
                startX += c.subtreeWidth;
            });
        }
    }

    drawNodeRecursive(node, step) {
        if (!node) return;
        if (!node.isLeaf) {
            node.children.forEach(c => {
                this.drawArrow(node.x, node.y + 15, c.x, c.y - 15, '#7f8c8d');
                this.drawNodeRecursive(c, step);
            });
        }

        const w = Math.max(this.config.nodeWidth, node.keys.length * 25 + 20);
        const h = 30;

        this.ctx.fillStyle = node.isLeaf ? '#e8f5e9' : '#e3f2fd';
        this.ctx.strokeStyle = node.isLeaf ? '#27ae60' : '#3498db';
        this.ctx.lineWidth = 2;
        node.rect = { x: node.x - w / 2, y: node.y - h / 2, w: w, h: h };

        this.ctx.beginPath();
        this.ctx.roundRect(node.rect.x, node.rect.y, w, h, 5);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        let startX = node.rect.x + 10;
        for (let i = 0; i < node.keys.length; i++) {
            this.ctx.fillText(node.keys[i], startX + 12.5, node.rect.y + h / 2);
            if (i < node.keys.length - 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(startX + 25, node.rect.y);
                this.ctx.lineTo(startX + 25, node.rect.y + h);
                this.ctx.stroke();
            }
            startX += 25;
        }
    }

    highlightNode(ctx, nodeId, color) {
        const find = (node) => {
            if (!node) return;
            if (node.id === nodeId) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(node.rect.x - 2, node.rect.y - 2, node.rect.w + 4, node.rect.h + 4);
            }
            if (node.children) node.children.forEach(find);
        };
        find(this.treeState || this.steps[this.currentStepIndex].state);
    }

    /**
     * Advanced Random Fill
     * @param {number} depth Target depth (1 = just root)
     * @param {number} keysPerInternal Keys in each internal node
     * @param {number} keysPerLeaf Keys in each leaf node
     */
    randomFill(depth, keysPerInternal, keysPerLeaf) {
        this.steps = [];
        this.currentStepIndex = -1;

        // Reset tree
        this.root = this.createNode(depth === 1);

        const fill = (node, currentDepth) => {
            if (currentDepth === depth) {
                // Leaf node
                for (let i = 0; i < keysPerLeaf; i++) {
                    node.keys.push(Math.floor(Math.random() * 100));
                }
                node.keys.sort((a, b) => a - b);
                return;
            }

            // Internal node
            for (let i = 0; i < keysPerInternal; i++) {
                node.keys.push(0); // Placeholder keys
            }

            for (let i = 0; i <= keysPerInternal; i++) {
                const child = this.createNode(currentDepth + 1 === depth);
                child.parent = node;
                node.children.push(child);
                fill(child, currentDepth + 1);
            }

            // Fix separator keys
            for (let i = 0; i < keysPerInternal; i++) {
                node.keys[i] = this.getSmallestKey(node.children[i + 1]);
            }
        };

        fill(this.root, 1);
        this.addStep(`Random Fill: Depth ${depth}, Keys/Int ${keysPerInternal}, Keys/Leaf ${keysPerLeaf}`, this.cloneTree(this.root));
        this.play();
    }

    getSmallestKey(node) {
        if (node.isLeaf) return node.keys[0];
        return this.getSmallestKey(node.children[0]);
    }

    resetState() {
        this.root = this.createNode(true);
    }

    loadExample(type) {
        this.resetState();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (type === 'parent-underflow') {
            // Setup for Parent Underflow
            // Config: N=4, M=3
            this.config.orderInternal = 4;
            this.config.orderLeaf = 3;

            // Sequence to create specific tree structure
            const keys = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

            // Execute inserts silently
            keys.forEach(k => {
                this.insertIntoTreeSilent(k);
            });

            this.computeSteps();
            this.draw(this.steps[this.steps.length - 1]);

            // Log for user
            console.log("Example Loaded: Parent Underflow Scenerio");
            console.log("Try deleting 70 to see leaf underflow triggering parent underflow.");
        }
    }

    // Helper for silent insertion without animation steps during setup
    insertIntoTreeSilent(key) {
        // A stripped down version of executeInsert that just modifies state
        // To reuse logic, we can just call executeInsert but ignore steps or 
        // better, since executeInsert relies on 'addStep' snapshots, 
        // we can temporarily override addStep or just run it and clear steps later.
        // Actually, running executeInsert is fine, we just won't 'play' it.
        this.executeInsert(key);
    }
}

window.BTreeSimulator = BTreeSimulator;

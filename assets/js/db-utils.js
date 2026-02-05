/**
 * Database Utilities & Calculation Helpers
 */

const DBUtils = {
    /**
     * Calculate number of blocks for a relation
     * @param {number} numTuples - t(R)
     * @param {number} tupleSize - Size of one tuple in bytes
     * @param {number} blockSize - Size of block in bytes (default 4KB)
     * @param {number} headerSize - Block header size (default 0)
     * @returns {number} p(R)
     */
    calculateBlocks: (numTuples, tupleSize, blockSize = 4096, headerSize = 0) => {
        const effectiveSpace = blockSize - headerSize;
        const tuplesPerBlock = Math.floor(effectiveSpace / tupleSize);
        return Math.ceil(numTuples / tuplesPerBlock);
    },

    /**
     * External Sort Cost
     * Cost = 2 * p(R) * (1 + ceil(log_{M-1}(ceil(p(R)/M))))
     */
    costExternalSort: (blocks, buffers) => {
        if (blocks <= buffers) return 2 * blocks; // 1 read + 1 write

        const initialRuns = Math.ceil(blocks / buffers);
        const passes = Math.ceil(Math.log(initialRuns) / Math.log(buffers - 1));

        return 2 * blocks * (1 + passes);
    },

    /**
     * Format bytes to readable string
     */
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

window.DBUtils = DBUtils;

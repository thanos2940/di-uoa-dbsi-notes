/**
 * Navigation Configuration
 * Defines the structure of the YSBD Notes platform
 */
const NavConfig = {
    parts: [
        {
            id: 'part-a',
            title: 'Μέρος Α: Φυσική Οργάνωση',
            icon: 'fas fa-hdd',
            color: 'var(--primary-blue)',
            pages: [
                { title: 'B+ Trees: Θεωρία', url: 'part-a/04-btree-basics.html', icon: 'fas fa-tree' },
                { title: 'Extendible Hashing', url: 'part-a/07-hash-theory.html', icon: 'fas fa-hashtag' }
            ]
        },
        {
            id: 'part-b',
            title: 'Μέρος Β: Επεξεργασία',
            icon: 'fas fa-filter',
            color: 'var(--primary-green)',
            pages: [
                { title: 'Θεωρία Ερωτημάτων', url: 'part-b/00-query-theory.html', icon: 'fas fa-book' },
                { title: 'Αλγόριθμοι Ζεύξης', url: 'part-b/01-join-algorithms.html', icon: 'fas fa-link' },
                { title: 'Nested Loop Visualizer', url: 'part-b/03-nested-loop.html', icon: 'fas fa-layer-group' },
                { title: 'Cost Calculator', url: 'part-b/06-cost-model.html', icon: 'fas fa-calculator' }
            ]
        },
        {
            id: 'part-c',
            title: 'Μέρος Γ: Συνδρομικότητα',
            icon: 'fas fa-exchange-alt',
            color: 'var(--primary-purple)',
            pages: [
                { title: 'Σειριοποιησιμότητα & 2PL', url: 'part-c/06-serializability-2pl.html', icon: 'fas fa-shield-alt' },
                { title: 'Conflict Graph Sim', url: 'part-c/03-serializability.html', icon: 'fas fa-project-diagram' },
                { title: 'Lock Manager Sim', url: 'part-c/05-two-phase-locking.html', icon: 'fas fa-lock' }
            ]
        }
    ],
    reference: [
        { title: 'Τυπολόγιο', url: 'reference/formulas.html', icon: 'fas fa-calculator' }
    ]
};

if (typeof window !== 'undefined') {
    window.NavConfig = NavConfig;
}

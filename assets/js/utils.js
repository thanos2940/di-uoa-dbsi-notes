/**
 * Global Utilities
 */

// Theme Toggling
function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Helper to get correct relative path to assets
function getRootPath() {
    // Determine depth based on current location
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p.length > 0);
    // Rough estimate: we are usually in pages/part-x/file.html (depth 3 from root if strictly following structure)
    // But let's look for 'ysbd-notes' or similar anchor.
    // For now, assume we are included in pages that know their relative path or use absolute if server.
    // Simpler: Just rely on relative links in HTML.
    return '../../';
}

// On Load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Add theme toggle button if Nav exists
    const nav = document.querySelector('nav ul');
    if (nav) {
        const li = document.createElement('li');
        li.style.marginLeft = 'auto';
        const button = document.createElement('button');
        button.innerText = '🌓 Theme';
        button.className = 'btn btn-secondary';
        button.onclick = toggleTheme;
        li.appendChild(button);
        nav.appendChild(li);
    }
});

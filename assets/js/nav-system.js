/**
 * Navigation System
 * Dynamically generates top nav and sidebar based on NavConfig
 */
document.addEventListener('DOMContentLoaded', () => {
    const isPageIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const pathPrefix = isPageIndex ? 'pages/' : '';
    const rootPath = isPageIndex ? '' : '../../';

    // 1. Inject Top Navigation
    injectTopNav(rootPath, pathPrefix);

    // 2. Inject Sidebar (if not on index)
    if (!isPageIndex) {
        injectSidebar(rootPath);
    }
});

function injectTopNav(rootPath, pathPrefix) {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const navContent = `
        <div class="container nav-content">
            <a href="${rootPath}index.html" class="logo">
                <i class="fas fa-database"></i> ΥΣΒΔ Notes
            </a>
            <ul class="nav-links">
                <li><a href="${rootPath}index.html#part-a">Φυσική Οργάνωση</a></li>
                <li><a href="${rootPath}index.html#part-b">Επεξεργασία</a></li>
                <li><a href="${rootPath}index.html#part-c">Συνδρομικότητα</a></li>
            </ul>
        </div>
    `;
    nav.innerHTML = navContent;

    const navLinks = nav.querySelector('.nav-links');
    if (navLinks) {
        const li = document.createElement('li');
        li.style.marginLeft = 'auto';
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-moon"></i> Theme';
        button.className = 'btn btn-secondary';
        button.onclick = () => {
            if (typeof toggleTheme === 'function') toggleTheme();
        };
        li.appendChild(button);
        navLinks.appendChild(li);
    }
}

function injectSidebar(rootPath) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const currentPath = window.location.pathname;

    // Find matching part
    let activePart = null;
    for (const part of window.NavConfig.parts) {
        if (part.pages.some(p => currentPath.includes(p.url))) {
            activePart = part;
            break;
        }
    }

    if (!activePart) return;

    const sidebarHTML = `
        <div class="sidebar-card">
            <h4><i class="${activePart.icon}" style="color: ${activePart.color};"></i> ${activePart.title.split(':')[0]}</h4>
            <nav class="sidebar-links">
                ${activePart.pages.map(page => `
                    <a href="${rootPath}pages/${page.url}" class="${currentPath.includes(page.url) ? 'active' : ''}">
                        <i class="${page.icon}"></i> ${page.title}
                    </a>
                `).join('')}
            </nav>
        </div>
        <div class="sidebar-card" style="margin-top: 1rem;">
            <h4><i class="fas fa-info-circle"></i> Reference</h4>
            <nav class="sidebar-links">
                <a href="${rootPath}pages/reference/formulas.html">
                    <i class="fas fa-calculator"></i> Τυπολόγιο
                </a>
            </nav>
        </div>
    `;
    sidebar.innerHTML = sidebarHTML;
}

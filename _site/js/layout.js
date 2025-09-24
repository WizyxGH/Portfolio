async function loadNavbar() {
    const res = await fetch('/partials/navbar.html');
    const html = await res.text();
    const container = document.getElementById('navbar-container');
    container.innerHTML = html;

    // Attendre le prochain cycle pour que le DOM soit pris en compte
    requestAnimationFrame(() => {
        // --- Menu burger ---
        const menuButton = document.getElementById('menuButton');
        const navMenu = document.getElementById('navMenu');
        if (menuButton && navMenu) {
            menuButton.addEventListener('click', () => navMenu.classList.toggle('hidden'));
        }

        // --- Dropdown ---
        const dropdownButton = document.getElementById('dropdownButton');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const dropdownChevron = document.getElementById('dropdownChevron');
        if (dropdownButton && dropdownMenu) {
            dropdownButton.addEventListener('click', () => {
                dropdownMenu.classList.toggle('hidden');
                if (dropdownChevron) {
                    dropdownChevron.classList.toggle('bx-chevron-down', dropdownMenu.classList.contains('hidden'));
                    dropdownChevron.classList.toggle('bx-chevron-up', !dropdownMenu.classList.contains('hidden'));
                }
            });
        }

        // --- Active link ---
        setActiveNavLinks();
    });
}

function setActiveNavLinks() {
    let currentPath = new URL(location.href).pathname.replace(/\/+$/, '');
    if (currentPath === '') currentPath = '/';

    document.querySelectorAll('#navMenu a').forEach(link => {
        let href = link.getAttribute('href');
        if (!href) return;

        let linkPath;
        try {
            linkPath = new URL(href, location.origin).pathname.replace(/\/+$/, '');
            if (linkPath === '') linkPath = '/';
        } catch (err) {
            return;
        }

        if (linkPath === currentPath) {
            link.classList.add('font-semibold');
        }
    });
}

loadNavbar();

async function loadFooter() {
    const res = await fetch('/partials/footer.html');
    const html = await res.text();
    document.getElementById('footer-container').innerHTML = html;
}

loadFooter();
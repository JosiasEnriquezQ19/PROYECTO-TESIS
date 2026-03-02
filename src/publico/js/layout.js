/* ========================================
   LAYOUT.JS - Shared Layout Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    // Toggle sidebar
    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('hide');
            mainContent.classList.toggle('full');
        });
    }

    // Set active sidebar item based on current URL
    const currentPath = window.location.pathname;
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');

    sidebarItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.startsWith(href) && href !== '/') {
            item.classList.add('active');
        } else if (href === '/menu/principal' && (currentPath === '/menu/principal' || currentPath === '/')) {
            item.classList.add('active');
        }
    });

    // Logout confirmation
    const logoutBtn = document.querySelector('.sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            if (!confirm('¿Desea cerrar sesión?')) {
                e.preventDefault();
            }
        });
    }
});

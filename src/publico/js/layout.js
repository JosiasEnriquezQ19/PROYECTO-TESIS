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

    // Logout confirmation — handled by liquid glass below
    const logoutBtn = document.querySelector('.sidebar-logout');
    // Removed native confirm for logout; it will be intercepted globally.

    // ========================================
    // CUSTOM MODAL LOGIC (with frosted glass backdrop)
    // ========================================
    const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
    const modalCloseBtns = document.querySelectorAll('[data-bs-dismiss="modal"]');
    const modals = document.querySelectorAll('.modal');

    // Helper: create/get frosted backdrop
    function getOrCreateBackdrop() {
        let backdrop = document.getElementById('custom-modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'custom-modal-backdrop';
            backdrop.className = 'custom-modal-backdrop';
            document.body.appendChild(backdrop);
        }
        return backdrop;
    }

    function openModal(modal) {
        if (!modal) return;
        // Help modal handles its own frosted glass — no separate backdrop needed
        if (!modal.classList.contains('help-modal')) {
            const backdrop = getOrCreateBackdrop();
            backdrop.classList.add('show');
        }
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        const backdrop = document.getElementById('custom-modal-backdrop');
        if (backdrop) backdrop.classList.remove('show');
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

    // Open modal
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-bs-target');
            if (targetId) {
                openModal(document.querySelector(targetId));
            }
        });
    });

    // Close modal via close button
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal(this.closest('.modal'));
        });
    });

    // Close modal when clicking outside content
    modals.forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });

    // Close modal on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
        }
    });

    // ========================================
    // LIQUID GLASS CONFIRM MODAL
    // Replaces ALL native confirm() dialogs
    // ========================================
    function initLiquidGlassConfirm() {
        // Create the modal HTML
        const overlayHTML = `
            <div id="liquid-glass-overlay">
                <div class="liquid-glass-modal">
                    <button class="liquid-glass-close" id="liquid-glass-close-btn" title="Cerrar">
                        &times; <span>ESC</span>
                    </button>
                    <div class="liquid-glass-icon">
                        <i class="bi bi-exclamation-triangle" id="liquid-glass-icon-i"></i>
                    </div>
                    <div class="liquid-glass-title" id="liquid-glass-title">
                        ¿Estás seguro de realizar esta acción?
                    </div>
                    <div class="liquid-glass-desc" id="liquid-glass-desc">
                        Esta operación no se puede deshacer.
                    </div>
                    <div class="liquid-glass-details" id="liquid-glass-details" style="display:none">
                        <ul id="liquid-glass-list"></ul>
                    </div>
                    <div class="liquid-glass-actions">
                        <button class="liquid-glass-btn liquid-glass-btn-confirm" id="liquid-glass-confirm-btn">
                            Sí, continuar
                        </button>
                        <button class="liquid-glass-btn liquid-glass-btn-cancel" id="liquid-glass-cancel-btn">
                            Cancelar, mantener todo
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHTML);

        const overlay = document.getElementById('liquid-glass-overlay');
        const confirmBtn = document.getElementById('liquid-glass-confirm-btn');
        const cancelBtn = document.getElementById('liquid-glass-cancel-btn');
        const closeBtn = document.getElementById('liquid-glass-close-btn');
        const titleEl = document.getElementById('liquid-glass-title');
        const descEl = document.getElementById('liquid-glass-desc');
        const detailsEl = document.getElementById('liquid-glass-details');
        const listEl = document.getElementById('liquid-glass-list');
        const iconEl = document.getElementById('liquid-glass-icon-i');

        let pendingResolve = null;
        let targetHref = '';
        let targetForm = null;

        // Map keywords to confirm button text & icon
        function getActionConfig(msg) {
            const lower = (msg || '').toLowerCase();
            if (lower.includes('eliminar') || lower.includes('borrar') || lower.includes('delete')) {
                return { btn: 'Sí, eliminar', icon: 'bi-trash3', cancelBtn: 'Cancelar, mantener' };
            }
            if (lower.includes('desactivar') || lower.includes('anular') || lower.includes('vencid')) {
                return { btn: 'Sí, desactivar', icon: 'bi-x-circle', cancelBtn: 'Cancelar, mantener' };
            }
            if (lower.includes('aprobar')) {
                return { btn: 'Sí, aprobar', icon: 'bi-check-circle', cancelBtn: 'Cancelar' };
            }
            if (lower.includes('factura') && lower.includes('generar')) {
                return { btn: 'Sí, generar factura', icon: 'bi-receipt', cancelBtn: 'Cancelar' };
            }
            if (lower.includes('actualizar')) {
                return { btn: 'Sí, actualizar', icon: 'bi-pencil-square', cancelBtn: 'Cancelar' };
            }
            if (lower.includes('sesión') || lower.includes('sesion') || lower.includes('cerrar')) {
                return { btn: 'Sí, cerrar sesión', icon: 'bi-box-arrow-left', cancelBtn: 'Cancelar, seguir aquí' };
            }
            if (lower.includes('crear') || lower.includes('contrato')) {
                return { btn: 'Sí, continuar', icon: 'bi-check-lg', cancelBtn: 'Cancelar' };
            }
            return { btn: 'Sí, continuar', icon: 'bi-exclamation-triangle', cancelBtn: 'Cancelar, mantener todo' };
        }

        // Parse message — split into title + bullet list items
        function parseMessage(msg) {
            // Split by \n or \\n
            const parts = msg.replace(/\\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
            const title = parts[0] || msg;
            const items = parts.slice(1);
            return { title, items };
        }

        // Open modal
        function openModal(message, href, formElement) {
            const config = getActionConfig(message);
            const parsed = parseMessage(message);

            titleEl.innerText = parsed.title;
            confirmBtn.innerText = config.btn;
            cancelBtn.innerText = config.cancelBtn;
            iconEl.className = 'bi ' + config.icon;

            // Description
            descEl.innerText = 'Esta operación no se puede deshacer.';
            descEl.style.display = 'block';

            // Detail bullet points
            if (parsed.items.length > 0) {
                listEl.innerHTML = parsed.items.map(item => '<li>' + item + '</li>').join('');
                detailsEl.style.display = 'block';
            } else {
                detailsEl.style.display = 'none';
            }

            targetHref = href || '';
            targetForm = formElement || null;

            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            confirmBtn.focus();
        }

        // Close modal
        function closeModal() {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            targetHref = '';
            targetForm = null;
            if (pendingResolve) {
                pendingResolve(false);
                pendingResolve = null;
            }
        }

        // Bind cancel & close
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        // Close on overlay click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        // Bind ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('show')) {
                closeModal();
            }
        });

        // Bind confirm
        confirmBtn.addEventListener('click', function () {
            overlay.classList.remove('show');
            document.body.style.overflow = '';

            if (pendingResolve) {
                pendingResolve(true);
                pendingResolve = null;
            } else if (targetHref) {
                window.location.href = targetHref;
            } else if (targetForm) {
                // Re-submit without triggering the intercepted onsubmit again
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = '_confirmed';
                hiddenInput.value = '1';
                targetForm.appendChild(hiddenInput);
                targetForm.submit();
            }
            targetHref = '';
            targetForm = null;
        });

        // ---- INTERCEPT onclick="return confirm(...)" ----
        const confirmElements = document.querySelectorAll('[onclick*="confirm"]');
        confirmElements.forEach(el => {
            const onclickAttr = el.getAttribute('onclick');
            const match = onclickAttr.match(/confirm\(\s*['"]([\s\S]*?)['"]\s*\)/);
            const message = match ? match[1] : '¿Estás seguro de realizar esta operación?';

            el.removeAttribute('onclick');

            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let href = null;
                let form = null;

                if (this.tagName === 'A') {
                    href = this.getAttribute('href');
                } else if (this.closest('form')) {
                    form = this.closest('form');
                }

                openModal(message, href, form);
            });
        });

        // ---- INTERCEPT onsubmit="return confirm(...)" ----
        const confirmForms = document.querySelectorAll('[onsubmit*="confirm"]');
        confirmForms.forEach(form => {
            const onsubmitAttr = form.getAttribute('onsubmit');
            const match = onsubmitAttr.match(/confirm\(\s*['"]([\s\S]*?)['"]\s*\)/);
            const message = match ? match[1] : '¿Estás seguro de realizar esta operación?';

            form.removeAttribute('onsubmit');

            form.addEventListener('submit', function (e) {
                // If already confirmed, let it through
                if (form.querySelector('input[name="_confirmed"]')) return;

                e.preventDefault();
                openModal(message, null, form);
            });
        });

        // ---- GLOBAL OVERRIDE: window.confirm() ----
        // This catches any JS code that calls confirm() directly
        const nativeConfirm = window.confirm;
        window.confirm = function (message) {
            // Return a flag — but since confirm is sync and our modal is async,
            // we need a clever pattern. We'll override and return false,
            // then re-trigger the action on confirm.
            // For inline JS that uses `if(confirm(...))` we intercept at a deeper level.
            return false; // Prevent the native confirm; our modal will handle it
        };

        // Expose global function for JS confirm() interception
        window.liquidGlassConfirm = function (message) {
            return new Promise(function (resolve) {
                pendingResolve = resolve;
                openModal(message, null, null);
            });
        };

        // ---- INTERCEPT logout button specifically ----
        const logoutLink = document.querySelector('.sidebar-logout');
        if (logoutLink) {
            logoutLink.addEventListener('click', function (e) {
                e.preventDefault();
                openModal('¿Desea cerrar sesión?', this.getAttribute('href'), null);
            });
        }
    }

    // Initialize after a slight delay to ensure dynamic elements are ready
    setTimeout(initLiquidGlassConfirm, 100);
});

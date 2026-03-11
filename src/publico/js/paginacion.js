/**
 * TablePagination - Paginación cliente-side para tablas del sistema CARSIL
 * Muestra 20 filas por página. Compatible con los filtros de búsqueda existentes.
 *
 * Uso:
 *   const pag = new TablePagination('tbodyId', 20);
 *
 * Para que el filtro de búsqueda funcione con la paginación:
 *   En filtrarTabla(), en lugar de: row.style.display = show ? '' : 'none'
 *   Usar:                           row.dataset.filterHidden = show ? '' : '1'
 *   Y al final llamar:              pag.reset()
 */
class TablePagination {
    constructor(tbodyId, rowsPerPage = 20) {
        this.tbody = typeof tbodyId === 'string'
            ? document.getElementById(tbodyId)
            : tbodyId;
        this.rowsPerPage = rowsPerPage;
        this.currentPage = 1;
        this.prefix = typeof tbodyId === 'string'
            ? tbodyId.replace(/^tbody/i, 'pag')
            : tbodyId.id.replace(/^tbody/i, 'pag');

        if (!this.tbody) return;
        this.render();
    }

    _allRows() {
        return Array.from(this.tbody.querySelectorAll('tr'));
    }

    _filteredRows() {
        return this._allRows().filter(r => r.dataset.filterHidden !== '1');
    }

    render() {
        const all = this._allRows();
        const filtered = this._filteredRows();
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / this.rowsPerPage));

        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;

        all.forEach(row => {
            if (row.dataset.filterHidden === '1') {
                row.style.display = 'none';
            } else {
                const idx = filtered.indexOf(row);
                row.style.display = (idx >= start && idx < end) ? '' : 'none';
            }
        });

        // Actualizar controles UI
        const pfx = this.prefix;
        const infoEl  = document.getElementById(pfx + 'Info');
        const totalEl = document.getElementById(pfx + 'Total');
        const pageEl  = document.getElementById(pfx + 'Page');
        const prevBtn = document.getElementById(pfx + 'Prev');
        const nextBtn = document.getElementById(pfx + 'Next');

        const showing = total === 0 ? '0' : `${start + 1}–${Math.min(end, total)}`;
        if (infoEl)  infoEl.textContent  = showing;
        if (totalEl) totalEl.textContent = total;
        if (pageEl)  pageEl.textContent  = `Página ${this.currentPage} de ${totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    next()  { this.currentPage++; this.render(); }
    prev()  { this.currentPage--; this.render(); }
    reset() { this.currentPage = 1; this.render(); }
}

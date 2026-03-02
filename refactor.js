const fs = require('fs');
const path = require('path');

function refactorContratos() {
    let p = path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'vistas', 'contratos', 'lista.ejs');
    let content = fs.readFileSync(p, 'utf8');

    // 1. Replace <style> to </style> with list-views.css link
    content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/list-views.css">');

    // 2. Header
    content = content.replace(/<div class="page-header">[\s\S]*?<\/div>(\s*<\/div>\s*<\/div>)?/, `<div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 class="page-title">
                                <i class="bi bi-file-earmark-check me-2"></i>
                                Gestión de Contratos
                            </h1>
                        </div>
                        <div>
                            <a href="/contratos/crear" class="btn btn-primary-modern btn-modern">
                                <i class="bi bi-plus-circle"></i>
                                Nuevo Contrato
                            </a>
                        </div>
                    </div>`);
    // Need to handle remaining divs if any. I'll just keep it simple.

    // Stats grid
    content = content.replace(/<div class="row mb-4">[\s\S]*?<\/div>\s*<% } %>/g, `<div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #0056b3, #0d6efd);">
                            <i class="bi bi-file-earmark-check text-white"></i>
                        </div>
                        <h6 class="text-muted">Total Contratos</h6>
                        <h3 class="text-primary"><%= estadisticas.TotalContratos || 0 %></h3>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #28a745, #20c997);">
                            <i class="bi bi-check-circle text-white"></i>
                        </div>
                        <h6 class="text-muted">Contratos Activos</h6>
                        <h3 class="text-success"><%= estadisticas.ContratosActivos || 0 %></h3>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #6f42c1, #e83e8c);">
                            <i class="bi bi-flag text-white"></i>
                        </div>
                        <h6 class="text-muted">Finalizados</h6>
                        <h3 class="text-info"><%= estadisticas.ContratosFinalizados || 0 %></h3>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #ffc107, #fd7e14);">
                            <i class="bi bi-currency-dollar text-white"></i>
                        </div>
                        <h6 class="text-muted">Prom. Semanal</h6>
                        <h3 class="text-warning">S/ <%= parseFloat(estadisticas.PromedioPageSemanal || 0).toFixed(2) %></h3>
                    </div>
                </div>
                <% } %>`);

    // Search and Card
    content = content.replace(/<div class="card shadow-sm">[\s\S]*?<div class="card-header">[\s\S]*?<div class="d-flex justify-content-between align-items-center">[\s\S]*?<h5 class="mb-0">[\s\S]*?<i class="bi bi-list-ul me-2"><\/i>[\s\S]*?Lista de Contratos[\s\S]*?<\/h5>[\s\S]*?<div class="d-flex align-items-center">/, `<div class="search-container">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="search-box flex-grow-1 me-3">
                            <div class="d-flex gap-2 align-items-center">`);

    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<div class="card-body p-0">/, `</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-modern">`);

    content = content.replace(/<table class="table table-hover mb-0" id="tablaContratos">/g, '<table class="table table-modern mb-0" id="tablaContratos">');

    // add checkbox column in header
    content = content.replace(/<th>Código<\/th>/, '<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"></th>\n                                <th>Código <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Cliente<\/th>/, '<th>Cliente <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Factura<\/th>/, '<th>Factura <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Fecha Inicio<\/th>/, '<th>Fecha Inicio <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Fecha Fin<\/th>/, '<th>Fecha Fin <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Pago Semanal<\/th>/, '<th>Pago Semanal <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th>Estado<\/th>/, '<th>Estado <i class="bi bi-arrow-down-up"></i></th>');

    // add checkbox column in body
    content = content.replace(/<td>\s*<strong><%= contrato\.Codigo %><\/strong>\s*<\/td>/g, '<td><input class="form-check-input custom-checkbox" type="checkbox"></td>\n                                <td>\n                                    <span class="fw-bold text-primary"><%= contrato.Codigo %></span>\n                                </td>');

    // Status Badge
    content = content.replace(/<span class="estado-badge estado-<%= contrato\.Estado\.toLowerCase\(\) %>">/g, '<span class="badge badge-modern <%= contrato.Estado === \'ACTIVO\' ? \'badge-activo\' : (contrato.Estado === \'FINALIZADO\' ? \'badge-inactivo\' : (contrato.Estado === \'SUSPENDIDO\' ? \'badge-warning\' : \'badge-danger\')) %>">');

    // Action buttons
    content = content.replace(/<div class="btn-group" role="group">[\s\S]*?<\/div>(\s*<\/td>)/g, (match) => {
        let res = match.replace(/btn btn-sm btn-outline-primary btn-action/g, 'btn-action-icon btn-action-view');
        res = res.replace(/btn btn-sm btn-outline-warning btn-action/g, 'btn-action-icon btn-action-edit');
        res = res.replace(/btn btn-sm btn-outline-secondary btn-action/g, 'btn-action-icon btn-action-delete text-secondary');
        res = res.replace(/btn btn-sm btn-outline-success btn-action/g, 'btn-action-icon btn-action-view text-success');
        res = res.replace(/btn btn-sm btn-outline-danger btn-action/g, 'btn-action-icon btn-action-delete');
        res = res.replace(/<div class="btn-group" role="group">/, '<div class="action-buttons justify-content-center">');
        return res;
    });

    // Item avatar for Client
    content = content.replace(/<td>\s*<div>\s*<strong><%= contrato\.ClienteNombre %><\/strong>\s*<br>\s*<small class="text-muted">\s*<i class="bi bi-card-text me-1"><\/i>\s*<%= contrato\.ClienteDocumento %>\s*<\/small>\s*<\/div>\s*<\/td>/g,
        `<td>
                                    <div class="item-info">
                                        <div class="item-avatar">
                                            <%= contrato.ClienteNombre ? contrato.ClienteNombre.charAt(0).toUpperCase() : 'C' %>
                                        </div>
                                        <div class="item-details">
                                            <strong><%= contrato.ClienteNombre %></strong>
                                            <div class="text-muted"><i class="bi bi-card-text me-1"></i><%= contrato.ClienteDocumento %></div>
                                        </div>
                                    </div>
                                </td>`);

    fs.writeFileSync(p, content);
}

function refactorEmpleados() {
    let p = path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'vistas', 'empleados', 'lista.ejs');
    let content = fs.readFileSync(p, 'utf8');

    // 1. Remove style
    content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/list-views.css">');

    // 2. Add checkbox header
    content = content.replace(/<th><i class="bi bi-person me-1"><\/i>Empleado<\/th>/, '<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"></th>\n                                    <th>Empleado <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th><i class="bi bi-[a-z-]+ me-1"><\/i>/g, '<th>');
    content = content.replace(/<\/th>/g, ' <i class="bi bi-arrow-down-up"></i></th>');
    content = content.replace(/<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"> <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"></th>');
    content = content.replace(/<th>Acciones <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th class="text-center">Acciones</th>');
    content = content.replace(/<th class="text-center">Acciones <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th class="text-center">Acciones</th>');
    // For th tags with text-center:
    content = content.replace(/<th class="text-center"> <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th class="text-center">Acciones</th>');

    // Fix ths:
    content = content.replace(/<th>Empleado <i class="bi bi-arrow-down-up"><\/i> <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th>Empleado <i class="bi bi-arrow-down-up"></i></th>');

    // 3. Add checkbox body
    content = content.replace(/<td>\s*<div class="employee-info">/g, '<td><input class="form-check-input custom-checkbox" type="checkbox"></td>\n                                            <td>\n                                                <div class="item-info">');
    content = content.replace(/<div class="employee-avatar">/g, '<div class="item-avatar">');

    // Action buttons
    content = content.replace(/<div class="d-flex justify-content-center gap-1">[\s\S]*?<\/td>/g, (match) => {
        let res = match.replace(/btn btn-outline-primary btn-action/g, 'btn-action-icon btn-action-edit');
        res = res.replace(/btn btn-outline-danger btn-action/g, 'btn-action-icon btn-action-delete');
        res = res.replace(/<div class="d-flex justify-content-center gap-1">/, '<div class="action-buttons justify-content-center">');
        return res;
    });

    // Status Badge
    content = content.replace(/<span class="badge-modern <%= e.Estado === 'ACTIVO' \? 'badge-activo' : 'badge-inactivo' %>">/g, '<span class="badge badge-modern <%= e.Estado === \'ACTIVO\' ? \'badge-activo\' : \'badge-inactivo\' %>">');

    fs.writeFileSync(p, content);
}

refactorContratos();
refactorEmpleados();

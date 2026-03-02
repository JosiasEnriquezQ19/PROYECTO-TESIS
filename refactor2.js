const fs = require('fs');
const path = require('path');

// Empresa
let pEmpresa = path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'vistas', 'empresa', 'lista.ejs');
let cEmpresa = fs.readFileSync(pEmpresa, 'utf8');

let styleMatch = cEmpresa.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
    let styles = styleMatch[1];
    fs.writeFileSync(path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'publico', 'css', 'empresa.css'), styles);
    cEmpresa = cEmpresa.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/empresa.css">');
    fs.writeFileSync(pEmpresa, cEmpresa);
}

// Pagos
let pPagos = path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'vistas', 'pagos', 'listar.ejs');
let cPagos = fs.readFileSync(pPagos, 'utf8');

cPagos = cPagos.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/list-views.css">');
cPagos = cPagos.replace(/<th><i class="bi bi-person me-1"><\/i>Empleado<\/th>/, '<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"></th>\n                                    <th>Empleado <i class="bi bi-arrow-down-up"></i></th>');
cPagos = cPagos.replace(/<th><i class="bi bi-[a-z-]+ me-1"><\/i>/g, '<th>');
cPagos = cPagos.replace(/<\/th>/g, ' <i class="bi bi-arrow-down-up"></i></th>');
cPagos = cPagos.replace(/<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"> <i class="bi bi-arrow-down-up"><\/i><\/th>/, '<th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox"></th>');
cPagos = cPagos.replace(/<th class="text-center">Acciones <i class="bi bi-arrow-down-up"><\/i><\/th>/g, '<th class="text-center">Acciones</th>');
cPagos = cPagos.replace(/<th class="text-center"><i class="bi bi-gear me-1"><\/i>Acciones <i class="bi bi-arrow-down-up"><\/i><\/th>/g, '<th class="text-center">Acciones</th>');
cPagos = cPagos.replace(/<th>Acciones <i class="bi bi-arrow-down-up"><\/i><\/th>/g, '<th class="text-center">Acciones</th>');

// Bodys
cPagos = cPagos.replace(/<td>\s*<div class="employee-info">/g, '<td><input class="form-check-input custom-checkbox" type="checkbox"></td>\n                                            <td>\n                                                <div class="item-info">');
cPagos = cPagos.replace(/<div class="employee-avatar">/g, '<div class="item-avatar">');

// Badges
cPagos = cPagos.replace(/<span class="badge-modern[\s\S]*?">/g, (match) => {
    if (match.includes('badge-pagado')) {
        return '<span class="badge badge-modern <%= pago.Estado === \'PAGADO\' ? \'badge-pagado\' : pago.Estado === \'PENDIENTE\' ? \'badge-pendiente\' : pago.Estado === \'PARCIAL\' ? \'badge-pendiente\' : \'badge-vencido\' %>">';
    }
    return match;
});

// Action buttons
cPagos = cPagos.replace(/<div class="d-flex justify-content-center gap-1">[\s\S]*?<\/td>/g, (match) => {
    let res = match.replace(/btn btn-outline-primary btn-action/g, 'btn-action-icon btn-action-edit');
    res = res.replace(/btn btn-outline-success btn-action/g, 'btn-action-icon btn-action-view text-success');
    res = res.replace(/btn btn-outline-danger btn-action/g, 'btn-action-icon btn-action-delete');
    res = res.replace(/btn btn-outline-warning btn-action/g, 'btn-action-icon btn-action-edit text-warning');
    res = res.replace(/<div class="d-flex justify-content-center gap-1">/, '<div class="action-buttons justify-content-center">');
    return res;
});

fs.writeFileSync(pPagos, cPagos);

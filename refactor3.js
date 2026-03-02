const fs = require('fs');
const path = require('path');

const updateActionButtons = (content) => {
    return content.replace(/<div class="d-flex justify-content-center gap-1[^>]*">([\s\S]*?)<\/td>/g, (match, inner) => {
        let res = inner.replace(/btn btn-outline-primary btn-action/g, 'btn-action-icon btn-action-edit');
        res = res.replace(/btn btn-outline-info btn-action/g, 'btn-action-icon btn-action-view');
        res = res.replace(/btn btn-outline-danger btn-action/g, 'btn-action-icon btn-action-delete');

        // Ensure not to add classes if they already are action buttons (idempotent)
        if (!res.includes('action-buttons')) {
            let container = `<div class="action-buttons justify-content-center">\n${res}\n</div>`;
            return container + '</td>';
        }
        return match;
    });
};

function processFile(modulePath, filename) {
    const fullPath = path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'vistas', modulePath, filename);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');

    // Extract styles for asistencia
    if (modulePath === 'asistencia') {
        let styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
        if (styleMatch) {
            let styles = styleMatch[1];
            fs.writeFileSync(path.join('e:', '6 CICLO', 'CURSO JUEVES', 'PROYECTO-TESIS-NUEVO', 'PROYECTO-TESIS', 'src', 'publico', 'css', 'asistencia.css'), styles);
            content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/list-views.css">\n    <link rel="stylesheet" href="/publico/css/asistencia.css">');
        }
    } else {
        content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/publico/css/list-views.css">');
    }

    // Ensure table headers get checkbox
    if (content.includes('<thead>')) {
        let theadMatch = content.match(/<thead>([\s\S]*?)<\/thead>/);
        if (theadMatch && !theadMatch[1].includes('custom-checkbox')) {
            let thead = theadMatch[1];
            thead = thead.replace(/<tr>\s*(<th[^>]*>.*?<\/th>)/, '<tr>\n                                    <th style="width: 40px;"><input class="form-check-input custom-checkbox" type="checkbox" onchange="toggleAll(this)"></th>\n                                    $1');
            thead = thead.replace(/<th class="text-center">.*?Acciones.*?<\/th>/g, '<th class="text-center">Acciones</th>');
            content = content.replace(/<thead>[\s\S]*?<\/thead>/, `<thead>${thead}</thead>`);
        }
    }

    // Body changes for checkboxes
    if (content.includes('<tbody>')) {
        content = content.replace(/<tr>\s*<td>/g, '<tr>\n                                            <td><input class="form-check-input custom-checkbox row-checkbox" type="checkbox"></td>\n                                            <td>');
        content = content.replace(/<tr>\s*<td class="text-center"><%= index \+ 1 %><\/td>/g, '<tr>\n                                            <td><input class="form-check-input custom-checkbox row-checkbox" type="checkbox"></td>\n                                            <td><%= index + 1 %></td>');
    }

    // Quick Fixes
    content = content.replace(/class="client-avatar/g, 'class="item-avatar');
    content = content.replace(/class="user-info-avatar/g, 'class="item-avatar');
    content = content.replace(/class="employee-avatar/g, 'class="item-avatar');
    content = content.replace(/<span class="badge-modern/g, '<span class="badge badge-modern');

    // Action buttons specific for usuarios
    if (modulePath === 'usuarios') {
        content = content.replace(/<td class="text-center">\s*<a href="\/usuarios\/editar[\s\S]*?<\/td>/g, (match) => {
            let res = match.replace(/btn btn-sm btn-outline-primary me-1/g, 'btn-action-icon btn-action-edit');
            res = res.replace(/btn btn-sm btn-outline-danger/g, 'btn-action-icon btn-action-delete');
            return res.replace(/<td class="text-center">\s*([\s\S]*?)\s*<\/td>/, '<td class="text-center">\n<div class="action-buttons justify-content-center">\n$1\n</div>\n</td>');
        });
    } else {
        content = updateActionButtons(content);
    }

    fs.writeFileSync(fullPath, content);
}

processFile('proformas', 'lista.ejs');
processFile('roles', 'listar.ejs');
processFile('usuarios', 'listar.ejs');
processFile('asistencia', 'list.ejs');


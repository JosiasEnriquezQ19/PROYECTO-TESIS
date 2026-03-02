const fs = require('fs');
const path = require('path');

const vistasPath = path.join(__dirname, 'src', 'vistas');
const modules = ['clientes', 'productos', 'facturas', 'contratos', 'empleados', 'proformas', 'roles', 'usuarios', 'asistencia'];

modules.forEach(mod => {
    const modPath = path.join(vistasPath, mod);
    if (!fs.existsSync(modPath)) return;

    const files = fs.readdirSync(modPath).filter(f => f === 'crear.ejs' || f === 'editar.ejs' || f === 'edit.ejs');

    files.forEach(file => {
        const filePath = path.join(modPath, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Remove style blocks completely
        content = content.replace(/<style>[\s\S]*?<\/style>/gi, '');

        // Add form-views.css link if not present
        if (!content.includes('form-views.css')) {
            content = content.replace(/<link rel="stylesheet" href="\/publico\/css\/layout\.css">/i,
                `<link rel="stylesheet" href="/publico/css/layout.css">\n    <link rel="stylesheet" href="/publico/css/form-views.css">`);
        }

        // Change input classes
        content = content.replace(/\bform-control\b/g, 'form-control-modern');
        content = content.replace(/\bform-select\b/g, 'form-control-modern form-select-modern');

        // Transform input-group with icon
        const inputGroupRegex = /<div class="input-group[^"]*">\s*<span class="input-group-text"[^>]*>\s*(<i class="[^"]+"><\/i>)\s*<\/span>\s*(<input[^>]+>|<select[^>]+>[\s\S]*?<\/select>|<textarea[^>]+>[\s\S]*?<\/textarea>)\s*<\/div>/gi;
        content = content.replace(inputGroupRegex, function (match, icon, inputTag) {
            let modernIcon = icon.replace('class="', 'class="input-icon ');
            return `<div class="input-wrapper has-icon">\n                                                    ${inputTag}\n                                                    ${modernIcon}\n                                                </div>`;
        });

        // Wrap label properly
        const labelWrapperRegex = /<label([^>]*)>(.*?)<\/label>\s*<div class="input-wrapper/gi;
        content = content.replace(labelWrapperRegex, `<div class="form-group-header">\n                                                <label$1>$2</label>\n                                            </div>\n                                            <div class="input-wrapper`);

        // Update button classes
        content = content.replace(/btn-primary-custom/g, 'btn-form-primary');
        content = content.replace(/btn-outline-secondary/g, 'btn-form btn-form-cancel');
        content = content.replace(/btn btn-primary/g, 'btn-form btn-form-primary');
        content = content.replace(/btn btn-secondary/g, 'btn-form btn-form-cancel');
        content = content.replace(/btn btn-danger/g, 'btn-form btn-form-cancel');

        // Change form headings and action wrappers
        content = content.replace(/<div class="form-header">\s*<h2>(.*?)<\/h2>\s*<\/div>/gi, '<div class="form-header-title" style="padding: 2rem 2rem 0; border-bottom: 1px solid var(--border-light); margin-bottom: 1.5rem;">$1</div>');
        content = content.replace(/<div class="form-actions">/g, '<div class="form-buttons">');

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Refactored ${mod}/${file}`);
    });
});
console.log('Form refactoring script completed.');

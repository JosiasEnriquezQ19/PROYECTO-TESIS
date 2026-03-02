const fs = require('fs');
const path = require('path');

function fixNavbar(filePath, pageTitleText, iconClass) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace navbar block
    const navbarRegex = /<nav class="navbar[^>]*>[\s\S]*?<\/nav>/;
    const newNavbar = `<nav class="navbar navbar-expand-lg navbar-top border-bottom">
                <div class="container-fluid">
                    <h5 class="page-title mb-0">
                        <i class="bi ${iconClass}"></i>
                        ${pageTitleText}
                    </h5>
                    <div class="user-profile ms-auto">
                        <span><%= typeof user !== 'undefined' && user && user.Nombres ? user.Nombres : 'Administrador' %></span>
                        <div class="user-avatar"><%= typeof user !== 'undefined' && user && user.Nombres ? user.Nombres.charAt(0) : 'A' %></div>
                    </div>
                </div>
            </nav>`;

    content = content.replace(navbarRegex, newNavbar);

    // Remove wrapper container if it exists
    content = content.replace(/<div class="container py-4">\s*(<div class="form-container">[\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<script/g, function (match, innerContent) {
        return innerContent + "\n        </div>\n    </div>\n    <script";
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${path.basename(filePath)}`);
}

fixNavbar(path.join(__dirname, 'src', 'vistas', 'clientes', 'crear.ejs'), 'Crear Cliente', 'bi-person-plus');
fixNavbar(path.join(__dirname, 'src', 'vistas', 'clientes', 'editar.ejs'), 'Editar Cliente', 'bi-person-gear');

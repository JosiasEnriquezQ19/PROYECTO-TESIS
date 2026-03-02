const fs = require('fs');
const path = require('path');

const vistasDir = path.join(__dirname, 'src', 'vistas');

function processDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDir(filePath);
        } else if (filePath.endsWith('.ejs')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // Regex to replace any form-header-title with style="..."
            const regex = /<div class="form-header-title"[^>]*style="[^"]*"[^>]*>/g;

            if (regex.test(content)) {
                console.log(`Fixing ${filePath}`);
                content = content.replace(regex, '<div class="form-header-title">');
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    }
}

processDir(vistasDir);
console.log('Done cleaning inline styles.');

const fs = require('fs');
const path = require('path');

function updateFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updateFiles(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const newVersion = Date.now();
            let newContent = content
                .replace(/\/publico\/css\/layout\.css(\?v=\d+)?/g, '/publico/css/layout.css?v=' + newVersion)
                .replace(/\/publico\/js\/layout\.js(\?v=\d+)?/g, '/publico/js/layout.js?v=' + newVersion)
                .replace(/\/publico\/css\/form-views\.css(\?v=\d+)?/g, '/publico/css/form-views.css?v=' + newVersion);

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated cache buster in ${fullPath}`);
            }
        }
    }
}

updateFiles(path.join(__dirname, 'src', 'vistas'));
console.log('Cache busting complete!');

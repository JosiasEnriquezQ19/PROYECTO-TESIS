/**
 * Script to update all EJS files to use centralized layout.css and layout.js
 * Removes duplicated sidebar CSS and adds links to centralized files
 */
const fs = require('fs');
const path = require('path');

const vistasDir = path.join(__dirname, 'src', 'vistas');

// Find all EJS files
function findEjsFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files = files.concat(findEjsFiles(fullPath));
        } else if (item.endsWith('.ejs') && item !== 'sidebar.ejs') {
            files.push(fullPath);
        }
    }
    return files;
}

const ejsFiles = findEjsFiles(vistasDir);

let updatedCount = 0;
let skippedCount = 0;

for (const file of ejsFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Skip files that don't include the sidebar
    if (!content.includes('include("../parciales/sidebar")') && !content.includes("include('../parciales/sidebar')")) {
        skippedCount++;
        continue;
    }

    // --- Step 1: Add layout.css link after bootstrap-icons if not already present ---
    if (!content.includes('/publico/css/layout.css')) {
        // Add after the google fonts link or after bootstrap-icons link
        const fontLink = content.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/);
        if (fontLink) {
            content = content.replace(
                fontLink[0],
                fontLink[0] + '\n    <link rel="stylesheet" href="/publico/css/layout.css">'
            );
        } else {
            const bsIconsLink = content.match(/<link[^>]*bootstrap-icons[^>]*>/);
            if (bsIconsLink) {
                content = content.replace(
                    bsIconsLink[0],
                    bsIconsLink[0] + '\n    <link rel="stylesheet" href="/publico/css/layout.css">'
                );
            }
        }
    }

    // --- Step 2: Add Inter font if using Montserrat ---
    if (content.includes('Montserrat') && !content.includes('family=Inter')) {
        content = content.replace(
            /(<link[^>]*Montserrat[^>]*>)/,
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
        );
    }

    // --- Step 3: Remove duplicated sidebar CSS from <style> blocks ---
    // Remove the common sidebar/toggle/main-content CSS patterns
    const patternsToRemove = [
        // Body font-family (will use layout.css)
        /\s*body\s*\{\s*\n?\s*font-family:\s*'Montserrat'[^}]*\}\s*/g,
        // sidebar, .main-content transition line
        /\s*\.sidebar,\s*\.main-content\s*\{[^}]*\}\s*/g,
        // toggle-sidebar-btn block
        /\s*\.toggle-sidebar-btn\s*\{[^}]*\}\s*/g,
        /\s*\.toggle-sidebar-btn:hover\s*\{[^}]*\}\s*/g,
        // sidebar.hide
        /\s*\.sidebar\.hide\s*\{[^}]*\}\s*/g,
        // main-content.full
        /\s*\.main-content\.full\s*\{[^}]*\}\s*/g,
        // media query for toggle-sidebar-btn
        /\s*@media\s*\(max-width:\s*768px\)\s*\{\s*\n?\s*\.toggle-sidebar-btn\s*\{[^}]*\}\s*\n?\s*\}\s*/g,
        // .sidebar block (the big one)
        /\s*\.sidebar\s*\{(?!\.)(?:[^{}]|\{[^{}]*\})*\}\s*/g,
        // .sidebar .sidebar-heading
        /\s*\.sidebar\s+\.sidebar-heading\s*\{[^}]*\}\s*/g,
        // .sidebar .company-slogan
        /\s*\.sidebar\s+\.company-slogan\s*\{[^}]*\}\s*/g,
        // .sidebar .menu-item
        /\s*\.sidebar\s+\.menu-item\s*\{[^}]*\}\s*/g,
        // .sidebar .menu-item:hover
        /\s*\.sidebar\s+\.menu-item:hover\s*\{[^}]*\}\s*/g,
        // .sidebar .menu-item.active
        /\s*\.sidebar\s+\.menu-item\.active\s*\{[^}]*\}\s*/g,
        // .sidebar .logout-item
        /\s*\.sidebar\s+\.logout-item\s*\{[^}]*\}\s*/g,
        // .sidebar .logout-item:hover
        /\s*\.sidebar\s+\.logout-item:hover\s*\{[^}]*\}\s*/g,
        // .main-content (standalone)
        /\s*\.main-content\s*\{\s*\n?\s*margin-left:\s*270px[^}]*\}\s*/g,
        // .user-profile
        /\s*\.user-profile\s*\{[^}]*\}\s*/g,
        // .user-avatar (but not .user-avatar-nav)
        /\s*\.user-avatar\s*\{[^}]*(?:linear-gradient|0056b3|003366)[^}]*\}\s*/g,
        // .navbar-top (legacy)
        /\s*\.navbar-top\s*\{[^}]*backdrop-filter[^}]*\}\s*/g,
    ];

    for (const pattern of patternsToRemove) {
        content = content.replace(pattern, '\n');
    }

    // --- Step 4: Replace old toggle button HTML with new one ---
    // Old: <button class="toggle-sidebar-btn" ...>
    content = content.replace(
        /\s*<button\s+class="toggle-sidebar-btn"[^>]*>\s*\n?\s*<i\s+class="bi\s+bi-(?:chevron-left|list)"[^>]*><\/i>\s*\n?\s*<\/button>/g,
        ''
    );

    // --- Step 5: Replace old navbar with new standardized one ---
    // We'll keep the existing navbar structure but fix the styling classes

    // --- Step 6: Add layout.js before closing </body> if not present ---
    if (!content.includes('/publico/js/layout.js')) {
        content = content.replace(
            '</body>',
            '    <script src="/publico/js/layout.js"></script>\n</body>'
        );
    }

    // --- Step 7: Remove duplicated sidebar toggle JS ---
    // Remove the standard toggle JS pattern
    content = content.replace(
        /\s*const toggleBtn\s*=\s*document\.getElementById\('toggleSidebarBtn'\);\s*\n\s*const sidebar\s*=\s*document\.getElementById\('sidebar'\);\s*\n\s*const mainContent\s*=\s*document\.getElementById\('main-content'\);\s*\n\s*const toggleIcon\s*=\s*document\.getElementById\('toggleIcon'\);\s*\n?\s*(const menuItems[^;]*;\s*\n?)?\s*\n?\s*toggleBtn\.addEventListener\('click'[^}]*\{[^}]*\{[^}]*\}[^}]*\{[^}]*\}[^}]*\}\);\s*/g,
        ''
    );

    // Remove menuItem click handlers
    content = content.replace(
        /\s*menuItems\.forEach\(item\s*=>\s*\{[^}]*forEach[^}]*\}[^}]*\}\);\s*/g,
        ''
    );

    // Clean up empty event listeners
    content = content.replace(
        /\s*document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*\n?\s*\}\);\s*/g,
        ''
    );

    // Clean up multiple consecutive blank lines
    content = content.replace(/\n{4,}/g, '\n\n');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf-8');
        updatedCount++;
        console.log('Updated:', path.relative(__dirname, file));
    } else {
        skippedCount++;
        console.log('No changes:', path.relative(__dirname, file));
    }
}

console.log(`\nDone! Updated: ${updatedCount}, Skipped: ${skippedCount}`);

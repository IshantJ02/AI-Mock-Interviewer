const fs = require('fs');
const path = require('path');

const COLOR_MAP = {
    '#faf8f4': 'var(--bg)',
    '#eaddcd': 'var(--bg)',
    '#f5f1ea': 'var(--surface)',
    '#dfcec1': 'var(--surface)',
    '#f0ece4': 'var(--surface)',
    '#e8e3da': 'var(--surface-2)',
    '#fffdf8': 'var(--paper)',
    '#f4ebd8': 'var(--paper)',
    '#ffffff': 'var(--paper)',
    '#fefcf5': 'var(--paper-cream)',
    '#fbf9f2': 'var(--paper-cream)',
    '#eee3cb': 'var(--paper-cream)',
    '#e0dbd2': 'var(--border)',
    '#d4cec3': 'var(--border)',
    '#c4bbae': 'var(--border-warm)',
    '#2d2926': 'var(--text-primary)',
    '#1a1816': 'var(--text-primary)',
    '#5c5650': 'var(--text-secondary)',
    '#4a443e': 'var(--text-secondary)',
    '#9e9790': 'var(--text-muted)',
    '#7a726b': 'var(--text-muted)',
    '#b8b2aa': 'var(--text-light)',
    '#918a82': 'var(--text-light)',
    '#7c9a6e': 'var(--accent)',
    '#5a7b4c': 'var(--accent)',
    '#d4a574': 'var(--warm)',
    '#b88655': 'var(--warm)',
    '#c0544f': 'var(--danger)',
    '#a53f3a': 'var(--danger)'
};

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const [hex, variable] of Object.entries(COLOR_MAP)) {
                // regex that matches the hex ignoring case
                const regex = new RegExp(hex, 'ig');
                if (regex.test(content)) {
                    content = content.replace(regex, variable);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDirectory('frontend/src');

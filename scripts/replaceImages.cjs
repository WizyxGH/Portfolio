const fs = require('fs');
const path = require('path');

function getRelativePath(fromFile, toPath) {
    const fromDir = path.dirname(fromFile);
    let rel = path.relative(fromDir, toPath).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.astro')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let hasChanges = false;
            let importsToAdd = [];
            
            // Match <img src="/assets/media/..." ...>
            const imgRegex = /<img\s+([^>]*)src=\"\/assets\/media\/([^\"]+)\"([^>]*)>/g;
            let match;
            let newContent = content;
            
            while ((match = imgRegex.exec(content)) !== null) {
                const fullMatch = match[0];
                const preAttrs = match[1];
                const imagePath = match[2];
                const postAttrs = match[3];
                
                // Exclude svg and videos
                if (imagePath.endsWith('.svg') || imagePath.endsWith('.webm') || imagePath.endsWith('.mp4')) continue;
                
                const varName = 'img' + Math.random().toString(36).substring(7);
                const absTargetPath = path.join(process.cwd(), 'src', 'assets', 'media', decodeURIComponent(imagePath));
                
                if (!fs.existsSync(absTargetPath)) {
                    console.log('Not found:', absTargetPath);
                    continue;
                }
                
                const relPath = getRelativePath(fullPath, absTargetPath);
                importsToAdd.push(`import ${varName} from '${relPath}';`);
                
                const newImg = `<Image ${preAttrs}src={${varName}}${postAttrs} />`;
                newContent = newContent.replace(fullMatch, newImg);
                hasChanges = true;
            }
            
            if (hasChanges) {
                if (!newContent.includes('import { Image }')) {
                    importsToAdd.unshift("import { Image } from 'astro:assets';");
                }
                
                // Add imports after ---
                if (newContent.includes('---')) {
                    newContent = newContent.replace('---', '---\n' + importsToAdd.join('\n'));
                } else {
                    newContent = '---\n' + importsToAdd.join('\n') + '\n---\n' + newContent;
                }
                
                fs.writeFileSync(fullPath, newContent, 'utf-8');
                console.log('Updated:', fullPath);
            }
        }
    }
}

processDirectory(path.join(process.cwd(), 'src'));

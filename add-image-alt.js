import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/content/projects';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let updated = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('image_alt:')) {
        const titleMatch = content.match(/title:\s*"(.*?)"/);
        const typeMatch = content.match(/type:\s*"(.*?)"/);
        
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
        const type = typeMatch ? typeMatch[1].toLowerCase() : 'projet';
        
        const altText = `Aperçu du ${type} pour ${title}`;
        
        if (content.includes('image:')) {
            content = content.replace(/(image:.*?\r?\n)/, `$1image_alt: "${altText}"\n`);
        } else {
            content = content.replace(/(title:.*?\r?\n)/, `$1image_alt: "${altText}"\n`);
        }
        
        fs.writeFileSync(filePath, content);
        updated++;
    }
}

console.log(`Updated ${updated} files with image_alt.`);

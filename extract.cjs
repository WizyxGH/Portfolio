const fs = require('fs');
const content = fs.readFileSync('src/pages/services/ui-ux.astro', 'utf8');
const lines = content.split('\n');

function extract(startStr, endStr, output) {
    const start = lines.findIndex(l => l.includes(startStr));
    const end = lines.findIndex(l => l.includes(endStr));
    if (start !== -1 && end !== -1) {
        let snippet = lines.slice(start, end).join('\n');
        fs.writeFileSync(output, '---\n---\n' + snippet);
        console.log(`Extracted ${output}`);
    } else {
        console.log(`Could not find ${startStr} or ${endStr}`);
    }
}

extract('<!-- 4. LA MÉTHODE', '<!-- 5. TARIFICATION', 'src/components/services/ui-ux/Process.astro');
extract('<!-- 5. TARIFICATION', '<!-- 6. TEMOIGNAGES', 'src/components/services/ui-ux/Pricing.astro');
extract('<!-- 6. TEMOIGNAGES', '<!-- 7. FAQ', 'src/components/services/ui-ux/Testimonials.astro');
extract('<!-- 7. FAQ', '<!-- 8. FINAL CTA', 'src/components/services/ui-ux/FAQ.astro');
extract('<!-- 8. FINAL CTA', '</main>', 'src/components/services/ui-ux/CTA.astro');

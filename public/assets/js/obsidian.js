/**
 * Obsidian Markdown Parser
 * Ce script est conçu pour ajouter le support de la syntaxe Obsidian (Surlignage, Callouts, Task lists)
 * qui n'est pas gérée nativement par le processeur Markdown (comme GFM/Kramdown).
 * Il s'applique de manière fluide et modulaire sur le contenu principal (ex: .prose).
 */

class ObsidianParser {
    static init() {
        const containers = document.querySelectorAll('.prose');
        if (!containers.length) return;

        containers.forEach(container => {
            ObsidianParser.parseHighlights(container);
            ObsidianParser.parseCallouts(container);
            ObsidianParser.parseTaskLists(container);
        });
    }

    /**
     * Remplace `==texte==` par `<mark>texte</mark>`
     * Utilise une itération sur les TextNodes pour éviter de casser le HTML existant.
     */
    static parseHighlights(container) {
        const regex = /==(.*?)==/g;

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (regex.test(node.textContent)) {
                    const span = document.createElement('span');
                    span.innerHTML = node.textContent.replace(regex, '<mark>$1</mark>');
                    while(span.firstChild) {
                        node.parentNode.insertBefore(span.firstChild, node);
                    }
                    node.parentNode.removeChild(node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Ignore les blocs de code où l'on veut conserver '=='
                if (['CODE', 'PRE', 'SCRIPT', 'STYLE'].includes(node.tagName)) return;
                Array.from(node.childNodes).forEach(processNode);
            }
        }

        processNode(container);
    }

    /**
     * Transforme les blockquotes Obsidian en Callouts graphiques.
     * `> [!info] Titre` -> `.callout.callout-info`
     */
    static parseCallouts(container) {
        container.querySelectorAll('blockquote').forEach(bq => {
            const firstP = bq.querySelector('p');
            // Si pas de <p>, on vérifie le contenu texte du blockquote entier
            const targetEl = firstP || bq;
            
            const html = targetEl.innerHTML;
            const match = html.match(/^\s*\[\!(\w+)\]([\+\-])?\s*([^\n<]*)?(?:<br>|\n)?/i);
            
            if (match) {
                const type = match[1].toLowerCase();
                const foldable = match[2]; // '+' or '-' ou undefined
                let title = match[3] ? match[3].trim() : type;
                
                // Nettoie le tag du contenu
                targetEl.innerHTML = html.replace(match[0], '');
                
                // Crée le nouveau conteneur Callout (details si dépliable, div sinon)
                const isDetails = foldable !== undefined;
                const callout = document.createElement(isDetails ? 'details' : 'div');
                callout.className = `callout callout-${type}`;
                if (foldable === '+') callout.open = true;
                
                // Définit l'icône selon le type précis issu de Obsidian
                let iconClass = 'bx bx-notepad'; // Default
                if (['note'].includes(type)) iconClass = 'bx bx-pencil';
                else if (['abstract', 'summary', 'tldr'].includes(type)) iconClass = 'bx bx-detail';
                else if (['info'].includes(type)) iconClass = 'bx bx-info-circle';
                else if (['todo'].includes(type)) iconClass = 'bx bx-check-circle';
                else if (['tip', 'hint', 'important'].includes(type)) iconClass = 'bx bxs-flame';
                else if (['success', 'check', 'done'].includes(type)) iconClass = 'bx bx-check';
                else if (['question', 'faq', 'help'].includes(type)) iconClass = 'bx bx-help-circle';
                else if (['warning', 'caution', 'attention'].includes(type)) iconClass = 'bx bx-error';
                else if (['failure', 'fail', 'missing'].includes(type)) iconClass = 'bx bx-x-circle';
                else if (['danger', 'error'].includes(type)) iconClass = 'bx bxs-zap';
                else if (['bug'].includes(type)) iconClass = 'bx bx-bug';
                else if (['example'].includes(type)) iconClass = 'bx bx-list-ol';
                else if (['quote', 'cite'].includes(type)) iconClass = 'bx bxs-quote-left';
                
                // En-tête du Callout
                const titleEl = document.createElement(isDetails ? 'summary' : 'div');
                titleEl.className = 'callout-title';
                
                if (isDetails) {
                    titleEl.style.cursor = 'pointer';
                    // Le chevron rotatif est placé directement à côté du titre (sans flex: 1)
                    let foldHtml = `<i class="bx bx-chevron-right transition-transform duration-200 fold-icon text-[1.4em]"></i>`;
                    titleEl.innerHTML = `<i class="${iconClass} text-[1.2em]"></i><span>${title}</span>${foldHtml}`;
                } else {
                    titleEl.innerHTML = `<i class="${iconClass} text-[1.2em]"></i><span>${title}</span>`;
                }
                
                // Contenu du callout
                const contentEl = document.createElement('div');
                contentEl.className = 'callout-content';
                
                // Déplace tous les enfants du blockquote d'origine dans le contenu
                while (bq.firstChild) {
                    contentEl.appendChild(bq.firstChild);
                }
                
                callout.appendChild(titleEl);
                callout.appendChild(contentEl);
                
                bq.parentNode.replaceChild(callout, bq);
            }
        });
    }

    /**
     * Parse les Task lists `- [ ]` ou `- [x]` si elles n'ont pas été rendues par Jekyll
     */
    static parseTaskLists(container) {
        container.querySelectorAll('li').forEach(li => {
            // Regex pour vérifier si le début du LI contient [ ] ou [x] éventuellement enfermé dans un <p>
            const taskRegex = /^\s*(?:<p>)?\[([ xX])\]\s/;
            if (taskRegex.test(li.innerHTML)) {
                const match = li.innerHTML.match(taskRegex);
                const isChecked = match[1].toLowerCase() === 'x';
                
                // Nettoie le code pour ne garder que le contenu de la tâche
                li.innerHTML = li.innerHTML.replace(taskRegex, match[0].includes('<p>') ? '<p>' : '');
                
                li.classList.add('task-list-item');
                
                // Crée la vraie Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-list-item-checkbox';
                checkbox.checked = isChecked;
                checkbox.disabled = true; 
                
                // L'insère correctement
                const p = li.querySelector('p');
                if (p) {
                    p.insertBefore(checkbox, p.firstChild);
                } else {
                    li.insertBefore(checkbox, li.firstChild);
                }
                
                // Indique au parent (UL) qu'il s'agit d'une liste de tâches
                if (li.parentNode && li.parentNode.tagName === 'UL') {
                    li.parentNode.classList.add('contains-task-list');
                }
            }
        });
    }
}

// Lancement automatique du parseur
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ObsidianParser.init);
} else {
    ObsidianParser.init();
}

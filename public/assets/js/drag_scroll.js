/**
 * Drag-to-scroll
 * Applique le drag-to-scroll sur tous les éléments portant l'attribut [data-drag-scroll].
 * Le scroll est appliqué sur l'élément parent (le conteneur scrollable).
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-drag-scroll]').forEach(el => {
        let isDown = false;
        let startX;
        let scrollLeft;

        el.addEventListener('mousedown', (e) => {
            isDown = true;
            el.style.cursor = 'grabbing';
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.parentElement.scrollLeft;
        });

        el.addEventListener('mouseleave', () => {
            isDown = false;
            el.style.cursor = 'grab';
        });

        el.addEventListener('mouseup', () => {
            isDown = false;
            el.style.cursor = 'grab';
        });

        el.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 2; // Multiplicateur de vitesse
            el.parentElement.scrollLeft = scrollLeft - walk;
        });
    });
});

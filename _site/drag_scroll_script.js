
<script>
        // Drag-to-scroll functionality for projects carousel
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        let isDown = false;
    let startX;
    let scrollLeft;

            projectsGrid.addEventListener('mousedown', (e) => {
        isDown = true;
    projectsGrid.style.cursor = 'grabbing';
    startX = e.pageX - projectsGrid.offsetLeft;
    scrollLeft = projectsGrid.parentElement.scrollLeft;
            });

            projectsGrid.addEventListener('mouseleave', () => {
        isDown = false;
    projectsGrid.style.cursor = 'grab';
            });

            projectsGrid.addEventListener('mouseup', () => {
        isDown = false;
    projectsGrid.style.cursor = 'grab';
            });

            projectsGrid.addEventListener('mousemove', (e) => {
                if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - projectsGrid.offsetLeft;
    const walk = (x - startX) * 2;
    projectsGrid.parentElement.scrollLeft = scrollLeft - walk;
            });
        }
</script>

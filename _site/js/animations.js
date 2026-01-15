
// Animation on scroll
document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
        // Add a small stagger effect based on index if needed, or just observe
        // Using a simple timeout or just observing directly
        observer.observe(el);
    });
});

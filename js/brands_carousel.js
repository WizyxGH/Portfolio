/**
 * Brand Carousel - Infinite Scroll
 * Automatically duplicates brand logos for seamless infinite scrolling animation
 * Uses exactly 1 duplicate set for perfect -50% translateX loop (no teleportation)
 */

document.addEventListener('DOMContentLoaded', function () {
    const brandsScroll = document.querySelector('.brands-scroll');

    if (!brandsScroll) return;

    // Get all original brand links
    const originalBrands = Array.from(brandsScroll.children);

    // Create exactly 1 duplicate set for perfect -50% translateX seamless loop
    // This is the ONLY way to eliminate teleportation completely
    originalBrands.forEach(brand => {
        const clone = brand.cloneNode(true);
        brandsScroll.appendChild(clone);
    });
});

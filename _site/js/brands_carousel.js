/**
 * Brand Carousel - Infinite Scroll
 * Creates 3 duplicate sets for a track that is 4x the original length.
 * Animation goes to -25% (= 1 original set) for a perfectly seamless loop
 * with no visible reset even on narrow mobile screens.
 */

document.addEventListener('DOMContentLoaded', function () {
    const brandsScroll = document.querySelector('.brands-scroll');

    if (!brandsScroll) return;

    // Get all original brand links
    const originalBrands = Array.from(brandsScroll.children);

    // Create 3 duplicate sets so the track is 4x the original length.
    // The animation translates by -25% (= 1 original set width), which is
    // invisible at the loop point because the next set is identical.
    for (let i = 0; i < 3; i++) {
        originalBrands.forEach(brand => {
            const clone = brand.cloneNode(true);
            brandsScroll.appendChild(clone);
        });
    }
});

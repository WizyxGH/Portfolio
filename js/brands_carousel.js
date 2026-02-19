/**
 * Brand Carousel - Seamless Infinite Scroll
 * Uses requestAnimationFrame to move pixel-by-pixel — zero teleportation.
 * Creates exactly 1 clone set. When position reaches the width of 1 original
 * set, it subtracts that width (invisible since clone = original).
 */

document.addEventListener('DOMContentLoaded', function () {
    const brandsScroll = document.querySelector('.brands-scroll');
    if (!brandsScroll) return;

    // Build exactly 1 clone set
    const originalBrands = Array.from(brandsScroll.children);
    originalBrands.forEach(function (brand) {
        brandsScroll.appendChild(brand.cloneNode(true));
    });

    function getSpeed() {
        return window.innerWidth <= 1024 ? 24 : 20;
    }

    var position = 0;
    var lastTime = null;
    var halfWidth = 0;
    var paused = false;

    function updateHalfWidth() {
        halfWidth = brandsScroll.scrollWidth / 2;
    }

    brandsScroll.addEventListener('mouseenter', function () { paused = true; });
    brandsScroll.addEventListener('mouseleave', function () { paused = false; });
    window.addEventListener('resize', updateHalfWidth);

    // Wait one frame so layout is computed before measuring
    requestAnimationFrame(function () {
        updateHalfWidth();

        function animate(timestamp) {
            if (lastTime !== null && !paused) {
                var delta = (timestamp - lastTime) / 1000; // seconds
                position += getSpeed() * delta;
                // Mathematical reset: visually identical because clone === original
                if (halfWidth > 0 && position >= halfWidth) {
                    position -= halfWidth;
                }
                brandsScroll.style.transform = 'translateX(-' + position + 'px)';
            }
            lastTime = timestamp;
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    });
});

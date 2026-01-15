(function (global) {
    function encodePathSegments(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
    }

    function extractFileName(src) {
        if (!src) return "";
        const parts = src.split("/").filter(Boolean);
        if (!parts.length) return "";
        const raw = parts[parts.length - 1].split(/[?#]/)[0];
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }

    function initProjectCarousel(config) {
        const {
            images = [],
            projectTitle = "",
            containerId = "projectCarousel",
            trackSelector = ".carousel-track",
            prevBtnId = "prevBtn",
            nextBtnId = "nextBtn",
            dotsId = "carouselDots",
            currentSlideId = "currentSlide",
            totalSlidesId = "totalSlides"
        } = config;

        const container = document.getElementById(containerId);
        if (!container) return;

        const carouselEls = {
            container: container,
            track: container.querySelector(trackSelector),
            prev: document.getElementById(prevBtnId),
            next: document.getElementById(nextBtnId),
            dots: document.getElementById(dotsId),
            currentSlide: document.getElementById(currentSlideId),
            totalSlides: document.getElementById(totalSlidesId)
        };

        const NAV_BTN_CLASS = "absolute top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md text-[#111] dark:text-white transition z-30 transform hover:scale-110";
        const DOT_CLASS = "rounded-full transition-all duration-300 w-3 h-3 block flex-shrink-0 bg-[#411FEB]/30 hover:bg-[#411FEB]/50 focus:outline-none p-0 border-0";
        const DOT_ACTIVE_CLASS = "rounded-full transition-all duration-300 w-3 h-3 block flex-shrink-0 bg-[#411FEB] focus:outline-none scale-125 p-0 border-0";

        let activeGalleryImages = (images || []).filter(Boolean);
        let currentSlideIndex = 0;

        // Fullscreen vars
        let fullscreenOverlay = null;
        let fullscreenImage = null;
        let fullscreenZoomed = false;
        let fullscreenPanX = 0;
        let fullscreenPanY = 0;
        let fullscreenPointerId = null;
        let fullscreenDragStart = null;
        let overlaySwipeConsumed = false;

        // Touch/Swipe vars
        let touchStartX = null;
        let touchStartY = null;
        let pointerStartX = null;
        let pointerStartY = null;
        const swipeThreshold = 40;
        const wheelThreshold = 25;
        const wheelDebounceMs = 220;
        let lastWheelTs = 0;



        // --- Fullscreen Logic ---
        function ensureFullscreenOverlay() {
            if (fullscreenOverlay && fullscreenImage) return;

            fullscreenOverlay = document.createElement("div");
            fullscreenOverlay.id = "modalImageFullscreen";
            fullscreenOverlay.className = "fixed inset-0 w-screen h-screen flex items-center justify-center px-4 z-[100000] hidden backdrop-blur-sm";
            fullscreenOverlay.style.zIndex = "100000";
            fullscreenOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
            fullscreenOverlay.setAttribute("aria-hidden", "true");

            fullscreenOverlay.addEventListener("click", (e) => {
                if (overlaySwipeConsumed) {
                    overlaySwipeConsumed = false;
                    e.stopPropagation();
                    return;
                }
                closeFullscreenImage();
            });

            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "text-white text-2xl hover:scale-110 transition flex items-center justify-center w-10 h-10 rounded-full";
            closeBtn.style.position = "absolute";
            closeBtn.style.top = "20px";
            closeBtn.style.right = "20px";
            closeBtn.style.zIndex = "100001";
            closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            closeBtn.style.backdropFilter = "blur(6px)";
            closeBtn.innerHTML = "<i class='bx bx-x'></i>";
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeFullscreenImage();
            });

            fullscreenImage = document.createElement("img");
            fullscreenImage.className = "max-h-[90vh] max-w-[90vw] object-contain shadow-2xl";
            fullscreenImage.alt = "";
            fullscreenImage.draggable = false;
            fullscreenImage.style.userSelect = "none";
            fullscreenImage.style.cursor = "zoom-in";
            fullscreenImage.addEventListener("click", (e) => e.stopPropagation());
            fullscreenImage.addEventListener("dblclick", (e) => {
                e.preventDefault();
                toggleFullscreenZoom(e);
            });
            fullscreenImage.addEventListener("pointerdown", onFullscreenPointerDown);
            fullscreenImage.addEventListener("pointermove", onFullscreenPointerMove);
            fullscreenImage.addEventListener("pointerup", endFullscreenPointer);
            fullscreenImage.addEventListener("pointercancel", endFullscreenPointer);
            fullscreenImage.addEventListener("pointerleave", endFullscreenPointer);

            fullscreenOverlay.appendChild(fullscreenImage);
            fullscreenOverlay.appendChild(closeBtn);
            document.body.appendChild(fullscreenOverlay);
            attachSwipeHandlers(fullscreenOverlay);
        }

        function openFullscreenImage(src, alt) {
            if (!src) return;
            ensureFullscreenOverlay();
            resetFullscreenZoom();
            fullscreenImage.src = src;
            fullscreenImage.alt = alt || "";
            fullscreenOverlay.classList.remove("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "false");
            overlaySwipeConsumed = false;
            document.body.classList.add("overflow-hidden");
        }

        function closeFullscreenImage() {
            if (!fullscreenOverlay || !fullscreenImage) return;
            fullscreenOverlay.classList.add("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "true");
            fullscreenImage.src = "";
            overlaySwipeConsumed = false;
            resetFullscreenZoom();
            document.body.classList.remove("overflow-hidden");
        }

        function resetFullscreenZoom() {
            fullscreenZoomed = false;
            fullscreenPanX = 0;
            fullscreenPanY = 0;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenImage) return;
            fullscreenImage.style.transformOrigin = "center center";
            fullscreenImage.style.transform = "translate(0px, 0px) scale(1)";
            fullscreenImage.style.cursor = "zoom-in";
        }

        function applyFullscreenTransform() {
            if (!fullscreenImage) return;
            const scale = fullscreenZoomed ? 2 : 1;
            fullscreenImage.style.transform = `translate(${fullscreenPanX}px, ${fullscreenPanY}px) scale(${scale})`;
        }

        function toggleFullscreenZoom(event) {
            if (!fullscreenImage) return;
            if (!fullscreenZoomed) {
                const rect = fullscreenImage.getBoundingClientRect();
                const originX = ((event?.clientX ?? rect.left + rect.width / 2) - rect.left) / rect.width * 100;
                const originY = ((event?.clientY ?? rect.top + rect.height / 2) - rect.top) / rect.height * 100;
                fullscreenImage.style.transformOrigin = `${originX}% ${originY}%`;
                fullscreenZoomed = true;
                fullscreenPanX = 0;
                fullscreenPanY = 0;
                fullscreenImage.style.cursor = "grab";
                applyFullscreenTransform();
                return;
            }
            resetFullscreenZoom();
        }

        function onFullscreenPointerDown(e) {
            if (!fullscreenZoomed || e.button !== 0) return;
            fullscreenPointerId = e.pointerId;
            fullscreenDragStart = { x: e.clientX, y: e.clientY, panX: fullscreenPanX, panY: fullscreenPanY };
            fullscreenImage?.setPointerCapture(fullscreenPointerId);
            fullscreenImage.style.cursor = "grabbing";
        }

        function onFullscreenPointerMove(e) {
            if (!fullscreenZoomed || fullscreenPointerId !== e.pointerId || !fullscreenDragStart) return;
            const dx = e.clientX - fullscreenDragStart.x;
            const dy = e.clientY - fullscreenDragStart.y;
            fullscreenPanX = fullscreenDragStart.panX + dx;
            fullscreenPanY = fullscreenDragStart.panY + dy;
            applyFullscreenTransform();
        }

        function endFullscreenPointer(e) {
            if (fullscreenPointerId === null || e.pointerId !== fullscreenPointerId) return;
            fullscreenPointerId = null;
            fullscreenDragStart = null;
            if (!fullscreenImage) return;
            fullscreenImage.releasePointerCapture?.(e.pointerId);
            fullscreenImage.style.cursor = fullscreenZoomed ? "grab" : "zoom-in";
        }

        function refreshFullscreenImage() {
            if (!fullscreenOverlay || !fullscreenImage || fullscreenOverlay.classList.contains("hidden")) return;
            const src = activeGalleryImages[currentSlideIndex];
            if (!src) return;
            resetFullscreenZoom();
            fullscreenImage.src = src;
            fullscreenImage.alt = projectTitle
                ? `${projectTitle} - visuel ${currentSlideIndex + 1}`
                : "";
        }

        // --- Carousel Rendering & Nav ---
        function renderCarousel() {
            if (!carouselEls.track) return;

            carouselEls.track.innerHTML = "";
            activeGalleryImages = (images || []).filter(Boolean);

            carouselEls.track.style.transform = "translateX(0%)";
            const totalSlides = activeGalleryImages.length || 1;
            carouselEls.track.style.width = `${totalSlides * 100}%`;
            carouselEls.track.style.height = "100%";

            if (carouselEls.prev) carouselEls.prev.className = `${NAV_BTN_CLASS} left-3`;
            if (carouselEls.next) carouselEls.next.className = `${NAV_BTN_CLASS} right-3`;

            if (!activeGalleryImages.length) return; // Should handle empty state?

            activeGalleryImages.forEach((src, idx) => {
                const slide = document.createElement("div");
                slide.className = "flex-none h-full flex items-center justify-center bg-black overflow-hidden relative";
                // Force correct width for slide
                slide.style.width = `${100 / totalSlides}%`;
                slide.style.flex = `0 0 ${100 / totalSlides}%`;

                const img = document.createElement("img");
                img.dataset.src = src;
                const fileName = extractFileName(src);
                img.alt = fileName ? `${projectTitle} - ${fileName}` : `${projectTitle} - visuel ${idx + 1}`;

                // Styling exact matches from user provided code, adjusted for container
                img.className = "h-full object-contain opacity-0 transition-opacity duration-300 cursor-pointer";
                img.draggable = false;
                img.style.userSelect = "none";

                img.addEventListener("load", () => {
                    img.classList.remove("opacity-0");
                });

                // Check if already complete (cached)
                if (img.complete && img.naturalHeight !== 0) {
                    img.classList.remove("opacity-0");
                }

                if (idx === 0) {
                    img.src = src;
                }

                img.addEventListener("click", () => {
                    const srcToShow = img.src || img.dataset.src || "";
                    if (srcToShow) openFullscreenImage(srcToShow, img.alt);
                });

                slide.appendChild(img);
                carouselEls.track.appendChild(slide);
            });

            renderDots(totalSlides);
            updateCarouselUI();
        }

        function renderDots(total) {
            if (!carouselEls.dots) return;
            carouselEls.dots.innerHTML = "";
            if (total <= 1) {
                carouselEls.dots.style.display = 'none';
                return;
            }
            carouselEls.dots.style.display = 'flex';

            const MAX_DOTS = 8;
            const windowSize = Math.min(total, MAX_DOTS);
            let start = Math.max(0, currentSlideIndex - Math.floor(windowSize / 2));
            let end = start + windowSize - 1;
            if (end >= total) {
                end = total - 1;
                start = Math.max(0, end - windowSize + 1);
            }

            for (let i = start; i <= end; i++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = i === currentSlideIndex ? DOT_ACTIVE_CLASS : DOT_CLASS;
                btn.ariaLabel = `Voir image ${i + 1}`;
                // Force dimensions inline to ensure visibility
                btn.style.width = "12px";
                btn.style.height = "12px";
                btn.style.display = "block";
                btn.style.padding = "0";
                btn.style.border = "none";

                // Force colors inline because Tailwind class parsing might be failing for these
                const isActive = (i === currentSlideIndex);
                btn.style.backgroundColor = "#411FEB";
                btn.style.opacity = isActive ? "1" : "0.3";

                btn.addEventListener("click", () => goToSlide(i));
                carouselEls.dots.appendChild(btn);
            }
        }

        function updateCarouselUI() {
            if (!carouselEls.track) return;
            const total = activeGalleryImages.length;
            const offset = total > 0 ? -(currentSlideIndex * (100 / total)) : 0;
            carouselEls.track.style.transform = `translateX(${offset}%)`;

            // Counter
            if (carouselEls.currentSlide && carouselEls.totalSlides) {
                carouselEls.currentSlide.textContent = currentSlideIndex + 1;
                carouselEls.totalSlides.textContent = total;
            }

            renderDots(total);

            // Hide buttons if need be
            if (carouselEls.prev && carouselEls.next) {
                if (total <= 1) {
                    carouselEls.prev.style.display = 'none';
                    carouselEls.next.style.display = 'none';
                } else {
                    carouselEls.prev.style.display = currentSlideIndex === 0 ? 'none' : 'flex';
                    carouselEls.next.style.display = currentSlideIndex === total - 1 ? 'none' : 'flex';
                }
            }
        }

        function preloadSlide(index) {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;
            const normalized = ((index % total) + total) % total;
            const img = slides[normalized]?.querySelector("img");
            if (!img) return;
            if (img.getAttribute("src")) return;
            const srcToLoad = img.dataset.src;
            if (srcToLoad) img.src = srcToLoad;
        }

        function goToSlide(index) {
            if (!activeGalleryImages.length) return;
            const total = activeGalleryImages.length;
            let target = index;

            // Disable wrapping: stop at edges
            if (target < 0 || target >= total) return;

            currentSlideIndex = target;
            preloadSlide(target);
            preloadSlide(target + 1);
            preloadSlide(target - 1); // preload prev as well (wrapping handled by modulo in preloadSlide)
            updateCarouselUI();
            refreshFullscreenImage();
        }

        // --- Swipe / Inputs ---
        function processSwipe(dx, dy, sourceEl) {
            if (!activeGalleryImages.length) return;
            if (Math.abs(dx) <= Math.abs(dy)) return;
            if (Math.abs(dx) < swipeThreshold) return;
            if (dx < 0) {
                goToSlide(currentSlideIndex + 1);
            } else {
                goToSlide(currentSlideIndex - 1);
            }
            if (sourceEl === fullscreenOverlay) overlaySwipeConsumed = true;
        }

        function attachSwipeHandlers(element) {
            if (!element) return;

            element.addEventListener("touchstart", (e) => {
                if (!e.touches?.length) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            element.addEventListener("touchmove", (e) => {
                if (touchStartX === null || touchStartY === null || !e.touches?.length) return;
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
                    e.preventDefault();
                }
            }, { passive: false });

            element.addEventListener("touchend", (e) => {
                if (touchStartX === null || touchStartY === null) return;
                const touch = e.changedTouches?.[0];
                if (!touch) {
                    touchStartX = touchStartY = null;
                    return;
                }
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                touchStartX = touchStartY = null;
                processSwipe(dx, dy, e.currentTarget);
            });

            const resetPointer = () => {
                pointerStartX = null;
                pointerStartY = null;
            };

            element.addEventListener("pointerdown", (e) => {
                if (!e.isPrimary || e.button !== 0) return;
                pointerStartX = e.clientX;
                pointerStartY = e.clientY;
            });

            element.addEventListener("pointermove", (e) => {
                if (pointerStartX === null || pointerStartY === null) return;
                const dx = e.clientX - pointerStartX;
                const dy = e.clientY - pointerStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
                    e.preventDefault();
                }
            });

            const handlePointerEnd = (e) => {
                if (pointerStartX === null || pointerStartY === null) return resetPointer();
                const dx = e.clientX - pointerStartX;
                const dy = e.clientY - pointerStartY;
                resetPointer();
                processSwipe(dx, dy, e.currentTarget);
            };

            element.addEventListener("pointerup", handlePointerEnd);
            element.addEventListener("pointerleave", handlePointerEnd);

            element.addEventListener("wheel", (e) => {
                const now = Date.now();
                if (now - lastWheelTs < wheelDebounceMs) return;
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                if (Math.abs(e.deltaX) < wheelThreshold) return;
                lastWheelTs = now;
                e.preventDefault();
                if (e.deltaX > 0) {
                    goToSlide(currentSlideIndex + 1);
                } else {
                    goToSlide(currentSlideIndex - 1);
                }
            }, { passive: false });
        }

        // --- Init ---
        renderCarousel();

        // Bind events
        if (carouselEls.prev) carouselEls.prev.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
        if (carouselEls.next) carouselEls.next.addEventListener('click', () => goToSlide(currentSlideIndex + 1));

        attachSwipeHandlers(carouselEls.track);

        document.addEventListener("keydown", (e) => {
            // Only capture if not focused in inputs
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

            // Check if fullscreen is open
            if (fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden")) {
                if (e.key === "ArrowLeft") { e.preventDefault(); goToSlide(currentSlideIndex - 1); }
                if (e.key === "ArrowRight") { e.preventDefault(); goToSlide(currentSlideIndex + 1); }
                if (e.key === "Escape") closeFullscreenImage();
                return;
            }

            // Otherwise check if element is visible on screen approximately?
            // Actually for project page, it's the main focus, so reasonable to capture arrows always
            // unless we scroll out of view? Let's keep it simple.
            if (e.key === "ArrowLeft") { e.preventDefault(); goToSlide(currentSlideIndex - 1); }
            if (e.key === "ArrowRight") { e.preventDefault(); goToSlide(currentSlideIndex + 1); }
        });

        // Initialize first slide preload
        preloadSlide(0);
        preloadSlide(1);

        return {
            destroy: () => {
                // cleanup if needed
            }
        };
    }

    global.ProjectCarousel = { init: initProjectCarousel };

})(window);

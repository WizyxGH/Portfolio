(function (global) {
    function encodePathSegments(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
    }

    function normalizeKey(str) {
        return (str || "")
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function initProjectModal(options = {}) {
        const carouselEls = options.carouselEls || {};
        const modalEls = {
            modal: document.getElementById("modal"),
            title: document.getElementById("modalTitle"),
            meta: document.getElementById("modalMeta"),
            text: document.getElementById("modalText"),
            website: document.getElementById("modalWebsite"),
            tags: document.getElementById("modalTags"),
        };

        // Retire le bouton obsolète s'il existe encore dans le DOM
        document.getElementById("modalButton")?.remove();

        let activeGalleryImages = [];
        let currentSlideIndex = 0;
        let resultsManifestPromise = null;
        let fullscreenOverlay = null;
        let fullscreenImage = null;
        let touchStartX = null;
        let touchStartY = null;
        const swipeThreshold = 40;
        const wheelThreshold = 25;
        const wheelDebounceMs = 220;
        let lastWheelTs = 0;
        let pointerStartX = null;
        let pointerStartY = null;
        let currentProjectTitle = "";
        let overlaySwipeConsumed = false;
        const autoAdvanceDelayMs = 15000;
        let autoAdvanceTimeout = null;
        let fullscreenZoomed = false;
        let fullscreenPanX = 0;
        let fullscreenPanY = 0;
        let fullscreenPointerId = null;
        let fullscreenDragStart = null;

        async function getResultsManifest() {
            if (resultsManifestPromise) return resultsManifestPromise;
            resultsManifestPromise = fetch('/media/projects/results/manifest.json', { cache: 'no-cache' })
                .then(res => res.ok ? res.json() : {})
                .then(raw => {
                    const normalized = {};
                    Object.entries(raw || {}).forEach(([key, list]) => {
                        const nk = normalizeKey(key);
                        if (!nk) return;
                        normalized[nk] = (list || []).map(rel => encodePathSegments(`/media/projects/results/${rel}`));
                    });
                    return normalized;
                })
                .catch(() => ({}));
            return resultsManifestPromise;
        }

        function deriveGalleryFolder(project) {
            if (!project) return null;
            if (project.galleryFolder) return project.galleryFolder.replace(/\/$/, '');
            if (!project.image) return null;
            const match = project.image.match(/\/([^/]+)\.[a-zA-Z0-9]+$/);
            if (!match) return null;
            return `/media/projects/${match[1]}`;
        }

        async function fetchGalleryManifest(folder) {
            const base = folder.endsWith('/') ? folder.slice(0, -1) : folder;
            try {
                const res = await fetch(`${base}/gallery.json`, { cache: 'no-cache' });
                if (res.ok) {
                    const files = await res.json();
                    if (Array.isArray(files) && files.length) {
                        return files
                            .filter(Boolean)
                            .map(file => {
                                const asString = String(file);
                                if (/^https?:\/\//i.test(asString) || asString.startsWith('/')) return asString;
                                const cleanFile = asString.replace(/^\/+/, '');
                                return encodePathSegments(`${base}/${cleanFile}`);
                            });
                    }
                }
        } catch (e) {
            console.info('Gallery not found for', base);
        }
        return [];
    }

        async function resolveGallerySources(project) {
            if (!project) return { images: [], source: "fallback" };
            const folder = deriveGalleryFolder(project);

            if (Array.isArray(project.gallery) && project.gallery.length) {
                const mapped = project.gallery
                    .filter(Boolean)
                    .map(src => {
                        if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
                        if (!folder) return encodePathSegments(src);
                        const normalizedFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
                        const cleanSrc = src.replace(/^\/+/, '');
                        return encodePathSegments(`${normalizedFolder}/${cleanSrc}`);
                    });
                return { images: mapped, source: "project" };
            }

            const resultsManifest = await getResultsManifest();
            const normalizedTitle = normalizeKey(project.title);
            if (normalizedTitle && resultsManifest[normalizedTitle]?.length) {
                return { images: resultsManifest[normalizedTitle], source: "results" };
            }

            if (folder) {
                const manifest = await fetchGalleryManifest(folder);
                if (manifest.length) return { images: manifest, source: "manifest" };
            }

            return { images: project.image ? [project.image] : [], source: "fallback" };
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

        function ensureFullscreenOverlay() {
            if (fullscreenOverlay && fullscreenImage) return;

            fullscreenOverlay = document.createElement("div");
            fullscreenOverlay.id = "modalImageFullscreen";
            fullscreenOverlay.className = "fixed inset-0 bg-black/85 flex items-center justify-center px-4 z-[9999] hidden";
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
            closeBtn.className = "absolute top-5 right-5 text-white text-3xl hover:scale-110 transition";
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
            clearAutoAdvance();
            refreshFullscreenImage();
        }

        function closeFullscreenImage(shouldResumeAuto = true) {
            if (!fullscreenOverlay || !fullscreenImage) return;
            fullscreenOverlay.classList.add("hidden");
            fullscreenOverlay.setAttribute("aria-hidden", "true");
            fullscreenImage.src = "";
            overlaySwipeConsumed = false;
            resetFullscreenZoom();
            if (modalEls.modal?.classList.contains("hidden")) {
                document.body.classList.remove("overflow-hidden");
            } else if (shouldResumeAuto) {
                scheduleAutoAdvance();
            }
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

        function clearAutoAdvance() {
            if (!autoAdvanceTimeout) return;
            clearTimeout(autoAdvanceTimeout);
            autoAdvanceTimeout = null;
        }

        function scheduleAutoAdvance() {
            clearAutoAdvance();
            const modalOpen = !!modalEls.modal && !modalEls.modal.classList.contains("hidden");
            const fullscreenOpen = fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden");
            const hasMultipleSlides = activeGalleryImages.length > 1;
            if (!modalOpen || !hasMultipleSlides || fullscreenOpen) return;

            autoAdvanceTimeout = setTimeout(() => {
                const total = activeGalleryImages.length;
                if (total <= 1) return;
                const nextIndex = (currentSlideIndex + 1) % total;
                goToSlide(nextIndex);
            }, autoAdvanceDelayMs);
        }

        function renderCarousel(images, projectTitle) {
            if (!carouselEls.container || !carouselEls.track || !carouselEls.dots) return;

            carouselEls.track.innerHTML = "";
            carouselEls.dots.innerHTML = "";
            activeGalleryImages = (images || []).filter(Boolean);
            currentSlideIndex = 0;
            clearAutoAdvance();

            if (!activeGalleryImages.length) {
                carouselEls.container.classList.add("hidden");
                carouselEls.counter?.classList.add("hidden");
                return;
            }

            activeGalleryImages.forEach((src, idx) => {
                const slide = document.createElement("div");
                slide.className = "min-w-full aspect-[4/3] flex items-center justify-center bg-[#121212] dark:bg-[#E8E4FC]";

                const img = document.createElement("img");
                img.dataset.src = src;
                const fileName = extractFileName(src);
                img.alt = fileName ? `${projectTitle} - ${fileName}` : `${projectTitle} - visuel ${idx + 1}`;
                img.loading = "lazy";
                img.className = "w-full h-full object-contain opacity-0 transition-opacity duration-300";
                img.draggable = false;
                img.style.userSelect = "none";
                img.addEventListener("click", () => {
                    const srcToShow = img.src || img.dataset.src || "";
                    if (srcToShow) openFullscreenImage(srcToShow, img.alt);
                });
                slide.appendChild(img);

                carouselEls.track.appendChild(slide);
            });

            carouselEls.container.classList.remove("hidden");
            goToSlide(0);
            preloadSlide(1);
        }

        function renderDots(total) {
            if (!carouselEls.dots) return;
            carouselEls.dots.innerHTML = "";
            if (total <= 1) return;

            const maxMain = 6;
            const mainCount = Math.min(total, maxMain);
            const windowStart = Math.max(0, Math.min(currentSlideIndex - Math.floor((mainCount - 1) / 2), total - mainCount));
            const windowEnd = Math.min(total - 1, windowStart + mainCount - 1);

            const hasLeftMore = windowStart > 0;
            const hasRightMore = windowEnd < total - 1;

            const createDot = (idx, isActive, isMini) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = [
                    "rounded-full transition-all duration-300",
                    isMini ? "w-2 h-2 bg-[#D7D0FA] dark:bg-[#2C2744] opacity-70" : "w-2.5 h-2.5 bg-[#D7D0FA] dark:bg-[#2C2744]"
                ].join(" ");
                if (!isMini && isActive) {
                    btn.classList.add("bg-[#411FEB]", "dark:bg-[#5536ED]", "w-6");
                    btn.classList.remove("bg-[#D7D0FA]", "dark:bg-[#2C2744]");
                }
                btn.addEventListener("click", () => goToSlide(idx));
                carouselEls.dots.appendChild(btn);
            };

            if (hasLeftMore) createDot(windowStart - 1, false, true);
            for (let i = windowStart; i <= windowEnd; i++) {
                createDot(i, i === currentSlideIndex, false);
            }
            if (hasRightMore) createDot(windowEnd + 1, false, true);
        }

        function updateCarouselUI(totalSlides) {
            if (!carouselEls.track) return;
            const total = totalSlides || activeGalleryImages.length;
            carouselEls.track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

            renderDots(total);

            if (carouselEls.counter) {
                carouselEls.counter.textContent = `${currentSlideIndex + 1} / ${total}`;
                carouselEls.counter.classList.toggle("hidden", total <= 1);
            }

            if (carouselEls.prev && carouselEls.next) {
                const hidePrev = total <= 1 || currentSlideIndex === 0;
                const hideNext = total <= 1 || currentSlideIndex === total - 1;
                carouselEls.prev.classList.toggle("hidden", hidePrev);
                carouselEls.next.classList.toggle("hidden", hideNext);
                carouselEls.prev.disabled = false;
                carouselEls.next.disabled = false;
            }
        }

        function preloadSlide(index) {
            if (!carouselEls.track) return;
            const slides = carouselEls.track.children;
            const total = slides.length;
            if (!total) return;
            const normalized = ((index % total) + total) % total;
            const img = slides[normalized]?.querySelector("img");
            if (img && !img.src) {
                img.src = img.dataset.src;
                img.onload = () => img.classList.remove("opacity-0");
                img.onerror = () => img.classList.add("opacity-40");
            }
        }

        function goToSlide(index) {
            if (!activeGalleryImages.length || !carouselEls.track) return;
            const total = activeGalleryImages.length;
            const clamped = Math.min(Math.max(index, 0), total - 1);
            if (clamped === currentSlideIndex && (index < 0 || index >= total)) return;
            currentSlideIndex = clamped;
            preloadSlide(currentSlideIndex);
            preloadSlide(currentSlideIndex + 1);
            updateCarouselUI(total);
            refreshFullscreenImage();
            scheduleAutoAdvance();
        }

        function refreshFullscreenImage() {
            if (!fullscreenOverlay || !fullscreenImage || fullscreenOverlay.classList.contains("hidden")) return;
            const src = activeGalleryImages[currentSlideIndex];
            if (!src) return;
            resetFullscreenZoom();
            fullscreenImage.src = src;
            fullscreenImage.alt = currentProjectTitle
                ? `${currentProjectTitle} - visuel ${currentSlideIndex + 1}`
                : "";
        }

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

            // Trackpad / souris (scroll horizontal)
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

        async function openModal(project) {
            if (!project || !modalEls.modal) return;

            clearAutoAdvance();
            currentProjectTitle = project.title || "";
            modalEls.title.textContent = project.title;
            modalEls.text.innerHTML = project.text.replace(/\n/g, "<br>");

            const { images: gallerySources, source: gallerySourceType } = await resolveGallerySources(project);
            const heroImage = gallerySources[0] || project.image;

            const formattedDate = project.date ? new Date(project.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "";
            const type = project.type ? project.type.charAt(0).toUpperCase() + project.type.slice(1) : "";
            const typeNormalized = (project.type || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const context = project.context || "";

            modalEls.meta.innerHTML = `
        <div class="flex items-center gap-1 text-[#121212] dark:text-white text-sm">
            <i class="bx bxs-calendar-alt text-[#411FEB] dark:text-[#5536ED] opacity-[0.48] text-base"></i>
            <span>${formattedDate || "Date inconnue"}</span>
            ${type ? `<span class="mx-1 text-[#411FEB] dark:text-[#5536ED] opacity-[0.48]">&middot;</span><span>${type}</span>` : ""}
            ${context ? `<span class="mx-1 text-[#411FEB] dark:text-[#5536ED] opacity-[0.48]">&middot;</span><span>${context}</span>` : ""}
        </div>`;

            modalEls.tags.innerHTML = "";
            project.tags?.forEach(tag => {
                const span = document.createElement("span");
                span.className =
                    "inline-flex items-center gap-1 px-2 rounded-full border border-[#411FEB] bg-[#411FEB] bg-opacity-[0.12] text-[#411FEB] dark:text-[#5536ED] font-medium";
                span.innerHTML = `<i class='${tag.icon} text-base'></i> ${tag.name}`;
                modalEls.tags.appendChild(span);
            });

            const hasGallery = gallerySources.length > 0;

            const rawLink = (project.projectLink || "").trim();
            const hasLink = !!rawLink && rawLink !== "#";
            const link = hasLink ? rawLink : "#";
            const websiteLabel = typeNormalized.includes("app") || typeNormalized.includes("mobile")
                ? "Voir l'application"
                : "Visiter le site web";

            if (modalEls.website) {
                if (hasLink) {
                    modalEls.website.href = link;
                    modalEls.website.classList.remove("hidden");
                    modalEls.website.innerHTML = `<i class='bx bx-globe'></i> ${websiteLabel}`;
                } else {
                    modalEls.website.classList.add("hidden");
                    modalEls.website.removeAttribute("href");
                }
            }
            renderCarousel(hasGallery ? gallerySources : (heroImage ? [heroImage] : []), project.title);

            modalEls.modal.classList.remove("hidden");
            document.body.classList.add("overflow-hidden");
            scheduleAutoAdvance();

            const newUrl = `?project=${project.id}`;
            window.history.replaceState(null, '', newUrl);
        }

        function closeModal() {
            clearAutoAdvance();
            document.body.classList.remove("overflow-hidden");
            closeFullscreenImage(false);
            modalEls.modal?.classList.add("hidden");
            carouselEls.track?.replaceChildren();
            carouselEls.dots?.replaceChildren();
            carouselEls.container?.classList.add("hidden");
            carouselEls.counter?.classList.add("hidden");
            activeGalleryImages = [];
            currentSlideIndex = 0;
            currentProjectTitle = "";
            window.history.replaceState(null, '', window.location.pathname);
        }

        carouselEls.prev?.addEventListener("click", () => goToSlide(currentSlideIndex - 1));
        carouselEls.next?.addEventListener("click", () => goToSlide(currentSlideIndex + 1));
        document.querySelector('.bx-x')?.addEventListener('click', closeModal);
        attachSwipeHandlers(carouselEls.track);
        document.addEventListener("keydown", (e) => {
            const modalOpen = !!modalEls.modal && !modalEls.modal.classList.contains("hidden");
            if (!modalOpen) return;
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const delta = e.key === "ArrowLeft" ? -1 : 1;
                goToSlide(currentSlideIndex + delta);
                return;
            }
            if (e.key === "Escape") {
                if (fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden")) {
                    closeFullscreenImage();
                } else {
                    closeModal();
                }
            }
        });
        global.closeModal = closeModal;

        return { openModal, closeModal };
    }

    global.ProjectModal = { init: initProjectModal };
})(window);
